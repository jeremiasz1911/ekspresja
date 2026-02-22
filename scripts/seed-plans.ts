import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Plan } from "../types/plans";

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function seed() {
  const plans: Plan[] = [
  {
    id: "one_off_class",
    type: "one_off_class",
    scope: "child",
    name: "Płatność jednorazowa",
    description: "1 zajęcia (bez dodatków)",
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
    name: "Pakiet miesięczny – 4 zajęcia",
    description: "4 wejścia / miesiąc",
    priceCents: 14000,
    currency: "PLN",
    limits: { credits: { period: "month", amount: 4 } },
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
    name: "Subskrypcja STANDARD",
    description: "5 zajęć / miesiąc + materiały + wybrane eventy",
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
    name: "Subskrypcja GOLD",
    description: "6 zajęć / miesiąc + wszystko + gadżety",
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
    await db.collection("plans").doc(plan.id).set(plan);
  }

  console.log("✅ Plans seeded");
}

seed();
