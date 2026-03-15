"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "ekspresja_cookie_consent_v1";

export function PublicCookieConsent() {
  const [visible, setVisible] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      if (saved === "accepted") return;
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur">
      <p className="text-sm text-zinc-700">
        Korzystamy z plików cookie oraz przetwarzamy dane (np. email, telefon, adres) wyłącznie w celu obsługi
        konta, zapisów, płatności i dokumentów (np. faktur). Hasła użytkowników są bezpiecznie hashowane przez
        dostawcę uwierzytelniania.
      </p>
      <label className="mt-3 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={acceptedPolicy}
          onChange={(e) => setAcceptedPolicy(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Akceptuję{" "}
          <Link href="/polityka-prywatnosci" className="underline">
            politykę prywatności
          </Link>{" "}
          i{" "}
          <Link href="/regulamin" className="underline">
            regulamin platformy
          </Link>
          .
        </span>
      </label>
      <div className="mt-3 flex justify-end">
        <button
          disabled={!acceptedPolicy}
          onClick={() => {
            try {
              window.localStorage.setItem(CONSENT_KEY, "accepted");
            } catch {}
            setVisible(false);
          }}
          className="rounded-lg border border-white/60 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Akceptuję i kontynuuję
        </button>
      </div>
    </div>
  );
}
