"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AlertTriangle, Ban, CalendarClock, CheckCircle2, CircleDollarSign, Info, Sparkles, type LucideIcon } from "lucide-react";

const PARENT_ANNOUNCEMENTS_SEEN_KEY = "ekspresja_parent_announcements_seen_v1";

type Announcement = {
  id: string;
  title?: string;
  content?: string;
  createdAt?: number;
  isActive?: boolean;
  variant?: string;
};

const VARIANT_UI: Record<string, { label: string; className: string; barClass: string; icon: LucideIcon }> = {
  info: { label: "Informacja", className: "bg-blue-100 text-blue-700", barClass: "bg-blue-200", icon: Info },
  warning: { label: "Ostrzeżenie", className: "bg-yellow-100 text-yellow-700", barClass: "bg-yellow-200", icon: AlertTriangle },
  error: { label: "Pilne / błąd", className: "bg-red-100 text-red-700", barClass: "bg-red-200", icon: Ban },
  success: { label: "Pozytywna", className: "bg-emerald-100 text-emerald-700", barClass: "bg-emerald-200", icon: CheckCircle2 },
  cancellation: { label: "Odwołanie zajęć", className: "bg-rose-100 text-rose-700", barClass: "bg-rose-200", icon: Ban },
  schedule: { label: "Zmiana grafiku", className: "bg-indigo-100 text-indigo-700", barClass: "bg-indigo-200", icon: CalendarClock },
  payment: { label: "Płatności", className: "bg-violet-100 text-violet-700", barClass: "bg-violet-200", icon: CircleDollarSign },
  reminder: { label: "Przypomnienie", className: "bg-cyan-100 text-cyan-700", barClass: "bg-cyan-200", icon: Sparkles },
};

export default function ParentAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    localStorage.setItem(PARENT_ANNOUNCEMENTS_SEEN_KEY, String(Date.now()));
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(50));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Announcement, "id">) }))
          .filter((a) => a.isActive !== false);
        setItems(rows);
      },
      () => setItems([])
    );
    return () => unsub();
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Aktualności</h1>
        <p className="mt-2 text-sm text-zinc-600">Wszystkie komunikaty i informacje od admina.</p>
      </section>
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-2xl border bg-white p-4 shadow-sm">
            {(() => {
              const variant = VARIANT_UI[item.variant ?? "info"] ?? VARIANT_UI.info;
              const Icon = variant.icon;
              return (
                <>
                  <div className={`-mx-4 -mt-4 mb-3 h-2 ${variant.barClass}`} />
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="font-semibold">{item.title || "Nowa informacja"}</h2>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${variant.className}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {variant.label}
                    </span>
                  </div>
                </>
              );
            })()}
            <p className="mt-1 text-sm text-zinc-700">{item.content || "Brak treści."}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {item.createdAt ? new Date(item.createdAt).toLocaleString("pl-PL") : "przed chwilą"}
            </p>
          </article>
        ))}
        {items.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-sm text-zinc-500">Brak aktualności.</div>
        ) : null}
      </div>
    </div>
  );
}
