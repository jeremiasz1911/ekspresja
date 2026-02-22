"use client";

import { useEffect, useMemo, useState } from "react";
import type { Plan } from "@/types/plans";
import type { PurchaseContext } from "@/types/billing";

import { getPlans } from "@/services/plans.service";
import { createPaymentIntent } from "@/services/payment-intents.service";
import { useAuth } from "@/components/auth/AuthProvider";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  context: PurchaseContext;
  onSuccess?: (data: { paymentIntentId: string }) => void;
};

export function PurchasePlanModal({ open, onClose, context, onSuccess }: Props) {
  const { user } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  useEffect(() => {
    if (!open) return;
    setSelectedPlanId(null);
    getPlans().then((all) => setPlans(all.filter((p) => p.isActive)));
  }, [open]);

  async function handlePurchase() {
    if (!selectedPlanId || !user) return;

    setLoading(true);
    try {
      const plan = plans.find((p) => p.id === selectedPlanId)!;

      const isClass = context.type === "class_enrollment";

      const rawDates = (context as any).dates;
      const dates = Array.isArray(rawDates) ? rawDates : null;

      const dateYMD = (context as any).dateYMD ? String((context as any).dateYMD) : null;

      // domyślnie: jak kupujesz z poziomu terminu zajęć => chcesz od razu zapisać ten termin
      const enrollNow = (context as any).enrollNow ?? (isClass ? true : false);

      const metadata = isClass
        ? {
            classId: (context as any).classId,
            childId: (context as any).childId,
            enrollNow: Boolean(enrollNow),
            ...(dateYMD ? { dateYMD } : {}),
            ...(dates ? { dates } : {}),
          }
        : {};

      const intentId = await createPaymentIntent({
        parentId: user.uid,
        email: user.email ?? "",
        description: `Plan ${plan.id}`,
        planId: plan.id,
        amountCents: plan.priceCents,
        currency: "PLN",
        provider: "tpay",
        metadata,
      });

      onSuccess?.({ paymentIntentId: intentId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Wybierz plan</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={cn(
                "rounded-xl border p-5 text-left transition",
                selectedPlanId === plan.id ? "border-primary bg-primary/5" : "hover:bg-muted"
              )}
            >
              <div className="text-lg font-semibold">{plan.name}</div>
              <div className="text-sm text-muted-foreground">{plan.description}</div>
              <div className="mt-4 text-xl font-bold">
                {(plan.priceCents / 100).toFixed(2)} zł
              </div>
            </button>
          ))}
        </div>

        <Button className="w-full" disabled={!selectedPlanId || loading} onClick={handlePurchase}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Przejdź do płatności
        </Button>
      </DialogContent>
    </Dialog>
  );
}
