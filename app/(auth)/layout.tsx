import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNav } from "@/components/public/PublicNav";
import { Music2, Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="min-h-[calc(100dvh-76px)] bg-zinc-50 p-4 pb-10 md:p-6">
        <div className="mx-auto mb-4 flex w-full max-w-6xl items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-xs text-zinc-600 md:hidden">
          <span className="hero-gradient-icon rounded-lg p-1.5 text-white">
            <Music2 className="h-4 w-4" />
          </span>
          <span>Rejestracja i logowanie • szybki dostęp z telefonu</span>
        </div>

        <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border bg-white shadow-sm md:min-h-[clamp(620px,74dvh,860px)] md:grid-cols-2">
          <section className="relative hidden h-full min-h-[clamp(620px,74dvh,860px)] md:block">
            <img
              src="https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1600&q=80"
              alt="Ekspresja - zajęcia muzyczne"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 to-black/65" />
            <div className="absolute inset-x-0 bottom-0 p-8 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/80">Ekspresja.net</p>
              <h2 className="hero-gradient mt-2 text-3xl font-black">Dołącz do muzycznej przygody</h2>
              <p className="mt-3 text-sm text-white/90">
                Panel rodzica: dzieci, zapisy na zajęcia, płatności i kalendarz w jednym miejscu.
              </p>
            </div>
          </section>

          <section className="relative h-full overflow-hidden p-5 md:p-8">
            <div className="hero-gradient-slow pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full opacity-15 blur-2xl" />
            <div className="hero-gradient-slow pointer-events-none absolute -bottom-14 -left-14 h-44 w-44 rounded-full opacity-15 blur-2xl" />
            <div className="mx-auto mb-4 flex items-center gap-2 rounded-xl border bg-zinc-50/80 px-3 py-2 text-xs text-zinc-600 md:hidden">
              <Sparkles className="h-4 w-4" />
              <span>Nowoczesny panel rodzica • mobile-friendly</span>
            </div>
            <div className="mx-auto w-full max-w-xl">{children}</div>
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
