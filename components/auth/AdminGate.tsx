"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserRole } from "@/services/role.service";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login?next=/admin/classes");
      return;
    }

    getUserRole(user.uid)
      .then((role) => {
        if (role !== "admin") {
          router.replace("/dashboard");
        }
      })
      .finally(() => setChecking(false));
  }, [user, loading, router]);

  if (loading || checking) {
    return <div className="p-6">Sprawdzanie uprawnień…</div>;
  }

  return <>{children}</>;
}
