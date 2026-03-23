"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpenText, CalendarDays, Bell, LayoutDashboard, Layers, Megaphone, MessageCircle, PanelLeftClose, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdminRealtime } from "./AdminRealtimeProvider";
import { Button } from "@/components/ui/button";

const nav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Zajęcia", href: "/admin/classes", icon: CalendarDays },
  { label: "E-materiały", href: "/admin/materials", icon: BookOpenText },
  { label: "Użytkownicy", href: "/admin/users", icon: Users },
  { label: "Plany", href: "/admin/plans", icon: ShieldCheck },
  { label: "Grupy", href: "/admin/groups", icon: Layers },
  { label: "Chaty", href: "/admin/chats", icon: MessageCircle },
  { label: "Statementy", href: "/admin/announcements", icon: Megaphone },
  { label: "Powiadomienia", href: "/admin/notifications", icon: Bell },
];

export function AdminSidebar({
  className,
  onNavigate,
  onToggleCollapse,
  showCollapseButton = false,
}: {
  className?: string;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  showCollapseButton?: boolean;
}) {
  const pathname = usePathname();
  const { unreadChats, unreadNotifications } = useAdminRealtime();

  return (
    <aside className={cn("w-72 border-r bg-background/95 h-screen sticky top-0 backdrop-blur-sm", className)}>
      <div className="border-b p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ekspresja</p>
        <div className="mt-1 flex items-center justify-between gap-2 text-lg font-semibold">
          <div className="flex items-center gap-2">
            <span className="hero-gradient-icon inline-flex rounded-lg p-1.5 text-white">👑</span>
            Admin Panel
          </div>
          {showCollapseButton ? (
            <Button type="button" size="icon" variant="ghost" onClick={onToggleCollapse}>
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <nav className="px-2 py-3 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          const badge =
            item.href === "/admin/chats"
              ? unreadChats
              : item.href === "/admin/notifications"
              ? unreadNotifications
              : 0;
          return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
              )}
            >
              <Icon className={cn("h-4 w-4", !active && "text-muted-foreground")} />
              {item.label}
              {badge > 0 ? (
                <Badge className="ml-auto h-5 min-w-5 rounded-full px-1 text-[11px]">{badge > 99 ? "99+" : badge}</Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 text-xs text-muted-foreground border-t">
        Zarządzanie zajęciami, użytkownikami i planami.
      </div>
    </aside>
  );
}
