import Link from "next/link";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";

const items = [
  { title: "Gordonki 0-3", href: "/oferta", tags: ["gordonki", "niemowlęta", "umuzykalnianie"] },
  { title: "Rytmika 3-4", href: "/oferta", tags: ["rytmika", "dzieci"] },
  { title: "Warsztaty muzyczne", href: "/oferta", tags: ["warsztaty", "muzyka", "kreatywność"] },
  { title: "Kalendarz zajęć", href: "/kalendarz", tags: ["harmonogram", "terminy"] },
  { title: "Kontakt", href: "/kontakt", tags: ["telefon", "email", "adres"] },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const q = String(params.q || "").toLowerCase().trim();
  const tag = String(params.tag || "").toLowerCase().trim();

  const filtered = items.filter((item) => {
    const hay = `${item.title} ${item.tags.join(" ")}`.toLowerCase();
    const byQuery = q ? hay.includes(q) : true;
    const byTag = tag ? item.tags.some((t) => t.toLowerCase().includes(tag)) : true;
    return byQuery && byTag;
  });

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <PublicNav />
      <section className="mx-auto max-w-5xl px-6 py-12">
        <PublicPageHeader title="Szukaj" description="Wyszukaj zajęcia i informacje na stronie." compact />
        <form action="/szukaj" className="mt-6 flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Szukaj po ofercie i stronach..."
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm"
          />
          <button className="rounded-xl border px-4 py-3 text-sm">Szukaj</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link className="rounded-full border px-2 py-1" href="/szukaj?tag=gordonki">#gordonki</Link>
          <Link className="rounded-full border px-2 py-1" href="/szukaj?tag=rytmika">#rytmika</Link>
          <Link className="rounded-full border px-2 py-1" href="/szukaj?tag=muzyka">#muzyka</Link>
          <Link className="rounded-full border px-2 py-1" href="/szukaj?tag=kontakt">#kontakt</Link>
        </div>

        <div className="mt-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border p-4 text-sm text-zinc-600">Brak wyników dla podanego zapytania.</div>
          ) : (
            filtered.map((item) => (
              <Link key={item.title} href={item.href} className="block rounded-xl border p-4">
                <div className="font-semibold">{item.title}</div>
                <div className="mt-1 text-xs text-zinc-500">{item.tags.map((t) => `#${t}`).join(" ")}</div>
              </Link>
            ))
          )}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
