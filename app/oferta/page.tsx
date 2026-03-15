import Link from "next/link";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNav } from "@/components/public/PublicNav";
import { Music2, Sparkles, Users } from "lucide-react";

export default function OfferPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <PublicNav />
      <section className="relative h-[52vh] min-h-[380px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=2000&q=80"
          alt="Oferta zajęć muzycznych"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl items-center px-6">
          <div className="max-w-2xl rounded-3xl border border-white/30 bg-white/10 p-6 text-white backdrop-blur-md">
            <h1 className="hero-gradient text-4xl font-black md:text-6xl">Oferta zajęć</h1>
            <p className="mt-4 text-white/90">
              Zajęcia dla dzieci, młodzieży i dorosłych - od Gordonków po warsztaty muzyczne i naukę instrumentów.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-3xl font-black">1. Zajęcia Gordonowskie (0-3)</h2>
            <p className="text-zinc-700">
              Umuzykalnianie najmłodszych przez głos, rytm i ruch. Dzieci chłoną muzykę naturalnie, bez presji,
              w przyjaznym kontakcie z rodzicem.
            </p>
            <p className="text-zinc-700">
              To podstawa do dalszego rozwoju: słuch muzyczny, poczucie rytmu, koncentracja i swoboda wyrażania emocji.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <img
              src="https://images.unsplash.com/photo-1516146544193-b54a65682f16?auto=format&fit=crop&w=1200&q=80"
              alt="Gordonki dla dzieci"
              className="h-56 w-full rounded-2xl object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80"
              alt="Zajęcia umuzykalniające"
              className="h-56 w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="order-2 grid gap-4 sm:grid-cols-2 md:order-1">
            <img
              src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80"
              alt="Warsztaty muzyczne"
              className="h-56 w-full rounded-2xl object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80"
              alt="Muzyka i śpiew"
              className="h-56 w-full rounded-2xl object-cover"
            />
          </div>
          <div className="order-1 space-y-4 md:order-2">
            <h2 className="text-3xl font-black">2. Warsztaty muzyczne i śpiew</h2>
            <p className="text-zinc-700">
              Zajęcia dla dzieci, młodzieży i dorosłych: rytmika, śpiew, kreatywność sceniczna i zabawy muzyczne.
            </p>
            <p className="text-zinc-700">
              Praktycznie i nowocześnie - aby uczestnik czuł się pewnie, twórczo i miał realną radość z muzyki.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border p-5">
            <Music2 className="h-6 w-6" />
            <div className="mt-2 font-semibold">Muzykalność</div>
            <p className="mt-1 text-sm text-zinc-600">Rozwój słuchu i poczucia rytmu od najwcześniejszych lat.</p>
          </div>
          <div className="rounded-2xl border p-5">
            <Sparkles className="h-6 w-6" />
            <div className="mt-2 font-semibold">Kreatywność</div>
            <p className="mt-1 text-sm text-zinc-600">Zajęcia uczą twórczego myślenia i swobodnej ekspresji.</p>
          </div>
          <div className="rounded-2xl border p-5">
            <Users className="h-6 w-6" />
            <div className="mt-2 font-semibold">Relacje</div>
            <p className="mt-1 text-sm text-zinc-600">Wspólna aktywność rodzic-dziecko wzmacnia więź i komunikację.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl border bg-zinc-50 p-6">
          <h3 className="text-2xl font-black">3. Instrumenty: fortepian, skrzypce, ukulele</h3>
          <p className="mt-3 text-zinc-700">
            Nauka indywidualna i grupowa z naciskiem na muzykalność, technikę i radość grania.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white" href="/kalendarz">
              Zobacz kalendarz zajęć
            </Link>
            <Link className="rounded-lg border px-4 py-2 text-sm" href="/kontakt">
              Skontaktuj się
            </Link>
            <Link className="rounded-lg border px-4 py-2 text-sm" href="/register">
              Dołącz do nas!
            </Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
