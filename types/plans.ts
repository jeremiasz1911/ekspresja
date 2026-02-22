export type PlanType =
  | "one_off_class"
  | "monthly_4"
  | "subscription_standard"
  | "subscription_gold";

export type MaterialsAccess = "none" | "partial" | "all";
export type EventsAccess = "none" | "selected" | "all";
export type PlanScope = "child" | "parent"; // u Ciebie najczęściej child (entitlement ma childId)

export type Plan = {
  id: string;
  type: PlanType;
  scope: PlanScope;

  name: string;
  description?: string;

  priceCents: number;
  currency: "PLN";

  // ile kredytów / i w jakim okresie
  limits?: {
    credits?: {
      period: "none" | "week" | "month";
      amount?: number;          // np. 4 / 5 / 6
      unlimited?: boolean;      // jeśli kiedyś chcesz nielimit
      oneTime?: boolean;        // dla jednorazowej
    };
    freezePerMonth?: number;    // 0 / 1 / 2
  };

  benefits?: {
    materials: MaterialsAccess; // none/partial/all
    events: EventsAccess;       // none/selected/all
    gadgets?: boolean;          // GOLD
    priorityEnrollment?: boolean; // GOLD
    membershipCard?: "standard" | "gold" | "none";
  };

  // jak długo działa entitlement po opłaceniu
  validity?: {
    kind: "one_off" | "monthly";
    days?: number; // np. 30 jeśli chcesz prościej niż “do końca miesiąca”
  };

  isActive: boolean;
  createdAt: number;
  updatedAt?: number;
};
