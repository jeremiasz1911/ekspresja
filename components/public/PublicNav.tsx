"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PublicCookieConsent } from "@/components/public/PublicCookieConsent";

const items = [
  { href: "/", label: "Start" },
  { href: "/o-mnie", label: "O mnie" },
  { href: "/oferta", label: "Opis zajęć" },
  { href: "/kalendarz", label: "Kalendarz zajęć" },
  { href: "/galeria", label: "Galeria" },
  { href: "/kontakt", label: "Kontakt" },
];

export function PublicNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-40 border-b transition-all duration-300 ${
          scrolled
            ? "border-zinc-200/80 bg-white/75 shadow-sm backdrop-blur-xl"
            : "border-transparent bg-white/45 backdrop-blur-md"
        }`}
      >
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-semibold">
            Ekspresja.net
          </Link>
          <div className="hidden items-center gap-4 text-sm md:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "font-semibold text-zinc-900" : "text-zinc-600"}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-2">
            <Link className="rounded-md border border-zinc-300/80 bg-white/70 px-3 py-1.5 text-sm" href="/login">
              Zaloguj
            </Link>
            <Link className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white" href="/register">
              Utwórz konto
            </Link>
          </div>
        </nav>
      </header>
      <div className="h-[76px]" />
      <PublicCookieConsent />
    </>
  );
}
