"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadMaterialAsset } from "@/services/upload.service";
import {
  createMaterial,
  deleteMaterialAsAdmin,
  getAllMaterials,
  toggleMaterialActive,
  updateMaterial,
} from "@/services/materials.service";
import { auth } from "@/lib/firebase/client";
import type { Material, MaterialAccessLevel, MaterialKind } from "@/types/materials";
import { BookOpenText, ExternalLink, FileUp, PencilLine, RefreshCw, Save, Trash2 } from "lucide-react";

type MaterialForm = {
  title: string;
  description: string;
  kind: MaterialKind;
  category: string;
  accessLevel: MaterialAccessLevel;
  externalUrl: string;
  isActive: boolean;
};

const INITIAL_FORM: MaterialForm = {
  title: "",
  description: "",
  kind: "video",
  category: "",
  accessLevel: "free",
  externalUrl: "",
  isActive: true,
};

function kindLabel(kind: MaterialKind) {
  if (kind === "video") return "Wideo";
  if (kind === "audio") return "Audio";
  if (kind === "sheet") return "Materiały";
  return "Link";
}

function accessLabel(level: MaterialAccessLevel) {
  if (level === "free") return "Darmowe";
  if (level === "partial") return "STANDARD+";
  return "GOLD";
}

function getAccessBadgeClass(level: MaterialAccessLevel): string {
  if (level === "free") {
    return "border border-emerald-200 bg-emerald-100 text-emerald-800";
  }
  if (level === "partial") {
    return "border border-sky-200 bg-sky-100 text-sky-800";
  }
  return "border border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-900";
}

function getAccessCardClass(level: MaterialAccessLevel): string {
  if (level === "free") return "border-emerald-200 bg-emerald-50/40";
  if (level === "partial") return "border-sky-200 bg-sky-50/40";
  return "border-amber-300 bg-amber-50/60";
}

const CATEGORY_STYLES = [
  "border-rose-200 bg-rose-50 text-rose-700",
  "border-orange-200 bg-orange-50 text-orange-700",
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-lime-200 bg-lime-50 text-lime-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-cyan-200 bg-cyan-50 text-cyan-700",
  "border-sky-200 bg-sky-50 text-sky-700",
  "border-indigo-200 bg-indigo-50 text-indigo-700",
  "border-violet-200 bg-violet-50 text-violet-700",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
];

function getCategoryTagClass(category?: string): string {
  if (!category?.trim()) {
    return "border-zinc-200 bg-zinc-50 text-zinc-600";
  }

  const hash = category
    .trim()
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  return CATEGORY_STYLES[hash % CATEGORY_STYLES.length];
}

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [form, setForm] = useState<MaterialForm>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editUploadFile, setEditUploadFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState<MaterialForm>(INITIAL_FORM);

  const stats = useMemo(() => {
    const active = materials.filter((item) => item.isActive).length;
    const free = materials.filter((item) => item.accessLevel === "free").length;
    const premium = materials.filter((item) => item.accessLevel === "premium").length;
    return { all: materials.length, active, free, premium };
  }, [materials]);

  async function loadMaterials() {
    const rows = await getAllMaterials();
    setMaterials(rows);
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadMaterials()
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function resetForm() {
    setForm(INITIAL_FORM);
    setUploadFile(null);
  }

  function resetEditForm() {
    setEditingId(null);
    setEditForm(INITIAL_FORM);
    setEditUploadFile(null);
    setEditOpen(false);
  }

  function startEdit(item: Material) {
    setEditingId(item.id);
    setEditUploadFile(null);
    setEditForm({
      title: item.title,
      description: item.description ?? "",
      kind: item.kind,
      category: item.category ?? "",
      accessLevel: item.accessLevel,
      externalUrl: item.externalUrl ?? "",
      isActive: item.isActive,
    });
    setEditOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Tytuł jest wymagany.");
      return;
    }

    setSaving(true);
    try {
      const createdAt = Date.now();
      const created = await createMaterial({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        kind: form.kind,
        category: form.category.trim() || undefined,
        accessLevel: form.accessLevel,
        externalUrl: form.externalUrl.trim() || undefined,
        isActive: form.isActive,
        createdAt,
        updatedAt: createdAt,
      });

      if (uploadFile) {
        const uploaded = await uploadMaterialAsset(uploadFile, created.id);
        await updateMaterial(created.id, {
          storagePath: uploaded.storagePath,
          updatedAt: Date.now(),
        });
      }

      await loadMaterials();
      resetForm();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Nie udało się zapisać materiału.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave() {
    if (!editingId) return;
    if (!editForm.title.trim()) {
      alert("Tytuł jest wymagany.");
      return;
    }

    setEditSaving(true);
    try {
      const patch: Partial<Material> = {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        kind: editForm.kind,
        category: editForm.category.trim() || undefined,
        accessLevel: editForm.accessLevel,
        externalUrl: editForm.externalUrl.trim() || undefined,
        isActive: editForm.isActive,
        updatedAt: Date.now(),
      };

      if (editUploadFile) {
        const uploaded = await uploadMaterialAsset(editUploadFile, editingId);
        patch.storagePath = uploaded.storagePath;
      }

      await updateMaterial(editingId, patch);
      await loadMaterials();
      resetEditForm();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Nie udało się zapisać materiału.");
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">E-materiały</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Zarządzaj biblioteką materiałów: darmowe, STANDARD+ i GOLD oraz pliki w Firebase Storage.
            </p>
          </div>
          <Button variant="outline" onClick={() => loadMaterials()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Odśwież
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-zinc-500">Wszystkie</p>
          <p className="mt-1 text-2xl font-semibold">{stats.all}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-zinc-500">Aktywne</p>
          <p className="mt-1 text-2xl font-semibold">{stats.active}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-zinc-500">Darmowe</p>
          <p className="mt-1 text-2xl font-semibold">{stats.free}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-zinc-500">GOLD</p>
          <p className="mt-1 text-2xl font-semibold">{stats.premium}</p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-zinc-900">
          Dodaj materiał
        </h2>

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Tytuł materiału"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Input
              placeholder="Kategoria (np. Rytmika, Wokal)"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            />
          </div>

          <textarea
            className="min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="Opis"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />

          <div className="grid gap-3 md:grid-cols-3">
            <Select
              value={form.kind}
              onValueChange={(value: MaterialKind) => setForm((prev) => ({ ...prev, kind: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rodzaj" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Wideo</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="sheet">Materiały</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={form.accessLevel}
              onValueChange={(value: MaterialAccessLevel) =>
                setForm((prev) => ({ ...prev, accessLevel: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Poziom dostępu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Darmowe</SelectItem>
                <SelectItem value="partial">STANDARD+</SelectItem>
                <SelectItem value="premium">GOLD</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={form.isActive ? "active" : "inactive"}
              onValueChange={(value: "active" | "inactive") =>
                setForm((prev) => ({ ...prev, isActive: value === "active" }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktywny</SelectItem>
                <SelectItem value="inactive">Nieaktywny</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="Zewnętrzny URL (opcjonalnie)"
            value={form.externalUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, externalUrl: e.target.value }))}
          />

          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-center">
            <Input
              type="file"
              accept="audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
            <Button type="submit" disabled={saving}>
              {editingId ? <Save className="mr-2 h-4 w-4" /> : <FileUp className="mr-2 h-4 w-4" />}
              {saving ? "Zapisywanie..." : editingId ? "Zapisz zmiany" : "Dodaj materiał"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm} disabled={saving}>
              Wyczyść
            </Button>
          </div>
        </form>
      </section>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) resetEditForm();
          else setEditOpen(true);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edytuj materiał</DialogTitle>
            <DialogDescription>
              Zmieniasz dane materiału i zapisujesz bez opuszczania listy.
            </DialogDescription>
          </DialogHeader>

          <div className={`rounded-xl border p-3 ${getAccessCardClass(editForm.accessLevel)}`}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getAccessBadgeClass(editForm.accessLevel)}>
                {accessLabel(editForm.accessLevel)}
              </Badge>
              {editForm.category.trim() ? (
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getCategoryTagClass(editForm.category)}`}
                >
                  {editForm.category}
                </span>
              ) : (
                <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                  Brak kategorii
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Tytuł materiału"
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <Input
                placeholder="Kategoria (np. Rytmika, Wokal)"
                value={editForm.category}
                onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
              />
            </div>

            <textarea
              className="min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Opis"
              value={editForm.description}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
            />

            <div className="grid gap-3 md:grid-cols-3">
              <Select
                value={editForm.kind}
                onValueChange={(value: MaterialKind) =>
                  setEditForm((prev) => ({ ...prev, kind: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Rodzaj" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Wideo</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="sheet">Materiały</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={editForm.accessLevel}
                onValueChange={(value: MaterialAccessLevel) =>
                  setEditForm((prev) => ({ ...prev, accessLevel: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Poziom dostępu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Darmowe</SelectItem>
                  <SelectItem value="partial">STANDARD+</SelectItem>
                  <SelectItem value="premium">GOLD</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={editForm.isActive ? "active" : "inactive"}
                onValueChange={(value: "active" | "inactive") =>
                  setEditForm((prev) => ({ ...prev, isActive: value === "active" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktywny</SelectItem>
                  <SelectItem value="inactive">Nieaktywny</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Zewnętrzny URL (opcjonalnie)"
              value={editForm.externalUrl}
              onChange={(e) => setEditForm((prev) => ({ ...prev, externalUrl: e.target.value }))}
            />

            <Input
              type="file"
              accept="audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
              onChange={(e) => setEditUploadFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetEditForm} disabled={editSaving}>
              Anuluj
            </Button>
            <Button onClick={() => void handleEditSave()} disabled={editSaving}>
              <Save className="mr-2 h-4 w-4" />
              {editSaving ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Lista materiałów</h2>

        {loading ? (
          <p className="text-sm text-zinc-500">Ładowanie materiałów...</p>
        ) : materials.length === 0 ? (
          <p className="text-sm text-zinc-500">Brak materiałów w bazie.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {materials.map((item) => (
              <article
                key={item.id}
                className={`rounded-2xl border p-4 ${getAccessCardClass(item.accessLevel)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="inline-flex items-center gap-2 font-medium text-zinc-900">
                    <BookOpenText className="h-4 w-4 text-zinc-600" />
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{kindLabel(item.kind)}</Badge>
                    <Badge className={getAccessBadgeClass(item.accessLevel)}>
                      {accessLabel(item.accessLevel)}
                    </Badge>
                    <Badge className={item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-700"}>
                      {item.isActive ? "Aktywny" : "Nieaktywny"}
                    </Badge>
                  </div>
                </div>

                {item.description ? (
                  <p className="mt-2 text-sm text-zinc-600">{item.description}</p>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  {item.category ? (
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getCategoryTagClass(item.category)}`}
                    >
                      {item.category}
                    </span>
                  ) : null}
                  <span>
                    {item.storagePath ? `Storage: ${item.storagePath}` : "Brak pliku w Storage"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                    <PencilLine className="mr-1 h-3.5 w-3.5" />
                    Edytuj
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await toggleMaterialActive(item.id, !item.isActive);
                      await loadMaterials();
                    }}
                  >
                    {item.isActive ? "Dezaktywuj" : "Aktywuj"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      if (!confirm(`Usunąć materiał: ${item.title}?`)) return;
                      const idToken = await auth.currentUser?.getIdToken();
                      if (!idToken) {
                        alert("Brak aktywnej sesji administratora.");
                        return;
                      }
                      await deleteMaterialAsAdmin(item.id, idToken);
                      await loadMaterials();
                    }}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Usuń
                  </Button>
                  {item.externalUrl ? (
                    <a href={item.externalUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost">
                        Otwórz link
                        <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
