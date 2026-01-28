"use client";

import { useEffect, useState } from "react";
import type { Group } from "@/types/groups";
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from "@/services/groups.service";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [editing, setEditing] = useState<Group | null>(null);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "#6366f1",
  });

  useEffect(() => {
    getGroups().then(setGroups);
  }, []);

  function openCreate() {
    setForm({ name: "", description: "", color: "#6366f1" });
    setEditing(null);
    setOpen(true);
  }

  function openEdit(group: Group) {
    setForm({
      name: group.name,
      description: group.description ?? "",
      color: group.color ?? "#6366f1",
    });
    setEditing(group);
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return alert("Podaj nazwę grupy.");

    if (editing) {
      await updateGroup(editing.id, form);
      setGroups((g) =>
        g.map((x) =>
          x.id === editing.id ? { ...x, ...form } : x
        )
      );
    } else {
      const ref = await createGroup({
        ...form,
        childIds: [],
      });

      setGroups((g) => [
        ...g,
        {
          id: ref.id,
          ...form,
          childIds: [],
          createdAt: Date.now(),
        },
      ]);
    }

    setOpen(false);
  }

  async function remove(group: Group) {
    if (!confirm(`Usunąć grupę "${group.name}"?`)) return;
    await deleteGroup(group.id);
    setGroups((g) => g.filter((x) => x.id !== group.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Grupy</h1>
        <Button onClick={openCreate}>➕ Nowa grupa</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div
            key={g.id}
            className="border rounded-xl p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: g.color }}
                />
                <p className="font-medium">{g.name}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(g)}
                >
                  Edytuj
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => remove(g)}
                >
                  Usuń
                </Button>
              </div>
            </div>

            {g.description && (
              <p className="text-sm text-muted-foreground">
                {g.description}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Dzieci: {g.childIds.length}
            </p>
          </div>
        ))}

        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Brak grup.
          </p>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="space-y-4">
          <h2 className="font-medium">
            {editing ? "Edytuj grupę" : "Nowa grupa"}
          </h2>

          <Input
            placeholder="Nazwa grupy"
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
          />

          <Input
            placeholder="Opis (opcjonalnie)"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                description: e.target.value,
              }))
            }
          />

          <div className="flex items-center gap-3">
            <label className="text-sm">Kolor</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) =>
                setForm((f) => ({ ...f, color: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={save}>Zapisz</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
