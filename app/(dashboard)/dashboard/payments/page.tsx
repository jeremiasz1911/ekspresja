"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreditCard, RefreshCw } from "lucide-react";

import { CreditsByChildPanel } from "@/components/billing/CreditsByChildPanel";
import { OrdersList } from "@/components/billing/OrdersList";

export default function PaymentsPage() {
  const [refreshTick, setRefreshTick] = useState(0);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Płatności</h1>
            <p className="mt-2 text-sm text-zinc-600">Subskrypcje, kredyty i historia zamówień w jednym miejscu.</p>
          </div>

          <Button variant="outline" onClick={() => setRefreshTick((x) => x + 1)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Odśwież
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
        <div className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-600">
          <CreditCard className="h-4 w-4" />
          Zarządzanie kredytami i zamówieniami
        </div>
        <Tabs defaultValue="credits" className="w-full">
        <TabsList>
          <TabsTrigger value="credits">Kredyty i subskrypcje</TabsTrigger>
          <TabsTrigger value="orders">Zamówienia</TabsTrigger>
        </TabsList>

        <TabsContent value="credits" className="mt-4">
          <CreditsByChildPanel refreshTick={refreshTick} />
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <OrdersList refreshTick={refreshTick} />
        </TabsContent>
      </Tabs>
      </section>
    </div>
  );
}
