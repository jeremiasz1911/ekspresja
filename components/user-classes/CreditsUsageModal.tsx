"use client";

import { useEffect, useMemo, useState } from "react";
import type { Class } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

function formatYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);
  return d;
}

function weeksBetween(a: Date, b: Date): number {
  const ms = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(ms / 7);
}

function weekIndexInMonth(d: Date): number {
  return Math.floor((d.getDate() - 1) / 7) + 1;
}

// identyczna logika jak w kalendarzu (weekly/biweekly/monthly/none)
function isClassOnDate(cls: Class, dateYMD: string): boolean {
  const r = cls.recurrence;
  if (!r?.startDate) return false;

  const date = parseYMD(dateYMD);
  const start = parseYMD(r.startDate);
  const end = r.endDate ? parseYMD(r.endDate) : null;

  if (date < start) return false;
  if (end && date > end) return false;

  const jsDay = date.getDay();
  const weekday = jsDay === 0 ? 7 : jsDay;
  if (weekday !== cls.weekday) return false;

  const interval = Math.max(1, r.interval || 1);

  if (r.type === "none") {
    return startOfWeekMonday(start).getTime() === startOfWeekMonday(date).getTime();
  }

  if (r.type === "weekly" || r.type === "biweekly") {
    const w = weeksBetween(startOfWeekMonday(start), startOfWeekMonday(date));
    return w % interval === 0;
  }

  if (r.type === "monthly") {
    const targetWeek = weekIndexInMonth(start);
    const currentWeek = weekIndexInMonth(date);
    if (currentWeek !== targetWeek) return false;

    const months = (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
    return months % interval === 0;
  }

  return false;
}

function prettyLabel(ymd: string) {
  const d = parseYMD(ymd);
  const dow = d.toLocaleDateString("pl-PL", { weekday: "short" });
  const dm = d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
  return `${dow} ${dm}`;
}

function occurrencesInMonth(c: Class, baseTs = Date.now()) {
   const base = new Date(baseTs);
  const now = new Date(Date.now());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);

  const monthStart = new Date(base.getFullYear(), base.getMonth(), 1, 12, 0, 0, 0);
  const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0, 12, 0, 0, 0);
  const out: string[] = [];
  let d = monthStart;

  while (d <= monthEnd) {
    if (d >= today) {
      const ymd = formatYMD(d);
      if (isClassOnDate(c, ymd)) out.push(ymd);
    }
    d = addDays(d, 1);
  }

  return out.sort();
}

type Props = {
  open: boolean;
  onClose: () => void;
  selectedClass: Class;
  creditsRemaining: number;
  onConfirm: (dates: string[]) => void;
  initialDateYMD?: string | null; // klik z kalendarza
};

export function CreditsUsageModal({
  open,
  onClose,
  selectedClass,
  creditsRemaining,
  onConfirm,
  initialDateYMD = null,
}: Props) {
 
  const baseTs = useMemo(() => {
    return initialDateYMD ? parseYMD(initialDateYMD).getTime() : Date.now();
  }, [initialDateYMD]);

  const dates = useMemo(() => occurrencesInMonth(selectedClass, baseTs), [selectedClass, baseTs]);


  const nearest = useMemo(() => (dates[0] ? [dates[0]] : []), [dates]);
  const maxAllCount = Math.min(dates.length, Math.max(0, creditsRemaining));
  const allUpToLimit = useMemo(() => dates.slice(0, maxAllCount), [dates, maxAllCount]);
  
  const defaultSelection = useMemo(() => {
    if (initialDateYMD && dates.includes(initialDateYMD)) return [initialDateYMD];
    return nearest;
  }, [initialDateYMD, dates, nearest]);

  const [manual, setManual] = useState<string[]>(defaultSelection);

  useEffect(() => {
    if (!open) return;
    setManual(defaultSelection);
  }, [open, defaultSelection]);

  function toggle(d: string) {
    setManual((prev) => {
      const has = prev.includes(d);
      if (has) return prev.filter((x) => x !== d);

      if (prev.length >= creditsRemaining) return prev;
      return [...prev, d];
    });
  }

  const manualSorted = useMemo(() => [...manual].sort(), [manual]);
  const canConfirmManual = manualSorted.length > 0 && manualSorted.length <= creditsRemaining;

  const canNearest = nearest.length > 0 && creditsRemaining >= 1;
  const canAll = allUpToLimit.length > 0 && creditsRemaining >= 1;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Jak wykorzystać kredyty?</DialogTitle>
        </DialogHeader>

        <Card className="border-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">Wybierz terminy do rezerwacji</div>
              <Badge variant={creditsRemaining > 0 ? "default" : "secondary"}>
                Kredyty: {creditsRemaining}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {dates.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Brak terminów w tym miesiącu (albo wszystkie są w przeszłości).
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled={!canNearest}
                    onClick={() => onConfirm(nearest)}
                  >
                    <span>Tylko najbliższy termin</span>
                    <span className="text-xs text-muted-foreground">
                      1 kredyt {nearest[0] ? `• ${prettyLabel(nearest[0])}` : ""}
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled={!canAll}
                    onClick={() => onConfirm(allUpToLimit)}
                  >
                    <span>Wszystkie terminy w tym miesiącu</span>
                    <span className="text-xs text-muted-foreground">
                      {allUpToLimit.length} / {dates.length}
                    </span>
                  </Button>

                  <div className="text-xs text-muted-foreground">
                    (Jeśli masz mniej kredytów niż terminów, rezerwujemy pierwsze {maxAllCount}.)
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Wybór ręczny</div>
                    <div className="text-xs text-muted-foreground">
                      Wybrano: {manualSorted.length}/{creditsRemaining}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {dates.map((d) => {
                      const checked = manual.includes(d);
                      const disabled = !checked && manual.length >= creditsRemaining;

                      return (
                        <label
                          key={d}
                          className="flex items-center gap-2 rounded-md border px-2 py-2 text-sm hover:bg-muted/40"
                        >
                          <Checkbox checked={checked} disabled={disabled} onCheckedChange={() => toggle(d)} />
                          <div className="flex flex-col leading-tight">
                            <span className="font-medium">{prettyLabel(d)}</span>
                            <span className="text-xs text-muted-foreground">{d}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {!canConfirmManual && (
                    <div className="text-xs text-muted-foreground">Wybierz 1…{creditsRemaining} terminów.</div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={onClose}>
                      Anuluj
                    </Button>
                    <Button disabled={!canConfirmManual} onClick={() => onConfirm(manualSorted)}>
                      Zarezerwuj ({manualSorted.length})
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
