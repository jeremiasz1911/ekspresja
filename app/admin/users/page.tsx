"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminUsers } from "@/services/admin-users.service";
import type { AdminUser } from "@/types/admin";
import { UserDetailsModal } from "@/components/admin/UserDetailsModal";
import { ProviderIcon } from "@/components/admin/ProviderIcon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortKey = "name" | "lastLogin" | "created" | "presence";

function formatWhen(ts?: number) {
  if (!ts) return "—";
  const d = new Date(ts);
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "przed chwilą";
  if (diffMin < 60) return `${diffMin} min temu`;
  if (diffMin < 24 * 60) return `${Math.floor(diffMin / 60)} h temu`;

  return d.toLocaleString("pl-PL");
}

function getPresence(u: AdminUser): { lastSeenAt?: number } {
  // Dostosowane elastycznie do różnych struktur
  const anyU: any = u as any;

  return {
    lastSeenAt:
      anyU?.presence?.lastSeenAt ??
      anyU?.presenceLastSeenAt ??
      anyU?.lastSeenAtPresence ??
      undefined,
  };
}

function presenceColor(u: AdminUser): "green" | "yellow" | "gray" {
  const { lastSeenAt } = getPresence(u);
  if (!lastSeenAt) return "gray";

  const diffMs = Date.now() - lastSeenAt;
  if (diffMs <= 2 * 60 * 1000) return "green"; // <= 2 min
  if (diffMs <= 60 * 60 * 1000) return "yellow"; // <= 1h
  return "gray";
}

function PresenceDot({ color }: { color: "green" | "yellow" | "gray" }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span
        className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-80",
          color === "green" && "bg-emerald-500",
          color === "yellow" && "bg-amber-500",
          color === "gray" && "bg-zinc-400"
        )}
      />
      {color === "green" && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 animate-ping opacity-25" />
      )}
    </span>
  );
}

function childrenLabel(u: AdminUser) {
  const kids = u.children ?? [];
  if (kids.length === 0) return null;

  const names = kids.map((c) => `${c.firstName} ${c.lastName}`.trim()).filter(Boolean);
  if (names.length === 0) return `👶 Dzieci: ${kids.length}`;

  const short = names.slice(0, 2).join(", ");
  const rest = names.length - 2;

  return rest > 0 ? `👶 ${short} +${rest}` : `👶 ${short}`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [onlyOnline, setOnlyOnline] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAdminUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    let list = users.filter((u) => {
      const base = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
      const kids = (u.children ?? [])
        .map((c) => `${c.firstName} ${c.lastName}`.toLowerCase())
        .join(" ");
      return `${base} ${kids}`.includes(q);
    });

    if (onlyOnline) {
      list = list.filter((u) => presenceColor(u) === "green");
    }

    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;

      if (sortKey === "name") {
        const av = `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`,
          "pl"
        );
        return av * dir;
      }

      if (sortKey === "lastLogin") {
        const av = a.lastLoginAt ?? 0;
        const bv = b.lastLoginAt ?? 0;
        return (av - bv) * dir;
      }

      if (sortKey === "created") {
        const av = a.createdAt ?? 0;
        const bv = b.createdAt ?? 0;
        return (av - bv) * dir;
      }

      if (sortKey === "presence") {
        const av = getPresence(a).lastSeenAt ?? 0;
        const bv = getPresence(b).lastSeenAt ?? 0;
        return (av - bv) * dir;
      }

      return 0;
    });

    return list;
  }, [users, query, sortKey, sortDir, onlyOnline]);

  if (loading) return <div className="p-6">Ładowanie…</div>;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Użytkownicy</h1>
          <div className="text-sm text-muted-foreground">
            Łącznie: {users.length} • Widoczne: {filtered.length}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Szukaj (imię, nazwisko, email, dzieci)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />

        <select
          className="input"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="name">Sortuj: Nazwa</option>
          <option value="lastLogin">Sortuj: Ostatnie logowanie</option>
          <option value="created">Sortuj: Data utworzenia</option>
          <option value="presence">Sortuj: Aktywność (online)</option>
        </select>

        <Button
          variant="outline"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          {sortDir === "asc" ? "↑ Rosnąco" : "↓ Malejąco"}
        </Button>

        <Button
          variant={onlyOnline ? "default" : "outline"}
          onClick={() => setOnlyOnline((v) => !v)}
        >
          {onlyOnline ? "Tylko online: TAK" : "Tylko online"}
        </Button>
      </div>

      {/* Lista */}
      <div className="rounded-xl border bg-background overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            Brak wyników.
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((u) => {
              const dot = presenceColor(u);
              const lastSeen = getPresence(u).lastSeenAt;

              return (
                <button
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className={cn(
                    "w-full text-left px-4 py-3 flex items-center justify-between gap-4",
                    "hover:bg-muted/60 transition-colors",
                    "active:scale-[0.99] transition-transform",
                    "focus:outline-none focus:ring-2 focus:ring-ring"
                  )}
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <PresenceDot color={dot} />
                      <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-muted border">
                        <ProviderIcon provider={u.provider} />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {u.email}
                      </div>

                      {childrenLabel(u) && (
                        <div className="mt-1 text-xs text-muted-foreground truncate">
                          {childrenLabel(u)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <div className="flex items-center justify-end gap-2">
                      <span className="rounded-full border px-2 py-0.5 bg-muted/40">
                        {dot === "green"
                          ? "online"
                          : dot === "yellow"
                          ? "aktywny < 1h"
                          : "offline"}
                      </span>
                    </div>

                    <div className="mt-1">
                      <span className="opacity-80">Ostatnio:</span>{" "}
                      {formatWhen(lastSeen)}
                    </div>

                    <div className="mt-1">
                      <span className="opacity-80">Logowanie:</span>{" "}
                      {formatWhen(u.lastLoginAt)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <UserDetailsModal
        user={selected}
        onClose={() => setSelected(null)}
        onUpdated={(updated) => {
          setUsers((u) => u.map((x) => (x.id === updated.id ? updated : x)));
          setSelected(updated); // opcjonalnie: odśwież też zaznaczonego
        }}
      />
    </div>
  );
}
