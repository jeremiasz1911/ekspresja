"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { ChildWithParent } from "@/types/children";

type Props = {
  open: boolean;
  childrenList: ChildWithParent[];
  selectedIds: string[];
  onClose(): void;
  onSave(ids: string[]): void;
};

export function SelectChildrenModal({
  open,
  childrenList,
  selectedIds,
  onClose,
  onSave,
}: Props) {
  const [query, setQuery] = useState("");
  const [localSelected, setLocalSelected] =
    useState<string[]>(selectedIds);

  useEffect(() => {
    setLocalSelected(selectedIds);
  }, [selectedIds]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) return childrenList;

    return childrenList.filter((c) => {
      const haystack = `${c.firstName} ${c.lastName} ${c.parentName}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, childrenList]);

  function toggle(id: string) {
    setLocalSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Wybierz dzieci</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="mb-2">
          <Input
            placeholder="Szukaj dziecka lub rodzica..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="p-2 w-10"></th>
                <th className="p-2 text-left">Dziecko</th>
                <th className="p-2 text-left">Wiek</th>
                <th className="p-2 text-left">Rodzic</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => {
                const checked = localSelected.includes(c.id);

                return (
                  <tr
                    key={c.id}
                    className={cn(
                      "border-t cursor-pointer hover:bg-muted/40",
                      checked && "bg-primary/5"
                    )}
                    onClick={() => toggle(c.id)}
                  >
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-2">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="p-2">{c.ageYears} lat</td>
                    <td className="p-2 text-muted-foreground">
                      {c.parentName}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-4 text-center text-muted-foreground"
                  >
                    Brak wyników
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <DialogFooter className="mt-3 flex justify-between">
          <div className="text-sm text-muted-foreground">
            Wybrano: {localSelected.length}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button onClick={() => onSave(localSelected)}>
              Zapisz
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
