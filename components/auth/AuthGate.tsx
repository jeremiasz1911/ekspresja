"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {
  doesUserProfileExist,
  isProfileComplete,
  getUserRole,
} from "@/features/profile/children";

type GuardSnapshot = {
  role: string | null;
  exists: boolean;
  complete: boolean;
};

const guardCache = new Map<string, GuardSnapshot>();

function isAdminByEmail(email?: string | null) {
  const list = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [checking, setChecking] = useState(true);

  // ✅ trasy, które NIE powinny wymuszać complete-profile
  const publicRoutes = useMemo(
    () =>
      new Set([
        "/",
        "/login",
        "/register",
        "/complete-profile", // pozwalamy wejść
      ]),
    []
  );

  // ✅ jeśli masz jakieś publiczne podstrony, dodaj prefixy:
  const publicPrefixes = useMemo(() => ["/public"], []);

  const isPublicRoute = useMemo(() => {
    if (publicRoutes.has(pathname)) return true;
    return publicPrefixes.some((p) => pathname.startsWith(p));
  }, [pathname, publicRoutes, publicPrefixes]);

  // ✅ trasy wymagające profilu (Twoje dashboard/admin)
  const requiresProfile = useMemo(() => {
    // dashboard i admin wymagają profilu
    return pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  }, [pathname]);

  // zapobiega wielokrotnym redirectom w tej samej “sesji efektu”
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    // zawsze resetuj "redirecting" przy zmianie usera
    redirectingRef.current = false;

    // 1) niezalogowany -> login (tylko gdy to nie jest publiczna strona)
    if (!user) {
      setChecking(false);
      if (!isPublicRoute) {
        const next = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      }
      return;
    }

    function applyGuard(snapshot: GuardSnapshot) {
      // admin nie przechodzi przez complete-profile
      if (snapshot.role === "admin" || isAdminByEmail(user?.email)) return;

      // brak profilu -> complete-profile
      if (!snapshot.exists) {
        if (pathname !== "/complete-profile" && !redirectingRef.current) {
          redirectingRef.current = true;
          const next = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;
          router.replace(`/complete-profile?next=${encodeURIComponent(next)}`);
        }
        return;
      }

      // profil niekompletny -> complete-profile tylko gdy trasa wymaga profilu
      if (!snapshot.complete && requiresProfile) {
        if (pathname !== "/complete-profile" && !redirectingRef.current) {
          redirectingRef.current = true;
          const next = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;
          router.replace(`/complete-profile?next=${encodeURIComponent(next)}`);
        }
        return;
      }

      // profil kompletny -> blokuj wejście na complete-profile
      if (snapshot.complete && pathname === "/complete-profile") {
        router.replace("/dashboard");
      }
    }

    async function verify() {
      try {
        const cached = guardCache.get(user!.uid);
        if (cached) {
          applyGuard(cached);
          return;
        }

        setChecking(true);
        const role = await getUserRole(user!.uid);
        const exists = await doesUserProfileExist(user!.uid);
        const complete = exists ? await isProfileComplete(user!.uid) : false;

        const snapshot: GuardSnapshot = { role, exists, complete };
        guardCache.set(user!.uid, snapshot);
        applyGuard(snapshot);
      } finally {
        setChecking(false);
      }
    }

    verify();
  }, [user, loading, pathname, router, isPublicRoute, requiresProfile, searchParams]);

  if (loading || checking) {
    return <div className="p-6">Sprawdzanie profilu…</div>;
  }

  return <>{children}</>;
}
