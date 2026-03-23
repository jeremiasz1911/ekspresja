"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { PublicCookieConsent } from "@/components/public/PublicCookieConsent";

const items = [
  { href: "/", label: "Start" },
  { href: "/o-mnie", label: "O mnie" },
  { href: "/oferta", label: "Opis zajęć" },
  { href: "/kalendarz", label: "Kalendarz zajęć" },
  { href: "/galeria", label: "Galeria" },
  { href: "/materials", label: "Materiały" },
  { href: "/kontakt", label: "Kontakt" },
];

export function PublicNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-[120] border-b transition-all duration-300 ${
          scrolled
            ? "border-zinc-200/80 bg-white/75 shadow-sm backdrop-blur-xl"
            : "border-transparent bg-white/45 backdrop-blur-md"
        }`}
      >
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-6 py-3 md:px-6">
          <Link href="/" className="flex flex-shrink-0 items-center" aria-label="Ekspresja.net - strona główna">
            <div className="relative h-12 w-[160px] sm:h-14 sm:w-[200px] md:h-14 md:w-[240px] lg:h-16 lg:w-[320px]">
              <Image
                src="/logoEkspresja.png"
                alt="Ekspresja.net"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          <div className="hidden items-center justify-center gap-0.5 whitespace-nowrap lg:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition ${
                  pathname === item.href
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center justify-end gap-2 whitespace-nowrap lg:flex">
            <Link className="flex-shrink-0 rounded-full border border-zinc-300/80 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-white" href="/login">
              Zaloguj
            </Link>
            <Link className="flex-shrink-0 rounded-full bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90" href="/register">
              Utwórz konto
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden items-center justify-center h-10 w-10 rounded-full transition hover:bg-zinc-100"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-zinc-900" />
            ) : (
              <Menu className="h-6 w-6 text-zinc-900" />
            )}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="fixed inset-0 top-[74px] z-[119] lg:hidden">
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <nav className="absolute left-0 right-0 top-0 border-b border-zinc-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur">
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-4 py-3 font-semibold transition ${
                      pathname === item.href
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="border-t border-zinc-200 pt-3 mt-2 flex flex-col gap-2">
                  <Link
                    className="block rounded-lg border border-zinc-300/80 bg-white/80 px-4 py-3 text-center font-medium text-zinc-700 transition"
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Zaloguj
                  </Link>
                  <Link
                    className="block rounded-lg bg-zinc-900 px-4 py-3 text-center font-semibold text-white transition hover:opacity-90"
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Utwórz konto
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
      <div className="h-[76px]" />
      <PublicCookieConsent />
    </>
  );
}
