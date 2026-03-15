"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserWeekCalendar } from "@/components/user-classes/UserWeekCalendar";
import { AvailableClassesTab } from "@/components/user-classes/AvailableClassesTab";

export function ClassesTabs({ refreshTick }: { refreshTick: number }) {
  const [tab, setTab] = useState("schedule");

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
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
        <div className="rounded-lg border p-4 space-y-3">
          <div className="text-sm font-medium">Centrum zapisów</div>
          <div className="text-sm text-muted-foreground">
            Najwygodniej zapiszesz dziecko z kalendarza tygodnia albo z listy dostępnych zajęć.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="default" size="sm" onClick={() => setTab("schedule")}>
              Przejdź do planu zajęć
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setTab("available")}>
              Przejdź do dostępnych zajęć
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
