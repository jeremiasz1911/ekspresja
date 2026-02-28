"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { usageKeyForPeriod } from "@/services/time";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

type CreditsInfo =
  | { state: "loading" }
  | { state: "none" }
  | {
      state: "loaded";
      remaining: number;
      used: number;
      total: number;
      entitlementId: string;
      periodKey: string;
    };

export function CreditsBadge({ dates }: { dates?: string[] }) {
  const { user } = useAuth();
  const [info, setInfo] = useState<CreditsInfo>({ state: "loading" });

  useEffect(() => {
    if (!user) return;

    (async () => {
      setInfo({ state: "loading" });

      const snap = await getDocs(
        query(
          collection(db, "entitlements"),
          where("parentId", "==", user.uid),
          where("status", "==", "active")
        )
      );

      if (snap.empty) {
        setInfo({ state: "none" });
        return;
      }

      const baseYMD = dates?.[0] ?? null;
      const baseTs = baseYMD ? new Date(`${baseYMD}T12:00:00`).getTime() : Date.now();

      let best: any = null;

      for (const d of snap.docs) {
        const data: any = d.data();

        const validFrom = Number(data?.validFrom || 0);
        const validTo = Number(data?.validTo || 0);

        // ✅ jeśli mamy dates -> sprawdzamy ważność dla tej daty, nie dla "teraz"
        if (baseTs < validFrom || baseTs > validTo) continue;

        const credits = data?.limits?.credits || {};
        const total = Number(credits?.amount || 0);
        const unlimited = Boolean(credits?.unlimited);
        const period = String(credits?.period || "month");

        if (!unlimited && total <= 0) continue;

        const key = usageKeyForPeriod(period, baseTs);
        const used = Number(data?.usage?.credits?.[key] || 0);
        const remaining = unlimited ? 999999 : Math.max(0, total - used);

        const candidate = { id: d.id, remaining, used, total: unlimited ? 999999 : total, periodKey: key };
        if (!best || candidate.remaining > best.remaining) best = candidate;
      }

      if (!best) {
        setInfo({ state: "none" });
        return;
      }

      setInfo({ state: "loaded", ...best });
    })();
  }, [user, dates?.join("|")]);

  // reszta renderu bez zmian

  if (info.state === "none") return null;

  if (info.state === "loading") {
    return (
      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-3 w-40" />
      </Card>
    );
  }

  const percent =
    info.total > 0 ? Math.min(100, Math.round((info.used / info.total) * 100)) : 0;

  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">Kredyty</div>
          <div className="text-xs text-muted-foreground">
            Okres: <span className="font-mono">{info.periodKey}</span>
          </div>
        </div>

        <Badge variant={info.remaining > 0 ? "default" : "destructive"}>
          {info.remaining}/{info.total}
        </Badge>
      </div>

      <Progress value={percent} />

      <div className="text-xs text-muted-foreground">
        Wykorzystane: <span className="font-medium text-foreground">{info.used}</span>
      </div>
    </Card>
  );
}
