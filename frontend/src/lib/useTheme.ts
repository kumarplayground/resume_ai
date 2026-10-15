"use client";

import { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "align_theme";

/**
 * Checks whether the user's OS / browser currently prefers dark mode.
 */
export function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Synchronously sets or removes the 'dark' class on <html> documentElement.
 */
export function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Comprehensive theme management hook:
 * - Initializes from localStorage (respects forced user selections)
 * - Defaults to 'system' when no preference is stored
 * - Applies system preference on initial load with zero flash
 * - Listens for live OS theme changes when in 'system' mode
 * - Syncs across browser tabs via storage events
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted] = useState<boolean>(false);

  // Restore saved theme on mount without overriding system preference
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeState(saved);
        applyThemeClass(saved);
      } else {
        // Initial load with no prior selection: default to system preference
        setThemeState("system");
        applyThemeClass("system");
      }
    } catch {
      setThemeState("system");
      applyThemeClass("system");
    }
  }, []);

  // Update theme, persist user choice, and update DOM class
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
    applyThemeClass(newTheme);
  }, []);

  // Real-time listener for OS color scheme changes (active when theme is 'system')
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = () => {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
        if (!stored || stored === "system") {
          applyThemeClass("system");
        }
      } catch {
        applyThemeClass("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);

    // Synchronize theme across multiple open tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        const val = (e.newValue as Theme) || "system";
        setThemeState(val);
        applyThemeClass(val);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return { theme, setTheme, mounted };
}
