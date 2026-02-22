"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {
  doesUserProfileExist,
  isProfileComplete,
  getUserRole,
} from "@/services/user-profile.service";

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

    async function verify() {
      setChecking(true);

      try {
        const role = await getUserRole(user!.uid);

        // ✅ admin nie przechodzi przez complete-profile
        if (role === "admin") return;

        const exists = await doesUserProfileExist(user!.uid);

        // 2) brak profilu -> complete-profile (z next)
        if (!exists) {
          if (pathname !== "/complete-profile" && !redirectingRef.current) {
            redirectingRef.current = true;
            const next = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;
            router.replace(`/complete-profile?next=${encodeURIComponent(next)}`);
          }
          return;
        }

        const complete = await isProfileComplete(user!.uid);

        // 3) profil niekompletny -> complete-profile tylko gdy wchodzisz w strefę wymagającą profilu
        if (!complete && requiresProfile) {
          if (pathname !== "/complete-profile" && !redirectingRef.current) {
            redirectingRef.current = true;
            const next = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;
            router.replace(`/complete-profile?next=${encodeURIComponent(next)}`);
          }
          return;
        }

        // 4) profil kompletny -> blokuj wejście na complete-profile
        if (complete && pathname === "/complete-profile") {
          router.replace("/dashboard");
          return;
        }
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
