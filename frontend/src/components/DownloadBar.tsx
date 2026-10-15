"use client";

import React, { useState } from "react";
import { Check, Download, Clock } from "lucide-react";
import { TailoredResume } from "../lib/types";

interface DownloadBarProps {
  resume: TailoredResume;
  onDownload: (format: "pdf" | "docx" | "txt") => void;
  isDownloading?: boolean;
}

export const DownloadBar: React.FC<DownloadBarProps> = ({
  resume,
  onDownload,
  isDownloading,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "docx" | "txt">("pdf");

  const formats: Array<"pdf" | "docx" | "txt"> = ["pdf", "docx", "txt"];
  const isReady = Boolean(
    resume &&
    (resume.candidate_name || resume.professional_summary) &&
    resume.candidate_name !== "Candidate"
  );

  return (
    <div className="border border-gray-200/90 dark:border-[#1c2621] bg-white dark:bg-[#111614] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs transition-colors">
      {/* Left: Status */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        {isReady ? (
          <>
            <Check className="w-4 h-4 text-emerald-600 dark:text-[#34d399] stroke-[2.5]" />
            <span className="text-gray-800 dark:text-gray-200">Ready for your review & download</span>
          </>
        ) : (
          <>
            <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-500 dark:text-gray-400">Tailor resume to enable export</span>
          </>
        )}
      </div>

      {/* Right: Download Action with Format Selector */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {/* Format Selector Pills */}
        <div className="flex items-center p-0.5 rounded-lg border border-gray-200 dark:border-[#1c2621] bg-gray-50 dark:bg-[#0b0f0d]">
          {formats.map((fmt) => (
            <button
              key={fmt}
              id={`format-btn-${fmt}`}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase transition cursor-pointer ${
                selectedFormat === fmt
                  ? "bg-white dark:bg-[#19241d] text-emerald-700 dark:text-[#34d399] shadow-2xs font-bold"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>

        {/* Download Button */}
        <button
          id="download-resume-btn"
          onClick={() => onDownload(selectedFormat)}
          disabled={isDownloading || !isReady}
          title={!isReady ? "Please tailor your resume first before downloading." : "Download your tailored resume"}
          className={`font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xs transition ${
            isReady
              ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-[#131916] dark:hover:bg-[#1a231e] text-white dark:text-white border border-emerald-600 dark:border-[#1f2823] cursor-pointer"
              : "bg-gray-100 dark:bg-[#121714] text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-[#1c241f] cursor-not-allowed opacity-60"
          }`}
        >
          <Download className={`w-4 h-4 ${isReady ? "text-white dark:text-[#34d399]" : "text-gray-400 dark:text-gray-500"}`} />
          <span>{isDownloading ? "Downloading..." : "Download resume"}</span>
          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
            isReady 
              ? "bg-emerald-700/60 dark:bg-[#1b251f] text-emerald-100 dark:text-[#34d399]" 
              : "bg-gray-200 dark:bg-[#18201b] text-gray-400 dark:text-gray-500"
          }`}>
            {selectedFormat}
          </span>
        </button>
      </div>
    </div>
  );
};
