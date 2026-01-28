"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminUser } from "@/types/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProviderIcon } from "@/components/admin/ProviderIcon";
import { getUserProfile, updateUserProfile } from "@/services/profile.service";
import type { ParentFormData } from "@/types/profile";
import { ParentProfileForm } from "@/components/profile/ParentProfileForm";
import { deleteUser } from "@/services/admin-users.service";
import { cn } from "@/lib/utils";

type Props = {
  user: AdminUser | null;
  onClose(): void;
  onUpdated(user: AdminUser): void;
};

function formatTS(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("pl-PL");
}

function getPresence(u?: AdminUser | null): { lastSeenAt?: number } {
  if (!u) return {};
  const anyU: any = u as any;
  return {
    lastSeenAt:
      anyU?.presence?.lastSeenAt ??
      anyU?.presenceLastSeenAt ??
      anyU?.lastSeenAtPresence ??
      undefined,
  };
}

function presenceBadge(u?: AdminUser | null) {
  const lastSeenAt = getPresence(u).lastSeenAt;
  if (!lastSeenAt) return { label: "offline", cls: "bg-zinc-100 text-zinc-700 border-zinc-200" };

  const diff = Date.now() - lastSeenAt;
  if (diff <= 2 * 60 * 1000) {
    return { label: "online", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (diff <= 60 * 60 * 1000) {
    return { label: "aktywny < 1h", cls: "bg-amber-50 text-amber-800 border-amber-200" };
  }
  return { label: "offline", cls: "bg-zinc-100 text-zinc-700 border-zinc-200" };
}

export function UserDetailsModal({ user, onClose, onUpdated }: Props) {
  const [profile, setProfile] = useState<ParentFormData | null>(null);
  const [view, setView] = useState<"details" | "edit">("details");
  const [loading, setLoading] = useState(false);

  // reset i load profilu
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setView("details");
      return;
    }

    setView("details");
    setLoading(true);
    getUserProfile(user.id)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const fullName = useMemo(() => {
    if (!user) return "";
    const n = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    return n || user.email;
  }, [user]);

  async function handleDelete() {
    if (!user) return;
    if (!confirm("Na pewno usunąć użytkownika?")) return;
    await deleteUser(user.id);
    onClose();
  }

  async function handleSave(data: ParentFormData) {
    if (!user) return;

    await updateUserProfile(user.id, data);

    const updated: AdminUser = {
      ...user,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      // children na liście masz z admin-users.service; tu tylko odświeżamy podstawy
    };

    onUpdated(updated);
    setProfile(data);
    setView("details");
  }

  const badge = presenceBadge(user);
  const lastSeenAt = getPresence(user).lastSeenAt;

  return (
    <Dialog
      open={!!user}
      onOpenChange={(open) => {
        if (!open) {
          setView("details");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-3 min-w-0">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-muted border shrink-0">
                <ProviderIcon provider={user?.provider ?? "password"} />
              </span>

              <span className="min-w-0">
                <div className="font-semibold truncate">{fullName}</div>
                <div className="text-xs text-muted-foreground font-normal truncate">
                  {user?.email}
                </div>
              </span>

              <span
                className={cn(
                  "ml-2 text-xs border rounded-full px-2 py-0.5",
                  badge.cls
                )}
              >
                {badge.label}
              </span>
            </span>

            {view === "details" ? (
              <Button onClick={() => setView("edit")}>Edytuj</Button>
            ) : (
              <Button variant="outline" onClick={() => setView("details")}>
                Anuluj i wróć
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading || !profile ? (
          <div className="py-10 text-sm text-muted-foreground">
            Ładowanie profilu…
          </div>
        ) : (
          <>
            {view === "details" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-muted-foreground">Telefon</div>
                    <div className="font-medium">{profile.phone || "—"}</div>
                  </div>

                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-muted-foreground">Ostatnie logowanie</div>
                    <div className="font-medium">{formatTS(user?.lastLoginAt)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Provider: <span className="font-medium">{user?.provider ?? "password"}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-muted-foreground">Aktywność (presence)</div>
                    <div className="font-medium">{formatTS(lastSeenAt)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Status: <span className="font-medium">{badge.label}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border p-3 text-sm">
                  <div className="text-xs text-muted-foreground mb-1">Adres</div>
                  <div className="font-medium">
                    {[
                      profile.street,
                      profile.houseNumber,
                      profile.apartmentNumber ? `/${profile.apartmentNumber}` : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </div>
                  <div className="text-muted-foreground">
                    {[profile.postalCode, profile.city].filter(Boolean).join(" ")}
                  </div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Dzieci</h3>
                    <div className="text-xs text-muted-foreground">
                      {profile.children.length} zapisanych
                    </div>
                  </div>

                  {profile.children.length === 0 ? (
                    <div className="text-sm text-muted-foreground mt-2">Brak dzieci.</div>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {profile.children.map((c, idx) => (
                        <div key={idx} className="rounded-lg border p-3">
                          <div className="font-medium">
                            {c.firstName} {c.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Wiek: {c.ageYears || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="destructive" onClick={handleDelete}>
                    Usuń użytkownika
                  </Button>
                  <Button onClick={() => setView("edit")}>Edytuj dane</Button>
                </div>
              </div>
            )}

            {view === "edit" && (
              <div className="space-y-3">
                <ParentProfileForm
                  mode="edit"
                  initialValues={profile}
                  submitLabel="Zapisz dane"
                  onSubmit={handleSave}
                />

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setView("details")}>
                    Anuluj i wróć
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
