"use client";

import { useState } from "react";

export function ContactForm({ compact = false }: { compact?: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<null | "ok" | "error">(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      if (!res.ok) throw new Error("SEND_FAILED");
      setStatus("ok");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setStatus("error");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`space-y-3 ${compact ? "" : "max-w-xl"}`}>
      <input
        className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm"
        placeholder="Imię i nazwisko"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <input
          className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm"
          placeholder="Telefon (opcjonalnie)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <textarea
        className="min-h-28 w-full rounded-xl border bg-white/90 px-4 py-3 text-sm"
        placeholder="Wiadomość"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />
      <button
        className="rounded-xl border border-white/60 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-5 py-3 font-semibold text-white shadow-lg disabled:opacity-60"
        disabled={sending}
      >
        {sending ? "Wysyłanie..." : "Wyślij wiadomość"}
      </button>
      {status === "ok" && <p className="text-sm text-emerald-600">Dziękujemy! Odezwiemy się najszybciej jak to możliwe.</p>}
      {status === "error" && <p className="text-sm text-red-600">Nie udało się wysłać formularza. Spróbuj ponownie.</p>}
    </form>
  );
}
