"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { AdminChatWidget } from "./AdminChatWidget";

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    setRouteLoading(true);
    const timer = window.setTimeout(() => setRouteLoading(false), 320);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar className="hidden md:block" />

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileOpen(false)}
            aria-label="Zamknij menu"
          />
          <Sidebar
            className="relative z-10 w-72"
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      ) : null}

      <div className="flex flex-col flex-1">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="relative flex-1 p-4 md:p-6">
          <div
            className={`transition-all duration-300 ${
              routeLoading ? "opacity-65 blur-[1px]" : "opacity-100"
            }`}
          >
            {children}
          </div>
          {routeLoading ? (
            <div className="pointer-events-none absolute inset-0 z-10">
              <div className="hero-gradient-slow h-1 w-full animate-pulse rounded-full opacity-90" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="rounded-full border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
                  Ładowanie widoku…
                </div>
              </div>
            </div>
          ) : null}
        </main>
        <footer className="border-t bg-background/80 px-4 py-3 text-xs text-muted-foreground md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Ekspresja.net • Panel rodzica</span>
            <span>Muzyka • Rozwój • Radość</span>
          </div>
        </footer>
      </div>
      <AdminChatWidget />
    </div>
  );
}
