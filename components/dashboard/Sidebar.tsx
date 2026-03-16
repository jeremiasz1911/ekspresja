"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CalendarDays, CreditCard, Home, Megaphone, MessageCircleMore, Settings, UserRoundCog, Users } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase/client";
import { collection, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";

const PARENT_ANNOUNCEMENTS_SEEN_KEY = "ekspresja_parent_announcements_seen_v1";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Napisz do admina", href: "/dashboard/messages", icon: MessageCircleMore },
  { label: "Aktualności", href: "/dashboard/announcements", icon: Megaphone },
  { label: "Profil", href: "/dashboard/profile", icon: UserRoundCog },
  { label: "Zajęcia", href: "/dashboard/classes", icon: CalendarDays },
  { label: "Płatności", href: "/dashboard/payments", icon: CreditCard },
  { label: "Dzieci", href: "/dashboard/children", icon: Users },
  { label: "Ustawienia", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      doc(db, "admin_chats", user.uid),
      (snap) => setUnreadMessages(Number(snap.data()?.unreadForParent ?? 0)),
      () => setUnreadMessages(0)
    );
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    const seenTs = Number(localStorage.getItem(PARENT_ANNOUNCEMENTS_SEEN_KEY) ?? "0");
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(25));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const unread = snap.docs
          .map((d) => d.data() as { createdAt?: number; isActive?: boolean })
          .filter((a) => a.isActive !== false && Number(a.createdAt ?? 0) > seenTs).length;
        setUnreadAnnouncements(unread);
      },
      () => setUnreadAnnouncements(0)
    );
    return () => unsub();
  }, []);

  return (
    <aside className={cn("w-72 border-r bg-background/95 h-screen sticky top-0 backdrop-blur-sm", className)}>
      <div className="border-b p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ekspresja</p>
        <div className="mt-1 flex items-center gap-2 font-semibold text-lg">
          <span className="hero-gradient-icon inline-flex rounded-lg p-1.5 text-white">♪</span>
          Panel Rodzica
        </div>
      </div>

      <nav className="px-2 py-3 space-y-1">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          const badge =
            item.href === "/dashboard/messages"
              ? unreadMessages
              : item.href === "/dashboard/announcements"
                ? unreadAnnouncements
                : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (item.href === "/dashboard/announcements") {
                  localStorage.setItem(PARENT_ANNOUNCEMENTS_SEEN_KEY, String(Date.now()));
                  setUnreadAnnouncements(0);
                }
                onNavigate?.();
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted"
              )}
            >
              <Icon className={cn("h-4 w-4", !active && "text-muted-foreground")} />
              {item.label}
              {badge > 0 ? (
                <Badge className="ml-auto h-5 min-w-5 rounded-full px-1 text-[11px]">
                  {badge > 99 ? "99+" : badge}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
