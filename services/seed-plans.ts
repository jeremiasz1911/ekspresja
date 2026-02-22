import type { Plan } from "@/types/plans";
import { savePlan } from "./plans.service";

export async function seedDefaultPlans() {
  const plans: Plan[] = [
    {
      id: "one_off_class",
      type: "one_off_class",
      name: "Pojedyncze zajęcia",
      description: "Jednorazowy udział w wybranych zajęciach",
      priceCents: 4000,
      currency: "PLN",
      rules: {
        oneTime: true,
      },
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: "class_monthly",
      type: "class_monthly",
      name: "Zajęcia miesięczne (1x tyg.)",
      description: "Stałe zajęcia raz w tygodniu – płatność miesięczna",
      priceCents: 14000,
      currency: "PLN",
      rules: {
        weeklyClassesLimit: 1,
      },
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: "subscription_standard",
      type: "subscription_standard",
      name: "Standard – 2 zajęcia tygodniowo",
      description: "Pakiet umożliwiający udział w 2 zajęciach tygodniowo",
      priceCents: 22000,
      currency: "PLN",
      rules: {
        weeklyClassesLimit: 2,
      },
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: "subscription_gold",
      type: "subscription_gold",
      name: "Gold – nielimitowany dostęp",
      description: "Nielimitowany dostęp do wszystkich zajęć",
      priceCents: 35000,
      currency: "PLN",
      rules: {
        unlimited: true,
      },
      isActive: true,
      createdAt: Date.now(),
    },
  ];

  for (const plan of plans) {
    await savePlan(plan);
  }
}
