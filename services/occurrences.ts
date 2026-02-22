import type { Class } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseYmd(s: string) {
  // local midnight; do kluczy YYYY-MM i listy dat wystarczy
  return new Date(`${s}T00:00:00`);
}

// class.weekday: 1=Mon..7=Sun, JS: 0=Sun..6=Sat
function classWeekdayToJs(weekday: number) {
  return weekday % 7; // 7->0
}

// pierwsza data >= from, która ma weekday
function nextWeekday(from: Date, jsDay: number) {
  const d = new Date(from);
  const diff = (jsDay - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

// anchor = pierwsze wystąpienie zgodne z weekday, nie wcześniejsze niż startDate
function getAnchorDate(cls: Class) {
  const start = parseYmd(cls.recurrence.startDate);
  const jsDay = classWeekdayToJs(cls.weekday);
  return nextWeekday(start, jsDay);
}

function weeksBetween(a: Date, b: Date) {
  // ile pełnych tygodni między a i b
  const diff = Math.floor((b.getTime() - a.getTime()) / DAY_MS);
  return Math.floor(diff / 7);
}

export function getClassDatesInMonth(cls: Class, ts: number = Date.now()) {
  // Zwraca listę dat (YYYY-MM-DD) w miesiącu ts, zgodnych z regułą zajęć
  // Obsługuje weekly/biweekly oraz respektuje startDate/endDate
  const d = new Date(ts);
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0); // ostatni dzień

  const startLimit = parseYmd(cls.recurrence.startDate);
  const endLimit = cls.recurrence.endDate ? parseYmd(cls.recurrence.endDate) : null;

  // jeśli zajęcia jednorazowe (recurrence.type === "none") => tylko startDate
  if (cls.recurrence.type === "none") {
    const sd = parseYmd(cls.recurrence.startDate);
    if (sd >= monthStart && sd <= monthEnd) return [toYmd(sd)];
    return [];
  }

  const interval = Math.max(1, Number(cls.recurrence.interval || 1));
  const anchor = getAnchorDate(cls);

  const jsDay = classWeekdayToJs(cls.weekday);
  let cur = nextWeekday(monthStart, jsDay);

  const out: string[] = [];

  while (cur <= monthEnd) {
    // zakres start/end
    if (cur >= startLimit && (!endLimit || cur <= endLimit)) {
      const w = weeksBetween(anchor, cur);
      if (w >= 0 && w % interval === 0) out.push(toYmd(cur));
    }
    cur = new Date(cur.getTime() + 7 * DAY_MS);
  }

  return out;
}

export function getNextDate(cls: Class, fromTs: number = Date.now()) {
  const from = new Date(fromTs);
  const startLimit = parseYmd(cls.recurrence.startDate);
  const endLimit = cls.recurrence.endDate ? parseYmd(cls.recurrence.endDate) : null;

  // jeśli “none”, to jest tylko startDate (jeśli jeszcze nie minęło)
  if (cls.recurrence.type === "none") {
    const sd = parseYmd(cls.recurrence.startDate);
    if (sd >= from) return toYmd(sd);
    return null;
  }

  const interval = Math.max(1, Number(cls.recurrence.interval || 1));
  const anchor = getAnchorDate(cls);
  const jsDay = classWeekdayToJs(cls.weekday);

  // start od max(from, startDate)
  const base = from > startLimit ? from : startLimit;
  let cur = nextWeekday(base, jsDay);

  // “dopasuj” do interwału (np. biweekly)
  for (let i = 0; i < 60; i++) {
    if (endLimit && cur > endLimit) return null;
    const w = weeksBetween(anchor, cur);
    if (w >= 0 && w % interval === 0) return toYmd(cur);
    cur = new Date(cur.getTime() + 7 * DAY_MS);
  }

  return null;
}
