"use client";

import { useEffect, useMemo, useState } from "react";
import type { Class } from "@/types/classes";
import { getActiveClasses } from "@/services/classes.service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateClassDialog } from "./CreateClassDialog";

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
  const end = cls.recurrence.endDate
    ? parseYMD(cls.recurrence.endDate)
    : null;

  if (date < start) return false;
  if (end && date > end) return false;

  const jsDay = date.getDay();
  const weekday = jsDay === 0 ? 7 : jsDay;
  if (weekday !== cls.weekday) return false;

  const interval = Math.max(1, cls.recurrence.interval || 1);

  if (cls.recurrence.type === "none") {
    return (
      startOfWeekMonday(start).getTime() ===
      startOfWeekMonday(date).getTime()
    );
  }

  if (
    cls.recurrence.type === "weekly" ||
    cls.recurrence.type === "biweekly"
  ) {
    const w = weeksBetween(
      startOfWeekMonday(start),
      startOfWeekMonday(date)
    );
    return w % interval === 0;
  }

  if (cls.recurrence.type === "monthly") {
    const targetWeek = weekIndexInMonth(start);
    const currentWeek = weekIndexInMonth(date);
    if (currentWeek !== targetWeek) return false;

    const months =
      (date.getFullYear() - start.getFullYear()) * 12 +
      (date.getMonth() - start.getMonth());
    return months % interval === 0;
  }

  return false;
}

export function WeekCalendar() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<{
    dateYMD: string;
    weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    startTime: string;
  } | null>(null);

  const [editing, setEditing] = useState<Class | null>(null);

  function openCreate(payload: {
    dateYMD: string;
    weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    startTime: string;
  }) {
    setDraft(payload);
    setCreateOpen(true);
  }

  const weekStart = useMemo(
    () => startOfWeekMonday(anchorDate),
    [anchorDate]
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    setLoading(true);
    getActiveClasses()
      .then(setClasses)
      .finally(() => setLoading(false));
  }, []);

  const slotsCount = ((END_HOUR - START_HOUR) * 60) / SLOT_MIN;

  const events = useMemo(() => {
    const out: Array<
      Class & {
        dateYMD: string;
        col: number;
        rowStart: number;
        rowSpan: number;
      }
    > = [];

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dateYMD = formatYMD(days[dayIdx]);

      for (const cls of classes) {
        if (!isClassOnDate(cls, dateYMD)) continue;

        const startMin =
          timeToMinutes(cls.startTime) - START_HOUR * 60;
        const endMin =
          timeToMinutes(cls.endTime) - START_HOUR * 60;

        const rowStart = minutesToRow(Math.max(0, startMin));
        const rowSpan = Math.max(
          1,
          Math.ceil((endMin - startMin) / SLOT_MIN)
        );

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
  }, [classes, days]);

  const rangeLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    return `${weekStart.getDate()} ${weekStart.toLocaleString("pl-PL", {
      month: "short",
    })} – ${end.getDate()} ${end.toLocaleString("pl-PL", {
      month: "short",
    })}`;
  }, [weekStart]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAnchorDate(new Date())}>
            Dziś
          </Button>
          <Button
            variant="outline"
            onClick={() => setAnchorDate(addDays(anchorDate, -7))}
          >
            ←
          </Button>
          <Button
            variant="outline"
            onClick={() => setAnchorDate(addDays(anchorDate, 7))}
          >
            →
          </Button>
          <div className="font-medium ml-2">{rangeLabel}</div>
        </div>

        <div className="text-sm text-muted-foreground">
          {loading ? "Ładowanie…" : `Zajęć: ${events.length}`}
        </div>
      </div>

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

        {/* Cells */}
        {Array.from({ length: slotsCount }).map((_, slotIdx) =>
          days.map((day, dayIdx) => {
            const minutes = slotIdx * SLOT_MIN;
            const hh = START_HOUR + Math.floor(minutes / 60);
            const mm = minutes % 60;

            const time = `${pad2(hh)}:${pad2(mm)}`;
            const dateYMD = formatYMD(day);

            return (
              <button
                key={`${slotIdx}-${dayIdx}`}
                type="button"
                onClick={() =>
                  openCreate({
                    dateYMD,
                    weekday: (day.getDay() === 0
                      ? 7
                      : day.getDay()) as any,
                    startTime: time,
                  })
                }
                className={cn(
                "border-t border-l transition relative group cursor-pointer",
                "hover:bg-primary/5"
                )}
               >
                <span className="absolute inset-0 hidden group-hover:flex items-center justify-center text-muted-foreground text-lg">
                    ＋
                </span>
               </button>
            );
          })
        )}

        {/* Events */}
        {events.map((ev) => (
          <button
            key={`${ev.id}-${ev.dateYMD}`}
            type="button"
            onClick={() => setEditing(ev)}
            className="border border-black/10 rounded-lg px-2 py-1 text-xs shadow-sm overflow-hidden text-left"
            style={{
              gridColumn: `${ev.col}`,
              gridRow: `${ev.rowStart} / ${ev.rowStart + ev.rowSpan}`,
              background: ev.color || "#e5e7eb",
            }}
          >
            <div className="font-medium leading-tight">{ev.title}</div>
            <div className="opacity-80 leading-tight">
              {ev.startTime}–{ev.endTime}
            </div>
            <div className="opacity-70 leading-tight">
              {ev.instructorName}
            </div>
          </button>
        ))}
      </div>

      {/* Create */}
      {createOpen && draft && (
        <CreateClassDialog
          mode="create"
          initial={{
            weekday: draft.weekday,
            startTime: draft.startTime,
            startDate: draft.dateYMD,
          }}
          onClose={() => setCreateOpen(false)}
          onCreated={(cls) => {
            setClasses((c) => [...c, cls]);
            setCreateOpen(false);
          }}
        />
      )}

     {/* Edit */}
      {editing && (
        <CreateClassDialog
          mode="edit"
          classToEdit={editing}
          initial={{
            weekday: editing.weekday,
            startTime: editing.startTime,
            startDate: editing.recurrence.startDate,
          }}
          onClose={() => setEditing(null)}
          onCreated={(updated) => {
            setClasses((c) => c.map((x) => (x.id === updated.id ? updated : x)));
            setEditing(null);
          }}
          onDeleted={() => {
            setClasses((c) => c.filter((x) => x.id !== editing.id));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
