import Link from "next/link";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNav } from "@/components/public/PublicNav";
import { ContactForm } from "@/components/public/ContactForm";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <PublicNav />
      <section className="relative h-[48vh] min-h-[360px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=2200&q=80"
          alt="Kontakt - Ekspresja"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl items-center px-6">
          <div className="max-w-2xl rounded-3xl border border-white/30 bg-white/10 p-6 text-white backdrop-blur-md">
            <p className="text-sm uppercase tracking-[0.2em] text-white/80">Ekspresja.net</p>
            <h1 className="hero-gradient mt-2 text-5xl font-black text-white md:text-6xl">Kontakt</h1>
            <p className="mt-3 text-white/90">Skontaktuj się z nami telefonicznie, mailowo lub przez formularz.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-2">
        <div className="md:col-span-2">
          <PublicPageHeader
            title="Kontakt"
            description="Skontaktuj się z nami telefonicznie, mailowo lub przez formularz."
          />
        </div>
        <div className="rounded-3xl border p-6">
          <h2 className="text-2xl font-bold">Dane kontaktowe</h2>
          <div className="mt-5 space-y-3 text-zinc-700">
            <div className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> 504 939 965</div>
            <div className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> antoninawenda@gmail.com</div>
            <div className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> Jana Reutta 16A, Ciechanów 06-400</div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white" href="/register">
              Dołącz do nas!
            </Link>
            <Link className="rounded-md border px-4 py-2 text-sm" href="/login">
              Zaloguj
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border p-6">
          <h3 className="text-xl font-semibold">Napisz wiadomość</h3>
          <p className="mt-2 text-sm text-zinc-600">Odezwę się najszybciej jak to możliwe.</p>
          <div className="mt-4">
            <ContactForm compact />
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
