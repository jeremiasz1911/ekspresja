"use client";

import { useEffect, useMemo, useState } from "react";
import type { Class } from "@/types/classes";
import type { Enrollment, Child } from "@/types";

import { getActiveClasses } from "@/services/classes.service";
import { getParentEnrollments } from "@/services/enrollments.service";
import { getParentReservationsInRange, type Reservation } from "@/services/reservations.service";
import { getChildrenForParent } from "@/services/children.service";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnrollModal } from "@/components/user-classes/EnrollModal";

const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_MIN = 30;

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

function formatYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function timeToMinutes(t: string): number {
  const [hh, mm] = t.split(":").map(Number);
  return (hh ?? 0) * 60 + (mm ?? 0);
}

function minutesToRow(minSinceStart: number) {
  return Math.floor(minSinceStart / SLOT_MIN) + 1;
}

function weeksBetween(a: Date, b: Date): number {
  const ms = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(ms / 7);
}

function weekIndexInMonth(d: Date): number {
  return Math.floor((d.getDate() - 1) / 7) + 1;
}

function isClassOnDate(cls: Class, dateYMD: string): boolean {
  if (!cls?.recurrence?.startDate) return false;

  const date = parseYMD(dateYMD);
  const start = parseYMD(cls.recurrence.startDate);
  const end = cls.recurrence.endDate ? parseYMD(cls.recurrence.endDate) : null;

  if (date < start) return false;
  if (end && date > end) return false;

  const jsDay = date.getDay();
  const weekday = jsDay === 0 ? 7 : jsDay;
  if (weekday !== cls.weekday) return false;

  const interval = Math.max(1, cls.recurrence.interval || 1);

  if (cls.recurrence.type === "none") {
    return start.getTime() === date.getTime();
  }

  if (cls.recurrence.type === "weekly" || cls.recurrence.type === "biweekly") {
    const w = weeksBetween(startOfWeekMonday(start), startOfWeekMonday(date));
    return w % interval === 0;
  }

  if (cls.recurrence.type === "monthly") {
    const targetWeek = weekIndexInMonth(start);
    const currentWeek = weekIndexInMonth(date);
    if (currentWeek !== targetWeek) return false;

    const months = (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
    return months % interval === 0;
  }

  return false;
}

type CalendarEvent = Class & {
  dateYMD: string;
  col: number;
  rowStart: number;
  rowSpan: number;
  bookedKind?: "subscription" | "reservation";
};

function safeDatesFromEnrollment(e: Enrollment): string[] {
  const raw = (e as any)?.dates;
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x || "").trim()).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x));
}

function isPastYMD(dateYMD: string) {
  const d = parseYMD(dateYMD);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  return d < today;
}

export function UserWeekCalendar({ refreshTick = 0 }: { refreshTick?: number }) {
  const { user, loading: authLoading } = useAuth();

  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const [selectedEvent, setSelectedEvent] = useState<{ cls: Class; dateYMD: string } | null>(null);

  const weekStart = useMemo(() => startOfWeekMonday(anchorDate), [anchorDate]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const weekFromYMD = useMemo(() => formatYMD(weekStart), [weekStart]);
  const weekToYMD = useMemo(() => formatYMD(addDays(weekStart, 6)), [weekStart]);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    Promise.all([
      getActiveClasses(),
      getParentEnrollments(user.uid),
      getChildrenForParent(user.uid),
      getParentReservationsInRange({ parentId: user.uid, fromYMD: weekFromYMD, toYMD: weekToYMD }),
    ])
      .then(([allClasses, parentEnrollments, kids, weekReservations]) => {
        setClasses(allClasses);
        setEnrollments(parentEnrollments);
        setChildren(kids);
        setReservations(weekReservations);
      })
      .finally(() => setLoading(false));
  }, [user, refreshTick, weekFromYMD, weekToYMD]);

  const slotsCount = ((END_HOUR - START_HOUR) * 60) / SLOT_MIN;

  // --- ENROLLMENTS: rozdziel subskrypcje (bez dates) vs kredyty (z dates) ---
  const subscriptionEnrollments = useMemo(() => {
    return enrollments.filter((e) => safeDatesFromEnrollment(e).length === 0);
  }, [enrollments]);

  const dateEnrollments = useMemo(() => {
    return enrollments.filter((e) => safeDatesFromEnrollment(e).length > 0);
  }, [enrollments]);

  // subscription: childId__classId
  const subSetAll = useMemo(() => {
    return new Set(subscriptionEnrollments.map((e: any) => `${e.childId}__${e.classId}`));
  }, [subscriptionEnrollments]);

  // subscription: classId (any child)
  const subClassSetAny = useMemo(() => {
    return new Set(subscriptionEnrollments.map((e: any) => `${e.classId}`));
  }, [subscriptionEnrollments]);

  // date-enrollments (credits): childId__classId__date
  const dateEnrollSetAll = useMemo(() => {
    const out: string[] = [];
    for (const e of dateEnrollments as any[]) {
      const dates = safeDatesFromEnrollment(e as Enrollment);
      for (const d of dates) out.push(`${e.childId}__${e.classId}__${d}`);
    }
    return new Set(out);
  }, [dateEnrollments]);

  // date-enrollments (credits): classId__date (any child)
  const dateEnrollSetAny = useMemo(() => {
    const out: string[] = [];
    for (const e of dateEnrollments as any[]) {
      const dates = safeDatesFromEnrollment(e as Enrollment);
      for (const d of dates) out.push(`${e.classId}__${d}`);
    }
    return new Set(out);
  }, [dateEnrollments]);

  // reservations (kolekcja per-date): childId__classId__date
  const reservationSetAll = useMemo(() => {
    return new Set(reservations.map((r) => `${r.childId}__${r.classId}__${r.dateYMD}`));
  }, [reservations]);

  // reservations: classId__date (any child)
  const reservationSetAny = useMemo(() => {
    return new Set(reservations.map((r) => `${r.classId}__${r.dateYMD}`));
  }, [reservations]);

  const allEvents = useMemo(() => {
    const out: CalendarEvent[] = [];

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dateYMD = formatYMD(days[dayIdx]);

      for (const cls of classes) {
        if (!isClassOnDate(cls, dateYMD)) continue;

        const startMin = timeToMinutes(cls.startTime) - START_HOUR * 60;
        const endMin = timeToMinutes(cls.endTime) - START_HOUR * 60;

        const rowStart = minutesToRow(Math.max(0, startMin));
        const rowSpan = Math.max(1, Math.ceil((endMin - startMin) / SLOT_MIN));

        // --- czy to jest zapisane (SUB) albo zarezerwowane (DATE) dla tej daty ---
        let isSubscribed = false;
        let isReserved = false;

        if (selectedChildId === "all") {
          isSubscribed = subClassSetAny.has(cls.id);
          isReserved =
            reservationSetAny.has(`${cls.id}__${dateYMD}`) ||
            dateEnrollSetAny.has(`${cls.id}__${dateYMD}`);
        } else {
          isSubscribed = subSetAll.has(`${selectedChildId}__${cls.id}`);
          isReserved =
            reservationSetAll.has(`${selectedChildId}__${cls.id}__${dateYMD}`) ||
            dateEnrollSetAll.has(`${selectedChildId}__${cls.id}__${dateYMD}`);
        }

        const bookedKind: CalendarEvent["bookedKind"] = isSubscribed
          ? "subscription"
          : isReserved
          ? "reservation"
          : undefined;

        out.push({
          ...cls,
          dateYMD,
          col: dayIdx + 2,
          rowStart: rowStart + 1,
          rowSpan,
          bookedKind,
        });
      }
    }

    return out;
  }, [
    classes,
    days,
    selectedChildId,
    subClassSetAny,
    subSetAll,
    reservationSetAny,
    reservationSetAll,
    dateEnrollSetAny,
    dateEnrollSetAll,
  ]);

  // masz jakieś booking w ogóle?
  const hasAnyBookingsOverall = useMemo(() => {
    if (reservations.length > 0) return true;
    // jakiekolwiek enrollmenty też liczymy
    return enrollments.length > 0;
  }, [reservations.length, enrollments.length]);

  // masz coś "zapisane" w tym tygodniu (dla aktualnego filtra dziecka)?
  const hasAnyBookedInWeek = useMemo(() => {
    return allEvents.some((e) => !!e.bookedKind);
  }, [allEvents]);

  // zachowujemy Twój UX: gdy masz booking w tym tygodniu => filtruj do "moich"
  const visibleEvents = useMemo(() => {
    if (hasAnyBookingsOverall && hasAnyBookedInWeek) return allEvents.filter((e) => !!e.bookedKind);
    return allEvents;
  }, [allEvents, hasAnyBookingsOverall, hasAnyBookedInWeek]);

  const rangeLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    return `${weekStart.getDate()} ${weekStart.toLocaleString("pl-PL", { month: "short" })} – ${end.getDate()} ${end.toLocaleString("pl-PL", { month: "short" })}`;
  }, [weekStart]);

  if (authLoading) return <div className="text-sm text-muted-foreground">Ładowanie…</div>;
  if (!user) return <div className="text-sm text-muted-foreground">Musisz być zalogowany, aby zobaczyć plan zajęć.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Wszystkie dzieci" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie dzieci</SelectItem>
              {children.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setAnchorDate(new Date())}>Dziś</Button>
          <Button variant="outline" onClick={() => setAnchorDate(addDays(anchorDate, -7))}>←</Button>
          <Button variant="outline" onClick={() => setAnchorDate(addDays(anchorDate, 7))}>→</Button>

          <div className="font-medium ml-2">{rangeLabel}</div>
        </div>

        <div className="text-sm text-muted-foreground">
          {loading ? "Ładowanie…" : `Zajęć: ${visibleEvents.length}`}
        </div>
      </div>

      {!loading && children.length === 0 && (
        <div className="text-sm text-orange-600">
          Nie masz dodanych dzieci. Dodaj dziecko w zakładce „Dzieci”, aby móc zapisywać na zajęcia.
        </div>
      )}

      {!loading && !hasAnyBookingsOverall && (
        <div className="text-sm text-muted-foreground">
          Brak zapisów/rezerwacji — pokazuję wszystkie dostępne zajęcia. Kliknij zajęcia, aby zapisać dziecko.
        </div>
      )}

      {!loading && hasAnyBookingsOverall && !hasAnyBookedInWeek && (
        <div className="text-sm text-muted-foreground">
          Masz rezerwacje / zapisy, ale nie w tym tygodniu — pokazuję wszystkie dostępne zajęcia.
        </div>
      )}

      <div
        className="relative border rounded-xl bg-background overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: "80px repeat(7, minmax(0, 1fr))",
          gridTemplateRows: `48px repeat(${slotsCount}, 28px)`,
        }}
      >
        <div className="border-b bg-muted/40" />
        {days.map((d, i) => (
          <div key={i} className="border-b border-l bg-muted/40 flex items-center justify-center text-sm font-medium">
            {d.toLocaleDateString("pl-PL", { weekday: "short", day: "2-digit", month: "2-digit" })}
          </div>
        ))}

        {Array.from({ length: slotsCount }).map((_, slotIdx) =>
          days.map((_, dayIdx) => (
            <div key={`${slotIdx}-${dayIdx}`} className={cn("border-t border-l transition", "hover:bg-muted/30")} />
          ))
        )}

        {visibleEvents.map((ev) => {
  const past = isPastYMD(ev.dateYMD);

  return (
    <button
      key={`${ev.id}-${ev.dateYMD}`}
      type="button"
      disabled={past}
      onClick={() => {
        if (past) return;
        setSelectedEvent({ cls: ev as unknown as Class, dateYMD: ev.dateYMD });
      }}
      className={cn(
        "border border-black/10 rounded-lg px-2 py-1 text-xs overflow-hidden text-left",
        "shadow-sm transition-all duration-200 ease-out",
        past
          ? "opacity-40 cursor-not-allowed"
          : "cursor-pointer hover:shadow-md hover:scale-[1.02] hover:opacity-90 hover:ring-2 hover:ring-primary/30 active:scale-[0.98]"
      )}
      style={{
        gridColumn: `${ev.col}`,
        gridRow: `${ev.rowStart} / ${ev.rowStart + ev.rowSpan}`,
        background: ev.color || "#e5e7eb",
      }}
      title={past ? "To zajęcia już się odbyły" : "Kliknij, aby zobaczyć szczegóły / zapisać"}
    >
            <div className="font-medium leading-tight flex items-center justify-between gap-2">
              <span>{ev.title}</span>
              {ev.bookedKind === "reservation" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10">rezerw.</span>
              )}
              {ev.bookedKind === "subscription" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10">sub</span>
              )}
            </div>
            <div className="opacity-80 leading-tight">{ev.startTime}–{ev.endTime}</div>
            <div className="opacity-70 leading-tight">{ev.instructorName}</div>
          </button>
        )})}

      </div>

      <EnrollModal
        open={!!selectedEvent}
        selectedClass={selectedEvent?.cls ?? null}
        initialDateYMD={selectedEvent?.dateYMD ?? null}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
