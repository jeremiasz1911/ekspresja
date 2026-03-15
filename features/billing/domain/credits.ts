import { parseYMD, usageKeyForPeriod } from "@/services/time";

export function periodKey(period: "none" | "week" | "month" | string, dateYMD: string) {
  return usageKeyForPeriod(period, parseYMD(dateYMD).getTime());
}

export function periodKeyFromTs(period: "none" | "week" | "month" | string, ts: number) {
  return usageKeyForPeriod(period, ts);
}

export function validateDateInEntitlement(dateYMD: string, validFrom: number, validTo: number) {
  const ts = parseYMD(dateYMD).getTime();
  return ts >= validFrom && ts <= validTo;
}

export function consumeCredits(params: {
  period: "none" | "week" | "month" | string;
  dates: string[];
}) {
  const out: Record<string, number> = {};
  for (const d of params.dates) {
    const k = periodKey(params.period, d);
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}
