"use client";

import { useEffect } from "react";

export type ThemeMode = "light" | "dark";
export type FontSizeMode = "sm" | "md" | "lg";

export const UI_SETTINGS_KEY = "ekspresja_ui_settings_v1";

type UISettings = {
  theme: ThemeMode;
  fontSize: FontSizeMode;
};

const defaultSettings: UISettings = {
  theme: "light",
  fontSize: "md",
};

export function readUISettings(): UISettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(UI_SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<UISettings>;
    return {
      theme: parsed.theme === "dark" ? "dark" : "light",
      fontSize: parsed.fontSize === "sm" || parsed.fontSize === "lg" ? parsed.fontSize : "md",
    };
  } catch {
    return defaultSettings;
  }
}

export function applyUISettings(settings: UISettings) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  if (settings.theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  const size = settings.fontSize === "sm" ? "14px" : settings.fontSize === "lg" ? "18px" : "16px";
  root.style.fontSize = size;
}

export function UISettingsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyUISettings(readUISettings());
  }, []);

  return <>{children}</>;
}
