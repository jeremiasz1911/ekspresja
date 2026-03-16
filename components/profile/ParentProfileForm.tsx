"use client";
import { useEffect, useMemo, useState } from "react";
import type { ParentFormData } from "@/types/profile";
import type { ChildInput } from "@/types/auth";
import { Baby, Cake, CalendarCheck2, CreditCard, PencilLine, UserRound } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

function emptyChild(): ChildInput {
  return { firstName: "", lastName: "", ageYears: "" };
}

type Props = {
  initialValues: ParentFormData;
  childInsights?: Record<
    string,
    { activeEntitlements: number; activeEnrollments: number; classTitles: string[] }
  >;
  mode: "register" | "complete" | "edit";
  submitLabel?: string;
  onSubmit(data: ParentFormData): Promise<void>;
};

export function ParentProfileForm({
  initialValues,
  childInsights,
  mode,
  submitLabel,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<ParentFormData>(initialValues);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] =
    useState<ParentFormData | null>(null);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const totalActiveEnrollments = useMemo(
    () =>
      Object.values(childInsights ?? {}).reduce(
        (sum, child) => sum + child.activeEnrollments,
        0
      ),
    [childInsights]
  );

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  function touch(name: string) {
    setTouched((t) => ({ ...t, [name]: true }));
  }

  function validate(data: ParentFormData) {
    const e: Record<string, string> = {};

    if (!data.firstName.trim()) e.firstName = "Podaj imię.";
    if (!data.lastName.trim()) e.lastName = "Podaj nazwisko.";
    if (!data.email.trim()) e.email = "Podaj email.";
    if (!data.phone.trim()) e.phone = "Podaj numer telefonu.";

    if (
      !data.children.some(
        (c) =>
          c.firstName.trim() &&
          c.lastName.trim() &&
          Number(c.ageYears) > 0
      )
    ) {
      e.children = "Dodaj co najmniej jedno dziecko (imię, nazwisko, wiek).";
    }

    // Adres – miękki
    if (!data.street.trim()) e.street = "Uzupełnij ulicę.";
    if (!data.houseNumber.trim())
      e.houseNumber = "Uzupełnij numer domu.";
    if (!data.postalCode.trim())
      e.postalCode = "Uzupełnij kod pocztowy.";
    if (!data.city.trim()) e.city = "Uzupełnij miasto.";

    return e;
  }

  function update<K extends keyof ParentFormData>(
    key: K,
    value: ParentFormData[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateChild(index: number, patch: Partial<ChildInput>) {
    update(
      "children",
      form.children.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  }

  function addChild() {
    update("children", [...form.children, emptyChild()]);
  }

  function removeChild(index: number) {
    update(
      "children",
      form.children.filter((_, i) => i !== index)
    );
  }

  async function submitForm(data: ParentFormData) {
    setPending(true);
    setError(null);

    try {
      await onSubmit(data);
    } catch (err: any) {
      setError(err?.message ?? "Nie udało się zapisać danych.");
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      street: true,
      houseNumber: true,
      postalCode: true,
      city: true,
      children: true,
    });

    const validationErrors = validate(form);
    setErrors(validationErrors);

    const hardErrors = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "children",
    ].filter((k) => validationErrors[k]);

    const softErrors = [
      "street",
      "houseNumber",
      "postalCode",
      "city",
    ].filter((k) => validationErrors[k]);

    if (hardErrors.length > 0) {
      setError(
        "Uzupełnij: imię, nazwisko, email, numer telefonu oraz dane co najmniej jednego dziecka."
      );
      return;
    }

    if (softErrors.length > 0) {
      setPendingSubmit(form);
      setShowConfirm(true);
      return;
    }
    
    await submitForm(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dane rodzica */}
      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 font-medium">
          <UserRound className="h-4 w-4 text-zinc-500" />
          Dane rodzica
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            placeholder="Imię *"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            onBlur={() => touch("firstName")}
            className={
              errors.firstName && touched.firstName ? "border-red-500" : ""
            }
          />

          <Input
            placeholder="Nazwisko *"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            onBlur={() => touch("lastName")}
            className={
              errors.lastName && touched.lastName ? "border-red-500" : ""
            }
          />
        </div>

        <Input
          placeholder="Email *"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          disabled={mode !== "edit"}
          onBlur={() => touch("email")}
          className={
            errors.email && touched.email ? "border-red-500" : ""
          }
        />

        <Input
          placeholder="Telefon *"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          onBlur={() => touch("phone")}
          className={
            errors.phone && touched.phone ? "border-red-500" : ""
          }
        />

        <Input
          placeholder="Ulica"
          value={form.street}
          onChange={(e) => update("street", e.target.value)}
          onBlur={() => touch("street")}
          className={
            errors.street && touched.street ? "border-red-500" : ""
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            placeholder="Nr domu"
            value={form.houseNumber}
            onChange={(e) => update("houseNumber", e.target.value)}
            onBlur={() => touch("houseNumber")}
            className={
              errors.houseNumber && touched.houseNumber
                ? "border-red-500"
                : ""
            }
          />

          <Input
            placeholder="Nr mieszkania (opcjonalnie)"
            value={form.apartmentNumber ?? ""}
            onChange={(e) =>
              update("apartmentNumber", e.target.value)
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            placeholder="Kod pocztowy"
            value={form.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
            onBlur={() => touch("postalCode")}
            className={
              errors.postalCode && touched.postalCode
                ? "border-red-500"
                : ""
            }
          />

          <Input
            placeholder="Miasto"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            onBlur={() => touch("city")}
            className={
              errors.city && touched.city ? "border-red-500" : ""
            }
          />
        </div>
      </section>

      {/* Dzieci */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 font-medium">
            <Baby className="h-4 w-4 text-zinc-500" />
            Dzieci
          </h2>

          <Button
            type="button"
            variant="outline"
            onClick={addChild}
          >
            ➕ Dodaj dziecko
          </Button>
        </div>

        {form.children.map((child, idx) => (
          <div key={idx} className="space-y-3 rounded-2xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 font-medium text-zinc-800">
                <PencilLine className="h-4 w-4 text-zinc-500" />
                Dziecko {idx + 1}
              </p>

              {form.children.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeChild(idx)}
                >
                  Usuń
                </Button>
              )}
            </div>

            {mode === "edit" && child.id ? (
              <ChildStatusCard
                child={child}
                data={childInsights?.[child.id]}
                allEnrollments={totalActiveEnrollments}
              />
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                placeholder="Imię *"
                value={child.firstName}
                onChange={(e) =>
                  updateChild(idx, { firstName: e.target.value })
                }
              />

              <Input
                placeholder="Nazwisko *"
                value={child.lastName}
                onChange={(e) =>
                  updateChild(idx, { lastName: e.target.value })
                }
              />

              <Input
                type="number"
                min={1}
                placeholder="Wiek *"
                value={child.ageYears}
                onChange={(e) =>
                  updateChild(idx, {
                    ageYears:
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        ))}

        {touched.children && errors.children && (
          <Alert variant="destructive">
            <AlertDescription>{errors.children}</AlertDescription>
          </Alert>
        )}
      </section>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button disabled={pending} className="w-full">
        {pending ? "Zapisywanie..." : submitLabel ?? "Zapisz"}
      </Button>

      {/* Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Niekompletne dane</DialogTitle>
            <DialogDescription>
              Nie uzupełniłeś pełnego adresu (ulica, numer domu,
              kod pocztowy, miasto). Adres jest potrzebny do faktur
              i dokumentów. Możesz uzupełnić go później w profilu.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirm(false);
                setPendingSubmit(null);
              }}
            >
              Uzupełnij dane
            </Button>

            <Button
              onClick={async () => {
                if (pendingSubmit) {
                  setShowConfirm(false);
                  await submitForm(pendingSubmit);
                  setPendingSubmit(null);
                }
              }}
            >
              Zapisz mimo to
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

function ChildStatusCard({
  child,
  data,
  allEnrollments,
}: {
  child: ChildInput & { id?: string };
  data?: { activeEntitlements: number; activeEnrollments: number; classTitles: string[] };
  allEnrollments: number;
}) {
  const activeEnrollments = data?.activeEnrollments ?? 0;
  const share = allEnrollments > 0 ? Math.round((activeEnrollments / allEnrollments) * 100) : 0;
  const ringStyle = {
    background: `conic-gradient(rgb(24 24 27) ${share}%, rgb(228 228 231) 0%)`,
  };

  return (
    <div className="rounded-xl border bg-zinc-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-800">
            Status: {child.firstName || "Dziecko"}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${data?.activeEntitlements ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-white text-zinc-600"}`}>
              <CreditCard className="h-3.5 w-3.5" />
              {data?.activeEntitlements ? "Opłacone" : "Brak aktywnej opłaty"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-700">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Zapisy: {activeEnrollments}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-700">
              <Cake className="h-3.5 w-3.5" />
              Wiek: {child.ageYears || "-"}
            </span>
          </div>
          <p className="text-xs text-zinc-600">
            Zajęcia: {data?.classTitles?.length ? data.classTitles.join(", ") : "brak zapisanych zajęć"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-12 w-12 rounded-full p-[4px]" style={ringStyle}>
            <div className="grid h-full w-full place-items-center rounded-full bg-white text-[11px] font-semibold text-zinc-700">
              {share}%
            </div>
          </div>
          <div className="text-xs text-zinc-600">Udział w zapisach</div>
        </div>
      </div>
    </div>
  );
}
