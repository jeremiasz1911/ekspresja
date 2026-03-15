import Link from "next/link";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNav } from "@/components/public/PublicNav";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { PublicWeekCalendar } from "@/components/public/PublicWeekCalendar";

export default function CalendarPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <PublicNav />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="hero-gradient text-4xl font-black md:text-5xl">Kalendarz zajęć</h1>
        <p className="mt-4 text-zinc-700">
          Publiczny widok tygodnia. Kliknij zajęcia, aby zobaczyć szczegóły i liczbę osób.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-600">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
            <CalendarDays className="h-4 w-4" />
            Grafik tygodniowy
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
            <MapPin className="h-4 w-4" />
            Jana Reutta 16A, Ciechanów
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
            <Clock3 className="h-4 w-4" />
            Kliknij zajęcia, aby zobaczyć opis
          </div>
        </div>

        <div className="mt-6">
          <PublicWeekCalendar />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white" href="/register">
            Utwórz konto i zapisz się na zajęcia
          </Link>
          <Link className="rounded-lg border px-4 py-2 text-sm" href="/kontakt">
            Skontaktuj się
          </Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
