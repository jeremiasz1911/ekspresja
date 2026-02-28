"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

import { CreditsByChildPanel } from "@/components/billing/CreditsByChildPanel";
import { OrdersList } from "@/components/billing/OrdersList";

export default function PaymentsPage() {
  const [refreshTick, setRefreshTick] = useState(0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Płatności</h1>

        <Button variant="outline" onClick={() => setRefreshTick((x) => x + 1)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Odśwież
        </Button>
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
    </div>
  );
}