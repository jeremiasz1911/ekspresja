import { WeekCalendar } from "@/components/admin/WeekCalendar";

export default function AdminClassesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Zajęcia</h1>
      <WeekCalendar />
    </div>
  );
}
