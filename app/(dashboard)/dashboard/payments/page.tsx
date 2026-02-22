"use client";

import { useState } from "react";


export default function PaymentsPage() {
  const [refreshTick, setRefreshTick] = useState(0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Płatności</h1>

    </div>
  );
}
