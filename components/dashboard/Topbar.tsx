"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { Bell, CircleDollarSign, Menu, MessageCircleMore, UserPlus2, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOptionalAdminRealtime } from "@/components/admin/AdminRealtimeProvider";

const breadcrumbLabels: Record<string, string> = {
  admin: "Admin",
  dashboard: "Panel",
  profile: "Profil",
  classes: "Zajęcia",
  payments: "Płatności",
  children: "Dzieci",
  settings: "Ustawienia",
  users: "Użytkownicy",
  plans: "Plany",
  groups: "Grupy",
  chats: "Chaty",
  messages: "Wiadomości",
  announcements: "Aktualności",
  notifications: "Powiadomienia",
};

function breadcrumbFromPath(path: string) {
  const parts = path.split("/").filter(Boolean);

  return parts.map((part, idx) => ({
    label: breadcrumbLabels[part] ?? part,
    href: "/" + parts.slice(0, idx + 1).join("/"),
  }));
}

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const crumbs = breadcrumbFromPath(pathname);
  const isAdminArea = pathname.startsWith("/admin");
  const adminRealtime = useOptionalAdminRealtime();

  return (
    <header className="h-14 border-b flex items-center justify-between px-3 md:px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-4 w-4" />
        </Button>
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {crumbs.map((c, i) => (
            <span key={c.href} className={i < crumbs.length - 1 ? "hidden sm:inline" : "inline"}>
              {i > 0 && (
                <span className={`mx-1 text-zinc-400 ${i < crumbs.length - 1 ? "hidden sm:inline" : ""}`}>/</span>
              )}
              {c.label}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {isAdminArea && adminRealtime ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {adminRealtime.unreadNotifications > 0 ? (
                  <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-[11px]">
                    {adminRealtime.unreadNotifications > 99 ? "99+" : adminRealtime.unreadNotifications}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium">Powiadomienia</div>
                <Button size="sm" variant="ghost" onClick={() => adminRealtime.markNotificationsSeen()}>
                  Oznacz jako przeczytane
                </Button>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {adminRealtime.events.slice(0, 10).map((e) => (
                  <Link
                    key={e.id}
                    href={e.href}
                    className="block rounded-lg border px-2 py-1.5 text-xs hover:bg-muted"
                    onClick={() => adminRealtime.markNotificationSeen(e.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100">
                        {e.type === "registration" ? (
                          <UserPlus2 className="h-3.5 w-3.5 text-blue-600" />
                        ) : e.type === "payment" ? (
                          <CircleDollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <ClipboardList className="h-3.5 w-3.5 text-amber-600" />
                        )}
                      </span>
                      <div className="font-medium">{e.title}</div>
                      {adminRealtime.isUnreadEvent(e.id) ? (
                        <span className="ml-auto rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
                          nowe
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1">{e.text}</div>
                    <div className="text-muted-foreground">{new Date(e.ts).toLocaleString("pl-PL")}</div>
                  </Link>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => window.dispatchEvent(new Event("open-admin-chat"))}
          >
            <MessageCircleMore className="mr-2 h-4 w-4" />
            Skontaktuj się z adminem
          </Button>
        )}
        <UserMenu />
      </div>
    </header>
  );
}
