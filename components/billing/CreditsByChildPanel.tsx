"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { getParentProfile } from "@/services/user-profile.service";
import { getPlans } from "@/services/plans.service";
import { usageKeyForPeriod } from "@/services/time";

import type { Entitlement } from "@/types/entitlements";
import type { Plan } from "@/types/plans";
import type { Child } from "@/types/child";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

function fmtDate(ts: number) {
  try {
    return new Date(ts).toLocaleDateString("pl-PL");
  } catch {
    return "—";
  }
}

function planTypeLabel(t?: string) {
  switch (t) {
    case "one_off_class":
      return "Płatność jednorazowa";
    case "monthly_4":
      return "Pakiet 4 zajęcia";
    case "subscription_standard":
      return "Subskrypcja STANDARD";
    case "subscription_gold":
      return "Subskrypcja GOLD";
    default:
      return t || "Plan";
  }
}

function cardLabel(v?: "standard" | "gold" | "none") {
  if (v === "gold") return "GOLD";
  if (v === "standard") return "STANDARD";
  return null;
}

type Props = {
  refreshTick?: number;
};

export function CreditsByChildPanel({ refreshTick = 0 }: Props) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [ents, setEnts] = useState<Entitlement[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [profile, plansList, entsSnap] = await Promise.all([
          getParentProfile(user.uid),
          getPlans(),
          getDocs(
            query(
              collection(db, "entitlements"),
              where("parentId", "==", user.uid),
              where("status", "==", "active")
            )
          ),
        ]);

        if (!alive) return;

        const now = Date.now();

        const entList = entsSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }) as Entitlement)
          // ważne “teraz”
          .filter((e) => now >= Number(e.validFrom || 0) && now <= Number(e.validTo || 0));

        setChildren((profile?.children as Child[]) ?? []);
        setPlans(plansList ?? []);
        setEnts(entList);
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

  const entsByChild = useMemo(() => {
    const map = new Map<string, Entitlement[]>();
    const general: Entitlement[] = [];

    for (const e of ents) {
      if (e.childId) {
        if (!map.has(e.childId)) map.set(e.childId, []);
        map.get(e.childId)!.push(e);
      } else {
        general.push(e);
      }
    }

    // sort: najpierw GOLD/STD potem reszta, potem końcówka ważności
    const score = (e: Entitlement) => {
      const card = e.benefits?.membershipCard;
      const s1 = card === "gold" ? 30 : card === "standard" ? 20 : 0;
      const s2 =
        e.type === "subscription_gold"
          ? 30
          : e.type === "subscription_standard"
          ? 20
          : e.type === "monthly_4"
          ? 10
          : 0;
      return s1 + s2;
    };

    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => score(b) - score(a) || Number(b.validTo) - Number(a.validTo));
    }
    general.sort((a, b) => score(b) - score(a) || Number(b.validTo) - Number(a.validTo));

    return { map, general };
  }, [ents]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kredyty</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-600">{error}</CardContent>
      </Card>
    );
  }

  if (children.length === 0 && ents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kredyty i subskrypcje</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Brak aktywnych pakietów/subskrypcji.
        </CardContent>
      </Card>
    );
  }

  function EntRow({ e }: { e: Entitlement }) {
    const plan = plansById.get(e.planId);
    const credits = e.limits?.credits;
    const unlimited = Boolean(credits?.unlimited);
    const amount = Number(credits?.amount || 0);
    const period = String(credits?.period || "month");

    const periodKey = usageKeyForPeriod(period, Date.now());
    const used = Number(e.usage?.credits?.[periodKey] || 0);
    const total = unlimited ? Infinity : amount;
    const remaining = unlimited ? Infinity : Math.max(0, amount - used);

    const pct =
      total === Infinity || total <= 0 ? 0 : Math.max(0, Math.min(100, (remaining / total) * 100));

    const card = cardLabel(e.benefits?.membershipCard);

    return (
      <div className="rounded-xl border p-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium truncate">
              {plan?.name ?? planTypeLabel(e.type)}
            </div>
            <div className="text-xs text-muted-foreground">
              Ważne: {fmtDate(e.validFrom)} – {fmtDate(e.validTo)}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {card && <Badge variant={card === "GOLD" ? "default" : "secondary"}>{card}</Badge>}
            <Badge variant="outline">{periodKey}</Badge>
          </div>
        </div>

        {credits ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Kredyty</span>
              <span className="font-medium">
                {remaining === Infinity ? "∞" : remaining} / {total === Infinity ? "∞" : total}
              </span>
            </div>
            {total !== Infinity && total > 0 ? <Progress value={pct} /> : null}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Ten plan nie ma kredytów.</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entsByChild.general.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pakiety ogólne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {entsByChild.general.map((e) => (
              <EntRow key={e.id} e={e} />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {children.map((c) => {
          const list = entsByChild.map.get(c.id) ?? [];
          return (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">
                    {c.firstName} {c.lastName}
                  </span>
                  <Badge variant="outline">{c.ageYears} lat</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {list.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Brak aktywnej subskrypcji/pakietu dla tego dziecka.
                  </div>
                ) : (
                  list.map((e) => <EntRow key={e.id} e={e} />)
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}