"use client";

import { useCallback, useState } from "react";
import { PaymentReturnBanner } from "@/components/classes/PaymentReturnBanner";
import { ClassesTabs } from "@/components/user-classes/ClassesTabs";

export default function ClassesPage() {
  const [refreshTick, setRefreshTick] = useState(0);

  const handleFinalized = useCallback(() => {
    setRefreshTick((x) => x + 1);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Zajęcia</h1>

      {/* Banner może oznaczać “płatność zakończona” i wtedy odświeżasz UI */}
      <PaymentReturnBanner onFinalized={handleFinalized} />

      <ClassesTabs refreshTick={refreshTick} />
    </div>
  );
}
