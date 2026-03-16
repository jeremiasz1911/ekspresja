"use client";

import { useMemo, useState } from "react";
import { useOptionalAdminRealtime } from "@/components/admin/AdminRealtimeProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CircleDollarSign, UserPlus2 } from "lucide-react";

export default function AdminNotificationsPage() {
  const realtime = useOptionalAdminRealtime();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!realtime) {
    return <div className="text-sm text-zinc-500">Brak danych powiadomień.</div>;
  }

  const selected = useMemo(
    () => realtime.events.find((e) => e.id === selectedId) ?? null,
    [realtime.events, selectedId]
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Powiadomienia</h1>
            <p className="mt-2 text-sm text-zinc-600">Lista najnowszych zdarzeń w panelu admina.</p>
          </div>
          <Button variant="outline" onClick={realtime.markNotificationsSeen}>
            Oznacz wszystkie jako przeczytane
          </Button>
        </div>
      </section>
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="divide-y">
          {realtime.events.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                realtime.markNotificationSeen(e.id);
                setSelectedId(e.id);
              }}
              className="block w-full px-4 py-3 text-left hover:bg-zinc-50"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100">
                  {e.type === "registration" ? (
                    <UserPlus2 className="h-4 w-4 text-blue-600" />
                  ) : e.type === "payment" ? (
                    <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ClipboardList className="h-4 w-4 text-amber-600" />
                  )}
                </span>
                <div className="font-medium">{e.title}</div>
                <Badge
                  className={`ml-auto ${
                    realtime.isUnreadEvent(e.id)
                      ? "bg-blue-100 text-blue-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {realtime.isUnreadEvent(e.id) ? "nieodczytane" : "odczytane"}
                </Badge>
              </div>
              <div className="mt-1 text-sm">{e.text}</div>
              <div className="mt-1 text-xs text-zinc-500">{new Date(e.ts).toLocaleString("pl-PL")}</div>
            </button>
          ))}
          {realtime.events.length === 0 ? (
            <div className="px-4 py-6 text-sm text-zinc-500">Brak powiadomień.</div>
          ) : null}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelectedId(null)}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          {selected ? (
            <>
              <img src={selected.imageUrl} alt={selected.title} className="h-52 w-full object-cover" />
              <div className="p-5">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selected.type === "registration" ? (
                      <UserPlus2 className="h-4 w-4 text-blue-600" />
                    ) : selected.type === "payment" ? (
                      <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ClipboardList className="h-4 w-4 text-amber-600" />
                    )}
                    {selected.title}
                  </DialogTitle>
                  <DialogDescription>{new Date(selected.ts).toLocaleString("pl-PL")}</DialogDescription>
                </DialogHeader>
                <p className="mt-3 text-sm text-zinc-700">{selected.text}</p>
                {selected.details && selected.details.length > 0 ? (
                  <div className="mt-4 grid gap-2 rounded-xl border bg-zinc-50 p-3 sm:grid-cols-2">
                    {selected.details.map((detail) => (
                      <div key={`${selected.id}-${detail.label}`} className="text-xs">
                        <div className="text-zinc-500">{detail.label}</div>
                        <div className="font-medium text-zinc-800">{detail.value}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex items-center gap-2">
                  <Badge
                    className={`${
                      realtime.isUnreadEvent(selected.id)
                        ? "bg-blue-100 text-blue-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {realtime.isUnreadEvent(selected.id) ? "nieodczytane" : "odczytane"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => realtime.markNotificationSeen(selected.id)}>
                    Oznacz jako przeczytane
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
