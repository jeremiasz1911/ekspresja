import { AuthGate } from "@/components/auth/AuthGate";
import { AdminGate } from "@/components/auth/AdminGate";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AdminGate>
        <AdminLayout>{children}</AdminLayout>
      </AdminGate>
    </AuthGate>
  );
}
