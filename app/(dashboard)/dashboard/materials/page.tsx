"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { getMaterialsForParent } from "@/features/materials";
import type { MaterialWithAccess, MaterialsForParent } from "@/types/materials";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpenText, ExternalLink, Lock } from "lucide-react";

function kindLabel(kind: MaterialWithAccess["kind"]): string {
  if (kind === "video") return "Wideo";
  if (kind === "audio") return "Audio";
  if (kind === "sheet") return "Materiały";
  return "Link";
}

function accessLabel(level: MaterialWithAccess["accessLevel"]): string {
  if (level === "free") return "Darmowe";
  if (level === "partial") return "Plan STANDARD+";
  return "Plan GOLD";
}

export default function MaterialsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MaterialsForParent | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMaterialsForParent(user.uid);
        if (mounted) setData(response);
      } catch (e: unknown) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Nie udało się pobrać e-materiałów.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">E-materiały</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Część materiałów jest darmowa, a część odblokowuje się zgodnie z aktywnym planem.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">Darmowe + Premium</Badge>
          <Badge variant="outline">Dostęp wg planu</Badge>
          <Badge variant="outline">Firebase Storage</Badge>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
        <div className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-600">
          <BookOpenText className="h-4 w-4" />
          Biblioteka materiałów
        </div>

        {loading ? <p className="text-sm text-zinc-500">Ładowanie materiałów…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error && data ? (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
              Twój poziom dostępu: <strong>{data.materialsAccess.toUpperCase()}</strong>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Dostępne dla Ciebie</h2>
              {data.available.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Brak materiałów w tej chwili.</p>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {data.available.map((item) => (
                    <article key={item.id} className="rounded-2xl border p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="font-medium text-zinc-900">{item.title}</p>
                        <Badge variant="secondary">{kindLabel(item.kind)}</Badge>
                      </div>
                      {item.description ? (
                        <p className="text-sm text-zinc-600">{item.description}</p>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Badge variant="outline">{accessLabel(item.accessLevel)}</Badge>
                        {item.resolvedUrl ? (
                          <a href={item.resolvedUrl} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="outline">
                              Otwórz
                              <ExternalLink className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-500">Brak pliku/linku</span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Zablokowane (premium)</h2>
              {data.locked.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Masz odblokowane wszystkie obecne materiały.</p>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {data.locked.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="font-medium text-zinc-900">{item.title}</p>
                        <Badge>{kindLabel(item.kind)}</Badge>
                      </div>
                      {item.description ? (
                        <p className="text-sm text-zinc-600">{item.description}</p>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Badge variant="outline">{accessLabel(item.accessLevel)}</Badge>
                        <Button size="sm" variant="secondary" asChild>
                          <Link href="/dashboard/payments">
                            <Lock className="mr-1 h-3.5 w-3.5" />
                            Odblokuj
                          </Link>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
