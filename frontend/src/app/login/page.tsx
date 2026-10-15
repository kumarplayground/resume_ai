"use client";

import React, { useEffect } from "react";
import { ShieldCheck, Sun, Moon, Monitor } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { useTheme } from "@/lib/useTheme";

export default function LoginPage() {
  const { theme, setTheme: handleThemeChange } = useTheme();

  // If already authenticated, redirect immediately to main studio
  useEffect(() => {
    try {
      const stored = localStorage.getItem("align_auth_user");
      const hasCookie = document.cookie.includes("align_auth=true");
      if (stored || hasCookie) {
        window.location.replace("/");
      }
    } catch {}
  }, []);

  return (
    <div className="relative min-h-svh w-full flex flex-col justify-between bg-[#fcfcfc] dark:bg-[#090c0a] text-gray-900 dark:text-gray-100 transition-colors">
      {/* Top Navigation Bar with Brand and Theme Switcher */}
      <header className="w-full border-b border-gray-200/80 dark:border-[#1c2621] bg-white/80 dark:bg-[#090c0a]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 select-none">
            <div className="w-6 h-6 rounded-md bg-emerald-600 dark:bg-[#10b981] flex items-center justify-center text-white shadow-xs">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              align.
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase px-2 py-0.5 rounded-full border border-gray-200 dark:border-[#1c2621] bg-gray-50 dark:bg-[#111614]">
              RESUME STUDIO
            </span>
          </div>

          {/* Right Controls: Theme Switcher */}
          <div className="flex items-center gap-3">
            {/* Segmented Theme Switcher */}
            <div className="flex items-center p-0.5 rounded-lg border border-gray-200 dark:border-[#1c2621] bg-gray-100/80 dark:bg-[#111614]">
              <button
                onClick={() => handleThemeChange("light")}
                title="Light theme"
                aria-label="Light mode"
                className={`p-1 rounded-md transition cursor-pointer ${
                  theme === "light"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                title="Dark theme"
                aria-label="Dark mode"
                className={`p-1 rounded-md transition cursor-pointer ${
                  theme === "dark"
                    ? "bg-[#1c2621] text-[#34d399] shadow-xs"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleThemeChange("system")}
                title="System preference"
                aria-label="System mode"
                className={`p-1 rounded-md transition cursor-pointer ${
                  theme === "system"
                    ? "bg-white dark:bg-[#1c2621] text-gray-900 dark:text-[#34d399] shadow-xs"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="flex flex-1 w-full items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        {/* Subtle Ambient Background Glows */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 dark:bg-[#34d399]/5 rounded-full blur-3xl" />
        
        <div className="w-full max-w-sm relative z-10">
          <LoginForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 dark:border-[#1c2621] py-4 text-center text-xs text-gray-400 dark:text-gray-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 align. Resume Studio. All rights reserved.</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34d399]" />
            <span>Encrypted authentication session</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
