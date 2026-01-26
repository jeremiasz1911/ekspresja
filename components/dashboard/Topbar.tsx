"use client";

import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";

function breadcrumbFromPath(path: string) {
  const parts = path.split("/").filter(Boolean);

  return parts.map((part, idx) => ({
    label: part,
    href: "/" + parts.slice(0, idx + 1).join("/"),
  }));
}

export function Topbar() {
  const pathname = usePathname();
  const crumbs = breadcrumbFromPath(pathname);

  return (
    <header className="h-14 border-b flex items-center justify-between px-4">
      <div className="flex gap-2 text-sm text-muted-foreground">
        {crumbs.map((c, i) => (
          <span key={c.href}>
            {i > 0 && " / "}
            {c.label}
          </span>
        ))}
      </div>

      <UserMenu />
    </header>
  );
}
