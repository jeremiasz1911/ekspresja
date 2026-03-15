"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

function mapResetError(code?: string) {
  switch (code) {
    case "auth/invalid-email":
      return "Podaj poprawny adres email.";
    case "auth/too-many-requests":
      return "Zbyt wiele prób. Spróbuj ponownie później.";
    default:
      return "Nie udało się wysłać linku resetu hasła.";
  }
}

function ForgotPasswordContent() {
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const initialEmail = search.get("email");
    if (initialEmail) setEmail(initialEmail);
  }, [search]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    setPending(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: any) {
      setError(mapResetError(err?.code));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Reset hasła</h1>
      <p className="text-sm text-gray-600">
        Podaj email konta, a wyślemy link do ustawienia nowego hasła.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-sm">Email</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {sent ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Link do resetu hasła został wysłany. Sprawdź skrzynkę email.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-black py-2 text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Wysyłanie..." : "Wyślij link resetu"}
        </button>
      </form>

      <p className="text-sm text-center">
        <Link href="/login" className="underline">
          Wróć do logowania
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-500">Ładowanie…</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
