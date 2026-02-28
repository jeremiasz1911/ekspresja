"use client";

import { useEffect, useMemo, useState } from "react";
import type { Class, EnrollmentRequest } from "@/types";
import { collection, getDocsFromServer, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
 
import { usageKeyForPeriod } from "@/services/time";
import { useAuth } from "@/components/auth/AuthProvider";
import { getParentProfile } from "@/services/user-profile.service";
import {
  createEnrollmentRequest,
  getEnrollmentRequestForChild,
  withdrawEnrollmentRequest,
} from "@/services/enrollment-requests.service";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  Calendar,
  Clock,
  MapPin,
  User,
  Repeat,
  Loader2,
  CheckCircle2,
  Hourglass,
  XCircle,
  X,
} from "lucide-react";

import { PurchasePlanModal } from "../billing/PurchasePlanModal";
import { CreditsUsageModal } from "@/components/user-classes/CreditsUsageModal";

/* ================= TYPES ================= */

type Child = { id: string; firstName: string; lastName: string };

type RequestState =
  | { state: "loading" }
  | { state: "none" }
  | { state: "loaded"; request: EnrollmentRequest };

type Props = {
  open: boolean;
  selectedClass: Class | null;
  initialDateYMD?: string | null;
  onClose: () => void;
};

function safeReqDates(req: EnrollmentRequest): string[] {
  const raw = (req as any)?.dates;
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x || "").trim()).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x));
}

function monthOf(ymd?: string | null) {
  return ymd ? String(ymd).slice(0, 7) : null; // YYYY-MM
}

/* ================= COMPONENT ================= */

export function EnrollModal({ open, selectedClass, initialDateYMD = null, onClose }: Props) {
  const { user } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<"credits" | "online" | "cash" | "declaration">("cash");

  const [requestStates, setRequestStates] = useState<Record<string, RequestState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [withdrawingChildId, setWithdrawingChildId] = useState<string | null>(null);

  const [showPlans, setShowPlans] = useState(false);
  const canShowPlans = showPlans && selectedClass !== null && selectedChildIds.length > 0;

  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [creditsLoadedForChild, setCreditsLoadedForChild] = useState<string | null>(null);

  const [showCreditsUsage, setShowCreditsUsage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedChildId = selectedChildIds[0] ?? null;
  const clickedMonth = monthOf(initialDateYMD);

  const isPastClicked = useMemo(() => {
    if (!initialDateYMD) return false;
    const d = new Date(initialDateYMD + "T12:00:00");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    return d < today;
  }, [initialDateYMD]);

  /* ================= CREDITS ================= */

  function tsFromYMD(ymd: string) {
    // południe żeby uniknąć przesunięć strefy
    return new Date(`${ymd}T12:00:00`).getTime();
  }

  async function loadCredits(forChildId: string, forDates?: string[] | null) {
    if (!user) return;

    const baseYMD = (forDates && forDates[0]) ? forDates[0] : (initialDateYMD ?? null);
    const baseTs = baseYMD ? tsFromYMD(baseYMD) : Date.now();

    const snap = await getDocsFromServer(
      query(
        collection(db, "entitlements"),
        where("parentId", "==", user.uid),
        where("status", "==", "active")
      )
    );

    let bestRemaining = 0;
    let hasAny = false;

    snap.forEach((doc) => {
      const data: any = doc.data();
      const entChildId = String(data?.childId || "").trim();

      // parent-scope + child-scope
      if (entChildId && entChildId !== forChildId) return;

      // ✅ entitlement musi obejmować miesiąc/termin który sprawdzamy
      const validFrom = Number(data?.validFrom || 0);
      const validTo = Number(data?.validTo || 0);
      if (baseTs < validFrom || baseTs > validTo) return;

      const credits = data?.limits?.credits || {};
      const period = String(credits?.period || "month");
      const total = Number(credits?.amount || 0);
      const unlimited = Boolean(credits?.unlimited);

      if (!unlimited && total <= 0) return;

      // ✅ klucz okresu liczony z DATY KLIKNIĘTEGO TERMINU (a nie z "teraz")
      const key = usageKeyForPeriod(period, baseTs);
      const used = Number(data?.usage?.credits?.[key] || 0);
      const remaining = unlimited ? 999999 : Math.max(0, total - used);

      bestRemaining = Math.max(bestRemaining, remaining);
      hasAny = true;
    });

    setCreditsLoadedForChild(forChildId);
    setCreditsRemaining(hasAny ? bestRemaining : 0);

    if (hasAny && bestRemaining > 0) {
      setPaymentMethod((prev) =>
        prev === "cash" || prev === "declaration" ? "credits" : prev
      );
    }
  }

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (!user || !open || !selectedClass) return;

    setErrorMsg(null);

    getParentProfile(user.uid).then(async (profile) => {
      const kids = profile?.children ?? [];
      setChildren(kids);
      setSelectedChildIds([]);

      const initial: Record<string, RequestState> = {};
      for (const c of kids) initial[c.id] = { state: "loading" };
      setRequestStates(initial);

      for (const c of kids) {
        const req = await getEnrollmentRequestForChild(c.id, selectedClass.id);
        setRequestStates((prev) => ({
          ...prev,
          [c.id]: req ? { state: "loaded", request: req } : { state: "none" },
        }));
      }
    });
  }, [user, open, selectedClass]);

  useEffect(() => {
    if (!open || !user) return;
    if (!selectedChildId) return;
    loadCredits(selectedChildId, initialDateYMD ? [initialDateYMD] : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, selectedChildId]);

  // credits => max 1 dziecko
  useEffect(() => {
    if (paymentMethod !== "credits") return;
    if (selectedChildIds.length > 1) setSelectedChildIds([selectedChildIds[0]]);
  }, [paymentMethod, selectedChildIds]);

  /* ================= ACTIONS ================= */
  
  function toggleChild(id: string) {
    setSelectedChildIds((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);

      if (paymentMethod === "credits") return [id];
      return [...prev, id];
    });
  }

  async function enrollWithCredits(childId: string, dates: string[]) {
    if (!user || !selectedClass) return;
    const token = await user.getIdToken();

    const res = await fetch("/api/enrollments/consume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ classId: selectedClass.id, childId, dates }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "CREDITS_ENROLL_FAILED");

    if (typeof data?.remaining === "number") setCreditsRemaining(data.remaining);
  }

  async function confirmEnrollCashOrDeclaration() {
    if (!user || !selectedClass) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      for (const cid of selectedChildIds) {
        setRequestStates((prev) => ({ ...prev, [cid]: { state: "loading" } }));

        await createEnrollmentRequest({
          parentId: user.uid,
          childId: cid,
          classId: selectedClass.id,
          paymentMethod,
        });

        const fresh = await getEnrollmentRequestForChild(cid, selectedClass.id);
        setRequestStates((prev) => ({
          ...prev,
          [cid]: fresh ? { state: "loaded", request: fresh } : { state: "none" },
        }));
      }

      setSelectedChildIds([]);
      onClose();
    } catch (e: any) {
      setErrorMsg(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmCreditsEnroll(dates: string[]) {
    if (!user || !selectedClass) return;
    if (!selectedChildId) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await enrollWithCredits(selectedChildId, dates);
      await loadCredits(selectedChildId, dates);

      // odśwież request dla tego dziecka (żeby badge od razu pokazywał nowe daty)
      const fresh = await getEnrollmentRequestForChild(selectedChildId, selectedClass.id);
      setRequestStates((prev) => ({
        ...prev,
        [selectedChildId]: fresh ? { state: "loaded", request: fresh } : { state: "none" },
      }));

      setSelectedChildIds([]);
      onClose();
    } catch (e: any) {
      setErrorMsg(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  function handleConfirm() {
    if (paymentMethod === "online") {
      setShowPlans(true);
      return;
    }

    if (paymentMethod === "credits") {
      setShowCreditsUsage(true);
      return;
    }

    confirmEnrollCashOrDeclaration();
  }

  async function handleWithdraw(childId: string) {
    const rs = requestStates[childId];
    if (!rs || rs.state !== "loaded") return;

    setWithdrawingChildId(childId);
    await withdrawEnrollmentRequest(rs.request.id);

    setRequestStates((prev) => ({ ...prev, [childId]: { state: "none" } }));
    setWithdrawingChildId(null);
  }

  /* ================= HELPERS ================= */

  function weekdayLabel(day?: number) {
    const map = {
      1: "Poniedziałek",
      2: "Wtorek",
      3: "Środa",
      4: "Czwartek",
      5: "Piątek",
      6: "Sobota",
      7: "Niedziela",
    };
    return day ? map[day as keyof typeof map] : "—";
  }

  function duration(start?: string, end?: string) {
    if (!start || !end) return "—";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return `${eh * 60 + em - (sh * 60 + sm)} min`;
  }

  function StatusBadge({ req }: { req: EnrollmentRequest }) {
    if (req.status === "pending") {
      return (
        <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
          <Hourglass className="w-3 h-3" />
          Oczekuje
        </span>
      );
    }
    if (req.status === "approved") {
      return (
        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          <CheckCircle2 className="w-3 h-3" />
          Zapisany
        </span>
      );
    }
    if (req.status === "canceled_by_admin") {
      return (
        <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
          <XCircle className="w-3 h-3" />
          Anulowane przez admina
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
        <XCircle className="w-3 h-3" />
        Odrzucone
      </span>
    );
  }

  function CreditsBadge({ dates }: { dates: string[] }) {
    if (dates.length === 0) return null;
    console.log("DATES", dates);
    console.log("CLICKED_MONTH", clickedMonth);
    console.log("CLICKED", initialDateYMD);

    const clicked = initialDateYMD ? dates.includes(initialDateYMD) : false;

    const countInMonth = clickedMonth
      ? dates.filter(d => d.startsWith(clickedMonth)).length
      : dates.length;
    if (countInMonth=== 0 ) return null;
    console.log("COUNT_IN_MONTH", countInMonth);

    const inClickedMonth = countInMonth === 0 ? "" : countInMonth;

    console.log("IN_CLICKED_MONTH_FINAL", inClickedMonth);




    if (clicked) {
      return (
        <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          Zarezerwowany termin
        </span>
      );
    }

    // jeśli kliknięty miesiąc ma coś, pokaż count dla tego miesiąca (to usuwa “magiczne ALL”)
    if (clickedMonth) {
      return null
      // return (
      //   <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
      //     Zarezerwowane w {clickedMonth}: {inClickedMonth}
      //   </span>
      // );
    }

    return (
      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
        Zarezerwowane: {dates.length}
      </span>
    );
  }

  /* ================= UI ================= */

  const showCreditsInfo =
    selectedChildId && creditsLoadedForChild === selectedChildId && creditsRemaining !== null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
        <DialogContent className="max-w-2xl space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Zapis na zajęcia</DialogTitle>
          </DialogHeader>

          {initialDateYMD && (
            <div className="text-sm text-muted-foreground">
              Kliknięty termin: {initialDateYMD}
            </div>
          )}

          <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
            <div className="text-lg font-semibold">{selectedClass?.title}</div>

            {selectedClass?.description && (
              <p className="text-sm text-muted-foreground">{selectedClass.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {weekdayLabel(selectedClass?.weekday)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {selectedClass?.startTime} – {selectedClass?.endTime} ({duration(selectedClass?.startTime, selectedClass?.endTime)})
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {selectedClass?.location}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {selectedClass?.instructorName}
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Repeat className="w-4 h-4" />
                {selectedClass?.recurrence.type === "weekly"
                  ? "Co tydzień"
                  : selectedClass?.recurrence.type === "biweekly"
                  ? "Co dwa tygodnie"
                  : selectedClass?.recurrence.type === "none"
                  ? "Jednorazowe"
                  : "Miesięcznie"}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Wybierz dzieci</h3>

            {children.map((c) => {
              const rs = requestStates[c.id];

              const req = rs?.state === "loaded" ? rs.request : null;
              const reqDates = req ? safeReqDates(req) : [];
              const isCreditsReq = !!req && ((req as any).paymentMethod === "credits" || reqDates.length > 0);

              // subskrypcja (pending/approved) blokuje checkbox, ale kredyty nie (bo to rezerwacje per data)
              const disabled =
                !isCreditsReq &&
                rs?.state === "loaded" &&
                (rs.request.status === "pending" || rs.request.status === "approved");

              return (
                <div key={c.id} className="flex items-center justify-between rounded-lg border px-4 py-2">
                  <label className="flex items-center gap-3">
                    <Checkbox
                      disabled={disabled}
                      checked={selectedChildIds.includes(c.id)}
                      onCheckedChange={() => toggleChild(c.id)}
                    />
                    {c.firstName} {c.lastName}
                  </label>

                  <div className="flex items-center gap-2">
                    {rs?.state === "loading" && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Sprawdzam…
                      </span>
                    )}

                    {rs?.state === "loaded" && req && isCreditsReq && (
                      <CreditsBadge dates={reqDates} />
                    )}

                    {rs?.state === "loaded" && req && !isCreditsReq && (
                      <>
                        <StatusBadge req={req} />
                        {req.status === "pending" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={withdrawingChildId === c.id}
                            onClick={() => handleWithdraw(c.id)}
                          >
                            {withdrawingChildId === c.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {paymentMethod === "credits" && !selectedChildId && (
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              Wybierz dziecko, aby sprawdzić dostępne kredyty.
            </div>
          )}

          {paymentMethod === "credits" && showCreditsInfo && (
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              {creditsRemaining! > 0
                ? `Masz dostępne kredyty: ${creditsRemaining}`
                : "Nie masz dostępnych kredytów w tym okresie."}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="space-y-2">
            {selectedChildId && creditsRemaining !== null && creditsRemaining > 0 && (
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="credits" />
                Użyj kredytu ({creditsRemaining} dostępne)
              </label>
            )}

            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="online" />
              Płatność online
            </label>

            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="cash" />
              Gotówka
            </label>

            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="declaration" />
              Deklaracja
            </label>
          </RadioGroup>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" disabled={selectedChildIds.length === 0 || submitting || isPastClicked}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {paymentMethod === "credits" ? "Dalej (wybór terminów)" : "Wyślij zgłoszenie"}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Potwierdzenie</AlertDialogTitle>
                <AlertDialogDescription>
                  {paymentMethod === "credits"
                    ? "Wybierzesz terminy do rezerwacji w kolejnym kroku."
                    : "Czy na pewno chcesz wysłać zgłoszenie?"}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>Dalej</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {canShowPlans && (
            <PurchasePlanModal
              open={showPlans}
              onClose={() => setShowPlans(false)}
              context={{
                type: "class_enrollment",
                classId: selectedClass!.id,
                childId: selectedChildIds[0],
                dateYMD: initialDateYMD ?? undefined,
              }}
              onSuccess={async ({ paymentIntentId }) => {
                try {
                  const res = await fetch("/api/payments/tpay/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ intentId: paymentIntentId }),
                  });

                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    console.error("TPAY OPENAPI ERROR", data);
                    return;
                  }

                  window.location.href = data.paymentUrl;
                } catch (e) {
                  console.error("TPAY OPENAPI EXCEPTION", e);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      {isPastClicked && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-800">
          Ten termin jest w przeszłości — nie można się zapisać.
        </div>
      )}

      {selectedClass && selectedChildId && creditsRemaining !== null && (
        <CreditsUsageModal
          open={showCreditsUsage}
          onClose={() => setShowCreditsUsage(false)}
          selectedClass={selectedClass}
          creditsRemaining={creditsRemaining}
          initialDateYMD={initialDateYMD}
          onConfirm={(dates) => {
            setShowCreditsUsage(false);
            confirmCreditsEnroll(dates);
          }}
        />
      )}
    </>
  );
}
