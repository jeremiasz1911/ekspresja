import Link from "next/link";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { Baby, MicVocal, Music2, Piano } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <PublicNav />
      <section className="relative h-[48vh] min-h-[360px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=2200&q=80"
          alt="Antonina Wiśniewska-Wenda"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl items-center px-6">
          <div className="max-w-3xl rounded-3xl border border-white/30 bg-white/10 p-6 text-white backdrop-blur-md">
            <p className="text-sm uppercase tracking-[0.2em] text-white/80">Ekspresja.net</p>
            <h1 className="hero-gradient mt-2 text-4xl font-black md:text-6xl">Antonina Wiśniewska-Wenda</h1>
            <p className="mt-3 text-white/90">Muzyka, relacja i rozwój dzieci przez zajęcia artystyczne.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <PublicPageHeader
          title="Antonina Wiśniewska-Wenda"
          description="Muzyka, relacja i rozwój dzieci przez zajęcia artystyczne."
        />
        <p className="mt-5 text-zinc-700">
          Mama Eli i Jasia, wokalistka oraz instrumentalistka (skrzypce, fortepian), prowadząca zajęcia dla
          dzieci i rodzin z dużą uważnością na emocje, relację i rozwój muzyczny.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white/90 p-5">
            <img
              src="https://images.unsplash.com/photo-1541692641319-981cc79ee10c?auto=format&fit=crop&w=1200&q=80"
              alt="Praca z najmłodszymi"
              className="mb-4 h-36 w-full rounded-xl object-cover"
            />
            <div className="mb-2 inline-flex rounded-xl bg-zinc-100 p-2"><Baby className="h-5 w-5" /></div>
            <div className="font-semibold">Praca z najmłodszymi</div>
            <p className="mt-2 text-sm text-zinc-600">Zajęcia od 0 do 3 lat prowadzone w formie muzycznej zabawy.</p>
          </div>
          <div className="rounded-2xl border bg-white/90 p-5">
            <img
              src="https://images.unsplash.com/photo-1516146544193-b54a65682f16?auto=format&fit=crop&w=1200&q=80"
              alt="Metoda Gordona"
              className="mb-4 h-36 w-full rounded-xl object-cover"
            />
            <div className="mb-2 inline-flex rounded-xl bg-zinc-100 p-2"><Music2 className="h-5 w-5" /></div>
            <div className="font-semibold">Metoda Gordona</div>
            <p className="mt-2 text-sm text-zinc-600">Naturalne rozwijanie słuchu i rytmu przez głos, ruch i interakcję.</p>
          </div>
          <div className="rounded-2xl border bg-white/90 p-5">
            <img
              src="https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80"
              alt="Instrumenty"
              className="mb-4 h-36 w-full rounded-xl object-cover"
            />
            <div className="mb-2 inline-flex rounded-xl bg-zinc-100 p-2"><Piano className="h-5 w-5" /></div>
            <div className="font-semibold">Instrumenty</div>
            <p className="mt-2 text-sm text-zinc-600">Skrzypce, fortepian i ukulele w pracy indywidualnej i grupowej.</p>
          </div>
          <div className="rounded-2xl border bg-white/90 p-5">
            <img
              src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=80"
              alt="Śpiew i ekspresja"
              className="mb-4 h-36 w-full rounded-xl object-cover"
            />
            <div className="mb-2 inline-flex rounded-xl bg-zinc-100 p-2"><MicVocal className="h-5 w-5" /></div>
            <div className="font-semibold">Śpiew i ekspresja</div>
            <p className="mt-2 text-sm text-zinc-600">Budowanie pewności siebie i swobodnej muzycznej ekspresji.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white" href="/kontakt">
            Skontaktuj się
          </Link>
          <Link className="rounded-lg border px-4 py-2 text-sm" href="/register">
            Utwórz konto
          </Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
