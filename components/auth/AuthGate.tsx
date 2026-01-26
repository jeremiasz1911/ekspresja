"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { doesUserProfileExist } from "@/services/user-profile.service";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    // Sprawdź czy profil istnieje
    doesUserProfileExist(user.uid)
      .then((exists) => {
        if (!exists) {
          router.replace("/complete-profile");
        }
      })
      .finally(() => setCheckingProfile(false));
  }, [user, loading, router, pathname]);

  if (loading || checkingProfile) {
    return <div className="p-6">Sprawdzanie profilu...</div>;
  }

  return <>{children}</>;
}
