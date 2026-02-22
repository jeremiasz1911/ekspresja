// services/entitlements-guard.service.ts
import { db } from "@/lib/firebase/client";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import type { Entitlement } from "@/types/entitlements";

function monthKey(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export type EntitlementGuardResult =
  | { allowed: true; entitlement: Entitlement; remainingCredits: number | null }
  | { allowed: false; reason: "no_entitlement" | "no_credits" };

export async function guardEnrollmentForChild(params: {
  parentId: string;
  childId: string;
  now?: number;
}): Promise<EntitlementGuardResult> {
  const now = params.now ?? Date.now();

  // aktywny entitlement dla dziecka, który obejmuje "teraz"
  const q = query(
    collection(db, "entitlements"),
    where("parentId", "==", params.parentId),
    where("childId", "==", params.childId),
    where("status", "==", "active")
  );

  const snap = await getDocs(q);
  if (snap.empty) return { allowed: false, reason: "no_entitlement" };

  // wybierz entitlement który faktycznie jest ważny teraz
  const ent = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Entitlement, "id">) } as Entitlement))
    .find((e) => now >= e.validFrom && now <= e.validTo);

  if (!ent) return { allowed: false, reason: "no_entitlement" };

  // kredyty (jeśli plan je ma)
  const limit = ent.limits?.weeklyClassesLimit;
  // U Ciebie docelowo chcesz credits/month — więc liczymy credits z usage.credits
  // Zakładamy usage.credits[YYYY-MM] = użyte w tym miesiącu
  const creditsLimit = (ent as any)?.limits?.credits?.amount ?? null;
  const period = (ent as any)?.limits?.credits?.period ?? null;

  if (!creditsLimit || !period) {
    // brak limitu = allowed
    return { allowed: true, entitlement: ent, remainingCredits: null };
  }

  const key = period === "month" ? monthKey(now) : "lifetime";
  const used = Number(((ent as any)?.usage?.credits?.[key] ?? 0));
  const remaining = Math.max(0, Number(creditsLimit) - used);

  if (remaining <= 0) return { allowed: false, reason: "no_credits" };

  return { allowed: true, entitlement: ent, remainingCredits: remaining };
}
