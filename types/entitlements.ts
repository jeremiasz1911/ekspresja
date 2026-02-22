// types/entitlements.ts
import type { PlanType, MaterialsAccess, EventsAccess } from "./plans";

export type EntitlementStatus = "active" | "inactive" | "expired" | "cancelled";

export type Entitlement = {
  id: string;

  parentId: string;
  childId: string | null;

  planId: string;
  type: PlanType;

  validFrom: number;
  validTo: number;

  limits?: {
    credits?: {
      period: "none" | "week" | "month";
      amount?: number;
      unlimited?: boolean;
      oneTime?: boolean;
    };
    freezePerMonth?: number;
  };

  benefits?: {
    materials: MaterialsAccess;
    events: EventsAccess;
    gadgets?: boolean;
    priorityEnrollment?: boolean;
    membershipCard?: "standard" | "gold" | "none";
  };

  usage?: {
    credits?: Record<string, number>; // np. { "2026-02": 2 }
  };

  status: EntitlementStatus;

  createdAt: number;
  createdFromPaymentIntentId: string;
};
