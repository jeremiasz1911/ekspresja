import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Baby, ArrowRight } from "lucide-react";

export default function ChildrenPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Moje dzieci</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Zarządzanie danymi dzieci jest dostępne w sekcji profilu rodzica.
        </p>
      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="mb-3 inline-flex rounded-2xl p-3 text-white hero-gradient-icon">
          <Baby className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold">Edytuj dzieci w profilu</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          W jednym formularzu zaktualizujesz dane opiekuna i dzieci, a zmiany będą od razu widoczne w zapisach i płatnościach.
        </p>
        <Link href="/dashboard/profile" className="mt-5 inline-flex">
          <Button>
            Przejdź do szczegółów konta
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
