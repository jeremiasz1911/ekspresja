import { WeekCalendar } from "@/components/admin/WeekCalendar";

export default function AdminClassesPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Zajęcia</h1>
        <p className="mt-2 text-sm text-zinc-600">Podgląd i zarządzanie harmonogramem zajęć.</p>
      </section>
      <WeekCalendar />
    </div>
  );
}
