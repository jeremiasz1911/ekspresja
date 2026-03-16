"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getChildrenForParent } from "@/features/profile/children";
import { getActiveEntitlements } from "@/features/billing";
import { getActiveClasses, getParentReservationsInRange, type Reservation } from "@/features/classes";
import { CalendarClock, CreditCard, Users, UserRoundCog, Sparkles, LogOut } from "lucide-react";

type ParentChild = {
  id: string;
  firstName?: string;
  lastName?: string;
  active?: boolean;
};

type ParentClass = {
  id: string;
  title: string;
};

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [entitlements, setEntitlements] = useState<Array<{ id: string; type: string; validTo: number }>>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [classes, setClasses] = useState<ParentClass[]>([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState<{
    title?: string;
    content?: string;
    createdAt?: number;
    variant?: string;
  } | null>(null);

  const announcementVariantClass: Record<string, string> = {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    success: "bg-emerald-100 text-emerald-700",
    cancellation: "bg-rose-100 text-rose-700",
    schedule: "bg-indigo-100 text-indigo-700",
    payment: "bg-violet-100 text-violet-700",
    reminder: "bg-cyan-100 text-cyan-700",
  };
  const announcementVariantBarClass: Record<string, string> = {
    info: "bg-blue-200",
    warning: "bg-yellow-200",
    error: "bg-red-200",
    success: "bg-emerald-200",
    cancellation: "bg-rose-200",
    schedule: "bg-indigo-200",
    payment: "bg-violet-200",
    reminder: "bg-cyan-200",
  };
  const announcementVariantLabel: Record<string, string> = {
    info: "Informacja",
    warning: "Ostrzeżenie",
    error: "Pilne / błąd",
    success: "Pozytywna",
    cancellation: "Odwołanie",
    schedule: "Zmiana grafiku",
    payment: "Płatności",
    reminder: "Przypomnienie",
  };

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 90);

    Promise.all([
      getChildrenForParent(user.uid),
      getActiveEntitlements(user.uid),
      getParentReservationsInRange({
        parentId: user.uid,
        fromYMD: toYMD(from),
        toYMD: toYMD(to),
      }),
      getActiveClasses(),
      getDocs(query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(10))),
    ])
      .then(([childRows, entitlementRows, reservationRows, classRows, announcementsSnap]) => {
        const activeChildren = (childRows as ParentChild[]).filter((c) => c.active !== false);
        setChildren(activeChildren);
        setEntitlements(entitlementRows.map((e) => ({ id: e.id, type: e.type, validTo: e.validTo })));
        setReservations(reservationRows);
        setClasses(classRows.map((c) => ({ id: c.id, title: c.title })));
        const latest = announcementsSnap.docs
          .map((d) => d.data() as { title?: string; content?: string; createdAt?: number; isActive?: boolean; variant?: string })
          .find((a) => a.isActive !== false);
        setLatestAnnouncement(latest ?? null);
      })
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const classNameById = useMemo(
    () => new Map(classes.map((c) => [c.id, c.title])),
    [classes]
  );
  const childNameById = useMemo(
    () =>
      new Map(
        children.map((c) => [
          c.id,
          `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Dziecko",
        ])
      ),
    [children]
  );

  const hasSubscription = entitlements.some((e) => e.type.includes("subscription"));
  const upcomingPaid = useMemo(
    () =>
      reservations
        .filter(
          (r) =>
            r.status === "active" &&
            !!r.paymentMethod &&
            ["credits", "one_off", "online"].includes(r.paymentMethod)
        )
        .sort((a, b) => a.dateYMD.localeCompare(b.dateYMD))
        .slice(0, 4),
    [reservations]
  );
  const nearestEntitlementExpiry = entitlements
    .map((e) => e.validTo)
    .sort((a, b) => a - b)[0];

  return (
    <main className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Witaj, {user?.displayName || user?.email}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Tu masz szybki podgląd subskrypcji, najbliższych opłaconych zajęć i skróty do zarządzania profilem rodziny.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">Nowoczesny widok</Badge>
          <Badge variant="outline">Szybkie akcje</Badge>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Aktualności od admina</h2>
          <Link href="/dashboard/announcements" className="text-sm underline">
            Zobacz wszystkie
          </Link>
        </div>
        {latestAnnouncement ? (
          <div className="mt-2 overflow-hidden rounded-xl border bg-zinc-50 p-3">
            <div
              className={`-mx-3 -mt-3 mb-3 h-2 ${
                announcementVariantBarClass[latestAnnouncement.variant ?? "info"] ?? "bg-blue-200"
              }`}
            />
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="font-medium">{latestAnnouncement.title || "Nowa aktualność"}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  announcementVariantClass[latestAnnouncement.variant ?? "info"] ?? "bg-blue-100 text-blue-700"
                }`}
              >
                {announcementVariantLabel[latestAnnouncement.variant ?? "info"] ?? "Informacja"}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600">{latestAnnouncement.content || "Brak treści."}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {latestAnnouncement.createdAt
                ? new Date(latestAnnouncement.createdAt).toLocaleString("pl-PL")
                : "przed chwilą"}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Brak aktualności od admina.</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="hero-gradient-icon mb-3 inline-flex rounded-xl p-2 text-white">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="text-sm text-zinc-500">Subskrypcja</p>
          <p className="mt-1 text-xl font-bold">{hasSubscription ? "Aktywna" : "Brak aktywnej"}</p>
          <p className="mt-2 text-sm text-zinc-600">
            {nearestEntitlementExpiry
              ? `Ważna do: ${new Date(nearestEntitlementExpiry).toLocaleDateString("pl-PL")}`
              : "Kup plan, aby odblokować pełne korzyści."}
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="hero-gradient-icon mb-3 inline-flex rounded-xl p-2 text-white">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm text-zinc-500">Twoje dzieci</p>
          <p className="mt-1 text-xl font-bold">{loading ? "..." : children.length}</p>
          <p className="mt-2 text-sm text-zinc-600">Dodawaj i edytuj dane dzieci w sekcji profil.</p>
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="hero-gradient-icon mb-3 inline-flex rounded-xl p-2 text-white">
            <CalendarClock className="h-5 w-5" />
          </div>
          <p className="text-sm text-zinc-500">Najbliższe opłacone zajęcia</p>
          <p className="mt-1 text-xl font-bold">{loading ? "..." : upcomingPaid.length}</p>
          <p className="mt-2 text-sm text-zinc-600">Tylko aktywne i opłacone terminy.</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Najbliższe opłacone zajęcia</h2>
            <Link href="/dashboard/classes" className="text-sm underline">
              Przejdź do zajęć
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-500">Ładowanie danych…</p>
          ) : upcomingPaid.length === 0 ? (
            <p className="text-sm text-zinc-500">Brak opłaconych zajęć na najbliższy okres.</p>
          ) : (
            <div className="space-y-3">
              {upcomingPaid.map((r) => (
                <div key={r.id} className="rounded-2xl border bg-zinc-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{classNameById.get(r.classId) ?? "Zajęcia"}</p>
                      <p className="text-sm text-zinc-600">{formatYMD(r.dateYMD)}</p>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {childNameById.get(r.childId) ?? "Dziecko"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Szybkie akcje</h2>
          <div className="mt-4 grid gap-2">
            <Link href="/dashboard/profile">
              <Button variant="outline" className="w-full justify-start">
                <UserRoundCog className="mr-2 h-4 w-4" />
                Edytuj dane konta
              </Button>
            </Link>
            <Link href="/dashboard/children">
              <Button variant="outline" className="w-full justify-start">
                <Sparkles className="mr-2 h-4 w-4" />
                Zarządzaj dziećmi
              </Button>
            </Link>
            <Link href="/dashboard/payments">
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                Płatności i plany
              </Button>
            </Link>
            <Button variant="destructive" className="mt-1 w-full justify-start bg-red-100 text-red-800 hover:bg-red-200" onClick={() => signOut(auth)}>
              <LogOut className="mr-2 h-4 w-4" />
              Wyloguj
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
