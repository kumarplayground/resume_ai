"use client";

import React from "react";
import { PieChart, FileCheck2 } from "lucide-react";
import { ScoreData } from "../lib/types";

interface ScoreCardsProps {
  scores: ScoreData;
}

export const ScoreCards: React.FC<ScoreCardsProps> = ({ scores }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Match Score Card */}
      <div className="bg-white dark:bg-[#111614] border border-gray-200/90 dark:border-[#1c2621] rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Match score
          </span>
          <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-[#14291f] flex items-center justify-center text-emerald-600 dark:text-[#34d399]">
            <PieChart className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline justify-between mt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {scores.match_score}
            </span>
            <span className="text-lg font-bold text-gray-400">%</span>
          </div>

          <span className="text-xs font-semibold text-emerald-800 dark:text-[#34d399] bg-emerald-50 dark:bg-[#14291f] border border-emerald-200/90 dark:border-[#1d4430] px-2.5 py-0.5 rounded-full">
            {scores.match_badge}
          </span>
        </div>

        {/* Progress underline bar matching screenshot */}
        <div className="w-full h-1 bg-gray-100 dark:bg-[#1b251f] rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-emerald-500 dark:bg-[#34d399] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(5, scores.match_score))}%` }}
          />
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Aligned with the role
        </p>
      </div>

      {/* ATS Friendly Card */}
      <div className="bg-white dark:bg-[#111614] border border-gray-200/90 dark:border-[#1c2621] rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            ATS-friendly
          </span>
          <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-[#14291f] flex items-center justify-center text-emerald-600 dark:text-[#34d399]">
            <FileCheck2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline justify-between mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {scores.ats_score}
            </span>
            <span className="text-sm font-semibold text-gray-400">/ 100</span>
          </div>

          <span className="text-xs font-semibold text-emerald-800 dark:text-[#34d399] bg-emerald-50 dark:bg-[#14291f] border border-emerald-200/90 dark:border-[#1d4430] px-2.5 py-0.5 rounded-full">
            {scores.ats_badge}
          </span>
        </div>

        {/* Progress underline bar matching screenshot */}
        <div className="w-full h-1 bg-gray-100 dark:bg-[#1b251f] rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-emerald-500 dark:bg-[#34d399] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(5, scores.ats_score))}%` }}
          />
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Estimated format readiness
        </p>
      </div>
    </div>
  );
};
