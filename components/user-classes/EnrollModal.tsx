"use client";

import { useEffect, useState } from "react";
import type { Class, EnrollmentRequest } from "@/types";

import { useAuth } from "@/components/auth/AuthProvider";
import { getParentProfile } from "@/services/user-profile.service";
import {
  createEnrollmentRequest,
  getEnrollmentRequestForChild,
  withdrawEnrollmentRequest,
} from "@/services/enrollment-requests.service";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
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

/* ================= TYPES ================= */

type Child = {
  id: string;
  firstName: string;
  lastName: string;
};

type RequestState =
  | { state: "loading" }
  | { state: "none" }
  | { state: "loaded"; request: EnrollmentRequest };

type Props = {
  open: boolean;
  selectedClass: Class | null;
  onClose: () => void;
};

/* ================= COMPONENT ================= */

export function EnrollModal({ open, selectedClass, onClose }: Props) {
  const { user } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<"online" | "cash" | "declaration">("cash");

  const [requestStates, setRequestStates] =
    useState<Record<string, RequestState>>({});

  const [submitting, setSubmitting] = useState(false);
  const [withdrawingChildId, setWithdrawingChildId] =
    useState<string | null>(null);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (!user || !open || !selectedClass) return;

    getParentProfile(user.uid).then(async (profile) => {
      const kids = profile?.children ?? [];
      setChildren(kids);
      setSelectedChildIds([]);

      // ⏳ najpierw: loading
      const initial: Record<string, RequestState> = {};
      for (const c of kids) {
        initial[c.id] = { state: "loading" };
      }
      setRequestStates(initial);

      // 🔄 pobieranie statusów
      for (const c of kids) {
        const req = await getEnrollmentRequestForChild(
          c.id,
          selectedClass.id
        );

        setRequestStates((prev) => ({
          ...prev,
          [c.id]: req
            ? { state: "loaded", request: req }
            : { state: "none" },
        }));
      }
    });
  }, [user, open, selectedClass]);

  /* ================= ACTIONS ================= */

  function toggleChild(id: string) {
    setSelectedChildIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  async function confirmEnroll() {
    if (!user || !selectedClass) return;

    setSubmitting(true);
    try {
      for (const childId of selectedChildIds) {
        setRequestStates((prev) => ({
          ...prev,
          [childId]: { state: "loading" },
        }));

        await createEnrollmentRequest({
          parentId: user.uid,
          childId,
          classId: selectedClass.id,
          paymentMethod,
        });

        const fresh = await getEnrollmentRequestForChild(
          childId,
          selectedClass.id
        );

        setRequestStates((prev) => ({
          ...prev,
          [childId]: fresh
            ? { state: "loaded", request: fresh }
            : { state: "none" },
        }));
      }

      setSelectedChildIds([]);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw(childId: string) {
    const rs = requestStates[childId];
    if (!rs || rs.state !== "loaded") return;

    setWithdrawingChildId(childId);

    await withdrawEnrollmentRequest(rs.request.id);

    setRequestStates((prev) => ({
      ...prev,
      [childId]: { state: "none" },
    }));

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

  /* ================= UI ================= */

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Zapis na zajęcia
          </DialogTitle>
        </DialogHeader>

        {/* ===== CLASS DETAILS ===== */}
        <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
          <div className="text-lg font-semibold">
            {selectedClass?.title}
          </div>

          {selectedClass?.description && (
            <p className="text-sm text-muted-foreground">
              {selectedClass.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {weekdayLabel(selectedClass?.weekday)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {selectedClass?.startTime} – {selectedClass?.endTime} (
              {duration(
                selectedClass?.startTime,
                selectedClass?.endTime
              )}
              )
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
                : "Jednorazowe"}
            </div>
          </div>
        </div>

        {/* ===== CHILDREN ===== */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">
            Wybierz dzieci
          </h3>

          {children.map((c) => {
            const rs = requestStates[c.id];
            const disabled =
              rs?.state === "loaded" &&
              (rs.request.status === "pending" ||
                rs.request.status === "approved");

            return (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border px-4 py-2"
              >
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

                  {rs?.state === "loaded" && (
                    <>
                      <StatusBadge req={rs.request} />
                      {rs.request.status === "pending" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={
                            withdrawingChildId === c.id
                          }
                          onClick={() =>
                            handleWithdraw(c.id)
                          }
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

        {/* ===== PAYMENT ===== */}
        <RadioGroup
          value={paymentMethod}
          onValueChange={(v) =>
            setPaymentMethod(v as any)
          }
        >
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

        {/* ===== CONFIRM ===== */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="w-full"
              disabled={
                selectedChildIds.length === 0 ||
                submitting
              }
            >
              {submitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Wyślij zgłoszenie
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Potwierdzenie zapisu
              </AlertDialogTitle>
              <AlertDialogDescription>
                Czy na pewno chcesz wysłać zgłoszenie?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>
                Anuluj
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmEnroll}>
                Potwierdź
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
