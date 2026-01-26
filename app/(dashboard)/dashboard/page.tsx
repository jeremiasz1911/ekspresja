"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="border rounded-xl p-4 space-y-2">
        <p className="text-sm">Zalogowany jako:</p>
        <p className="font-medium">{user?.displayName || user?.email}</p>
      </div>

      <Link href="/dashboard/profile">
        <Button variant="outline">✏️ Edytuj dane</Button>
      </Link>

      <button className="border rounded-md px-3 py-2" onClick={() => signOut(auth)}>
        Wyloguj
      </button>
    </main>
  );
}
