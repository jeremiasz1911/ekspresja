"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  UI_SETTINGS_KEY,
  applyUISettings,
  readUISettings,
  type FontSizeMode,
  type ThemeMode,
} from "@/components/settings/UISettingsProvider";

export default function SettingsPage() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [fontSize, setFontSize] = useState<FontSizeMode>("md");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = readUISettings();
    setTheme(current.theme);
    setFontSize(current.fontSize);
  }, []);

  function saveSettings(nextTheme: ThemeMode, nextFontSize: FontSizeMode) {
    const next = { theme: nextTheme, fontSize: nextFontSize };
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(next));
    applyUISettings(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Personalizacja</h1>
        <p className="mt-2 text-sm text-zinc-600">Wybierz motyw i rozmiar czcionki dla panelu.</p>
      </section>

      <section className="grid gap-4 rounded-3xl border bg-white p-5 shadow-sm md:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-medium text-zinc-700">Tryb kolorów</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => {
                setTheme("light");
                saveSettings("light", fontSize);
              }}
            >
              <Sun className="mr-2 h-4 w-4" />
              Jasny
            </Button>
            <Button
              type="button"
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => {
                setTheme("dark");
                saveSettings("dark", fontSize);
              }}
            >
              <Moon className="mr-2 h-4 w-4" />
              Ciemny
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-zinc-700">Rozmiar czcionki</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={fontSize === "sm" ? "default" : "outline"}
              onClick={() => {
                setFontSize("sm");
                saveSettings(theme, "sm");
              }}
            >
              <Type className="mr-2 h-4 w-4" />
              Mała
            </Button>
            <Button
              type="button"
              variant={fontSize === "md" ? "default" : "outline"}
              onClick={() => {
                setFontSize("md");
                saveSettings(theme, "md");
              }}
            >
              <Type className="mr-2 h-4 w-4" />
              Standard
            </Button>
            <Button
              type="button"
              variant={fontSize === "lg" ? "default" : "outline"}
              onClick={() => {
                setFontSize("lg");
                saveSettings(theme, "lg");
              }}
            >
              <Type className="mr-2 h-4 w-4" />
              Duża
            </Button>
          </div>
        </div>

        <div className="md:col-span-2">
          <p className="rounded-xl border bg-zinc-50 p-3 text-sm text-zinc-600">
            {saved ? "Ustawienia zapisane." : "Zmiany zapisują się od razu i zostają zapamiętane."}
          </p>
        </div>
      </section>
    </div>
  );
}
