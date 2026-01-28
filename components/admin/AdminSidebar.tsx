"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Zajęcia", href: "/admin/classes" },
  { label: "Użytkownicy", href: "/admin/users" },
  { label: "Płatności", href: "/admin/payments" },
  { label: "Grupy", href: "/admin/groups" },
  { label: "Eventy", href: "/admin/events" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-background h-screen sticky top-0">
      <div className="p-4 font-semibold text-lg">👑 Admin</div>

      <nav className="px-2 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition",
                active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 text-xs text-muted-foreground">
        Panel administracyjny
      </div>
    </aside>
  );
}
