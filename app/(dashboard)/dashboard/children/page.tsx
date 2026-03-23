"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserProfile } from "@/features/profile/children";
import { getActiveEntitlements } from "@/features/billing";
import {
  getActiveClasses,
  getParentEnrollments,
  getParentReservationsInRange,
  type Reservation,
} from "@/features/classes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Baby,
  ArrowRight,
  CalendarClock,
  CalendarCheck2,
  CreditCard,
  Edit3,
  UserCheck2,
} from "lucide-react";

type ChildOverview = {
  id: string;
  fullName: string;
  activeEntitlements: number;
  activeEnrollments: number;
  nextReservation?: Reservation;
  classTitles: string[];
};

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function plusDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function ChildrenPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getUserProfile(user.uid),
      getActiveEntitlements(user.uid),
      getParentEnrollments(user.uid),
      getActiveClasses(),
      getParentReservationsInRange({
        parentId: user.uid,
        fromYMD: ymd(new Date()),
        toYMD: ymd(plusDays(new Date(), 120)),
      }),
    ])
      .then(([profile, entitlements, enrollments, classes, reservations]) => {
        const classTitleById = new Map(classes.map((c) => [c.id, c.title]));
        const overview = profile.children
          .filter((child) => !!child.id)
          .map((child) => {
            const childId = child.id as string;
            const childEntitlements = entitlements.filter((e) => e.childId === childId);
            const childEnrollments = enrollments.filter(
              (e) => e.childId === childId && e.status !== "cancelled"
            );
            const childReservations = reservations
              .filter((r) => r.childId === childId)
              .sort((a, b) => a.dateYMD.localeCompare(b.dateYMD));
            const classTitles = [
              ...new Set(
                childEnrollments.map((e) => classTitleById.get(e.classId) ?? "Nieznane zajęcia")
              ),
            ].slice(0, 4);

            return {
              id: childId,
              fullName: `${child.firstName} ${child.lastName}`.trim(),
              activeEntitlements: childEntitlements.length,
              activeEnrollments: childEnrollments.length,
              nextReservation: childReservations[0],
              classTitles,
            };
          });

        setChildren(overview);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const totalEnrollments = useMemo(
    () => children.reduce((sum, c) => sum + c.activeEnrollments, 0),
    [children]
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Moje dzieci</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Panel zarządzania: status zapisów, opłat i najbliższych zajęć dla każdego dziecka.
        </p>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-zinc-900">
            <UserCheck2 className="h-4 w-4 text-zinc-600" />
            Zarządzanie dziećmi
          </h2>
          <Link href="/dashboard/profile">
            <Button variant="outline" size="sm">
              <Edit3 className="mr-2 h-4 w-4" />
              Edytuj dane dzieci
            </Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Ładowanie danych dzieci...</p>
        ) : children.length === 0 ? (
          <div className="rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-600">
            Brak dzieci w profilu. Dodaj dziecko w sekcji profilu, aby zarządzać zapisami.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {children.map((child) => {
              const enrolledShare =
                totalEnrollments > 0
                  ? Math.round((child.activeEnrollments / totalEnrollments) * 100)
                  : 0;
              const ringStyle = {
                background: `conic-gradient(rgb(24 24 27) ${enrolledShare}%, rgb(228 228 231) 0%)`,
              };

              return (
                <article key={child.id} className="rounded-2xl border bg-zinc-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
                        <Baby className="h-4 w-4 text-zinc-600" />
                        {child.fullName || "Dziecko"}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-600">
                        {child.classTitles.length
                          ? `Zajęcia: ${child.classTitles.join(", ")}`
                          : "Brak aktywnych zapisów na zajęcia"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative h-12 w-12 rounded-full p-[4px]" style={ringStyle}>
                        <div className="grid h-full w-full place-items-center rounded-full bg-white text-[11px] font-semibold text-zinc-700">
                          {enrolledShare}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className={child.activeEntitlements > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}
                    >
                      <CreditCard className="mr-1 h-3.5 w-3.5" />
                      {child.activeEntitlements > 0 ? "Opłacone" : "Brak aktywnej opłaty"}
                    </Badge>
                    <Badge variant="outline">
                      <CalendarCheck2 className="mr-1 h-3.5 w-3.5" />
                      Zapisy: {child.activeEnrollments}
                    </Badge>
                    <Badge variant="outline">
                      <CalendarClock className="mr-1 h-3.5 w-3.5" />
                      {child.nextReservation
                        ? `Następne: ${new Date(child.nextReservation.dateYMD).toLocaleDateString("pl-PL")}`
                        : "Brak najbliższych zajęć"}
                    </Badge>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <Link href="/dashboard/classes" className="mt-4 inline-flex">
          <Button>
            Przejdź do zapisów na zajęcia
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
