"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
import Image from "next/image";

const slides = [
  {
    image:
      "assets/slider/sli_zdj7.jpg",
    kicker: "Ekspresja - usługi artystyczne",
    title: "Zajęcia umuzykalniające metodą Gordona",
    text: "Muzyka, ruch i radość wspólnego bycia. Dla niemowląt, małych dzieci i całych rodzin.",
  },
  {
    image:
      "assets/slider/sli_zdj5.jpg",
    kicker: "Dla dzieci i rodziców",
    title: "Rozwijamy słuch, rytm i kreatywność",
    text: "Zajęcia pomagają budować muzykalność i pewność siebie w naturalny, przyjazny sposób.",
  },
  {
    image:
      "assets/slider/sli_zdj2.jpg",
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
      "https://source.unsplash.com/1200x900/?children,happy,preschool",
  },
  {
    icon: Brain,
    title: "Kreatywne myślenie",
    text: "Zajęcia wzmacniają koncentrację, pamięć i twórcze reagowanie.",
    image:
      "https://source.unsplash.com/1200x900/?kids,creative,education",
  },
  {
    icon: Music2,
    title: "Słuch i rytm",
    text: "Naturalne osłuchanie z muzyką od pierwszych lat życia.",
    image:
      "https://source.unsplash.com/1200x900/?children,music,kindergarten",
  },
  {
    icon: Baby,
    title: "Dla maluchów 0-3",
    text: "Program dopasowany do etapu rozwoju niemowląt i małych dzieci.",
    image:
      "https://source.unsplash.com/1200x900/?toddler,play,learning",
  },
  {
    icon: Users,
    title: "Dla rodzin",
    text: "Wspólne muzykowanie rodzica i dziecka buduje relację i pewność siebie.",
    image:
      "https://source.unsplash.com/1200x900/?family,kids,playtime",
  },
  {
    icon: Sparkles,
    title: "Zabawa i ekspresja",
    text: "Lekka forma zajęć, dużo ruchu i śpiewu bez presji oceniania.",
    image:
      "https://source.unsplash.com/1200x900/?preschool,art,crafts,children",
  },
];

const gordonTags = [
  "Metoda Gordona",
  "Małe grupy",
  "Przyjazna przestrzeń",
  "Realne postępy dziecka",
];

const spotlightBlocks = [
    {
    image: "assets/main/antonina.jpg",
    alt: "Antonina Wiśniewska-Wenda",
    eyebrow: "Antonina Wiśniewska-Wenda",
    title: "Kim jest Antonina?",
    text: "Antonina Wiśniewska-Wenda - mama Eli i Jasia, wokalistka i instrumentalistka (skrzypce, fortepian), prowadzi zajęcia z sercem i dużą energią.",
  },
  {
    image: "assets/slider/sli_zdj2.jpg",
    alt: "Zajęcia gordonowskie",
    eyebrow: "Czym są zajęcia Gordonowskie?",
    title: "Muzyka bez presji występowania",
    text: "To zajęcia umuzykalniające inspirowane podejściem Edwina E. Gordona: dużo śpiewu, rytmów, ruchu i zabawy, bez presji na występowanie.",
  },
  {
    image: "assets/main/mama_dziecko.jpg",
    alt: "Dla kogo zajęcia",
    eyebrow: "Dla kogo zajęcia",
    title: "Dla kogo?",
    text: "Dla niemowląt, małych dzieci, przedszkolaków, młodzieży i dorosłych - w grupach dopasowanych do wieku i potrzeb.",
  }
];

export default function HomePage() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [activeBenefit, setActiveBenefit] = useState(0);
  const [isWheelHovered, setIsWheelHovered] = useState(false);
  const activeSlideRef = useRef(0);
  const heroTargetRef = useRef({ x: 0, y: 0 });
  const heroCurrentRef = useRef({ x: 0, y: 0 });
  const heroGlowRef = useRef<HTMLDivElement | null>(null);
  const slideImageRefs = useRef<Array<HTMLImageElement | null>>([]);
  const wheelPhysicsRef = useRef({ speed: 0.018, angle: 0 });
  const wheelShellRef = useRef<HTMLDivElement | null>(null);
  const wheelTrackRef = useRef<HTMLDivElement | null>(null);
  const wheelTiltRef = useRef<HTMLDivElement | null>(null);
  const wheelCounterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const wheelPointerRef = useRef({ x: 0, y: 0 });
  const wheelTiltRafRef = useRef(0);
  const wheelTiltFrameRef = useRef(0);
  const wheelFpsEmaRef = useRef(60);
  const wheelLowPerfRef = useRef(false);
  const setActiveBenefitSafe = (next: number) => {
    setActiveBenefit((prev) => (prev === next ? prev : next));
  };

  useEffect(() => {
    const id = window.setInterval(() => setActive((p) => (p + 1) % slides.length), 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    activeSlideRef.current = active;
  }, [active]);

  useEffect(() => {
    if (isWheelHovered) {
      return;
    }
    const id = window.setInterval(() => {
      setActiveBenefit((prev) => (prev + 1) % benefits.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [isWheelHovered]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 40);
      last = now;

      const targetSpeed = isWheelHovered ? 0 : 0.018;
      wheelPhysicsRef.current.speed += (targetSpeed - wheelPhysicsRef.current.speed) * 0.08;
      wheelPhysicsRef.current.angle = (wheelPhysicsRef.current.angle + wheelPhysicsRef.current.speed * dt) % 360;

      const fps = 1000 / Math.max(dt, 1);
      wheelFpsEmaRef.current = wheelFpsEmaRef.current * 0.92 + fps * 0.08;
      const shouldLowPerf = wheelFpsEmaRef.current < 48 ? true : wheelFpsEmaRef.current > 54 ? false : wheelLowPerfRef.current;
      if (shouldLowPerf !== wheelLowPerfRef.current) {
        wheelLowPerfRef.current = shouldLowPerf;
        if (wheelShellRef.current) {
          wheelShellRef.current.classList.toggle("is-low-perf", shouldLowPerf);
        }
      }

      const angle = wheelPhysicsRef.current.angle;
      if (wheelTrackRef.current) {
        wheelTrackRef.current.style.transform = `rotate(${angle}deg)`;
      }
      for (const el of wheelCounterRefs.current) {
        if (el) {
          el.style.transform = `rotate(${-angle}deg)`;
        }
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      if (wheelTiltRafRef.current) {
        window.cancelAnimationFrame(wheelTiltRafRef.current);
      }
    };
  }, [isWheelHovered]);

  useEffect(() => {
    let raf = 0;

    const animateHero = () => {
      const target = heroTargetRef.current;
      const current = heroCurrentRef.current;

      current.x += (target.x - current.x) * 0.14;
      current.y += (target.y - current.y) * 0.14;

      const scroll = window.scrollY || 0;
      const activeIdx = activeSlideRef.current;

      for (let i = 0; i < slideImageRefs.current.length; i += 1) {
        const el = slideImageRefs.current[i];
        if (!el) {
          continue;
        }
        const isActive = i === activeIdx;
        const dx = current.x * (isActive ? 38 : 24);
        const dy = current.y * (isActive ? 30 : 20) + scroll * (isActive ? 0.075 : 0.052);
        const rotX = current.y * (isActive ? -2.1 : -1.2);
        const rotY = current.x * (isActive ? 2.8 : 1.6);
        const scale = isActive ? 1.14 : 1.18;

        el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        el.style.filter = isActive ? "saturate(1.05) brightness(1.03)" : "saturate(0.9) brightness(0.9)";
      }

      if (heroGlowRef.current) {
        heroGlowRef.current.style.transform = `translate3d(${current.x * 12}px, ${current.y * 12 + scroll * 0.03}px, 0)`;
      }

      raf = window.requestAnimationFrame(animateHero);
    };

    raf = window.requestAnimationFrame(animateHero);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <main
      className="relative min-h-screen overflow-x-hidden bg-white text-zinc-900"
      onMouseMove={(e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        heroTargetRef.current = { x, y };
      }}
      onMouseLeave={() => {
        heroTargetRef.current = { x: 0, y: 0 };
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
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === active ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="slider-follow-image h-full w-full object-cover"
              ref={(el) => {
                slideImageRefs.current[i] = el;
              }}
            />
            <div className="absolute inset-0 bg-black/45" />
          </div>
        ))}

        <div className="relative z-10 mx-auto flex min-h-[76vh] max-w-6xl items-center px-6 py-16 gap-5">
          <div
            className="hero-entry floating-card group max-w-3xl cursor-pointer rounded-3xl bg-white/20 p-6 backdrop-blur-xs transition-all duration-300 hover:border-white/55 hover:bg-white/20 hover:shadow-2xl md:p-8"
            onClick={() => router.push("/oferta")}
          >
            <p className="text-sm uppercase tracking-[0.2em] text-white/80">{slides[active].kicker}</p>
            <h1 className="hero-gradient mt-3 text-4xl font-black text-white/90 drop-shadow-[0px_0px_15px_white] md:text-6xl">{slides[active].title}</h1>
            <p className="mt-5 text-lg text-white/90">{slides[active].text}</p>
            <div className="mt-8 flex flex-wrap gap-3" onClick={(e) => e.stopPropagation()}>
              <Link
                className="rounded-xl border border-white/60 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-5 py-3 font-semibold text-white shadow-lg hover:bg-gradient-to-r hover:from-fuchsia-400 hover:via-violet-400 hover:to-cyan-400 hover:scale-[1.02] transition-transform"
                href="/register"
              >
                Dołącz do nas!
              </Link>
              <Link
                className="rounded-xl border border-white/60 bg-white/10 px-5 py-3 font-medium text-white backdrop-blur hover:scale-[1.02] transition-transform hover:bg-white/20 hover:border-white/80"
                href="/oferta"
              >
                Zobacz ofertę
              </Link>
            </div>
          </div>
          <div className="relative ml-auto hidden w-full max-w-sm lg:block">
            <div
              className="hero-gradient-slow absolute -inset-2 rounded-3xl blur-3xl"
              style={{ opacity: 0.35 }}
              ref={heroGlowRef}
            />
            <div className="hero-entry floating-card-delay relative rounded-3xl bg-white/15 p-6 text-white backdrop-blur-xs transition-all duration-300 hover:bg-white/20 hover:shadow-2xl">
              <p className="text-sm font-medium text-white/80 uppercase tracking-[0.2em]">Ekspresja.net</p>
              <h2 className="mt-2 text-2xl font-regular">Muzyczna przygoda dla dzieci</h2>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-2 hover:scale-102 transition-transform hover:cursor-pointer hover:drop-shadow-[0px_0px_15px_white]">
                  <span className="hero-gradient-icon rounded-lg p-1.5"><Baby className="h-8 w-8" /></span>
                  <span>Gordonki 0-3</span>
                </li>
                <li className="flex items-center gap-2 hover:scale-102 transition-transform hover:cursor-pointer hover:drop-shadow-[0px_0px_15px_white]">
                  <span className="hero-gradient-icon rounded-lg p-1.5"><Music2 className="h-8 w-8" /></span>
                  <span>Rytmika 3-4</span>
                </li>
                <li className="flex items-center gap-2 hover:scale-102 transition-transform hover:cursor-pointer hover:drop-shadow-[0px_0px_15px_white]">
                  <span className="hero-gradient-icon rounded-lg p-1.5"><Sparkles className="h-8 w-8" /></span>
                  <span>Warsztaty muzyczne</span>
                </li>
                <li className="flex items-center gap-2 hover:scale-102 transition-transform hover:cursor-pointer hover:drop-shadow-[0px_0px_15px_white]">
                  <span className="hero-gradient-icon rounded-lg p-1.5"><Users className="h-8 w-8" /></span>
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
        <div className="relative  p-6 md:p-10">
          <div className="pointer-events-none absolute -left-14 top-10 h-40 w-40 rounded-full  blur-3xl" />
          <div className="pointer-events-none absolute -right-12 bottom-12 h-44 w-44 rounded-full blur-3xl" />

          
          <div className="relative z-10 grid items-center gap-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
            <div className="max-w-5xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Dlaczego właśnie my</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-900 md:text-5xl">
                Dlaczego rodzice wybierają Ekspresję?
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600 md:text-base">
                Łączymy metodę Gordona, ciepłą atmosferę i nowoczesne podejście do pracy z dziećmi,
                dzięki czemu zajęcia są jednocześnie rozwojowe i naprawdę angażujące.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 md:text-base">
                Edwin E. Gordon był wybitnym pedagogiem muzycznym i twórcą teorii uczenia się muzyki.
                Jego podejście opiera się na rozwijaniu audiacji, czyli wewnętrznego "słyszenia i rozumienia"
                muzyki, jeszcze zanim dziecko zacznie ją świadomie wykonywać.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-zinc-700 md:text-sm">
                {gordonTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-zinc-200/80 bg-white/90 px-3 py-1.5 shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <aside className="mx-auto w-full max-w-sm">
              <div className="relative min-h-[340px] md:min-h-[390px]">
                <div className="absolute left-0 top-0 w-[66%] z-15 opacity-80 rounded-3xl border border-zinc-200/80 bg-white p-2 shadow-[0_26px_55px_-34px_rgba(24,24,27,0.75)]">
                  <Image
                    src="/assets/main/antonina.png"
                    alt="Antonina Wiśniewska-Wenda"
                    width={640}
                    height={820}
                    className="h-auto w-full rounded-2xl object-cover"
                  />
                </div>

                <div className="absolute bottom-0 right-0 w-[42%] rounded-3xl border border-zinc-200/80 bg-white p-2 shadow-[0_24px_46px_-32px_rgba(24,24,27,0.7)]">
                  <Image
                    src="/edwin.png"
                    alt="Edwin E. Gordon"
                    width={640}
                    height={820}
                    className="h-auto w-full rounded-2xl object-cover opacity-80 z-10"
                  />
                </div>
              </div>
              <p className="mt-4 px-3 text-center text-xs font-medium text-zinc-600 md:text-sm">
                Edwin E. Gordon, autor metody wspierającej naturalny rozwój muzykalności dziecka.
              </p>
            </aside>
          </div>

          <div className="mt-8 grid gap-3 sm:hidden">
            {benefits.slice(0, 6).map((b, i) => (
              <article
                key={b.title}
                className={`rounded-3xl border bg-white/90 p-4 shadow-sm transition ${
                  i === activeBenefit ? "border-zinc-900/30 shadow-md" : "border-zinc-200"
                }`}
                onClick={() => setActiveBenefitSafe(i)}
              >
                <div className="hero-gradient-icon inline-flex rounded-2xl p-2.5 text-white">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-2 text-base font-semibold text-zinc-900">{b.title}</h3>
                <p className="mt-1 text-sm text-zinc-600">{b.text}</p>
              </article>
            ))}
          </div>

          <div className="relative z-20 mt-10 hidden items-center gap-8 overflow-visible sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <article className="gordon-active-benefit rounded-[2rem] border border-zinc-200/80 bg-white/90 p-7 shadow-[0_24px_60px_-35px_rgba(24,24,27,0.8)] backdrop-blur-sm">
              <div className="hero-gradient-icon inline-flex rounded-2xl p-2.5 text-white">
                {(() => {
                  const Icon = benefits[activeBenefit].icon;
                  return <Icon className="h-6 w-6" />;
                })()}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Aktywny atut</p>
              <h3 className="mt-2 text-3xl font-black text-zinc-900">{benefits[activeBenefit].title}</h3>
              <p className="gordon-active-benefit-text mt-4 text-sm leading-relaxed text-zinc-600">{benefits[activeBenefit].text}</p>
            </article>

            <div
              className={`gordon-wheel-shell relative z-20 overflow-visible ${isWheelHovered ? "is-hovered" : ""}`}
              ref={wheelShellRef}
              onMouseEnter={() => setIsWheelHovered(true)}
              onMouseLeave={() => {
                setIsWheelHovered(false);
                if (wheelTiltRef.current) {
                  wheelTiltRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
                }
                if (wheelTiltRafRef.current) {
                  window.cancelAnimationFrame(wheelTiltRafRef.current);
                  wheelTiltRafRef.current = 0;
                }
              }}
              onTouchStart={() => setIsWheelHovered(true)}
              onTouchEnd={() => setIsWheelHovered(false)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const nx = (e.clientX - rect.left) / rect.width - 0.5;
                const ny = (e.clientY - rect.top) / rect.height - 0.5;
                wheelPointerRef.current = { x: nx, y: ny };
                if (!wheelTiltRafRef.current) {
                  wheelTiltRafRef.current = window.requestAnimationFrame(() => {
                    wheelTiltRafRef.current = 0;
                    wheelTiltFrameRef.current = (wheelTiltFrameRef.current + 1) % 2;
                    if (wheelTiltFrameRef.current === 0 || !wheelTiltRef.current) {
                      return;
                    }
                    const pointer = wheelPointerRef.current;
                    wheelTiltRef.current.style.transform = `rotateX(${pointer.y * -8}deg) rotateY(${pointer.x * 10}deg)`;
                  });
                }
              }}
            >
              <div className="gordon-wheel-tilt" ref={wheelTiltRef}>
                <div className="gordon-wheel-track" ref={wheelTrackRef}>
                  {benefits.slice(0, 6).map((b, i) => {
                    const angle = (360 / 6) * i;
                    return (
                      <button
                        key={b.title}
                        type="button"
                        className="gordon-wheel-item"
                        style={{
                          transform: `rotate(${angle}deg) translateY(calc(var(--wheel-size) * -0.415)) rotate(-${angle}deg)`,
                        }}
                        onMouseEnter={() => setActiveBenefitSafe(i)}
                        onFocus={() => setActiveBenefitSafe(i)}
                        onClick={() => setActiveBenefitSafe(i)}
                        aria-label={`Ustaw atut: ${b.title}`}
                      >
                        <span
                          className="gordon-wheel-item-counter"
                          ref={(el) => {
                            wheelCounterRefs.current[i] = el;
                          }}
                        >
                          <span className={`gordon-wheel-item-inner ${i === activeBenefit ? "is-active" : "is-ghost"}`}>
                            <span className="hero-gradient-icon inline-flex rounded-xl p-2 text-white">
                              <b.icon className="h-5 w-5" />
                            </span>
                            <span className="mt-2 block text-sm font-semibold text-zinc-900">{b.title}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="gordon-wheel-center">
                  <Image
                           src="/logoEkspresja.png"
                           alt="Ekspresja.net"
                           width={420}
                           height={120}
                           priority
                           className="h-auto w-full max-w-[240px] object-contain sm:max-w-[300px]"
                         />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-5 px-6 pb-16">
        {spotlightBlocks.map((block, index) => (
          <article
            key={block.title}
            className={`grid overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_20px_50px_-36px_rgba(24,24,27,0.75)] md:grid-cols-2 ${index % 2 === 1 ? "md:[&>*:first-child]:order-last" : ""}`}
          >
            <div className="relative min-h-[230px] md:min-h-[320px]">
              <img src={block.image} alt={block.alt} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-black/10 to-transparent" />
            </div>
            <div className="flex items-center p-6 md:p-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{block.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-black text-zinc-900 md:text-3xl">{block.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-zinc-700 md:text-base">{block.text}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border bg-zinc-50 p-6 md:p-8">
          <h2 className="hero-gradient text-2xl font-black md:text-4xl">Gotowi na muzyczną przygodę?</h2>
          <p className="mt-3 text-zinc-700">Gość widzi ofertę publicznie, a użytkownik po rejestracji dostaje pełny panel rodzica.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-xl border border-white/60 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-5 py-3 font-semibold text-white shadow-lg hover:bg-gradient-to-r hover:from-fuchsia-400 hover:via-violet-400 hover:to-cyan-400 hover:scale-[1.02] transition-transform"
              href="/register"
            >
              Dołącz do nas!
            </Link>
            <Link className="hover:scale-105 hover:cursor-pointer hover:bg-black/5 rounded-lg border px-5 py-3" href="/kalendarz">
              Zobacz kalendarz zajęć
            </Link>
            <Link className="hover:scale-105 hover:cursor-pointer hover:bg-black/5 rounded-lg border px-5 py-3" href="/kontakt">
              Skontaktuj się
            </Link>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden">
        <img
          src="assets/main/kontakt.jpg"
          alt="Kontakt Ekspresja"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 mx-auto grid min-h-[clamp(680px,74vh,920px)] max-w-6xl items-center gap-6 px-6 py-10 md:grid-cols-2 md:py-12">
          <div className="self-center rounded-3xl border border-white/30 bg-white/10 p-6 text-white backdrop-blur-md">
            <h2 className="text-3xl font-black">Kontakt</h2>
            <p className="mt-3 text-white/90">Masz pytania o zajęcia? Napisz do nas przez formularz.</p>
            <div className="mt-5 space-y-2 text-sm text-white/90">
              <div onClick={() => window.location.href = 'tel:504939965'} className="hover:scale-105 hover:cursor-pointer inline-flex items-center gap-2">
                <Phone className="h-4 w-4 " />
                <span className="mr-4">504 939 965</span>
              </div>
              <div onClick={() => window.location.href = 'mailto:antoninawenda@gmail.com'} className="hover:scale-105 hover:cursor-pointer inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="mr-4">antoninawenda@gmail.com</span>
              </div>
              <div onClick={() => window.location.href = 'https://www.google.com/maps/place/Jana+Reutta+16A,+06-500+Ciechanów/@52.180000,21.000000,15z/data=!4m2!3m1!1s0x471a7d8c8c8c8c8c:0x471a7d8c8c8c8c8c?hl=pl'} className="hover:scale-105 hover:cursor-pointer inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Jana Reutta 16A, 06-500 Ciechanów</span>
              </div>
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
