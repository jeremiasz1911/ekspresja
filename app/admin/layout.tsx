import { Suspense } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { AdminGate } from "@/components/auth/AdminGate";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6">Ładowanie…</div>}>
      <AuthGate>
        <AdminGate>
          <AdminLayout>{children}</AdminLayout>
        </AdminGate>
      </AuthGate>
    </Suspense>
  );
}
