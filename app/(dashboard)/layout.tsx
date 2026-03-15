import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AuthGate } from "@/components/auth/AuthGate";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="p-6">Ładowanie…</div>}>
      <AuthGate>
        <DashboardLayout>{children}</DashboardLayout>
      </AuthGate>
    </Suspense>
  );
}
