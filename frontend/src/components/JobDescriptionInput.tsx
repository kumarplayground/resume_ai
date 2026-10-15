"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Code, AlertCircle, Scissors, ArrowDownUp } from "lucide-react";

interface JobDescriptionInputProps {
  value: string;
  errorMessage?: string | null;
  onChange: (val: string) => void;
  onErrorClear?: () => void;
}

const MIN_HEIGHT = 140; // Base comfortable height (~6 lines)
const MAX_WORDS = 208; // Ceiling for dynamic auto-stretch

// Helper to extract first N words preserving original spacing & newlines
function getFirstNWords(text: string, maxWords: number): string {
  const regex = /\S+/g;
  let found = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    found++;
    if (found === maxWords) {
      lastIndex = match.index + match[0].length;
      return text.slice(0, lastIndex);
    }
  }
  return text;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  value,
  errorMessage,
  onChange,
  onErrorClear,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hiddenMeasureRef = useRef<HTMLTextAreaElement>(null);

  const charCount = value.length;
  const maxChars = 5000;
  const minChars = 50;
  const isTooShort = charCount > 0 && charCount < minChars;

  // Real-time word calculation
  const words = value.trim() ? value.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const isCapped = wordCount > MAX_WORDS;

  // Dynamic auto-stretch calculation
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (wordCount <= MAX_WORDS) {
      // Auto-stretch to fit the full text dynamically
      textarea.style.height = "auto";
      const targetHeight = Math.max(MIN_HEIGHT, textarea.scrollHeight);
      textarea.style.height = `${targetHeight}px`;
      textarea.style.overflowY = "hidden";
    } else {
      // Measure the exact rendered height of the first 208 words
      const measureEl = hiddenMeasureRef.current;
      let cappedHeight = 440;
      if (measureEl) {
        measureEl.style.width = `${textarea.clientWidth}px`;
        measureEl.value = getFirstNWords(value, MAX_WORDS);
        cappedHeight = Math.max(MIN_HEIGHT, measureEl.scrollHeight);
      }
      textarea.style.height = `${cappedHeight}px`;
      textarea.style.overflowY = "auto";
    }
  }, [value, wordCount]);

  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  // Re-adjust height on window or container resize
  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);

    const textarea = textareaRef.current;
    let observer: ResizeObserver | null = null;
    if (textarea && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => adjustHeight());
      observer.observe(textarea);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer && textarea) {
        observer.unobserve(textarea);
      }
    };
  }, [adjustHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    if (errorMessage && e.target.value.trim().length >= minChars) {
      onErrorClear?.();
    }
  };

  const handleTrimToMaxWords = () => {
    const trimmed = getFirstNWords(value, MAX_WORDS);
    onChange(trimmed);
    if (errorMessage && trimmed.trim().length >= minChars) {
      onErrorClear?.();
    }
  };

  return (
    <div
      className={`w-full bg-white dark:bg-[#111614] border rounded-2xl p-5 shadow-xs transition-colors ${
        errorMessage
          ? "border-rose-300 dark:border-rose-900/60"
          : "border-gray-200/90 dark:border-[#1c2621]"
      }`}
    >
      {/* Hidden offscreen clone used to measure exact height for 208 words */}
      <textarea
        ref={hiddenMeasureRef}
        tabIndex={-1}
        aria-hidden="true"
        readOnly
        className="absolute -top-[9999px] -left-[9999px] opacity-0 pointer-events-none p-3.5 text-xs sm:text-sm leading-relaxed border box-border"
        style={{ height: "auto", overflowY: "hidden" }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider text-emerald-800 dark:text-[#34d399] bg-emerald-100 dark:bg-[#14291f] border border-emerald-200 dark:border-[#1d4430] px-1.5 py-0.5 rounded-md">
            02
          </span>
          <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-[#14291f] border border-emerald-200 dark:border-[#1d4430] flex items-center justify-center text-emerald-700 dark:text-[#34d399]">
            <Code className="w-3.5 h-3.5" />
          </div>
          <h2 className="font-bold text-gray-900 dark:text-white text-base">
            Job description
          </h2>
        </div>

        {/* Dynamic Stretch Pill Indicator */}
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
            isCapped
              ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60"
              : wordCount > 0
              ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50"
              : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#16201b] border-gray-200 dark:border-[#223028]"
          }`}
          title="Text area auto-stretches up to 208 words, then enables internal scrolling"
        >
          <ArrowDownUp className="w-2.5 h-2.5" />
          {isCapped
            ? "Stretch capped (208 words)"
            : wordCount > 0
            ? "Auto-stretched"
            : "Auto-stretches ≤ 208 words"}
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        The role you have your eye on:
      </p>

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder="Paste the full job description here (responsibilities, required qualifications, key skills)..."
          maxLength={maxChars}
          className={`w-full p-3.5 text-xs sm:text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-[#0b0f0d] border rounded-xl outline-none leading-relaxed resize-none transition-[border-color,background-color,box-shadow] ${
            errorMessage
              ? "border-rose-400 dark:border-rose-600/80 bg-rose-50/20 dark:bg-[#1d0e12] ring-2 ring-rose-400/20 focus:border-rose-500"
              : isTooShort
              ? "border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500"
              : "border-gray-200 dark:border-[#1c2621] focus:border-emerald-600 dark:focus:border-[#2d6347] focus:ring-2 focus:ring-emerald-500/20"
          }`}
          style={{ minHeight: `${MIN_HEIGHT}px` }}
        />
      </div>

      {/* Inline Error Alert */}
      {errorMessage && (
        <div className="mt-2.5 p-3 rounded-xl bg-rose-50 dark:bg-[#201013] border border-rose-200 dark:border-[#3d1921] flex items-start gap-2.5 text-rose-700 dark:text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span className="flex-1 font-medium leading-relaxed">
            {errorMessage}
          </span>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 text-[11px] text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-2">
          <span className={isTooShort ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>
            {isTooShort ? "Minimum 50 characters required" : "Paste job description"}
          </span>

          {/* If exceeded 208 words, provide 1-click helper to trim */}
          {isCapped && (
            <button
              type="button"
              onClick={handleTrimToMaxWords}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 transition cursor-pointer"
              title="Trim text to exactly 208 words"
            >
              <Scissors className="w-2.5 h-2.5" />
              Trim to 208 words
            </button>
          )}
        </div>

        {/* Counters */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span
            className={`font-semibold ${
              isCapped
                ? "text-amber-600 dark:text-amber-400"
                : wordCount > 0
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {wordCount} / {MAX_WORDS} words
          </span>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <span>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()} chars
          </span>
        </div>
      </div>
    </div>
  );
};
