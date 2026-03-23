"use client";

import { useState, useEffect } from "react";
import {
  Lock,
  Music,
  Video,
  Play,
  AlertCircle,
  Trash2,
  CircleDollarSign,
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import {
  deleteMaterialAsAdmin,
  getActiveMaterials,
} from "@/services/materials.service";
import type { Material, MaterialKind } from "@/types/materials";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MaterialsListProps {
  searchQuery: string;
  filterType: "all" | "video" | "audio";
  isSubscribed: boolean;
  isAdmin?: boolean;
  isLoading?: boolean;
}

export function MaterialsList({
  searchQuery,
  filterType,
  isSubscribed,
  isAdmin = false,
  isLoading = false,
}: MaterialsListProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = Array.from(
    new Set(materials.map((material) => material.category?.trim()).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b, "pl"));

  useEffect(() => {
    async function loadMaterials() {
      try {
        setLoading(true);
        const data = await getActiveMaterials();
        setMaterials(data);
        setError(null);
      } catch (err) {
        console.error("Error loading materials:", err);
        setError("Nie udało się załadować materiałów. Spróbuj później.");
      } finally {
        setLoading(false);
      }
    }

    loadMaterials();
  }, []);

  // Filter materials based on category, search and type
  const filtered = materials.filter((material) => {
    // Filter by category
    if (selectedCategory !== "all") {
      const category = material.category?.trim() || "Bez kategorii";
      if (category !== selectedCategory) {
        return false;
      }
    }

    // Filter by type
    if (filterType !== "all") {
      const kind = material.kind as MaterialKind;
      if (
        (filterType === "video" && kind !== "video") ||
        (filterType === "audio" && kind !== "audio")
      ) {
        return false;
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        material.title.toLowerCase().includes(query) ||
        material.description?.toLowerCase().includes(query) ||
        material.category?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Separate free and premium materials
  const freeItems = filtered.filter((m) => m.accessLevel === "free");
  const premiumItems = filtered.filter((m) => m.accessLevel !== "free");

  async function onDeleteMaterial(materialId: string) {
    if (!isAdmin || !auth.currentUser) {
      setError("Brak uprawnień do usuwania materiałów.");
      return;
    }

    try {
      setIsDeleting(true);
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Brak aktywnej sesji administratora.");
      }

      await deleteMaterialAsAdmin(materialId, idToken);
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      setSelectedMaterial(null);
    } catch (err: unknown) {
      console.error("Error deleting material:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się usunąć materiału. Spróbuj ponownie."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  // Loading state
  if (loading || isLoading) {
    return <SkeletonLoader />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-red-100 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">Coś poszło nie tak</h3>
        <p className="text-zinc-600 text-center max-w-sm">{error}</p>
      </div>
    );
  }

  // Empty state
  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-zinc-100 p-4 mb-4">
          <Music className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">Nie znaleziono materiałów</h3>
        <p className="text-zinc-600 text-center max-w-sm">
          {searchQuery || selectedCategory !== "all"
            ? "Spróbuj innej nazwy, kategorii lub zmień filtry"
            : "Wkrótce pojawią się nowe materiały"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">Kategorie</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition cursor-pointer ${
              selectedCategory === "all"
                ? "bg-zinc-900 text-white shadow"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            Wszystkie kategorie
          </button>

          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition cursor-pointer ${
                selectedCategory === category
                  ? "bg-zinc-900 text-white shadow"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </aside>

      <div className="space-y-16">
        {/* Free Materials */}
        {freeItems.length > 0 && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-zinc-900 mb-2">Materiały Darmowe</h2>
              <p className="text-zinc-600">Dostępne dla wszystkich użytkowników</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {freeItems.map((material, idx) => (
                <div key={material.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-slide-up">
                  <MaterialCard
                    material={material}
                    canAccess={true}
                    onOpenModal={() => setSelectedMaterial(material)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium Materials */}
        {premiumItems.length > 0 && (
          <div className="animate-fade-in">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 mb-2">Materiały Premium</h2>
                <p className="text-zinc-600">
                  {isSubscribed
                    ? "Masz dostęp do wszystkich materiałów premium"
                    : `${premiumItems.length} materiałów dostępnych dla subskrybentów`}
                </p>
              </div>
              {!isSubscribed && premiumItems.length > 0 && (
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">Zablokowane</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumItems.map((material, idx) => (
                <div key={material.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-slide-up">
                  <MaterialCard
                    material={material}
                    canAccess={isSubscribed}
                    onOpenModal={() => setSelectedMaterial(material)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <MaterialPreviewModal
        material={selectedMaterial}
        canAccess={selectedMaterial ? selectedMaterial.accessLevel === "free" || isSubscribed : false}
        isAdmin={isAdmin}
        isDeleting={isDeleting}
        onClose={() => setSelectedMaterial(null)}
        onDelete={onDeleteMaterial}
      />
    </div>
  );
}

interface MaterialCardProps {
  material: Material;
  canAccess: boolean;
  onOpenModal: () => void;
}

function getAccessMeta(level: Material["accessLevel"]) {
  if (level === "free") {
    return {
      label: "Darmowy",
      badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
      cardClass:
        "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 hover:shadow-emerald-100/80",
      iconClass: "text-emerald-600",
      priceClass: "bg-emerald-100 text-emerald-800",
    };
  }

  if (level === "partial") {
    return {
      label: "STANDARD+",
      badgeClass: "bg-sky-100 text-sky-800 border border-sky-200",
      cardClass:
        "border-sky-200 bg-sky-50/40 hover:border-sky-300 hover:shadow-sky-100/80",
      iconClass: "text-sky-600",
      priceClass: "bg-sky-100 text-sky-800",
    };
  }

  return {
    label: "GOLD",
    badgeClass:
      "bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-900 border border-amber-300 shadow-sm",
    cardClass:
      "border-amber-300 bg-amber-50/60 hover:border-amber-400 hover:shadow-amber-200/80",
    iconClass: "text-amber-600",
    priceClass:
      "bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-900 border border-amber-300",
  };
}

const CATEGORY_STYLES = [
  "border-rose-200 bg-rose-50 text-rose-700",
  "border-orange-200 bg-orange-50 text-orange-700",
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-lime-200 bg-lime-50 text-lime-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-cyan-200 bg-cyan-50 text-cyan-700",
  "border-sky-200 bg-sky-50 text-sky-700",
  "border-indigo-200 bg-indigo-50 text-indigo-700",
  "border-violet-200 bg-violet-50 text-violet-700",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
];

function getCategoryTagClass(category?: string): string {
  if (!category?.trim()) {
    return "border-zinc-200 bg-zinc-50 text-zinc-600";
  }

  const hash = category
    .trim()
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CATEGORY_STYLES[hash % CATEGORY_STYLES.length];
}

function MaterialCard({ material, canAccess, onOpenModal }: MaterialCardProps) {
  const icon = material.kind === "video" ? <Video className="h-6 w-6" /> : <Music className="h-6 w-6" />;
  const isAudio = material.kind === "audio";
  const typeLabel = material.kind === "video" ? "Teledysk" : "Piosenka";
  const price = material.priceCents ? material.priceCents / 100 : 19;
  const access = getAccessMeta(material.accessLevel);
  const categoryTagClass = getCategoryTagClass(material.category);

  return (
    <div
      onClick={onOpenModal}
      className={`group rounded-xl overflow-hidden border transition-all duration-300 ${access.cardClass} ${
        canAccess
          ? "hover:shadow-xl cursor-pointer bg-white hover:-translate-y-1"
          : "bg-white/95 opacity-85 cursor-pointer"
      }`}
    >
      {/* Thumbnail / Icon */}
      <div className="relative h-56 bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center overflow-hidden">
        {isAudio ? (
          <img
            src="/logoEkspresja.png"
            alt={`Okładka materiału: ${material.title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`text-zinc-400 group-hover:text-zinc-500 transition-colors ${canAccess ? "group-hover:scale-110" : ""} transition-transform`}>
            {icon}
          </div>
        )}

        {isAudio ? <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" /> : null}

        {/* Overlay for locked content */}
        {!canAccess && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
        )}

        {/* Play button on hover for accessible content */}
        {canAccess && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <div className="rounded-full bg-white p-4 transform group-hover:scale-110 transition-transform">
              <Play className="h-6 w-6 text-zinc-900 fill-zinc-900" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="inline-block px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 rounded-lg group-hover:bg-zinc-200 transition">
            {typeLabel}
          </span>
          {material.accessLevel !== "free" && (
            <Lock className={`h-4 w-4 flex-shrink-0 mt-0.5 ${access.iconClass}`} />
          )}
        </div>

        <div className={`mb-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${access.badgeClass}`}>
          {access.label}
        </div>

        <h3 className="font-bold text-zinc-900 mb-2 line-clamp-2 group-hover:text-zinc-700 transition">
          {material.title}
        </h3>

        {material.description && (
          <p className="text-sm text-zinc-600 line-clamp-2 mb-3 group-hover:text-zinc-700 transition">
            {material.description}
          </p>
        )}

        {material.category && (
          <div className="mb-3">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryTagClass}`}
            >
              {material.category}
            </span>
          </div>
        )}

        {material.accessLevel !== "free" && (
          <div className={`mb-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${access.priceClass}`}>
            <CircleDollarSign className="h-3 w-3" />
            {price.toFixed(2)} PLN
          </div>
        )}

        {!canAccess && (
          <button className="w-full mt-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 rounded-lg font-medium text-sm hover:from-amber-100 hover:to-orange-100 transition border border-amber-200 hover:border-amber-300 cursor-pointer">
            Wznów Subskrypcję
          </button>
        )}
      </div>
    </div>
  );
}

// Skeleton Loader
function SkeletonLoader() {
  return (
    <div className="space-y-12">
      <div className="animate-fade-in">
        <div className="h-10 w-40 bg-zinc-200 rounded-lg mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 bg-white animate-pulse">
      <div className="h-56 bg-gradient-to-br from-zinc-100 to-zinc-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-20 bg-zinc-200 rounded" />
        <div className="h-5 w-3/4 bg-zinc-200 rounded" />
        <div className="h-4 w-full bg-zinc-200 rounded" />
        <div className="h-4 w-2/3 bg-zinc-200 rounded" />
      </div>
    </div>
  );
}

function isEmbeddableYoutube(url?: string): boolean {
  return !!url && (url.includes("youtube.com/embed/") || url.includes("youtube-nocookie.com/embed/"));
}

interface MaterialPreviewModalProps {
  material: Material | null;
  canAccess: boolean;
  isAdmin: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

function MaterialPreviewModal({
  material,
  canAccess,
  isAdmin,
  isDeleting,
  onClose,
  onDelete,
}: MaterialPreviewModalProps) {
  if (!material) return null;

  const isVideo = material.kind === "video";
  const isAudio = material.kind === "audio";
  const price = material.priceCents ? material.priceCents / 100 : 19;
  const youtubeEmbeddable = isEmbeddableYoutube(material.externalUrl);
  const categoryTagClass = getCategoryTagClass(material.category);
  const canDelete = isAdmin && !!auth.currentUser;

  return (
    <Dialog open={!!material} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{material.title}</DialogTitle>
          <DialogDescription>
            {material.category ? `Kategoria: ${material.category}` : "Materiał edukacyjny"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {material.description ? (
            <p className="text-sm text-zinc-700">{material.description}</p>
          ) : null}

          {material.category ? (
            <div>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryTagClass}`}
              >
                {material.category}
              </span>
            </div>
          ) : null}

          {material.accessLevel !== "free" ? (
            <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-900">
              <CircleDollarSign className="h-4 w-4" />
              Materiał płatny: {price.toFixed(2)} PLN
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-900">
              Darmowy materiał
            </div>
          )}

          {!canAccess ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              Ten materiał jest płatny. Kup subskrypcję, aby odblokować podgląd.
            </div>
          ) : null}

          {canAccess && isVideo && youtubeEmbeddable ? (
            <div className="overflow-hidden rounded-xl border">
              <iframe
                title={material.title}
                src={material.externalUrl}
                className="h-[340px] w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : null}

          {isAudio ? (
            <div className="relative overflow-hidden rounded-xl border">
              <img
                src="/logoEkspresja.png"
                alt={`Okładka utworu: ${material.title}`}
                className="h-[340px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">
                <Music className="h-4 w-4" />
                Utwór
              </div>
            </div>
          ) : null}

          {canAccess && isAudio && material.externalUrl ? (
            <div className="rounded-xl border bg-zinc-50 p-4">
              <audio controls className="w-full" src={material.externalUrl}>
                Twoja przeglądarka nie obsługuje odtwarzacza audio.
              </audio>
            </div>
          ) : null}

          {canAccess && material.externalUrl && (!isAudio && (!isVideo || !youtubeEmbeddable)) ? (
            <a
              href={material.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Otwórz materiał
            </a>
          ) : null}
        </div>

        <DialogFooter>
          {canDelete ? (
            <Button
              variant="destructive"
              onClick={() => onDelete(material.id)}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Usuwanie..." : "Usuń materiał"}
            </Button>
          ) : null}
         
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Zamknij
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

