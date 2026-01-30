"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Profil", href: "/dashboard/profile" },
  { label: "Zajęcia", href: "/dashboard/classes" },
  { label: "Płatności", href: "/dashboard/payments" },
  { label: "Dzieci", href: "/dashboard/children" },
];

export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="w-64 border-r bg-background h-screen sticky top-0">
      <div className="p-4 font-semibold text-lg">
        🎵 Music Platform
      </div>

      <nav className="px-2 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
