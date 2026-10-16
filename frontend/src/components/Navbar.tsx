"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Sun, Moon, Monitor, LogOut, User } from "lucide-react";

interface NavbarProps {
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark" | "system") => void;
  authUser?: { email: string; name?: string } | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, setTheme, authUser, onLogout }) => {
  return (
    <header className="w-full border-b border-gray-200/80 dark:border-[#1c2621] bg-white/90 dark:bg-[#090c0a]/90 backdrop-blur sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Brand Logo + Studio Badge (hidden on compact mobile) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link href="/" className="flex items-center gap-1.5 cursor-pointer select-none">
            {/* Mint green leaf badge */}
            <div className="w-6 h-6 rounded-md bg-emerald-600 dark:bg-[#10b981] flex items-center justify-center text-white shadow-xs shrink-0">
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
          </Link>

          <span className="hidden sm:inline-flex text-[10px] font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase px-2 py-0.5 rounded-full border border-gray-200 dark:border-[#1c2621] bg-gray-50 dark:bg-[#111614]">
            RESUME STUDIO
          </span>
        </div>

        {/* Right: Privacy Badge, User/Auth, & Theme Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#34d399]" />
            <span>Your resume stays private</span>
          </div>

          {/* User state / Sign in / Log out */}
          {authUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 min-h-[32px] sm:min-h-[36px] rounded-lg border border-gray-200 dark:border-[#1c2621] bg-gray-50/80 dark:bg-[#111614] text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-2xs">
                <div className="w-4 h-4 rounded-full bg-emerald-600 dark:bg-[#10b981] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {(authUser.name || authUser.email || "U")[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[130px] truncate">
                  {authUser.name || authUser.email}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Log out"
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 px-2 sm:px-2.5 py-1 min-h-[32px] sm:min-h-[36px] rounded-lg border border-gray-200 dark:border-[#1c2621] bg-gray-50 dark:bg-[#111614] hover:bg-rose-50/60 dark:hover:bg-rose-950/20 transition cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold text-gray-700 dark:text-gray-200 hover:text-emerald-700 dark:hover:text-[#34d399] px-2.5 py-1 rounded-lg border border-gray-200 dark:border-[#1c2621] bg-gray-50 dark:bg-[#111614] hover:bg-gray-100 dark:hover:bg-[#19241d] transition shadow-2xs"
            >
              Sign in
            </Link>
          )}

          {/* Theme Switcher Segmented Control with touch-friendly pads */}
          <div className="flex items-center p-0.5 rounded-lg border border-gray-200 dark:border-[#1c2621] bg-gray-100/80 dark:bg-[#111614]">
            <button
              onClick={() => setTheme("light")}
              title="Light theme"
              aria-label="Light mode"
              className={`p-1.5 sm:p-1 rounded-md min-h-[30px] min-w-[30px] flex items-center justify-center transition cursor-pointer ${
                theme === "light"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              title="Dark theme"
              aria-label="Dark mode"
              className={`p-1.5 sm:p-1 rounded-md min-h-[30px] min-w-[30px] flex items-center justify-center transition cursor-pointer ${
                theme === "dark"
                  ? "bg-[#1c2621] text-[#34d399] shadow-xs"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme("system")}
              title="System preference"
              aria-label="System mode"
              className={`p-1.5 sm:p-1 rounded-md min-h-[30px] min-w-[30px] flex items-center justify-center transition cursor-pointer ${
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
  );
};
