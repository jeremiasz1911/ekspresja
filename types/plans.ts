export type PlanType =
  | "one_off_class"
  | "class_monthly"
  | "subscription_standard"
  | "subscription_gold";

export type Plan = {
  id: string;
  type: PlanType;
  name: string;
  description?: string;

  priceCents: number;
  currency: "PLN";

  // reguły (różne dla planów)
  rules?: {
    weeklyClassesLimit?: number; // np. Standard = 2
  };

  isActive: boolean;
  createdAt: number;
};
