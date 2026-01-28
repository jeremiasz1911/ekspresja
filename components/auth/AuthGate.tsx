"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    async function verify() {
      try {
        const exists = await doesUserProfileExist(user!.uid);

        // 👉 Nowy użytkownik
        if (!exists) {
          if (pathname !== "/complete-profile") {
            router.replace("/complete-profile");
          }
          return;
        }

        const role = await getUserRole(user!.uid);

        // ✅ ADMIN omija complete-profile
        if (role === "admin") {
          return;
        }

        const complete = await isProfileComplete(user!.uid);

        if (!complete && pathname !== "/complete-profile") {
          router.replace("/complete-profile");
          return;
        }

        // 🚫 blokada wchodzenia na complete-profile gdy już kompletne
        if (complete && pathname === "/complete-profile") {
          router.replace("/dashboard");
        }
      } finally {
        setChecking(false);
      }
    }

    verify();
  }, [user, loading, pathname, router]);

  if (loading || checking) {
    return <div className="p-6">Sprawdzanie profilu…</div>;
  }

  return <>{children}</>;
}
