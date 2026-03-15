"use client";

import { useEffect, useMemo, useState } from "react";
import type { Plan } from "@/types/plans";
import type { PurchaseContext } from "@/types/billing";

import { getPlans } from "@/features/billing";
import { createPaymentIntent } from "@/features/billing";
import { useAuth } from "@/components/auth/AuthProvider";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function firstDayOfNextMonthYMD() {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1, 12, 0, 0, 0);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

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
  const [activationTiming, setActivationTiming] = useState<"current" | "next">("current");
  const [loading, setLoading] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  const canStartNextMonth =
    selectedPlan?.type === "subscription_standard" ||
    selectedPlan?.type === "subscription_gold";

  useEffect(() => {
    if (!open) return;
    setSelectedPlanId(null);
    setActivationTiming("current");
    getPlans().then((all) => setPlans(all.filter((p) => p.isActive)));
  }, [open]);

  useEffect(() => {
    if (!canStartNextMonth) setActivationTiming("current");
  }, [canStartNextMonth]);

  async function handlePurchase() {
    if (!selectedPlanId || !user) return;

    setLoading(true);
    try {
      const plan = plans.find((p) => p.id === selectedPlanId)!;

      const isClass = context.type === "class_enrollment";

      const rawDates = (context as any).dates;
      const dates = Array.isArray(rawDates) ? rawDates : null;

      const dateYMD = (context as any).dateYMD ? String((context as any).dateYMD) : null;

      const enrollNow =
        activationTiming === "next"
          ? false
          : ((context as any).enrollNow ?? (isClass ? true : false));

      const activationDateYMD =
        canStartNextMonth && activationTiming === "next"
          ? firstDayOfNextMonthYMD()
          : null;

      const metadata = isClass
        ? {
            classId: (context as any).classId,
            childId: (context as any).childId,
            enrollNow: Boolean(enrollNow),
            ...(dateYMD ? { dateYMD } : {}),
            ...(dates ? { dates } : {}),
            ...(activationDateYMD ? { activationDateYMD } : {}),
          }
        : {
            ...(activationDateYMD ? { activationDateYMD } : {}),
          };

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

        {canStartNextMonth && (
          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-sm font-medium">Aktywacja subskrypcji</div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={activationTiming === "current" ? "default" : "outline"}
                onClick={() => setActivationTiming("current")}
              >
                Od teraz
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activationTiming === "next" ? "default" : "outline"}
                onClick={() => setActivationTiming("next")}
              >
                Od następnego miesiąca
              </Button>
            </div>
            {activationTiming === "next" && (
              <div className="text-xs text-muted-foreground">
                Subskrypcja rozpocznie się od {firstDayOfNextMonthYMD()}.
              </div>
            )}
          </div>
        )}

        <Button className="w-full" disabled={!selectedPlanId || loading} onClick={handlePurchase}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Przejdź do płatności
        </Button>
      </DialogContent>
    </Dialog>
  );
}
