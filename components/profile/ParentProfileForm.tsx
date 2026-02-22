"use client";
import { useEffect, useMemo, useState } from "react";
import type { ParentFormData } from "@/types/profile";
import type { ChildInput } from "@/types/auth";
import { upsertChildrenForParent } from "@/services/children.service";
//import { updateParentProfile } from "@/services/user-profile.service"; 

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
  mode: "register" | "complete" | "edit";
  submitLabel?: string;
  onSubmit(data: ParentFormData): Promise<void>;
};

export function ParentProfileForm({
  initialValues,
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
        <h2 className="font-medium">Dane rodzica</h2>

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
          <h2 className="font-medium">Dzieci</h2>

          <Button
            type="button"
            variant="outline"
            onClick={addChild}
          >
            ➕ Dodaj dziecko
          </Button>
        </div>

        {form.children.map((child, idx) => (
          <div key={idx} className="border rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <p>Dziecko {idx + 1}</p>

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
