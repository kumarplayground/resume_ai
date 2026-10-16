"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface KeywordsAlertProps {
  keywords: string[];
}

export const KeywordsAlert: React.FC<KeywordsAlertProps> = ({ keywords }) => {
  if (!keywords || keywords.length === 0) return null;

  return (
    <div className="bg-[#fffbeb] dark:bg-[#17140e] border border-[#fde68a] dark:border-[#2e2518] rounded-2xl p-4 sm:p-5 transition-colors">
      <div className="flex items-center gap-2 text-amber-900 dark:text-[#fbbf24]">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-[#fbbf24] shrink-0" />
        <h3 className="font-semibold text-xs sm:text-sm">
          A few keywords to keep in mind
        </h3>
      </div>

      <p className="text-xs text-amber-800/90 dark:text-amber-200/80 mt-1">
        Not found in your resume, only add them if they reflect your experience:
      </p>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mt-3.5">
        {keywords.map((kw, idx) => (
          <span
            key={idx}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/90 dark:bg-[#201b13] text-amber-950 dark:text-[#fde68a] border border-amber-200/80 dark:border-[#382d1c] shadow-2xs select-all hover:bg-white dark:hover:bg-[#282218] transition"
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
};
