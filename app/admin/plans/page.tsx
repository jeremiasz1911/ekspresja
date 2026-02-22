"use client";

import { seedDefaultPlans } from "@/services/seed-plans";

export default function AdminPlansSeedPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-xl font-semibold">Seed plans</h1>

      <button
        onClick={async () => {
          await seedDefaultPlans();
          alert("Plany zapisane w Firestore");
        }}
        className="px-4 py-2 rounded bg-black text-white"
      >
        Seed default plans
      </button>
    </div>
  );
}
