import type { PlanType } from "./plans";

export type EntitlementStatus = "active" | "expired" | "cancelled";

export type Entitlement = {
  id: string;

  parentId: string;
  childId: string;

  planId: string;
  type: PlanType;

  validFrom: number;
  validTo: number;

  limits?: {
    weeklyClassesLimit?: number;
  };

  // użycie (np. Standard)
  usage?: {
    // klucz tygodnia np. "2026-W05": 2
    weeklyCount?: Record<string, number>;
  };

  status: EntitlementStatus;

  createdAt: number;
  createdFromPaymentIntentId: string;
};
