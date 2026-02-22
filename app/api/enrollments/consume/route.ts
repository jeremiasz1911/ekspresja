// app/api/enrollments/consume/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { parseYMD, usageKeyForPeriod } from "@/services/time";

export const runtime = "nodejs";

type ClassDoc = {
  isActive?: boolean;
  weekday?: number; // 1=Mon..7=Sun
  recurrence?: {
    type?: "none" | "weekly" | "biweekly" | "monthly";
    interval?: number;
    startDate: string; // YYYY-MM-DD
    endDate?: string | null;
  };
};

function uniqSortedDates(dates: string[]) {
  return Array.from(
    new Set(dates.map((s) => String(s || "").trim()).filter(Boolean))
  ).sort();
}

// class.weekday: 1=Mon..7=Sun, JS: 0=Sun..6=Sat
function classWeekdayToJs(weekday: number) {
  return weekday % 7; // 7->0
}

function nextWeekday(from: Date, jsDay: number) {
  const d = new Date(from);
  const diff = (jsDay - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function getAnchorDate(cls: ClassDoc) {
  const start = parseYMD(cls.recurrence?.startDate || "1970-01-01");
  const jsDay = classWeekdayToJs(Number(cls.weekday || 1));
  return nextWeekday(start, jsDay);
}

function weeksBetween(a: Date, b: Date) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const diff = Math.floor((b.getTime() - a.getTime()) / DAY_MS);
  return Math.floor(diff / 7);
}

/** Czy zajęcia występują w danym dniu (YYYY-MM-DD) wg recurrence? */
function isClassOnDate(cls: ClassDoc, ymd: string) {
  const rec = cls.recurrence;
  if (!rec?.startDate) return false;

  const d = parseYMD(ymd);

  const startLimit = parseYMD(rec.startDate);
  const endLimit = rec.endDate ? parseYMD(rec.endDate) : null;

  if (d < startLimit) return false;
  if (endLimit && d > endLimit) return false;

  if (rec.type === "none") {
    return ymd === rec.startDate;
  }

  const interval = Math.max(1, Number(rec.interval || 1));
  const anchor = getAnchorDate(cls);

  const jsDay = classWeekdayToJs(Number(cls.weekday || 1));
  if (d.getDay() !== jsDay) return false;

  const w = weeksBetween(anchor, d);
  if (w < 0) return false;
  return w % interval === 0;
}

type EntDoc = {
  parentId: string;
  childId?: string | null;
  status: "active" | "inactive" | "expired" | "cancelled" | string;
  validFrom: number;
  validTo: number;
  limits?: {
    credits?: {
      amount?: number;
      period?: "none" | "month" | "week";
      unlimited?: boolean;
      oneTime?: boolean;
    };
  };
  usage?: { credits?: Record<string, number> };
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const parentId = decoded.uid;

    const body = await req.json();
    const classId = String(body?.classId || "").trim();
    const childId = String(body?.childId || "").trim();
    const requestedDates = uniqSortedDates(
      Array.isArray(body?.dates) ? body.dates : []
    );

    if (!classId || !childId || requestedDates.length === 0) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    // --- child must belong to parent ---
    const childSnap = await adminDb.collection("children").doc(childId).get();
    if (!childSnap.exists) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    if (String(childSnap.data()?.parentId || "") !== parentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- class exists + active ---
    const classSnap = await adminDb.collection("classes").doc(classId).get();
    if (!classSnap.exists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    const cls = classSnap.data() as ClassDoc;
    if (cls.isActive === false) {
      return NextResponse.json({ error: "Class inactive" }, { status: 400 });
    }

    // --- validate requested dates ---
    const now = Date.now();
    for (const ymd of requestedDates) {
      const ts = parseYMD(ymd).getTime();
      if (ts < now) {
        return NextResponse.json(
          { error: "Date in the past", date: ymd },
          { status: 400 }
        );
      }
      if (!isClassOnDate(cls, ymd)) {
        return NextResponse.json(
          { error: "Date not valid for this class", date: ymd },
          { status: 400 }
        );
      }
    }

    // --- load active entitlements (then filter by validity) ---
    const entSnap = await adminDb
      .collection("entitlements")
      .where("parentId", "==", parentId)
      .where("status", "==", "active")
      .get();

    // ✅ krytyczne: tylko entitlements ważne dla TERAZ i dla wszystkich dat
    const entDocs = entSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as EntDoc) }))
      .filter((e) => now >= Number(e.validFrom || 0) && now <= Number(e.validTo || 0))
      .filter((e) => {
        // entitlement musi obejmować wszystkie daty rezerwacji
        return requestedDates.every((ymd) => {
          const ts = parseYMD(ymd).getTime();
          return ts >= Number(e.validFrom || 0) && ts <= Number(e.validTo || 0);
        });
      });

    if (entDocs.length === 0) {
      return NextResponse.json(
        { error: "No valid entitlement for these dates" },
        { status: 402 }
      );
    }

    // --- choose best entitlement (enough credits for all dates) ---
    let best:
      | {
          id: string;
          ent: EntDoc;
          remainingByKey: Record<string, number>;
          score: number;
        }
      | null = null;

    for (const item of entDocs) {
      const entChildId = String(item.childId || "").trim();
      if (entChildId && entChildId !== childId) continue;

      const credits = item.limits?.credits || {};
      const unlimited = Boolean(credits.unlimited);
      const amount = Number(credits.amount || 0);
      const period = (credits.period || "none") as "none" | "month" | "week";

      if (!unlimited && amount <= 0) continue;

      // ile potrzeba spalić w danym okresie (kluczu)
      const needByKey: Record<string, number> = {};
      for (const ymd of requestedDates) {
        const ts = parseYMD(ymd).getTime();
        const k = usageKeyForPeriod(period, ts);
        needByKey[k] = (needByKey[k] || 0) + 1;
      }

      // stan użycia
      const usedMap = item.usage?.credits || {};
      const remainingByKey: Record<string, number> = {};
      let ok = true;

      for (const [k, need] of Object.entries(needByKey)) {
        const used = Number(usedMap[k] || 0);
        const remaining = unlimited ? 999999 : Math.max(0, amount - used);
        remainingByKey[k] = remaining;
        if (!unlimited && remaining < need) {
          ok = false;
          break;
        }
      }

      if (!ok) continue;

      // scoring: prefer child-specific + more remaining
      const sumRemaining = Object.values(remainingByKey).reduce((a, b) => a + b, 0);
      const score = (entChildId ? 100000 : 0) + sumRemaining;

      if (!best || score > best.score) {
        best = { id: item.id, ent: item, remainingByKey, score };
      }
    }

    if (!best) {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 402 }
      );
    }

    const entitlementId = best.id;

    // --- transaction: re-check + create reservations + burn credits ---
    const entRef = adminDb.collection("entitlements").doc(entitlementId);

    const reservations = requestedDates.map((ymd) => {
      const rid = `${childId}__${classId}__${ymd}`;
      return { id: rid, ymd, ref: adminDb.collection("reservations").doc(rid) };
    });

    const reqId = `${classId}_${childId}`;
    const reqRef = adminDb.collection("enrollment_requests").doc(reqId);

    const result = await adminDb.runTransaction(async (tx) => {
      // READS
      const entSnap2 = await tx.get(entRef);
      if (!entSnap2.exists) throw new Error("Entitlement missing");
      const ent2 = entSnap2.data() as EntDoc;

      if (ent2.status !== "active") throw new Error("Entitlement not active");

      // ✅ ważność w transakcji
      if (!(now >= Number(ent2.validFrom || 0) && now <= Number(ent2.validTo || 0))) {
        throw new Error("Entitlement expired");
      }
      for (const ymd of requestedDates) {
        const ts = parseYMD(ymd).getTime();
        if (ts < Number(ent2.validFrom || 0) || ts > Number(ent2.validTo || 0)) {
          throw new Error("Entitlement not valid for date " + ymd);
        }
      }

      const resSnaps = await Promise.all(reservations.map((r) => tx.get(r.ref)));

      const toCreate = reservations.filter((r, idx) => !resSnaps[idx].exists);
      if (toCreate.length === 0) {
        return { created: 0, alreadyHadAll: true };
      }

      const credits = ent2.limits?.credits || {};
      const unlimited = Boolean(credits.unlimited);
      const amount = Number(credits.amount || 0);
      const period = (credits.period || "none") as "none" | "month" | "week";

      if (!unlimited && amount <= 0) throw new Error("No credits limit found");

      // burn map for only the NEW reservations
      const burnByKey: Record<string, number> = {};
      for (const r of toCreate) {
        const ts = parseYMD(r.ymd).getTime();
        const k = usageKeyForPeriod(period, ts);
        burnByKey[k] = (burnByKey[k] || 0) + 1;
      }

      // check credits again with current usage
      const usedMap = ent2.usage?.credits || {};
      if (!unlimited) {
        for (const [k, burn] of Object.entries(burnByKey)) {
          const used = Number(usedMap[k] || 0);
          if (used + burn > amount) throw new Error("No credits");
        }
      }

      // WRITES
      for (const r of toCreate) {
        tx.set(
          r.ref,
          {
            parentId,
            childId,
            classId,
            dateYMD: r.ymd,
            status: "active",
            paymentMethod: "credits",
            entitlementId,
            createdAt: Date.now(),
            createdAtServer: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      tx.set(
        reqRef,
        {
          parentId,
          childId,
          classId,
          status: "approved",
          paymentMethod: "credits",
          dates: FieldValue.arrayUnion(...toCreate.map((x) => x.ymd)),
          updatedAt: Date.now(),
          updatedAtServer: FieldValue.serverTimestamp(),
          createdAt: Date.now(),
          createdAtServer: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (!unlimited) {
        const incObj: Record<string, any> = {};
        for (const [k, burn] of Object.entries(burnByKey)) {
          incObj[k] = FieldValue.increment(burn);
        }
        tx.set(
          entRef,
          {
            usage: { credits: incObj },
            updatedAt: Date.now(),
            updatedAtServer: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      return { created: toCreate.length, alreadyHadAll: false };
    });

    return NextResponse.json({ ok: true, entitlementId, ...result });
  } catch (e: any) {
    console.error("[consume] error:", e);
    const msg = String(e?.message || "Unknown error");
    const status =
      msg.includes("No credits") ? 402 :
      msg.includes("expired") ? 402 :
      500;
    return NextResponse.json({ error: msg }, { status });
  }
}
