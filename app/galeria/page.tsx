"use client";

import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { useEffect, useState } from "react";

const gallery = [
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1514119412350-e174d90d280e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80",
];

export default function GalleryPage() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setActive((p) => (p + 1) % gallery.length), 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <PublicNav />
      <section className="relative h-[50vh] min-h-[340px] overflow-hidden">
        {gallery.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Galeria hero ${i + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${
              i === active ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl items-center px-6">
          <div className="rounded-3xl border border-white/30 bg-white/10 p-6 text-white backdrop-blur-md">
            <h1 className="hero-gradient text-4xl font-black md:text-6xl">Galeria</h1>
            <p className="mt-3 text-white/90">Momenty z zajęć i muzycznej atmosfery Ekspresji.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-zinc-500">Zdjęcia poglądowe: Unsplash.</p>
        <div className="mt-6 columns-1 gap-4 space-y-4 md:columns-3">
          {gallery.concat(gallery.slice(0, 3)).map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt={`Ekspresja zdjęcie ${i + 1}`}
              className="w-full rounded-xl object-cover transition duration-300 hover:scale-[1.02]"
            />
          ))}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
