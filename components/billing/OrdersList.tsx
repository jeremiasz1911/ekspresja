"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPlans } from "@/services/plans.service";
import { getParentProfile } from "@/services/user-profile.service";

import type { PaymentIntent } from "@/types/payment-intents";
import type { Plan } from "@/types/plans";
import type { Child } from "@/types/child";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Loader2 } from "lucide-react";

type Filter = "unpaid" | "paid" | "all";

function moneyPLN(cents: number) {
  const v = Number(cents || 0) / 100;
  return v.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
}

function fmtDateTime(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("pl-PL");
}

function statusBadge(status: string) {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-600">opłacone</Badge>;
    case "redirected":
      return <Badge className="bg-blue-600">rozpoczęte</Badge>;
    case "created":
      return <Badge variant="secondary">utworzone</Badge>;
    case "failed":
      return <Badge className="bg-red-600">nieudane</Badge>;
    case "cancelled":
      return <Badge variant="outline">anulowane</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

type Props = {
  refreshTick?: number;
};

export function OrdersList({ refreshTick = 0 }: Props) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Array<PaymentIntent & { finalizedAt?: number; providerTitle?: string }>>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [filter, setFilter] = useState<Filter>("unpaid");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [plansList, profile, snap] = await Promise.all([
          getPlans(),
          getParentProfile(user.uid),
          getDocs(query(collection(db, "payment_intents"), where("parentId", "==", user.uid))),
        ]);

        if (!alive) return;

        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .map((x) => x as any)
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

        setPlans(plansList ?? []);
        setChildren((profile?.children as Child[]) ?? []);
        setItems(list);
      } catch (e: any) {
        if (!alive) return;
        setError(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user, refreshTick]);

  const plansById = useMemo(() => {
    const m = new Map<string, Plan>();
    for (const p of plans) m.set(p.id, p);
    return m;
  }, [plans]);

  const childNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of children) m.set(c.id, `${c.firstName} ${c.lastName}`.trim());
    return m;
  }, [children]);

  const visible = useMemo(() => {
    const isPaid = (s: string) => s === "paid";
    const isUnpaid = (s: string) => s !== "paid" && s !== "cancelled";
    if (filter === "paid") return items.filter((x) => isPaid(String(x.status)));
    if (filter === "unpaid") return items.filter((x) => isUnpaid(String(x.status)));
    return items;
  }, [items, filter]);

  async function pay(intentId: string) {
    setPayingId(intentId);
    setError(null);

    try {
      const res = await fetch("/api/payments/tpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.details || "Nie udało się rozpocząć płatności.");
      }

      if (!data?.paymentUrl) throw new Error("Brak paymentUrl z API.");
      window.location.assign(String(data.paymentUrl));
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setPayingId(null);
    }
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === "unpaid" ? "default" : "outline"}
          onClick={() => setFilter("unpaid")}
        >
          Do opłacenia
        </Button>
        <Button
          variant={filter === "paid" ? "default" : "outline"}
          onClick={() => setFilter("paid")}
        >
          Opłacone
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Wszystkie
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {visible.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Zamówienia</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Brak pozycji dla wybranego filtra.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((x) => {
            const plan = plansById.get(x.planId);
            const status = String(x.status || "");
            const metaChildId = (x.metadata?.childId || x.childId || "") as string;
            const who = metaChildId ? childNameById.get(metaChildId) : null;

            const isPayable = status !== "paid" && status !== "cancelled";
            const isPaying = payingId === x.id;

            return (
              <Card key={x.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {plan?.name ?? x.description ?? x.planId}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Utworzono: {fmtDateTime(x.createdAt)} • Kwota:{" "}
                        <span className="font-medium">{moneyPLN(x.amountCents)}</span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {who ? <>Dla dziecka: <span className="font-medium">{who}</span> • </> : null}
                        Intent: <span className="font-mono">{x.id}</span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Opłacono: {fmtDateTime(x.paidAt)} • Finalizacja:{" "}
                        {fmtDateTime((x as any).finalizedAt)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {statusBadge(status)}

                      <Button
                        size="sm"
                        disabled={!isPayable || isPaying}
                        onClick={() => pay(x.id)}
                      >
                        {isPaying ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Przekierowuję…
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {status === "redirected" ? "Kontynuuj" : "Zapłać"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}