"use client";

import { useState, useEffect } from "react";
import { Search, Lock, Music, Video, Sparkles } from "lucide-react";
import { MaterialsList } from "@/components/public/MaterialsList";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import { getActiveEntitlements } from "@/features/billing";
import { getUserRole } from "@/features/admin";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=2000&q=80",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=2000&q=80",
];

function isAdminByEmail(email?: string | null) {
  const list = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

export default function MaterialsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "video" | "audio">("all");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  // Check subscription status
  useEffect(() => {
    async function checkSubscription() {
      if (!user?.uid) {
        setIsSubscribed(false);
        setIsAdmin(false);
        setUserLoading(false);
        return;
      }

      try {
        const [entitlements, role] = await Promise.all([
          getActiveEntitlements(user.uid),
          getUserRole(user.uid),
        ]);
        setIsSubscribed(entitlements.length > 0);
        setIsAdmin(role === "admin" || isAdminByEmail(user.email));
      } catch (err) {
        console.error("Error checking subscription:", err);
        setIsSubscribed(false);
        setIsAdmin(false);
      } finally {
        setUserLoading(false);
      }
    }

    checkSubscription();
  }, [user]);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <PublicNav />
      
      {/* Hero Section */}
      <section className="relative h-[48vh] min-h-[360px] overflow-hidden">
        <img
          src={HERO_IMAGES[0]}
          alt="Materiały edukacyjne"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl items-center px-6">
          <div className="max-w-2xl rounded-3xl border border-white/30 bg-white/10 p-6 text-white backdrop-blur-md">
            <h1 className="hero-gradient text-4xl font-black md:text-6xl">Materiały</h1>
            <p className="mt-4 text-white/90">
              Teledyski, piosenki i zasoby edukacyjne do nauki gry na instrumencie. 
              Część darmowa dla wszystkich, część premium dla subskrybentów.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <PublicPageHeader
          title="Materiały Edukacyjne"
          description="Teledyski, utwory i zasoby do nauki gry na instrumencie"
        />

        {/* Search Bar */}
        <div className="relative max-w-2xl mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Szukaj materiałów, artystów, piosenek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-sm font-medium text-zinc-600">Filtry:</span>
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filterType === "all"
                ? "bg-zinc-900 text-white shadow-md"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            } cursor-pointer`}
          >
            Wszystkie
          </button>
          <button
            onClick={() => setFilterType("video")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              filterType === "video"
                ? "bg-zinc-900 text-white shadow-md"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            } cursor-pointer`}
          >
            <Video className="h-4 w-4" />
            Teledyski
          </button>
          <button
            onClick={() => setFilterType("audio")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              filterType === "audio"
                ? "bg-zinc-900 text-white shadow-md"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            } cursor-pointer`}
          >
            <Music className="h-4 w-4" />
            Piosenki
          </button>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md border border-emerald-200 bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">
            Darmowe
          </span>
          <span className="rounded-md border border-sky-200 bg-sky-100 px-2 py-1 font-semibold text-sky-800">
            STANDARD+
          </span>
          <span className="rounded-md border border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-200 px-2 py-1 font-semibold text-amber-900">
            GOLD
          </span>
        </div>

        {/* Info Banner */}
        {!user && !userLoading && (
          <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-200 rounded-xl flex items-start gap-4 shadow-sm mb-8">
            <Lock className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Dostęp Ograniczony</h3>
              <p className="text-sm text-blue-800">
                Zaloguj się, aby uzyskać dostęp do wszystkich premium materiałów edukacyjnych.
              </p>
            </div>
          </div>
        )}

        {/* Materials List */}
        <MaterialsList
          searchQuery={searchQuery}
          filterType={filterType}
          isSubscribed={isSubscribed}
          isAdmin={isAdmin}
          isLoading={userLoading}
        />
      </section>

      <PublicFooter />
    </main>
  );
}
