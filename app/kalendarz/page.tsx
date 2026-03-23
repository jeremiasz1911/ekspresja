import Link from "next/link";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNav } from "@/components/public/PublicNav";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { PublicWeekCalendar } from "@/components/public/PublicWeekCalendar";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";

export default function CalendarPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <PublicNav />
      <section className="relative h-[48vh] min-h-[360px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=2200&q=80"
          alt="Kalendarz zajęć"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl items-center px-6">
          <div className="max-w-2xl rounded-3xl border border-white/30 bg-white/10 p-6 text-white backdrop-blur-md">
            <p className="text-sm uppercase tracking-[0.2em] text-white/80">Ekspresja.net</p>
            <h1 className="hero-gradient mt-2 text-4xl font-black md:text-6xl">Kalendarz zajęć</h1>
            <p className="mt-3 text-white/90">
              Sprawdź terminy, opis zajęć i zaplanuj muzyczny tydzień.
            </p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <PublicPageHeader
          title="Kalendarz zajęć"
          description="Publiczny widok tygodnia. Kliknij zajęcia, aby zobaczyć szczegóły i liczbę osób."
        />
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
