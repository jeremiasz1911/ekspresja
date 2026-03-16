"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { AdminRealtimeProvider } from "./AdminRealtimeProvider";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_SIDEBAR_COLLAPSED_KEY = "ekspresja_admin_sidebar_collapsed_v1";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [routeLoading, setRouteLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const raw = localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY);
    setSidebarCollapsed(raw === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    setRouteLoading(true);
    setMobileOpen(false);
    const timer = window.setTimeout(() => setRouteLoading(false), 320);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <AdminRealtimeProvider>
      <div className="relative flex min-h-screen overflow-x-hidden bg-muted/30">
        <div
          className={cn(
            "relative z-30 hidden shrink-0 overflow-hidden border-r bg-background/95 backdrop-blur-sm transition-all duration-300 md:block",
            sidebarCollapsed ? "w-0 opacity-0" : "w-72 opacity-100"
          )}
        >
          <AdminSidebar
            className={cn(
              "h-screen transition-all duration-300",
              sidebarCollapsed ? "-translate-x-8 opacity-0" : "translate-x-0 opacity-100"
            )}
            showCollapseButton
            onToggleCollapse={() => setSidebarCollapsed(true)}
          />
        </div>
        <div
          className={cn(
            "fixed inset-0 z-40 transition-all duration-300 md:hidden",
            mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <button
            type="button"
            className={cn(
              "absolute inset-0 bg-black/45 transition-opacity duration-300",
              mobileOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setMobileOpen(false)}
            aria-label="Zamknij menu"
          />
          <AdminSidebar
            className={cn(
              "relative z-10 h-screen w-72 border-r bg-background/95 transition-transform duration-300",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="relative min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-36 overflow-hidden rounded-b-3xl">
              <img
                src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1800&q=80"
                alt="Admin background"
                className="h-full w-full object-cover opacity-15"
              />
            </div>
            {sidebarCollapsed ? (
              <div className="relative z-20 mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarCollapsed(false)}
                  className="bg-background/90 backdrop-blur-sm"
                >
                  <PanelLeftOpen className="mr-2 h-4 w-4" />
                  Pokaż sidebar
                </Button>
              </div>
            ) : null}
            <div
              className={`relative z-10 min-w-0 transition-all duration-300 ${
                routeLoading ? "opacity-65 blur-[1px]" : "opacity-100"
              }`}
            >
              {children}
            </div>
            {routeLoading ? (
              <div className="pointer-events-none absolute inset-0 z-20">
                <div className="hero-gradient-slow h-1 w-full animate-pulse rounded-full opacity-90" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="rounded-full border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
                    Ładowanie widoku…
                  </div>
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </AdminRealtimeProvider>
  );
}
