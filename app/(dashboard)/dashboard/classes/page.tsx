"use client";

import { ClassesTabs } from "@/components/user-classes/ClassesTabs";

export default function ClassesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Zajęcia</h1>
      <ClassesTabs />
    </div>
  );
}
