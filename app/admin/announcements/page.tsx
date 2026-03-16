"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Ban, CalendarClock, CheckCircle2, CircleDollarSign, Info, Megaphone, Sparkles } from "lucide-react";

const ANNOUNCEMENT_VARIANTS = [
  { id: "info", label: "Informacja", icon: Info, className: "bg-blue-100 text-blue-700", barClass: "bg-blue-200" },
  { id: "warning", label: "Ostrzeżenie", icon: AlertTriangle, className: "bg-yellow-100 text-yellow-700", barClass: "bg-yellow-200" },
  { id: "error", label: "Pilne / błąd", icon: Ban, className: "bg-red-100 text-red-700", barClass: "bg-red-200" },
  { id: "success", label: "Pozytywna", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700", barClass: "bg-emerald-200" },
  { id: "cancellation", label: "Odwołanie zajęć", icon: Ban, className: "bg-rose-100 text-rose-700", barClass: "bg-rose-200" },
  { id: "schedule", label: "Zmiana grafiku", icon: CalendarClock, className: "bg-indigo-100 text-indigo-700", barClass: "bg-indigo-200" },
  { id: "payment", label: "Płatności", icon: CircleDollarSign, className: "bg-violet-100 text-violet-700", barClass: "bg-violet-200" },
  { id: "reminder", label: "Przypomnienie", icon: Sparkles, className: "bg-cyan-100 text-cyan-700", barClass: "bg-cyan-200" },
] as const;

type Announcement = {
  id: string;
  title?: string;
  content?: string;
  variant?: string;
  isActive?: boolean;
  createdAt?: number;
  createdBy?: string;
};

export default function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [variant, setVariant] = useState<(typeof ANNOUNCEMENT_VARIANTS)[number]["id"]>("info");
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(50));
    const unsub = onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Announcement, "id">) }))),
      () => setItems([])
    );
    return () => unsub();
  }, []);

  async function createStatement() {
    const t = title.trim();
    const c = content.trim();
    if (!t || !c || saving) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title: t,
        content: c,
        variant,
        isActive: true,
        createdAt: Date.now(),
        createdBy: user?.uid ?? "",
        createdByEmail: user?.email ?? "",
        createdAtServer: serverTimestamp(),
      });
      setTitle("");
      setContent("");
      setVariant("info");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, next: boolean) {
    await updateDoc(doc(db, "announcements", id), {
      isActive: next,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Statementy / aktualności</h1>
        <p className="mt-2 text-sm text-zinc-600">Tworzenie i publikacja komunikatów dla rodziców.</p>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Nowy statement</h2>
        <div className="mt-3 grid gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tytuł komunikatu (np. Odwołane zajęcia)"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Treść dla rodziców..."
            className="min-h-28 rounded-lg border px-3 py-2 text-sm"
          />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {ANNOUNCEMENT_VARIANTS.map((v) => {
              const Icon = v.icon;
              const active = variant === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariant(v.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                    active ? "border-zinc-900 bg-zinc-900 text-white" : "bg-white hover:bg-zinc-50"
                  }`}
                >
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${active ? "bg-white/20 text-white" : v.className}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {v.label}
                </button>
              );
            })}
          </div>
          <div>
            <Button type="button" onClick={() => void createStatement()} disabled={saving || !title.trim() || !content.trim()}>
              {saving ? "Zapisywanie..." : "Opublikuj statement"}
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-2xl border bg-white p-4 shadow-sm">
            <div
              className={`-mx-4 -mt-4 mb-3 h-2 ${
                (ANNOUNCEMENT_VARIANTS.find((v) => v.id === (item.variant ?? "info")) ?? ANNOUNCEMENT_VARIANTS[0]).barClass
              }`}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {(() => {
                  const variantMeta =
                    ANNOUNCEMENT_VARIANTS.find((v) => v.id === (item.variant ?? "info")) ??
                    ANNOUNCEMENT_VARIANTS[0];
                  const Icon = variantMeta.icon;
                  return (
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${variantMeta.className}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                  );
                })()}
                <h3 className="font-semibold">{item.title || "Bez tytułu"}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  (ANNOUNCEMENT_VARIANTS.find((v) => v.id === (item.variant ?? "info")) ?? ANNOUNCEMENT_VARIANTS[0]).className
                }`}>
                  {(ANNOUNCEMENT_VARIANTS.find((v) => v.id === (item.variant ?? "info")) ?? ANNOUNCEMENT_VARIANTS[0]).label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    item.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {item.isActive !== false ? "widoczne" : "ukryte"}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-700">{item.content || "Brak treści."}</p>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-zinc-500">
              <span>{item.createdAt ? new Date(item.createdAt).toLocaleString("pl-PL") : "przed chwilą"}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void toggleActive(item.id, item.isActive === false)}
              >
                {item.isActive === false ? "Pokaż rodzicom" : "Ukryj"}
              </Button>
            </div>
          </article>
        ))}
        {items.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-sm text-zinc-500">Brak statementów.</div>
        ) : null}
      </section>
    </div>
  );
}
