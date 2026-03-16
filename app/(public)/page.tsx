import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNav } from "@/components/public/PublicNav";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function PublicPage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicNav />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border bg-zinc-50 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-zinc-600">
            <Sparkles className="h-3.5 w-3.5" />
            Strona publiczna
          </div>
          <h1 className="hero-gradient mt-3 text-3xl font-black">Ekspresja</h1>
          <p className="mt-2 text-zinc-600">Platforma zajęć dla rodziców i dzieci.</p>
          <div className="mt-5">
            <Link href="/" className="rounded-lg border px-4 py-2 text-sm">
              Przejdź na stronę główną
            </Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
