"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

function mapFirebaseError(code?: string) {
  switch (code) {
    case "auth/user-not-found":
      return "Nie znaleziono konta z tym adresem email.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Nieprawidłowy email lub hasło.";
    case "auth/too-many-requests":
      return "Zbyt wiele prób logowania. Spróbuj ponownie później.";
    case "auth/popup-closed-by-user":
      return "Okno logowania zostało zamknięte.";
    default:
      return "Wystąpił błąd podczas logowania.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace(next);
    } catch (err: any) {
      setError(mapFirebaseError(err?.code));
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleLogin() {
    setPending(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace(next);
    } catch (err: any) {
      setError(mapFirebaseError(err?.code));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <Image
          src="/logo.png"
          alt="Logo"
          width={640}
          height={640}
          priority
        />
        <h1 className="text-2xl font-semibold">Zaloguj się</h1>
        <p className="text-sm text-gray-500">
          Dostęp do panelu użytkownika
        </p>
      </div>

      {/* Google */}
      <button
        onClick={handleGoogleLogin}
        disabled={pending}
        className="w-full flex items-center justify-center gap-3 border rounded-lg px-4 py-2 hover:bg-gray-50 transition"
      >
        <Image src="/google.svg" alt="Google" width={20} height={20} />
        Zaloguj się przez Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">lub</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Formularz */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
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

        <div>
          <label className="text-sm">Hasło</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
            {error}
          </div>
        )}

        <button
          disabled={pending}
          className="w-full rounded-lg bg-black text-white py-2 hover:opacity-90 transition"
        >
          {pending ? "Logowanie..." : "Zaloguj się"}
        </button>
      </form>

      <p className="text-sm text-center">
        Nie masz konta?{" "}
        <Link href="/register" className="underline">
          Zarejestruj się
        </Link>
      </p>
    </div>
  );
}
