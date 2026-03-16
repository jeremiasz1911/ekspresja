"use client";

import { useCallback, useState } from "react";
import { PaymentReturnBanner } from "@/components/user-classes/PaymentReturnBanner";
import { ClassesTabs } from "@/components/user-classes/ClassesTabs";
import { CalendarDays } from "lucide-react";

export default function ClassesPage() {
  const [refreshTick, setRefreshTick] = useState(0);

  const handleFinalized = useCallback(() => {
    setRefreshTick((x) => x + 1);
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Zajęcia</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Przeglądaj terminy, zapisuj dzieci i zarządzaj obecnością z jednego miejsca.
        </p>
      </section>

      {/* Banner może oznaczać “płatność zakończona” i wtedy odświeżasz UI */}
      <PaymentReturnBanner onFinalized={handleFinalized} />

      <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
        <div className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-600">
          <CalendarDays className="h-4 w-4" />
          Widok zapisów i kalendarza
        </div>
        <ClassesTabs refreshTick={refreshTick} />
      </section>
    </div>
  );
}
