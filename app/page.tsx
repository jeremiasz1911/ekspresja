import Link from "next/link";

export default function HomePage() {
  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Platforma</h1>
      <p>Publiczna strona główna.</p>

      <div className="flex gap-3">
        <Link className="underline" href="/login">Logowanie</Link>
        <Link className="underline" href="/register">Rejestracja</Link>
        <Link className="underline" href="/dashboard">Dashboard</Link>
      </div>
    </main>
  );
}
