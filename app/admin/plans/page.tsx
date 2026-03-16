"use client";

import { useEffect, useMemo, useState } from "react";
import { seedDefaultPlans } from "@/features/billing";
import { getPlans } from "@/services/plans.service";
import type { Plan } from "@/types/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Crown, ShieldCheck, Sparkles, Ticket } from "lucide-react";

export default function AdminPlansSeedPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPlans()
      .then((rows) => {
        if (!active) return;
        setPlans(rows.sort((a, b) => a.priceCents - b.priceCents));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const active = plans.filter((p) => p.isActive).length;
    const monthly = plans.filter((p) => p.validity?.kind === "monthly").length;
    return { all: plans.length, active, monthly };
  }, [plans]);
  const maxPriceCents = useMemo(
    () => plans.reduce((max, p) => Math.max(max, p.priceCents), 0),
    [plans]
  );

  function price(value: number) {
    return `${(value / 100).toFixed(2)} PLN`;
  }

  function creditsLabel(plan: Plan) {
    const credits = plan.limits?.credits;
    if (!credits) return "Bez limitu kredytów";
    if (credits.oneTime) return "Jednorazowe wejście";
    if (credits.unlimited) return "Nielimitowane zajęcia";
    const period = credits.period === "month" ? "miesiąc" : credits.period === "week" ? "tydzień" : "okres";
    return `${credits.amount ?? 0} zajęć / ${period}`;
  }

  function validityLabel(plan: Plan) {
    if (plan.validity?.kind === "monthly") return "Ważne do końca miesiąca";
    if (plan.validity?.kind === "one_off") return "Ważne na pojedynczy termin";
    return "Ważność wg ustawień";
  }

  function imageByType(type: Plan["type"]) {
    if (type === "subscription_gold") {
      return "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80";
    }
    if (type === "subscription_standard") {
      return "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80";
    }
    if (type === "monthly_4") {
      return "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80";
    }
    return "https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?auto=format&fit=crop&w=1200&q=80";
  }

  function IconByType({ type }: { type: Plan["type"] }) {
    if (type === "subscription_gold") return <Crown className="h-4 w-4 text-amber-600" />;
    if (type === "subscription_standard") return <ShieldCheck className="h-4 w-4 text-blue-600" />;
    if (type === "monthly_4") return <CalendarDays className="h-4 w-4 text-emerald-600" />;
    return <Ticket className="h-4 w-4 text-violet-600" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Plany i zasady</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Przejrzysty podgląd ofert dla rodziców: co zawiera plan, ile zajęć daje i jak długo działa.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={async () => {
              await seedDefaultPlans();
              const rows = await getPlans();
              setPlans(rows.sort((a, b) => a.priceCents - b.priceCents));
              alert("Plany zapisane w Firestore");
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Odśwież domyślne plany
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-zinc-500">Wszystkie plany</div>
          <div className="mt-1 text-2xl font-semibold">{stats.all}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-zinc-500">Aktywne</div>
          <div className="mt-1 text-2xl font-semibold">{stats.active}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-zinc-500">Plany miesięczne</div>
          <div className="mt-1 text-2xl font-semibold">{stats.monthly}</div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-sm text-zinc-500">Ładowanie planów...</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-800">Porównanie cen planów</h3>
            <div className="mt-3 space-y-2">
              {plans.map((plan) => {
                const width = maxPriceCents > 0 ? Math.max(12, Math.round((plan.priceCents / maxPriceCents) * 100)) : 12;
                return (
                  <div key={`chart-${plan.id}`} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-600">
                      <span>{plan.name}</span>
                      <span className="font-medium">{price(plan.priceCents)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-zinc-700 to-zinc-900 transition-all duration-700"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Cena</th>
                  <th className="px-4 py-3">Zajęcia</th>
                  <th className="px-4 py-3">Ważność</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plans.map((plan) => (
                  <tr key={`row-${plan.id}`} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium">{plan.name}</td>
                    <td className="px-4 py-3">{price(plan.priceCents)}</td>
                    <td className="px-4 py-3">{creditsLabel(plan)}</td>
                    <td className="px-4 py-3">{validityLabel(plan)}</td>
                    <td className="px-4 py-3">
                      <Badge className={plan.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}>
                        {plan.isActive ? "aktywny" : "nieaktywny"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
              <img src={imageByType(plan.type)} alt={plan.name} className="h-40 w-full object-cover" />
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100">
                    <IconByType type={plan.type} />
                  </span>
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  <Badge className={plan.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}>
                    {plan.isActive ? "aktywny" : "nieaktywny"}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-600">{plan.description || "Brak opisu planu."}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-500">Cena</div>
                    <div className="text-base font-semibold">{price(plan.priceCents)}</div>
                  </div>
                  <div className="rounded-xl border bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-500">Zakres</div>
                    <div className="text-base font-semibold">{plan.scope === "child" ? "Na dziecko" : "Na rodzica"}</div>
                  </div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">Zasady planu</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                    <li>{creditsLabel(plan)}</li>
                    <li>{validityLabel(plan)}</li>
                    <li>
                      Zamrożenia w miesiącu: {plan.limits?.freezePerMonth ?? 0}
                    </li>
                    <li>
                      Materiały: {plan.benefits?.materials ?? "brak"} • Wydarzenia: {plan.benefits?.events ?? "brak"}
                    </li>
                  </ul>
                </div>
              </div>
              </div>
            ))}
            {plans.length === 0 ? (
              <div className="rounded-2xl border bg-white p-8 text-center text-sm text-zinc-500">
                Brak planów w bazie. Użyj przycisku „Odśwież domyślne plany”.
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
