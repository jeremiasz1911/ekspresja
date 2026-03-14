import type { Plan } from "@/types/plans";
import { savePlan } from "./plans.service";

export async function seedDefaultPlans() {
  const plans: Plan[] = [
    {
      id: "one_off_class",
      type: "one_off_class",
      scope: "child",
      name: "Pojedyncze zajęcia",
      description: "Jednorazowy udział w wybranych zajęciach",
      priceCents: 4000,
      currency: "PLN",
      limits: { credits: { period: "none", oneTime: true, amount: 1 } },
      benefits: {
        materials: "none",
        events: "none",
        membershipCard: "none",
        gadgets: false,
        priorityEnrollment: false,
      },
      validity: { kind: "one_off" },
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: "monthly_4",
      type: "monthly_4",
      scope: "child",
      name: "Zajęcia miesięczne (1x tyg.)",
      description: "Stałe zajęcia raz w tygodniu – płatność miesięczna",
      priceCents: 14000,
      currency: "PLN",
      limits: {
        credits: { period: "month", amount: 4 },
      },
      benefits: {
        materials: "none",
        events: "none",
        membershipCard: "none",
      },
      validity: { kind: "monthly", days: 30 },
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: "subscription_standard",
      type: "subscription_standard",
      scope: "child",
      name: "Standard – 2 zajęcia tygodniowo",
      description: "Pakiet umożliwiający udział w 2 zajęciach tygodniowo",
      priceCents: 22000,
      currency: "PLN",
      limits: {
        credits: { period: "month", amount: 5 },
        freezePerMonth: 1,
      },
      benefits: {
        materials: "partial",
        events: "selected",
        membershipCard: "standard",
        gadgets: false,
        priorityEnrollment: false,
      },
      validity: { kind: "monthly", days: 30 },
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: "subscription_gold",
      type: "subscription_gold",
      scope: "child",
      name: "Gold – nielimitowany dostęp",
      description: "Nielimitowany dostęp do wszystkich zajęć",
      priceCents: 35000,
      currency: "PLN",
      limits: {
        credits: { period: "month", amount: 6 },
        freezePerMonth: 2,
      },
      benefits: {
        materials: "all",
        events: "all",
        gadgets: true,
        priorityEnrollment: true,
        membershipCard: "gold",
      },
      validity: { kind: "monthly", days: 30 },
      isActive: true,
      createdAt: Date.now(),
    },
  ];

  for (const plan of plans) {
    await savePlan(plan);
  }
}
