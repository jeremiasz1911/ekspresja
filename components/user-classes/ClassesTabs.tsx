"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserWeekCalendar } from "@/components/user-classes/UserWeekCalendar";
import { AvailableClassesTab } from "@/components/user-classes/AvailableClassesTab";

export function ClassesTabs({ refreshTick }: { refreshTick: number }) {
  return (
    <Tabs defaultValue="schedule" className="w-full">
      <TabsList>
        <TabsTrigger value="schedule">Plan zajęć</TabsTrigger>
        <TabsTrigger value="available">Dostępne zajęcia</TabsTrigger>
        <TabsTrigger value="enrollments">Moje zapisy</TabsTrigger>
      </TabsList>

      <TabsContent value="schedule">
        <UserWeekCalendar refreshTick={refreshTick} />
      </TabsContent>

      <TabsContent value="available">
        <AvailableClassesTab />
      </TabsContent>

      <TabsContent value="enrollments">
        <div className="text-sm text-muted-foreground">
          Tu zrobimy listę zapisów (TAB 3).
        </div>
      </TabsContent>
    </Tabs>
  );
}
