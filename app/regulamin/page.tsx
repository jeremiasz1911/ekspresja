import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <PublicNav />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <PublicPageHeader title="Regulamin platformy" compact />
        <div className="mt-6 space-y-4 text-sm text-zinc-700">
          <p>
            Platforma umożliwia zapisy na zajęcia, podgląd harmonogramu i kontakt z organizatorem.
            Rejestracja konta oznacza akceptację zasad działania platformy i polityki prywatności.
          </p>
          <p>
            Zapis na zajęcia jest skuteczny po potwierdzeniu zgodnie z wybraną metodą płatności
            (online, kredyty, gotówka, deklaracja). Organizator może odwołać lub zmienić termin zajęć.
          </p>
          <p>
            Użytkownik zobowiązuje się podawać prawdziwe dane i korzystać z platformy zgodnie z przeznaczeniem.
          </p>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
