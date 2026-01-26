"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import type { ChildInput } from "@/types/auth";
import { createParentAndChildren } from "@/services/registration.service";

function emptyChild(): ChildInput {
  return { firstName: "", lastName: "", ageYears: "" };
}

function isEmailLike(v: string) {
  return /\S+@\S+\.\S+/.test(v);
}

export default function RegisterPage() {
  const router = useRouter();

  // Parent fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Children dynamic
  const [children, setChildren] = useState<ChildInput[]>([emptyChild()]);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!firstName.trim() || !lastName.trim()) return false;
    if (!isEmailLike(email)) return false;
    if (password.length < 6) return false;
    if (!phone.trim()) return false;
    if (!addressLine1.trim() || !city.trim() || !postalCode.trim()) return false;

    // Minimum 1 dziecko poprawne
    const validKids = children.some(
      (c) =>
        c.firstName.trim() &&
        c.lastName.trim() &&
        typeof c.ageYears !== "string" &&
        c.ageYears > 0
    );

    // ageYears jest "" lub number — więc sprawdźmy prościej:
    const validKids2 = children.some(
      (c) => c.firstName.trim() && c.lastName.trim() && Number(c.ageYears) > 0
    );

    return validKids || validKids2;
  }, [firstName, lastName, email, password, phone, addressLine1, city, postalCode, children]);

  function updateChild(index: number, patch: Partial<ChildInput>) {
    setChildren((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function addChild() {
    setChildren((prev) => [...prev, emptyChild()]);
  }

  function removeChild(index: number) {
    setChildren((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Uzupełnij wymagane pola (w tym co najmniej 1 dziecko).");
      return;
    }

    setPending(true);

    try {
      // 1) Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // displayName (ładne w UI)
      await updateProfile(cred.user, { displayName: `${firstName.trim()} ${lastName.trim()}` });

      // 2) Firestore: users + children
      await createParentAndChildren({
        uid: cred.user.uid,
        parent: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim(),
          postalCode: postalCode.trim(),
          role: "user",
        },
        children: children.map((c) => ({
          firstName: c.firstName,
          lastName: c.lastName,
          ageYears: c.ageYears === "" ? "" : Number(c.ageYears),
        })),
      });

      router.replace("/dashboard");
    } catch (err: any) {
      // Minimalnie, bez rozpisywania wszystkich kodów:
      const code = err?.code as string | undefined;
      if (code === "auth/email-already-in-use") setError("Ten email jest już zajęty.");
      else if (code === "auth/weak-password") setError("Hasło jest za słabe (min. 6 znaków).");
      else setError(err?.message ?? "Błąd rejestracji.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Rejestracja rodzica</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Rodzic */}
        <section className="space-y-3">
          <h2 className="font-medium">Dane rodzica</h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Imię *</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2"
                value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm">Nazwisko *</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2"
                value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="text-sm">Email *</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2"
              value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>

          <div>
            <label className="text-sm">Hasło *</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2"
              value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 znaków.</p>
          </div>

          <div>
            <label className="text-sm">Telefon *</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2"
              value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div>
            <label className="text-sm">Adres (ulica i nr) *</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2"
              value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
          </div>

          <div>
            <label className="text-sm">Adres c.d. (opcjonalnie)</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2"
              value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Miasto *</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2"
                value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm">Kod pocztowy *</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2"
                value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
            </div>
          </div>
        </section>

        {/* Dzieci */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium">Dzieci</h2>
            <button
              type="button"
              onClick={addChild}
              className="border rounded-lg px-3 py-2"
            >
              ➕ Dodaj dziecko
            </button>
          </div>

          <div className="space-y-3">
            {children.map((child, idx) => (
              <div key={idx} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Dziecko {idx + 1}</p>
                  {children.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChild(idx)}
                      className="text-sm underline"
                    >
                      Usuń
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-sm">Imię *</label>
                    <input
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      value={child.firstName}
                      onChange={(e) => updateChild(idx, { firstName: e.target.value })}
                      required={idx === 0}
                    />
                  </div>
                  <div>
                    <label className="text-sm">Nazwisko *</label>
                    <input
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      value={child.lastName}
                      onChange={(e) => updateChild(idx, { lastName: e.target.value })}
                      required={idx === 0}
                    />
                  </div>
                  <div>
                    <label className="text-sm">Wiek (lata) *</label>
                    <input
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      value={child.ageYears}
                      onChange={(e) =>
                        updateChild(idx, {
                          ageYears: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      type="number"
                      min={1}
                      max={25}
                      required={idx === 0}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Wymagane jest co najmniej jedno dziecko.
                </p>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
            {error}
          </div>
        )}

        <button
          disabled={pending}
          className="w-full rounded-lg bg-black text-white py-2 hover:opacity-90 transition disabled:opacity-60"
          type="submit"
        >
          {pending ? "Tworzę konto..." : "Utwórz konto"}
        </button>
      </form>

      <p className="text-sm text-center">
        Masz konto? <Link className="underline" href="/login">Zaloguj się</Link>
      </p>
    </div>
  );
}
