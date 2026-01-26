"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Błąd rejestracji");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Rejestracja</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm">Imię / nazwa</span>
          <input
            className="mt-1 w-full border rounded-md px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            type="text"
            autoComplete="name"
          />
        </label>

        <label className="block">
          <span className="text-sm">Email</span>
          <input
            className="mt-1 w-full border rounded-md px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm">Hasło</span>
          <input
            className="mt-1 w-full border rounded-md px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={pending}
          className="w-full rounded-md border px-3 py-2"
          type="submit"
        >
          {pending ? "Tworzę konto..." : "Utwórz konto"}
        </button>
      </form>

      <p className="text-sm">
        Masz konto? <Link className="underline" href="/login">Zaloguj się</Link>
      </p>
    </div>
  );
}
