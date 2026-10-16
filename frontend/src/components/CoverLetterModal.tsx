"use client";

import React, { useState } from "react";
import { FileText, Copy, Check, X, Sparkles } from "lucide-react";

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverLetterText: string;
  onGenerate: () => void;
  isLoading: boolean;
}

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({
  isOpen,
  onClose,
  coverLetterText,
  onGenerate,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#111614] border border-gray-200 dark:border-[#1c2621] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-gray-150 dark:border-[#1c2621] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-[#142e20] text-emerald-700 dark:text-[#34d399] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-base text-gray-900 dark:text-white leading-tight truncate">
                AI Cover Letter Generator (Bonus)
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 leading-snug truncate mt-0.5">
                Tailored directly from your resume & target job
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1b251f] cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center text-gray-400">
              <Sparkles className="w-8 h-8 text-emerald-600 dark:text-[#34d399] animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium">Drafting tailored cover letter...</p>
            </div>
          ) : coverLetterText ? (
            <div className="whitespace-pre-line text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-sans bg-gray-50/50 dark:bg-[#0b0f0d] p-3.5 sm:p-4 rounded-xl border border-gray-200/80 dark:border-[#1c2621]">
              {coverLetterText}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-gray-500 mb-3">
                No cover letter generated yet. Click generate to draft one!
              </p>
              <button
                onClick={onGenerate}
                className="bg-emerald-700 hover:bg-emerald-800 dark:bg-[#34d399] dark:hover:bg-[#2dd4bf] text-white dark:text-[#062419] font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Generate Cover Letter
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-[#0d1210] border-t border-gray-150 dark:border-[#1c2621] flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2.5">
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="text-xs font-semibold text-emerald-800 dark:text-[#34d399] hover:underline flex items-center justify-center xs:justify-start gap-1 cursor-pointer py-1"
          >
            <Sparkles className="w-3.5 h-3.5" /> Re-generate
          </button>

          <div className="flex items-center gap-2 w-full xs:w-auto">
            <button
              onClick={handleCopy}
              disabled={!coverLetterText}
              className="flex-1 xs:flex-initial min-h-[36px] bg-white dark:bg-[#131916] border border-gray-300 dark:border-[#1f2823] text-gray-800 dark:text-gray-200 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-[#1b251f] transition cursor-pointer disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34d399]" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy to Clipboard
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="min-h-[36px] bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
