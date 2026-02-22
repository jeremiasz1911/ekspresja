// services/time.ts

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Lokalne YYYY-MM-DD ustawione na 12:00 (żeby nie waliło strefami) */
export function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function monthKey(ts: number = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

// ISO week key: YYYY-Www
export function weekKey(ts: number = Date.now()) {
  const d = new Date(ts);
  const day = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  d.setDate(d.getDate() - day + 3); // Thursday

  const isoYear = d.getFullYear();

  const firstThu = new Date(isoYear, 0, 4);
  const firstDay = (firstThu.getDay() + 6) % 7;
  firstThu.setDate(firstThu.getDate() - firstDay + 3);

  const diffDays = Math.round((d.getTime() - firstThu.getTime()) / 86400000);
  const week = 1 + Math.floor(diffDays / 7);

  return `${isoYear}-W${pad2(week)}`;
}

/** Klucz użycia zależy od daty ZAJĘĆ (ts), nie od "teraz" */
export function usageKeyForPeriod(period: string, ts: number = Date.now()) {
  if (period === "month") return monthKey(ts);
  if (period === "week") return weekKey(ts);
  return "lifetime"; // "none" / inne
}

export function startOfMonth(ts: number) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime();
}

export function endOfMonth(ts: number) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
}
