"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Class, RecurrenceType, ClassIcon } from "@/types/classes";
import { Group } from "@/types/groups";
import { createClass, updateClass, deleteClass } from "@/services/classes.service";
import { uploadClassImage } from "@/services/upload.service";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAllGroups } from "@/services/groups.service";

type Props = {
  mode: "create" | "edit";
  classToEdit?: Class;
  initial: {
    weekday: Class["weekday"];
    startTime: string;
    startDate: string;
  };
  onClose(): void;
  onCreated(cls: Class): void;
  onDeleted?(): void; // ✅ żeby WeekCalendar mógł usunąć z listy
};

export function CreateClassDialog({
  mode,
  classToEdit,
  initial,
  onClose,
  onCreated,
  onDeleted,
}: Props) {
  const { user } = useAuth();
  const initialData = classToEdit;

  const [groups, setGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl ?? null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    instructorName: initialData?.instructorName ?? "",
    location: initialData?.location ?? "",
    category: initialData?.category ?? "music",
    icon: initialData?.icon ?? "music",
    color: initialData?.color ?? "#6366f1",

    startTime: initialData?.startTime ?? initial.startTime,
    endTime: initialData?.endTime ?? "",

    recurrenceType: (initialData?.recurrence.type ?? "weekly") as RecurrenceType,
    interval: initialData?.recurrence.interval ?? 1,
    startDate: initialData?.recurrence.startDate ?? initial.startDate,
    endDate: initialData?.recurrence.endDate ?? "",

    groupIds: initialData?.groupIds ?? [],
  });

  useEffect(() => {
    getAllGroups().then(setGroups);
  }, []);

  useEffect(() => {
    if (initialData?.imageUrl) setPreviewUrl(initialData.imageUrl);
  }, [initialData?.imageUrl]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Podaj nazwę zajęć.";
    if (!form.instructorName.trim()) e.instructorName = "Podaj prowadzącego.";
    if (!form.location.trim()) e.location = "Podaj miejsce.";
    if (!form.startTime) e.startTime = "Podaj godzinę rozpoczęcia.";
    if (!form.endTime) e.endTime = "Podaj godzinę zakończenia.";
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      e.endTime = "Godzina zakończenia musi być późniejsza.";
    }
    if (!form.startDate) e.startDate = "Podaj datę startu.";

    if (form.endDate && form.endDate < form.startDate) {
      e.endDate = "Data końca nie może być wcześniejsza niż start.";
    }

    return e;
  }

  async function submit() {
    if (!user) return;

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);

    try {
      const recurrenceInterval =
        form.recurrenceType === "none" ? 1 : Math.max(1, Number(form.interval || 1));

      const payload: Omit<Class, "id"> = {
        title: form.title.trim(),
        description: form.description?.trim() || "",
        instructorName: form.instructorName.trim(),
        location: form.location.trim(),
        category: form.category,
        color: form.color,
        icon: form.icon as ClassIcon,

        weekday: initial.weekday,
        startTime: form.startTime,
        endTime: form.endTime,

        recurrence: {
          type: form.recurrenceType,
          interval: recurrenceInterval,
          startDate: form.startDate,
          ...(form.endDate ? { endDate: form.endDate } : {}),
        },

        // ✅ zapisujemy groupIds (wcześniej tego brakowało)
        groupIds: form.groupIds,

        isActive: true,
        createdAt: initialData?.createdAt ?? Date.now(),
        createdBy: initialData?.createdBy ?? user.uid,
      };

      let classId = initialData?.id;

      if (mode === "create") {
        const ref = await createClass(payload);
        classId = ref.id;
      } else {
        await updateClass(classId!, payload);
      }

      // ✅ upload zdjęcia i zapis imageUrl do Firestore
      let imageUrl: string | undefined = initialData?.imageUrl;
      if (imageFile) {
        imageUrl = await uploadClassImage(imageFile, classId!);
        await updateClass(classId!, { imageUrl });
      }

      onCreated({ id: classId!, ...payload, imageUrl });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initialData) return;
    if (!confirm("Usunąć zajęcia?")) return;

    await deleteClass(initialData.id);
    onDeleted?.();
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edytuj zajęcia" : "Dodaj zajęcia"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              placeholder="Nazwa zajęć *"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <Input
              placeholder="Opis (opcjonalnie)"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div>
            <Input
              placeholder="Prowadzący *"
              value={form.instructorName}
              onChange={(e) => update("instructorName", e.target.value)}
              className={errors.instructorName ? "border-red-500" : ""}
            />
            {errors.instructorName && <p className="text-xs text-red-500 mt-1">{errors.instructorName}</p>}
          </div>

          <div>
            <Input
              placeholder="Miejsce *"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className={errors.location ? "border-red-500" : ""}
            />
            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)}
                className={errors.startTime ? "border-red-500" : ""}
              />
              {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
            </div>

            <div>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => update("endTime", e.target.value)}
                className={errors.endTime ? "border-red-500" : ""}
              />
              {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              className="input"
              value={form.recurrenceType}
              onChange={(e) => update("recurrenceType", e.target.value as RecurrenceType)}
            >
              <option value="none">Jednorazowo</option>
              <option value="weekly">Co tydzień</option>
              <option value="biweekly">Co 2 tygodnie</option>
              <option value="monthly">Co miesiąc</option>
            </select>

            <Input
              type="number"
              min={1}
              value={form.interval}
              disabled={form.recurrenceType === "none"}
              onChange={(e) => update("interval", Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Od kiedy *</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                className={errors.startDate ? "border-red-500" : ""}
              />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Do kiedy (opcjonalnie)</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
                className={errors.endDate ? "border-red-500" : ""}
              />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Ikona</label>
            <select
              className="input mt-1"
              value={form.icon}
              onChange={(e) => update("icon", e.target.value as any)}
            >
              <option value="music">🎵 Muzyka</option>
              <option value="guitar">🎸 Gitara</option>
              <option value="piano">🎹 Piano</option>
              <option value="mic">🎤 Wokal</option>
              <option value="headphones">🎧 Produkcja</option>
              <option value="drums">🥁 Perkusja</option>
            </select>
          </div>

          {/* ✅ Grupy (zapis do payload działa) */}
          <div>
            <label className="text-sm font-medium">Grupy</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {groups.map((g) => {
                const active = form.groupIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() =>
                      update(
                        "groupIds",
                        active ? form.groupIds.filter((id) => id !== g.id) : [...form.groupIds, g.id]
                      )
                    }
                    className={cn(
                      "px-3 py-1 rounded-full text-sm border transition",
                      active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
                    )}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ✅ Kolor */}
          <div className="flex items-center gap-3">
            <span className="text-sm">Kolor</span>
            <input type="color" value={form.color} onChange={(e) => update("color", e.target.value)} />
          </div>

          {/* ✅ Zdjęcie */}
          <div>
            <label className="text-sm font-medium">Zdjęcie (opcjonalne)</label>

            <div
              className={cn(
                "mt-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition",
                previewUrl ? "border-muted" : "border-muted-foreground/30 hover:border-primary"
              )}
              onClick={() => document.getElementById("class-image")?.click()}
            >
              <input
                id="class-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (file.size > 2_000_000) {
                    alert("Maksymalny rozmiar zdjęcia to 2MB.");
                    return;
                  }

                  setImageFile(file);
                  setPreviewUrl(URL.createObjectURL(file));
                }}
              />

              {previewUrl ? (
                <div className="space-y-2">
                  <img src={previewUrl} className="mx-auto h-32 rounded-md object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-xs underline text-muted-foreground"
                  >
                    Usuń zdjęcie
                  </button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Kliknij aby dodać zdjęcie
                  <br />
                  <span className="text-xs">(PNG / JPG, max 2MB)</span>
                </div>
              )}
            </div>
          </div>

          {/* ❌ USUNIĘTE: “Zapisane dzieci” (to nie powinno być w klasie) */}
        </div>

        <DialogFooter className="flex justify-between">
          {mode === "edit" && (
            <Button variant="destructive" onClick={handleDelete}>
              Usuń
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button disabled={saving} onClick={submit}>
              {saving ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
