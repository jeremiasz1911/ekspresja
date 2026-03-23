import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <PublicNav />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <PublicPageHeader title="Polityka prywatności" compact />
        <div className="mt-6 space-y-4 text-sm text-zinc-700">
          <p>
            Administratorem danych jest Ekspresja - usługi artystyczne. Dane kontaktowe są przetwarzane
            wyłącznie w celu odpowiedzi na zapytania, obsługi zapisów oraz realizacji usług.
          </p>
          <p>
            Użytkownik ma prawo dostępu do swoich danych, ich poprawiania, usunięcia oraz ograniczenia
            przetwarzania. W sprawach dotyczących danych prosimy o kontakt: antoninawenda@gmail.com.
          </p>
          <p>
            Formularz kontaktowy zapisuje zgłoszenia w zabezpieczonej bazie (Firebase/Firestore) wyłącznie
            dla celów organizacyjnych i kontaktowych.
          </p>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
