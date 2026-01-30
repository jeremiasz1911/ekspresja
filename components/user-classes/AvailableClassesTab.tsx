"use client";

import { useEffect, useState } from "react";
import { getActiveClasses } from "@/services/classes.service";
import type { Class, Child } from "@/types";
import { Button } from "@/components/ui/button";
import { EnrollModal } from "./EnrollModal";

export function AvailableClassesTab() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  useEffect(() => {
    getActiveClasses()
      .then(setClasses)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Ładowanie zajęć...</div>;
  }

  return (
    <div className="space-y-4">
      {classes.map((c) => (
        <div
          key={c.id}
          className="border rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <div className="font-medium">{c.title}</div>
            <div className="text-sm text-muted-foreground">
              {c.weekday} • {c.startTime}–{c.endTime}
            </div>
          </div>

          <Button onClick={() => setSelectedClass(c)}>
            Zapisz dziecko
          </Button>
        </div>
      ))}

      <EnrollModal
        open={!!selectedClass}
        selectedClass={selectedClass}
        onClose={() => setSelectedClass(null)}
      />
    </div>
  );
}
