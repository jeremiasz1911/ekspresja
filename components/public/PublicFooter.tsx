import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t bg-zinc-50/90">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="inline-flex items-center gap-2 font-semibold">
            <span className="hero-gradient-icon inline-block h-6 w-6 rounded-md" />
            Ekspresja.net
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            Ekspresja - usługi artystyczne dla dzieci i rodzin. Zajęcia umuzykalniające, rytmika, śpiew i instrumenty.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold">Nawigacja</div>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            <div><Link href="/">Start</Link></div>
            <div><Link href="/oferta">Oferta</Link></div>
            <div><Link href="/kalendarz">Kalendarz</Link></div>
            <div><Link href="/galeria">Galeria</Link></div>
            <div><Link href="/kontakt">Kontakt</Link></div>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold">Informacje</div>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            <div><Link href="/polityka-prywatnosci">Polityka prywatności</Link></div>
            <div><Link href="/regulamin">Regulamin platformy</Link></div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-zinc-700">
            <div className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>504 939 965</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>antoninawenda@gmail.com</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Jana Reutta 16A, Ciechanów</span>
            </div>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold">Szukaj na stronie</div>
          <form action="/szukaj" className="mt-3 flex gap-2">
            <input
              name="q"
              placeholder="np. Gordonki"
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
            <button className="rounded-lg border px-3 py-2 text-sm">Szukaj</button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link className="rounded-full border px-2 py-1" href="/szukaj?tag=gordonki">#gordonki</Link>
            <Link className="rounded-full border px-2 py-1" href="/szukaj?tag=rytmika">#rytmika</Link>
            <Link className="rounded-full border px-2 py-1" href="/szukaj?tag=instrumenty">#instrumenty</Link>
          </div>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-zinc-500">
        © <span suppressHydrationWarning>{new Date().getFullYear()}</span> Ekspresja.net
      </div>
    </footer>
  );
}
