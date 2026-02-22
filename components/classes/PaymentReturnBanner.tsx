"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type BannerState = "idle" | "pending" | "success" | "error";

export function PaymentReturnBanner(props: { onFinalized?: () => void }) {
  const { onFinalized } = props;

  const sp = useSearchParams();
  const router = useRouter();

  const payment = sp.get("payment"); // success | error
  const intentId = sp.get("intent");

  const [state, setState] = useState<BannerState>("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);

  const doneRef = useRef(false);
  const onFinalizedRef = useRef(onFinalized);

  useEffect(() => {
    onFinalizedRef.current = onFinalized;
  }, [onFinalized]);

  const cleanUrl = useMemo(() => "/dashboard/classes", []);

  useEffect(() => {
    if (!payment || !intentId) return;

    doneRef.current = false;
    setDetails(null);

    let unsub: (() => void) | null = null;
    let clearTimer: any = null;
    let fallbackTimer: any = null;

    const clearQuerySoon = (delayMs: number) => {
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = setTimeout(() => router.replace(cleanUrl), delayMs);
    };

    const safeSet = (nextState: BannerState, nextMsg: string, nextDetails?: string | null) => {
      if (doneRef.current) return;
      setState(nextState);
      setMsg(nextMsg);
      if (typeof nextDetails !== "undefined") setDetails(nextDetails);
    };

    // payment=error
    if (payment === "error") {
      doneRef.current = true;
      safeSet("error", "❌ Płatność nieudana lub anulowana.");
      clearQuerySoon(3500);
      return () => clearTimer && clearTimeout(clearTimer);
    }

    safeSet("pending", "⏳ Płatność przyjęta. Czekamy na potwierdzenie…");

    const intentRef = doc(db, "payment_intents", intentId);

    // ✅ 1) Najpierw jednorazowy odczyt (łapie stan nawet jeśli webhook już zdążył)
    (async () => {
      try {
        const snap = await getDoc(intentRef);
        if (snap.exists()) {
          const data: any = snap.data();
          const status = String(data?.status || "");
          const finalizedAt = data?.finalizedAt;

          if (finalizedAt) {
            doneRef.current = true;
            setState("success");
            setMsg("✅ Gotowe. Zapisy zostały zaktualizowane.");
            onFinalizedRef.current?.();
            clearQuerySoon(1200);
            return;
          }

          if (status === "failed" || status === "cancelled") {
            doneRef.current = true;
            safeSet("error", "❌ Płatność oznaczona jako nieudana.");
            clearQuerySoon(3000);
            return;
          }
        }
      } catch (e: any) {
        // np. adblock / permission
        setDetails("Nie mogę odczytać statusu płatności (blokada / rules). Spróbuję potwierdzić zapis inaczej…");
      }
    })();

    // ✅ 2) Snapshot (na żywo)
    unsub = onSnapshot(
      intentRef,
      (snap) => {
        if (!snap.exists()) return;

        const data: any = snap.data();
        const status = String(data?.status || "");
        const finalizedAt = data?.finalizedAt;

        if (status === "paid" && !finalizedAt) {
          safeSet("pending", "✅ Płatność potwierdzona. Finalizujemy zapis…");
          return;
        }

        if (finalizedAt) {
          doneRef.current = true;
          setState("success");
          setMsg("✅ Gotowe. Zapisy zostały zaktualizowane.");
          onFinalizedRef.current?.();
          clearQuerySoon(1200);
          return;
        }

        if (status === "failed" || status === "cancelled") {
          doneRef.current = true;
          safeSet("error", "❌ Płatność oznaczona jako nieudana.");
          clearQuerySoon(3000);
        }
      },
      (err) => {
        setDetails("Nie mogę słuchać statusu płatności (blokada / rules).");
      }
    );

    // ✅ 3) Fallback po 6s: jeśli intent nie dochodzi, a zapis już jest (enrollment istnieje) -> pokaż sukces
    fallbackTimer = setTimeout(async () => {
      if (doneRef.current) return;

      try {
        // spróbuj odczytać intent (może już jest finalizedAt)
        const intentSnap = await getDoc(intentRef);
        const data: any = intentSnap.data() || {};
        const finalizedAt = data?.finalizedAt;

        if (finalizedAt) {
          doneRef.current = true;
          setState("success");
          setMsg("✅ Płatność potwierdzona.");
          onFinalizedRef.current?.();
          clearQuerySoon(1200);
          return;
        }

        // jeśli nie możemy polegać na finalizedAt (rules/adblock), spróbuj potwierdzić skutki:
        // 1) one-off class -> enrollment
        const classId = String(data?.metadata?.classId || "");
        const childId = String(data?.metadata?.childId || "");

        if (classId && childId) {
          const enrollSnap = await getDocs(
            query(
              collection(db, "enrollments"),
              where("classId", "==", classId),
              where("childId", "==", childId),
              limit(1)
            )
          );

          if (!enrollSnap.empty) {
            doneRef.current = true;
            setState("success");
            setMsg("✅ Zapis na zajęcia został potwierdzony.");
            onFinalizedRef.current?.();
            clearQuerySoon(1200);
            return;
          }
        }

        // 2) monthly/other -> entitlement (u Ciebie entitlements docId = intentId)
        const entSnap = await getDoc(doc(db, "entitlements", intentId));
        if (entSnap.exists()) {
          doneRef.current = true;
          setState("success");
          setMsg("✅ Subskrypcja aktywna. Dostęp został nadany.");
          onFinalizedRef.current?.();
          clearQuerySoon(1200);
          return;
        }
      } catch (e) {
        setDetails((d) => d || "Wygląda na to, że coś blokuje połączenie z Firestore (np. adblock).");
      }

      setState("pending");
      setMsg("⏳ Nadal czekamy na potwierdzenie. Jeśli trwa to długo, odśwież stronę.");
    }, 6000);


    return () => {
      if (unsub) unsub();
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (clearTimer) clearTimeout(clearTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment, intentId, router, cleanUrl]);

  if (!msg || state === "idle") return null;

  const cls =
    state === "success"
      ? "border-green-200 bg-green-50"
      : state === "error"
      ? "border-red-200 bg-red-50"
      : "border-yellow-200 bg-yellow-50";

  const icon =
    state === "success" ? (
      <CheckCircle2 className="w-4 h-4" />
    ) : state === "error" ? (
      <XCircle className="w-4 h-4" />
    ) : (
      <Loader2 className="w-4 h-4 animate-spin" />
    );

  return (
    <div className={`mb-4 rounded-lg border p-3 text-sm ${cls}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5">{icon}</div>
          <div>
            <div className="font-medium">{msg}</div>
            {details && <div className="mt-1 text-muted-foreground">{details}</div>}
          </div>
        </div>

        {state === "pending" && (
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Odśwież
          </Button>
        )}
      </div>
    </div>
  );
}
