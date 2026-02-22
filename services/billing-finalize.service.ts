// services/billing-finalize.service.ts
import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { endOfMonth, parseYMD, usageKeyForPeriod,startOfMonth,monthKey  } from "@/services/time";

type PlanDoc = {
  id: string;
  type: string;
  scope?: "child" | "parent";
  isActive?: boolean;

  benefits?: any;

  limits?: {
    credits?: {
      period: "none" | "month" | "week";
      amount: number;
      oneTime?: boolean;
      unlimited?: boolean;
    };
    freezePerMonth?: number;
  };

  validity?: { kind: "one_off" | "monthly"; days?: number };
};

type PaymentIntentDoc = {
  parentId: string;
  planId: string;
  status: "created" | "redirected" | "paid" | "failed" | "cancelled";
  paidAt?: number;
  finalizedAt?: number;
  provider?: "tpay";
  providerTransactionId?: string;
  metadata?: {
    classId?: string;
    childId?: string;
    enrollNow?: boolean;
    dateYMD?: string;
    dates?: string[];
  };
};

type ClassDoc = {
  isActive?: boolean;
  weekday?: number;
  recurrence?: {
    type?: "none" | "weekly" | "biweekly" | "monthly";
    interval?: number;
    startDate: string;
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
function isClassOnDate(cls: ClassDoc, ymd: string) {
  const rec = cls.recurrence;
  if (!rec?.startDate) return false;

  const d = parseYMD(ymd);

  const startLimit = parseYMD(rec.startDate);
  const endLimit = rec.endDate ? parseYMD(rec.endDate) : null;

  if (d < startLimit) return false;
  if (endLimit && d > endLimit) return false;

  if (rec.type === "none") return ymd === rec.startDate;

  const interval = Math.max(1, Number(rec.interval || 1));
  const anchor = getAnchorDate(cls);
  const jsDay = classWeekdayToJs(Number(cls.weekday || 1));
  if (d.getDay() !== jsDay) return false;

  const w = weeksBetween(anchor, d);
  if (w < 0) return false;
  return w % interval === 0;
}

async function deactivateOtherEntitlements(params: {
  parentId: string;
  childId?: string;
  planId: string;
  keepEntitlementId: string;
}) {
  const { parentId, childId, planId, keepEntitlementId } = params;

  let q = adminDb
    .collection("entitlements")
    .where("parentId", "==", parentId)
    .where("status", "==", "active")
    .where("planId", "==", planId);

  if (childId) q = q.where("childId", "==", childId);

  const snap = await q.get();
  const batch = adminDb.batch();

  snap.docs.forEach((d) => {
    if (d.id === keepEntitlementId) return;
    batch.set(d.ref, { status: "inactive", updatedAt: Date.now() }, { merge: true });
  });

  await batch.commit();
}

export async function finalizePaidIntent(params: {
  intentId: string;
  providerTransactionId?: string;
}) {
  const { intentId, providerTransactionId } = params;

  const intentRef = adminDb.collection("payment_intents").doc(intentId);
  const entRef = adminDb.collection("entitlements").doc(intentId);

  let deactivateParams:
    | { parentId: string; childId?: string; planId: string; keepEntitlementId: string }
    | null = null;

  await adminDb.runTransaction(async (tx) => {
    // ===== READS FIRST =====
    const intentSnap = await tx.get(intentRef);
    if (!intentSnap.exists) throw new Error(`payment_intents/${intentId} not found`);
    const intent = intentSnap.data() as PaymentIntentDoc;

    if (intent.finalizedAt) return;

    const paidAt = intent.paidAt ?? Date.now();

    const planRef = adminDb.collection("plans").doc(intent.planId);
    const planSnap = await tx.get(planRef);
    if (!planSnap.exists) throw new Error(`plans/${intent.planId} not found`);
    const plan = planSnap.data() as PlanDoc;

    if (plan.isActive === false) throw new Error("Plan inactive");

    const parentId = String(intent.parentId || "").trim();
    const childId = String(intent.metadata?.childId || "").trim();
    const classId = String(intent.metadata?.classId || "").trim();

    const isOneOff = intent.planId === "one_off_class";

    // daty do auto-rezerwacji (np. kliknięta data w kalendarzu)
    const metaDates = Array.isArray(intent.metadata?.dates) ? intent.metadata!.dates! : [];
    const reserveDates = uniqSortedDates(
      metaDates.length ? metaDates : (intent.metadata?.dateYMD ? [intent.metadata.dateYMD] : [])
    );

    const anchorYMD =
    reserveDates[0] ||
    (intent.metadata?.dateYMD ? String(intent.metadata.dateYMD) : null);

    const anchorTs = anchorYMD ? parseYMD(anchorYMD).getTime() : paidAt;

    const wantsReserve =
      Boolean(intent.metadata?.enrollNow) &&
      reserveDates.length > 0 &&
      classId &&
      childId;

    if ((plan.scope ?? "child") === "child" && !childId) {
      throw new Error("Plan scope=child requires metadata.childId");
    }

    // jeśli rezerwujemy: pobierz klasę i zweryfikuj daty
    let classSnap: FirebaseFirestore.DocumentSnapshot | null = null;
    let classData: ClassDoc | null = null;

    if ((isOneOff || wantsReserve) && classId) {
      const classRef = adminDb.collection("classes").doc(classId);
      classSnap = await tx.get(classRef);
      if (!classSnap.exists) throw new Error("Class not found");
      classData = classSnap.data() as ClassDoc;
      if (classData.isActive === false) throw new Error("Class inactive");

      // walidacja dat (żeby ktoś nie wstrzyknął "dowolnej" daty w metadata)
      for (const ymd of reserveDates) {
        const ts = parseYMD(ymd).getTime();
        if (ts < Date.now()) throw new Error(`Reserved date in the past: ${ymd}`);
        if (!isClassOnDate(classData, ymd)) throw new Error(`Date not valid for class: ${ymd}`);
      }
    }

    // przygotuj refs do rezerwacji
    const reservationRefs =
      (isOneOff || wantsReserve)
        ? reserveDates.map((ymd) => {
            const rid = `${childId}__${classId}__${ymd}`;
            return { ymd, ref: adminDb.collection("reservations").doc(rid) };
          })
        : [];

    const reservationSnaps =
      reservationRefs.length > 0
        ? await Promise.all(reservationRefs.map((r) => tx.get(r.ref)))
        : [];

    const reqId = classId && childId ? `${classId}_${childId}` : null;
    const reqRef = reqId ? adminDb.collection("enrollment_requests").doc(reqId) : null;

    const entSnap = !isOneOff ? await tx.get(entRef) : null;

    // ===== WRITES =====

    // 1) payment intent -> paid + finalized
    tx.set(
      intentRef,
      {
        status: "paid",
        paidAt,
        finalizedAt: Date.now(),
        provider: "tpay",
        providerTransactionId: providerTransactionId ?? null,
        updatedAt: Date.now(),
        updatedAtServer: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 2) ONE-OFF: twórz rezerwacje (bez enrollments)
    if (isOneOff) {
      if (!classId || !childId || reserveDates.length === 0) {
        // jednorazówka bez daty = nie zrobimy rezerwacji (ale płatność i tak oznaczona jako paid)
        return;
      }

      // rezerwacje
      reservationRefs.forEach((r, idx) => {
        if (reservationSnaps[idx]?.exists) return;
        tx.set(
          r.ref,
          {
            parentId,
            childId,
            classId,
            dateYMD: r.ymd,
            status: "active",
            paymentMethod: "one_off",
            paymentIntentId: intentId,
            providerTransactionId: providerTransactionId ?? null,
            createdAt: Date.now(),
            createdAtServer: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });

      // log do enrollment_requests (żeby UI miało "jakie daty są zapisane")
      if (reqRef) {
        tx.set(
          reqRef,
          {
            parentId,
            childId,
            classId,
            status: "approved",
            paymentMethod: "online",
            paymentIntentId: intentId,
            providerTransactionId: providerTransactionId ?? null,
            dates: FieldValue.arrayUnion(...reserveDates),
            updatedAt: Date.now(),
            updatedAtServer: FieldValue.serverTimestamp(),
            createdAt: Date.now(),
            createdAtServer: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      return;
    }

    // 3) entitlement dla planów miesięcznych/subów (kredyty)
    if (entSnap && !entSnap.exists) {
      const validFrom = paidAt;

      // domyślnie rok, ale miesięczne — do końca miesiąca
      let validTo = validFrom + 365 * 24 * 60 * 60 * 1000;

      if (plan.validity?.kind === "monthly") {
        validTo = endOfMonth(validFrom);
      }
      if (plan.validity?.kind === "one_off") {
        // raczej nie używamy tu, bo one_off_class obsługujemy wyżej
        validTo = validFrom + 60 * 24 * 60 * 60 * 1000;
      }

      tx.set(entRef, {
        parentId,
        childId: childId || null,
        planId: plan.id,
        type: plan.type,
        status: "active",
        validFrom,
        validTo,
        limits: plan.limits ?? {},
        benefits: plan.benefits ?? {},
        usage: { credits: {} },

        createdFromPaymentIntentId: intentId,
        createdAt: Date.now(),
        createdAtServer: FieldValue.serverTimestamp(),
      });
    } else {
      tx.set(entRef, { status: "active", updatedAt: Date.now() }, { merge: true });
    }

    if (plan.validity?.kind === "monthly") {
      deactivateParams = {
        parentId,
        childId: childId || undefined,
        planId: plan.id,
        keepEntitlementId: entRef.id,
      };
    }

    // 4) jeśli user kupił plan i chciał od razu zapisać termin => zrób rezerwację i spal kredyt
    if (wantsReserve && reqRef && reservationRefs.length > 0) {
      const credits = plan.limits?.credits;
      if (!credits) return;

      const unlimited = Boolean(credits.unlimited);
      const amount = Number(credits.amount || 0);
      const period = credits.period;

      // plan musi obejmować te daty (ważność)
      // (ważność entRef powstaje na podstawie paidAt, więc tu logicznie to weryfikujemy)
      const entValidFrom = paidAt;
      const entValidTo =
        plan.validity?.kind === "monthly" ? endOfMonth(paidAt) : (paidAt + 365 * 24 * 60 * 60 * 1000);

      for (const ymd of reserveDates) {
        const ts = parseYMD(ymd).getTime();
        if (ts < entValidFrom || ts > entValidTo) {
          throw new Error(`Plan not valid for date ${ymd}`);
        }
      }

      // rezerwacje
      const toCreate = reservationRefs.filter((_, idx) => !reservationSnaps[idx]?.exists);
      toCreate.forEach((r) => {
        tx.set(
          r.ref,
          {
            parentId,
            childId,
            classId,
            dateYMD: r.ymd,
            status: "active",
            paymentMethod: "online",
            entitlementId: entRef.id,
            paymentIntentId: intentId,
            providerTransactionId: providerTransactionId ?? null,
            createdAt: Date.now(),
            createdAtServer: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });

      // enrollment_requests log
      tx.set(
        reqRef,
        {
          parentId,
          childId,
          classId,
          status: "approved",
          paymentMethod: "online",
          paymentIntentId: intentId,
          providerTransactionId: providerTransactionId ?? null,
          dates: FieldValue.arrayUnion(...toCreate.map((x) => x.ymd)),
          updatedAt: Date.now(),
          updatedAtServer: FieldValue.serverTimestamp(),
          createdAt: Date.now(),
          createdAtServer: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // spal kredyty tylko jeśli coś stworzyliśmy
      if (!unlimited && amount > 0 && toCreate.length > 0) {
        const burnByKey: Record<string, number> = {};
        for (const r of toCreate) {
          const ts = parseYMD(r.ymd).getTime();
          const k = usageKeyForPeriod(period, ts);
          burnByKey[k] = (burnByKey[k] || 0) + 1;
        }

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
    }
  });

  if (deactivateParams) {
    await deactivateOtherEntitlements(deactivateParams);
  }
}

export async function markIntentFailed(params: {
  intentId: string;
  providerTransactionId?: string;
}) {
  const { intentId, providerTransactionId } = params;

  await adminDb.collection("payment_intents").doc(intentId).set(
    {
      status: "failed",
      provider: "tpay",
      providerTransactionId: providerTransactionId ?? null,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}
