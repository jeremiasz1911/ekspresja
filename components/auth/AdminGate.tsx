"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserRole } from "@/features/admin";

function isAdminByEmail(email?: string | null) {
  const list = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

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
        const isAdmin = role === "admin" || isAdminByEmail(user.email);
        if (!isAdmin) {
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
