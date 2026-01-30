"use client";

import { useEffect, useMemo, useState } from "react";
import type { Class } from "@/types/classes";
import type { Enrollment, Child } from "@/types";

import { getActiveClasses } from "@/services/classes.service";
import { getParentEnrollments } from "@/services/enrollments.service";
import { getParentProfile } from "@/services/user-profile.service";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Modal zapisu dziecka (masz już działający z listy zajęć)
import { EnrollModal } from "@/components/user-classes/EnrollModal";

const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_MIN = 30; // 30-min

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
  const day = d.getDay(); // 0=ndz ... 1=pon
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
    return startOfWeekMonday(start).getTime() === startOfWeekMonday(date).getTime();
  }

  if (cls.recurrence.type === "weekly" || cls.recurrence.type === "biweekly") {
    const w = weeksBetween(startOfWeekMonday(start), startOfWeekMonday(date));
    return w % interval === 0;
  }

  if (cls.recurrence.type === "monthly") {
    const targetWeek = weekIndexInMonth(start);
    const currentWeek = weekIndexInMonth(date);
    if (currentWeek !== targetWeek) return false;

    const months =
      (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
    return months % interval === 0;
  }

  return false;
}

type CalendarEvent = Class & {
  dateYMD: string;
  col: number;
  rowStart: number;
  rowSpan: number;
};

export function UserWeekCalendar() {
  const { user, loading: authLoading } = useAuth();

  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  // klik event => modal zapisu
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const weekStart = useMemo(() => startOfWeekMonday(anchorDate), [anchorDate]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    Promise.all([
      getActiveClasses(),
      getParentEnrollments(user.uid),
      getParentProfile(user.uid),
    ])
      .then(([allClasses, parentEnrollments, profile]) => {
        setClasses(allClasses);
        setEnrollments(parentEnrollments);
        // profile.children u Ciebie ma: id, firstName, lastName, ageYears
        setChildren((profile?.children as unknown as Child[]) ?? []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const slotsCount = ((END_HOUR - START_HOUR) * 60) / SLOT_MIN;

  /**
   * LOGIKA DOMYŚLNA:
   * - jeśli są zapisy => pokazuj zapisane (z filtrem dziecka)
   * - jeśli nie ma zapisów => pokazuj wszystkie dostępne zajęcia
   */
  const visibleClasses = useMemo(() => {
    // brak zapisów => wszystkie
    if (enrollments.length === 0) return classes;

    // filtr po dziecku lub wszystkie dzieci
    const enrolledClassIds = new Set(
      enrollments
        .filter((e) => (selectedChildId === "all" ? true : e.childId === selectedChildId))
        .map((e) => e.classId)
    );

    return classes.filter((c) => enrolledClassIds.has(c.id));
  }, [classes, enrollments, selectedChildId]);

  const events = useMemo(() => {
    const out: CalendarEvent[] = [];

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dateYMD = formatYMD(days[dayIdx]);

      for (const cls of visibleClasses) {
        if (!isClassOnDate(cls, dateYMD)) continue;

        const startMin = timeToMinutes(cls.startTime) - START_HOUR * 60;
        const endMin = timeToMinutes(cls.endTime) - START_HOUR * 60;

        const rowStart = minutesToRow(Math.max(0, startMin));
        const rowSpan = Math.max(1, Math.ceil((endMin - startMin) / SLOT_MIN));

        out.push({
          ...cls,
          dateYMD,
          col: dayIdx + 2,
          rowStart: rowStart + 1,
          rowSpan,
        });
      }
    }

    return out;
  }, [visibleClasses, days]);

  const rangeLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    return `${weekStart.getDate()} ${weekStart.toLocaleString("pl-PL", {
      month: "short",
    })} – ${end.getDate()} ${end.toLocaleString("pl-PL", {
      month: "short",
    })}`;
  }, [weekStart]);

  if (authLoading) {
    return <div className="text-sm text-muted-foreground">Ładowanie…</div>;
  }

  if (!user) {
    return (
      <div className="text-sm text-muted-foreground">
        Musisz być zalogowany, aby zobaczyć plan zajęć.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
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


          <Button variant="outline" onClick={() => setAnchorDate(new Date())}>
            Dziś
          </Button>
          <Button variant="outline" onClick={() => setAnchorDate(addDays(anchorDate, -7))}>
            ←
          </Button>
          <Button variant="outline" onClick={() => setAnchorDate(addDays(anchorDate, 7))}>
            →
          </Button>

          <div className="font-medium ml-2">{rangeLabel}</div>
        </div>

        <div className="text-sm text-muted-foreground">
          {loading ? "Ładowanie…" : `Zajęć: ${events.length}`}
        </div>
      </div>

      {/* Hint jeśli nie ma dzieci */}
      {!loading && children.length === 0 && (
        <div className="text-sm text-orange-600">
          Nie masz dodanych dzieci. Dodaj dziecko w zakładce „Dzieci”, aby móc zapisywać na zajęcia.
        </div>
      )}

      {/* Hint jeśli brak zapisów => pokazujemy wszystkie */}
      {!loading && enrollments.length === 0 && (
        <div className="text-sm text-muted-foreground">
          Brak zapisów — pokazuję wszystkie dostępne zajęcia. Kliknij zajęcia, aby zapisać dziecko.
        </div>
      )}

      {/* Grid */}
      <div
        className="relative border rounded-xl bg-background overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: "80px repeat(7, minmax(0, 1fr))",
          gridTemplateRows: `48px repeat(${slotsCount}, 28px)`,
        }}
      >
        {/* Header */}
        <div className="border-b bg-muted/40" />
        {days.map((d, i) => (
          <div
            key={i}
            className="border-b border-l bg-muted/40 flex items-center justify-center text-sm font-medium"
          >
            {d.toLocaleDateString("pl-PL", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            })}
          </div>
        ))}

        {/* Cells (user nie klika pustych slotów - tylko hover) */}
        {Array.from({ length: slotsCount }).map((_, slotIdx) =>
          days.map((_, dayIdx) => (
            <div
              key={`${slotIdx}-${dayIdx}`}
              className={cn("border-t border-l transition", "hover:bg-muted/30")}
            />
          ))
        )}

        {/* Events (klik => zapis dziecka) */}
        {events.map((ev) => (
          <button
            key={`${ev.id}-${ev.dateYMD}`}
            type="button"
            onClick={() => setSelectedClass(ev as unknown as Class)}
            className={cn(
              "border border-black/10 rounded-lg px-2 py-1 text-xs overflow-hidden text-left cursor-pointer",
              "shadow-sm transition-all duration-200 ease-out",
              "hover:shadow-md hover:scale-[1.02] hover:opacity-90 cursor-pointer ",  
              "hover:ring-2 hover:ring-primary/30",
              "hover:shadow-md hover:scale-[1.02] hover:opacity-90 hover:ring-2 hover:ring-primary/30",
              "active:scale-[0.98]"
            )}
            style={{
              gridColumn: `${ev.col}`,
              gridRow: `${ev.rowStart} / ${ev.rowStart + ev.rowSpan}`,
              background: ev.color || "#e5e7eb",
            }}
            title="Kliknij, aby zapisać dziecko"
          >
            <div className="font-medium leading-tight">{ev.title}</div>
            <div className="opacity-80 leading-tight">
              {ev.startTime}–{ev.endTime}
            </div>
            <div className="opacity-70 leading-tight">{ev.instructorName}</div>
          </button>
        ))}
      </div>

      {/* Enroll modal */}
      <EnrollModal
        open={!!selectedClass}
        selectedClass={selectedClass}
        onClose={() => setSelectedClass(null)}
      />
    </div>
  );
}
