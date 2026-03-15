"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNav } from "@/components/public/PublicNav";
import { ContactForm } from "@/components/public/ContactForm";
import {
  Baby,
  Brain,
  Heart,
  Mail,
  MapPin,
  Music2,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1800&q=80",
    kicker: "Ekspresja - usługi artystyczne",
    title: "Zajęcia umuzykalniające metodą Gordona",
    text: "Muzyka, ruch i radość wspólnego bycia. Dla niemowląt, małych dzieci i całych rodzin.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1800&q=80",
    kicker: "Dla dzieci i rodziców",
    title: "Rozwijamy słuch, rytm i kreatywność",
    text: "Zajęcia pomagają budować muzykalność i pewność siebie w naturalny, przyjazny sposób.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1800&q=80",
    kicker: "Ciechanów, Jana Reutta 16A",
    title: "Nowoczesne zajęcia artystyczne",
    text: "Gordonki, rytmika, śpiew i instrumenty: fortepian, skrzypce, ukulele.",
  },
];

const benefits = [
  {
    icon: Heart,
    title: "Zdrowy rozwój emocjonalny",
    text: "Muzyka wspiera więź, poczucie bezpieczeństwa i radość dziecka.",
    image:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Brain,
    title: "Kreatywne myślenie",
    text: "Zajęcia wzmacniają koncentrację, pamięć i twórcze reagowanie.",
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Music2,
    title: "Słuch i rytm",
    text: "Naturalne osłuchanie z muzyką od pierwszych lat życia.",
    image:
      "https://images.unsplash.com/photo-1514119412350-e174d90d280e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Baby,
    title: "Dla maluchów 0-3",
    text: "Program dopasowany do etapu rozwoju niemowląt i małych dzieci.",
    image:
      "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Users,
    title: "Dla rodzin",
    text: "Wspólne muzykowanie rodzica i dziecka buduje relację i pewność siebie.",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Sparkles,
    title: "Zabawa i ekspresja",
    text: "Lekka forma zajęć, dużo ruchu i śpiewu bez presji oceniania.",
    image:
      "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setActive((p) => (p + 1) % slides.length), 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setMouse((prev) => ({
        x: prev.x + (target.x - prev.x) * 0.14,
        y: prev.y + (target.y - prev.y) * 0.14,
      }));
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [target]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroShift = useMemo(
    () => ({
      transform: `translate3d(${mouse.x * 12}px, ${mouse.y * 12 + scrollY * 0.03}px, 0)`,
    }),
    [mouse, scrollY]
  );
  const imageShift = useMemo(
    () => ({
      transform: `translate3d(${mouse.x * 22}px, ${mouse.y * 22 + scrollY * 0.04}px, 0) scale(1.12)`,
    }),
    [mouse, scrollY]
  );

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-white text-zinc-900"
      onMouseMove={(e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        setTarget({ x, y });
      }}
    >
      <div className="music-web-bg pointer-events-none absolute inset-0 opacity-10" />
      <Music2 className="floating-note pointer-events-none absolute left-[8%] top-[20%] h-8 w-8 text-fuchsia-400/50" />
      <Music2 className="floating-note-delay pointer-events-none absolute right-[10%] top-[28%] h-9 w-9 text-cyan-400/50" />
      <Sparkles className="floating-note pointer-events-none absolute bottom-[28%] left-[12%] h-7 w-7 text-violet-400/50" />
      <Sparkles className="floating-note-delay pointer-events-none absolute bottom-[22%] right-[14%] h-7 w-7 text-pink-400/50" />

      <PublicNav />

      <section className="relative min-h-[76vh] overflow-hidden">
        {slides.map((slide, i) => (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-all duration-1000 ${i === active ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-105"}`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="slider-follow-image h-full w-full object-cover"
              style={i === active ? imageShift : undefined}
            />
            <div className="absolute inset-0 bg-black/45" />
          </div>
        ))}

        <div className="relative z-10 mx-auto flex min-h-[76vh] max-w-6xl items-center px-6 py-16">
          <div
            className="hero-entry floating-card group max-w-3xl cursor-pointer rounded-3xl border border-white/25 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:border-white/55 hover:bg-white/20 hover:shadow-2xl md:p-8"
            onClick={() => router.push("/oferta")}
          >
            <p className="text-sm uppercase tracking-[0.2em] text-white/80">{slides[active].kicker}</p>
            <h1 className="hero-gradient mt-3 text-4xl font-black text-white md:text-6xl">{slides[active].title}</h1>
            <p className="mt-5 text-lg text-white/90">{slides[active].text}</p>
            <p className="mt-3 text-sm text-white/80">Najedź i kliknij box, aby przejść do oferty.</p>
            <div className="mt-8 flex flex-wrap gap-3" onClick={(e) => e.stopPropagation()}>
              <Link
                className="rounded-xl border border-white/60 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-5 py-3 font-semibold text-white shadow-lg"
                href="/register"
              >
                Dołącz do nas!
              </Link>
              <Link
                className="rounded-xl border border-white/60 bg-white/10 px-5 py-3 font-medium text-white backdrop-blur"
                href="/oferta"
              >
                Zobacz ofertę
              </Link>
            </div>
          </div>
          <div className="relative ml-auto hidden w-full max-w-sm lg:block">
            <div
              className="hero-gradient-slow absolute -inset-2 rounded-3xl blur-3xl"
              style={{ opacity: 0.35, ...heroShift }}
            />
            <div className="hero-entry floating-card-delay relative rounded-3xl border border-white/35 bg-white/15 p-6 text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:shadow-2xl">
              <p className="text-sm font-medium text-white/80">Ekspresja.net</p>
              <h2 className="mt-2 text-2xl font-bold">Muzyczna przygoda dla dzieci</h2>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-2">
                  <span className="hero-gradient-icon rounded-lg p-1.5"><Baby className="h-4 w-4" /></span>
                  <span>Gordonki 0-3</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="hero-gradient-icon rounded-lg p-1.5"><Music2 className="h-4 w-4" /></span>
                  <span>Rytmika 3-4</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="hero-gradient-icon rounded-lg p-1.5"><Sparkles className="h-4 w-4" /></span>
                  <span>Warsztaty muzyczne</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="hero-gradient-icon rounded-lg p-1.5"><Users className="h-4 w-4" /></span>
                  <span>Śpiew + instrumenty</span>
                </li>
              </ul>
              <p className="mt-4 text-sm text-white/80">Jana Reutta 16A, Ciechanów 06-400</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2.5 rounded-full border border-white/70 transition-all ${
                i === active
                  ? "w-10 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500"
                  : "w-2.5 bg-white/40"
              }`}
              aria-label={`Przejdź do slajdu ${i + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-2xl font-bold md:text-3xl">Dlaczego rodzice wybierają Ekspresję?</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="group rounded-3xl border bg-white/85 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <img
                src={b.image}
                alt={b.title}
                className="mb-4 h-32 w-full rounded-2xl object-cover"
              />
              <div className="hero-gradient-icon mb-3 inline-flex rounded-2xl p-3 text-white">
                <b.icon className="h-8 w-8" />
              </div>
              <div className="mt-2 font-semibold">{b.title}</div>
              <p className="mt-2 text-sm text-zinc-600">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 md:grid-cols-3">
        <div className="rounded-2xl border p-6">
          <img
            src="https://images.unsplash.com/photo-1541692641319-981cc79ee10c?auto=format&fit=crop&w=1200&q=80"
            alt="Zajęcia gordonowskie"
            className="mb-4 h-40 w-full rounded-xl object-cover"
          />
          <h3 className="text-xl font-semibold">Czym są zajęcia Gordonowskie?</h3>
          <p className="mt-3 text-sm text-zinc-700">
            To zajęcia umuzykalniające inspirowane podejściem Edwina E. Gordona: dużo śpiewu, rytmów,
            ruchu i zabawy, bez presji na „występowanie”.
          </p>
        </div>
        <div className="rounded-2xl border p-6">
          <img
            src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80"
            alt="Dla kogo zajęcia"
            className="mb-4 h-40 w-full rounded-xl object-cover"
          />
          <h3 className="text-xl font-semibold">Dla kogo?</h3>
          <p className="mt-3 text-sm text-zinc-700">
            Dla niemowląt, małych dzieci, przedszkolaków, młodzieży i dorosłych - w grupach dopasowanych
            do wieku i potrzeb.
          </p>
        </div>
        <div className="rounded-2xl border p-6">
          <img
            src="https://images.unsplash.com/photo-1509339022327-1e1e25360a41?auto=format&fit=crop&w=1200&q=80"
            alt="Antonina Wiśniewska-Wenda"
            className="mb-4 h-40 w-full rounded-xl object-cover"
          />
          <h3 className="text-xl font-semibold">Kim jest Antonina?</h3>
          <p className="mt-3 text-sm text-zinc-700">
            Antonina Wiśniewska-Wenda - mama Eli i Jasia, wokalistka i instrumentalistka (skrzypce,
            fortepian), prowadzi zajęcia z sercem i dużą energią.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border bg-zinc-50 p-6 md:p-8">
          <h2 className="hero-gradient text-2xl font-black md:text-4xl">Gotowi na muzyczną przygodę?</h2>
          <p className="mt-3 text-zinc-700">Gość widzi ofertę publicznie, a użytkownik po rejestracji dostaje pełny panel rodzica.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-lg border border-white/60 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-5 py-3 font-semibold text-white shadow-lg"
              href="/register"
            >
              Dołącz do nas!
            </Link>
            <Link className="rounded-lg border px-5 py-3" href="/kalendarz">
              Zobacz kalendarz zajęć
            </Link>
            <Link className="rounded-lg border px-5 py-3" href="/kontakt">
              Skontaktuj się
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=2200&q=80"
          alt="Kontakt Ekspresja"
          className="h-[62vh] w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-2">
          <div className="self-center rounded-3xl border border-white/30 bg-white/10 p-6 text-white backdrop-blur-md">
            <h2 className="text-3xl font-black">Kontakt</h2>
            <p className="mt-3 text-white/90">Masz pytania o zajęcia? Napisz do nas przez formularz.</p>
            <div className="mt-5 space-y-2 text-sm text-white/90">
              <div className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> 504 939 965</div>
              <div className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> antoninawenda@gmail.com</div>
              <div className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> Jana Reutta 16A, Ciechanów</div>
            </div>
          </div>
          <div className="self-center rounded-3xl border border-white/30 bg-white/10 p-6 backdrop-blur-md">
            <ContactForm compact />
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
