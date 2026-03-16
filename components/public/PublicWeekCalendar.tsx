"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Class } from "@/types/classes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export function PublicWeekCalendar() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selected, setSelected] = useState<(Class & { dateYMD: string }) | null>(null);

  const weekStart = useMemo(() => startOfWeekMonday(anchorDate), [anchorDate]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/public/classes", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Nie udało się pobrać zajęć.");
        const data = (await res.json()) as { classes?: Class[] };
        return data.classes ?? [];
      })
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  const slotsCount = ((END_HOUR - START_HOUR) * 60) / SLOT_MIN;

  const events = useMemo(() => {
    const out: Array<Class & { dateYMD: string; col: number; rowStart: number; rowSpan: number }> = [];
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dateYMD = formatYMD(days[dayIdx]);
      for (const cls of classes) {
        if (!isClassOnDate(cls, dateYMD)) continue;
        const startMin = timeToMinutes(cls.startTime) - START_HOUR * 60;
        const endMin = timeToMinutes(cls.endTime) - START_HOUR * 60;
        const rowStart = minutesToRow(Math.max(0, startMin));
        const rowSpan = Math.max(1, Math.ceil((endMin - startMin) / SLOT_MIN));
        out.push({ ...cls, dateYMD, col: dayIdx + 2, rowStart: rowStart + 1, rowSpan });
      }
    }
    return out;
  }, [classes, days]);

  const rangeLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    return `${weekStart.getDate()} ${weekStart.toLocaleString("pl-PL", {
      month: "short",
    })} – ${end.getDate()} ${end.toLocaleString("pl-PL", { month: "short" })}`;
  }, [weekStart]);

  const enrolledCount = selected?.enrolledChildrenIds?.length ?? 0;
  const capacity = selected?.capacity ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button className="hover:cursor-pointer" variant="outline" onClick={() => setAnchorDate(new Date())}>Dziś</Button>
          <Button className="hover:cursor-pointer" variant="outline" onClick={() => setAnchorDate(addDays(anchorDate, -7))}>←</Button>
          <Button className="hover:cursor-pointer" variant="outline" onClick={() => setAnchorDate(addDays(anchorDate, 7))}>→</Button>
          <div className="ml-2 font-medium">{rangeLabel}</div>
        </div>
        <div className="text-sm text-muted-foreground">{loading ? "Ładowanie…" : `Zajęć: ${events.length}`}</div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-background">
      <div
        className="relative min-w-[900px]"
        style={{
          display: "grid",
          gridTemplateColumns: "70px repeat(7, minmax(0, 1fr))",
          gridTemplateRows: `42px repeat(${slotsCount}, 28px)`,
        }}
      >
        <div className="border-b bg-muted/40" />
        {days.map((d, i) => (
          <div key={i} className="flex items-center justify-center border-b border-l bg-muted/40 text-xs font-medium md:text-sm">
            {d.toLocaleDateString("pl-PL", { weekday: "short", day: "2-digit", month: "2-digit" })}
          </div>
        ))}

        {Array.from({ length: slotsCount }).map((_, slotIdx) => {
          const minutes = slotIdx * SLOT_MIN;
          const hh = START_HOUR + Math.floor(minutes / 60);
          const mm = minutes % 60;
          return (
            <div
              key={`time-${slotIdx}`}
              className="border-t bg-muted/30 px-1 pt-1 text-right text-[10px] font-medium text-zinc-600 md:text-xs"
              style={{ gridColumn: "1", gridRow: `${slotIdx + 2}` }}
            >
              {pad2(hh)}:{pad2(mm)}
            </div>
          );
        })}

        {Array.from({ length: slotsCount }).map((_, slotIdx) =>
          days.map((_, dayIdx) => (
            <div
              key={`${slotIdx}-${dayIdx}`}
              className="border-l border-t"
              style={{ gridColumn: `${dayIdx + 2}`, gridRow: `${slotIdx + 2}` }}
            />
          ))
        )}

        {events.map((ev) => (
          <button
            key={`${ev.id}-${ev.dateYMD}`}
            type="button"
            onClick={() => setSelected(ev)}
            className={cn("overflow-hidden rounded-lg border border-black/10 px-2 py-1 text-left text-xs shadow-sm hover:cursor-pointer hover:scale-105 transition-transform hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary/50 md:text-sm", !ev.color && "bg-gray-100")}
            style={{
              gridColumn: `${ev.col}`,
              gridRow: `${ev.rowStart} / ${ev.rowStart + ev.rowSpan}`,
              background: ev.color || "#e5e7eb",
            }}
          >
            <div className="truncate font-medium leading-tight">{ev.title}</div>
            <div className="opacity-80 leading-tight">{ev.startTime}–{ev.endTime}</div>
          </button>
        ))}
      </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected?.dateYMD} • {selected?.startTime}–{selected?.endTime}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              {selected.description ? <p className="text-zinc-700">{selected.description}</p> : null}
              <p><span className="font-medium">Prowadząca:</span> {selected.instructorName}</p>
              <p><span className="font-medium">Miejsce:</span> {selected.location}</p>
              <p>
                <span className="font-medium">Liczba osób:</span>{" "}
                {capacity ? `${enrolledCount}/${capacity}` : `${enrolledCount} (bez limitu)`}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button asChild>
              <Link href="/register">Zapisz się (najpierw utwórz konto)</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
