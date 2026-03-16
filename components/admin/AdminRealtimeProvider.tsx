"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

type AdminEvent = {
  id: string;
  type: "registration" | "payment" | "request";
  ts: number;
  title: string;
  text: string;
  href: string;
  imageUrl: string;
  details?: Array<{ label: string; value: string }>;
};

type AdminRealtimeState = {
  unreadChats: number;
  unreadNotifications: number;
  events: AdminEvent[];
  markNotificationsSeen: () => void;
  markNotificationSeen: (eventId: string) => void;
  isUnreadEvent: (eventId: string) => boolean;
};

const AdminRealtimeContext = createContext<AdminRealtimeState | null>(null);
const ADMIN_NOTIFS_SEEN_KEY = "ekspresja_admin_notifications_seen_ids_v1";
const PERIOD_LABEL: Record<string, string> = {
  none: "jednorazowo",
  week: "tygodniowo",
  month: "miesięcznie",
};

function currency(cents: number) {
  return `${(Number(cents || 0) / 100).toFixed(2)} PLN`;
}

function planCreditsLabel(plan: any) {
  const credits = plan?.limits?.credits;
  if (!credits) return "brak limitu";
  if (credits.unlimited) return `nielimitowane zajęcia (${PERIOD_LABEL[String(credits.period || "month")] ?? "okres"})`;
  return `${Number(credits.amount || 0)} zajęć / ${PERIOD_LABEL[String(credits.period || "month")] ?? "okres"}`;
}

function planValidityLabel(plan: any) {
  const validity = plan?.validity;
  if (!validity) return "wg planu";
  if (validity.kind === "monthly") return "do końca miesiąca";
  if (validity.kind === "one_off" && validity.days) return `${validity.days} dni`;
  return "jednorazowo";
}

export function AdminRealtimeProvider({ children }: { children: React.ReactNode }) {
  const [unreadChats, setUnreadChats] = useState(0);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [seenIds, setSeenIds] = useState<Record<string, true>>({});

  useEffect(() => {
    const raw = localStorage.getItem(ADMIN_NOTIFS_SEEN_KEY);
    if (!raw) return;
    try {
      const ids = JSON.parse(raw) as string[];
      if (!Array.isArray(ids)) return;
      const next: Record<string, true> = {};
      ids.forEach((id) => {
        if (id) next[id] = true;
      });
      setSeenIds(next);
    } catch {}
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "admin_chats"), (snap) => {
      const unreadThreads = snap.docs.filter((d) => Number(d.data().unreadForAdmin ?? 0) > 0).length;
      setUnreadChats(unreadThreads);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadEvents() {
      const [usersSnap, paidSnap, reqSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(20))),
        getDocs(query(collection(db, "payment_intents"), orderBy("createdAt", "desc"), limit(30))),
        getDocs(query(collection(db, "enrollment_requests"), orderBy("createdAt", "desc"), limit(30))),
      ]);

      if (!mounted) return;

      const rows: AdminEvent[] = [];
      const paidDocs = paidSnap.docs.filter((d) => {
        const data = d.data() as any;
        return data.status === "paid";
      });
      const uniquePlanIds = Array.from(
        new Set(
          paidDocs
            .map((d) => String((d.data() as any)?.planId || "").trim())
            .filter(Boolean)
        )
      );
      const planDocs = await Promise.all(
        uniquePlanIds.map(async (planId) => {
          const snap = await getDoc(doc(db, "plans", planId));
          return [planId, snap.exists() ? (snap.data() as any) : null] as const;
        })
      );
      const planMap = new Map(planDocs);
      const requestDocs = reqSnap.docs.map((d) => ({ id: d.id, data: d.data() as any }));
      const classIds = Array.from(
        new Set(requestDocs.map((r) => String(r.data.classId || "").trim()).filter(Boolean))
      );
      const parentIds = Array.from(
        new Set(requestDocs.map((r) => String(r.data.parentId || "").trim()).filter(Boolean))
      );
      const childIds = Array.from(
        new Set(requestDocs.map((r) => String(r.data.childId || "").trim()).filter(Boolean))
      );
      const [classDocs, parentDocs, childDocs] = await Promise.all([
        Promise.all(
          classIds.map(async (classId) => {
            const snap = await getDoc(doc(db, "classes", classId));
            return [classId, snap.exists() ? (snap.data() as any) : null] as const;
          })
        ),
        Promise.all(
          parentIds.map(async (parentId) => {
            const snap = await getDoc(doc(db, "users", parentId));
            return [parentId, snap.exists() ? (snap.data() as any) : null] as const;
          })
        ),
        Promise.all(
          childIds.map(async (childId) => {
            const snap = await getDoc(doc(db, "children", childId));
            return [childId, snap.exists() ? (snap.data() as any) : null] as const;
          })
        ),
      ]);
      const classMap = new Map(classDocs);
      const parentMap = new Map(parentDocs);
      const childMap = new Map(childDocs);

      usersSnap.docs.forEach((d) => {
        const data = d.data() as any;
        if (!data.createdAt) return;
        const fullName = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();
        rows.push({
          id: `u-${d.id}`,
          type: "registration",
          ts: Number(data.createdAt),
          title: "Nowa rejestracja",
          text: `Nowa rejestracja: ${fullName || data.email || d.id}`,
          href: "/admin/users",
          imageUrl:
            "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
          details: [
            { label: "Użytkownik", value: fullName || "brak imienia i nazwiska" },
            { label: "Email", value: String(data.email || "brak") },
            { label: "UID", value: d.id },
            { label: "Utworzono", value: new Date(Number(data.createdAt)).toLocaleString("pl-PL") },
          ],
        });
      });
      paidDocs.forEach((d) => {
        const data = d.data() as any;
        const ts = Number(data.paidAt ?? data.createdAt ?? 0);
        if (!ts) return;
        const planId = String(data.planId || "").trim();
        const plan = planMap.get(planId);
        const dates = Array.isArray(data.metadata?.dates)
          ? data.metadata.dates.join(", ")
          : data.metadata?.dateYMD
            ? String(data.metadata.dateYMD)
            : "brak";
        const who = String(data.payerName || data.email || data.parentId || "nieznany");
        rows.push({
          id: `p-${d.id}`,
          type: "payment",
          ts,
          title: "Nowa opłata",
          text: `Opłata online: ${currency(Number(data.amountCents ?? 0))} • ${data.description || plan?.name || planId || "plan"}`,
          href: "/admin",
          imageUrl:
            "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
          details: [
            { label: "Kto opłacił", value: who },
            { label: "Co kupiono", value: String(data.description || plan?.name || planId || "plan") },
            { label: "Kwota", value: currency(Number(data.amountCents ?? 0)) },
            { label: "Na ile", value: planCreditsLabel(plan) },
            { label: "Ważność", value: planValidityLabel(plan) },
            { label: "Dla dziecka", value: String(data.metadata?.childId || "nie przypisano") },
            { label: "Terminy", value: dates },
            { label: "Transakcja", value: String(data.providerTransactionId || "w trakcie") },
            { label: "Intent ID", value: d.id },
          ],
        });
      });
      requestDocs.forEach((r) => {
        const data = r.data;
        const ts = Number(data.createdAt ?? 0);
        if (!ts) return;
        const classId = String(data.classId || "").trim();
        const classTitle = String(classMap.get(classId)?.title || classId || "brak");
        const parentId = String(data.parentId || "").trim();
        const parent = parentMap.get(parentId);
        const parentName = `${parent?.firstName ?? ""} ${parent?.lastName ?? ""}`.trim();
        const childId = String(data.childId || "").trim();
        const child = childMap.get(childId);
        const childName = `${child?.firstName ?? ""} ${child?.lastName ?? ""}`.trim();
        const dates = Array.isArray(data.dates) ? data.dates.join(", ") : "brak";
        rows.push({
          id: `r-${r.id}`,
          type: "request",
          ts,
          title: "Nowe zgłoszenie",
          text: `Zgłoszenie na: ${classTitle} • ${data.paymentMethod ?? "brak metody"}`,
          href: "/admin/notifications",
          imageUrl:
            "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
          details: [
            { label: "Zajęcia", value: classTitle },
            { label: "Metoda płatności", value: String(data.paymentMethod || "brak") },
            { label: "Status", value: String(data.status || "nowe") },
            { label: "Rodzic", value: parentName || parent?.email || parentId || "brak" },
            { label: "Dziecko", value: childName || childId || "brak" },
            { label: "Terminy", value: dates },
            { label: "Zgłoszenie ID", value: r.id },
          ],
        });
      });

      rows.sort((a, b) => b.ts - a.ts);
      setEvents(rows.slice(0, 30));
    }

    loadEvents().catch(() => {});
    const id = window.setInterval(() => loadEvents().catch(() => {}), 30000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const unreadNotifications = useMemo(() => events.filter((e) => !seenIds[e.id]).length, [events, seenIds]);

  const value = useMemo<AdminRealtimeState>(
    () => ({
      unreadChats,
      unreadNotifications,
      events,
      markNotificationsSeen: () => {
        const all: Record<string, true> = {};
        events.forEach((e) => {
          all[e.id] = true;
        });
        localStorage.setItem(ADMIN_NOTIFS_SEEN_KEY, JSON.stringify(Object.keys(all)));
        setSeenIds(all);
      },
      markNotificationSeen: (eventId: string) => {
        if (!eventId || seenIds[eventId]) return;
        const next: Record<string, true> = { ...seenIds, [eventId]: true };
        localStorage.setItem(ADMIN_NOTIFS_SEEN_KEY, JSON.stringify(Object.keys(next)));
        setSeenIds(next);
      },
      isUnreadEvent: (eventId: string) => !seenIds[eventId],
    }),
    [events, seenIds, unreadChats, unreadNotifications]
  );

  return <AdminRealtimeContext.Provider value={value}>{children}</AdminRealtimeContext.Provider>;
}

export function useAdminRealtime() {
  const ctx = useContext(AdminRealtimeContext);
  if (!ctx) throw new Error("useAdminRealtime must be used within AdminRealtimeProvider");
  return ctx;
}

export function useOptionalAdminRealtime() {
  return useContext(AdminRealtimeContext);
}
