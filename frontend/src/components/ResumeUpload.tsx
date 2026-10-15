"use client";

import React, { useRef, useState } from "react";
import { FileText, Check, X, Upload, AlertCircle } from "lucide-react";

interface ResumeUploadProps {
  file: File | null;
  fileName: string | null;
  fileSizeKb: number | null;
  errorMessage?: string | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  onErrorClear?: () => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  file,
  fileName,
  fileSizeKb,
  errorMessage,
  onFileSelect,
  onRemoveFile,
  onErrorClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = errorMessage || localError;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSelect(droppedFile);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
    // Reset file input value so user can re-select same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateAndSelect = (selectedFile: File) => {
    const ext = selectedFile.name.toLowerCase();
    const validExtensions = [".pdf", ".docx", ".doc"];
    const isSupported = validExtensions.some((e) => ext.endsWith(e));

    if (!isSupported) {
      const actualExt = selectedFile.name.includes(".")
        ? "." + selectedFile.name.split(".").pop()
        : "unknown";
      setLocalError(
        `Unsupported file format (${actualExt}). Please upload a valid PDF or Word document (.pdf or .docx).`
      );
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(1);
      setLocalError(
        `File size (${sizeMb} MB) exceeds the 10 MB maximum limit. Please upload a smaller document.`
      );
      return;
    }

    // Clear any previous error and select file
    setLocalError(null);
    onErrorClear?.();
    onFileSelect(selectedFile);
  };

  const clearError = () => {
    setLocalError(null);
    onErrorClear?.();
  };

  return (
    <div
      className={`w-full bg-white dark:bg-[#111614] border rounded-2xl p-5 shadow-xs transition-colors ${displayError
          ? "border-rose-300 dark:border-rose-900/60"
          : "border-gray-200/90 dark:border-[#1c2621]"
        }`}
    >
      {/* Card Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-bold tracking-wider text-emerald-800 dark:text-[#34d399] bg-emerald-100 dark:bg-[#14291f] border border-emerald-200 dark:border-[#1d4430] px-1.5 py-0.5 rounded-md">
          01
        </span>
        <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-[#14291f] border border-emerald-200 dark:border-[#1d4430] flex items-center justify-center text-emerald-700 dark:text-[#34d399]">
          <FileText className="w-3.5 h-3.5" />
        </div>
        <h2 className="font-bold text-gray-900 dark:text-white text-base">
          Your resume
        </h2>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl py-8 px-4 text-center transition cursor-pointer select-none ${displayError
            ? "border-rose-400 dark:border-rose-600/80 bg-rose-50/30 dark:bg-[#1d0e12] ring-2 ring-rose-400/20"
            : "border-gray-200 dark:border-[#1c2621] hover:border-emerald-500/60 dark:hover:border-[#2d6347] bg-gray-50/40 dark:bg-[#0b0f0d] hover:bg-emerald-50/20 dark:hover:bg-[#111915]"
          }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2.5 ${displayError
              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
              : "bg-emerald-50 dark:bg-[#14291f] text-emerald-600 dark:text-[#34d399]"
            }`}
        >
          <Upload className="w-5 h-5 stroke-[2.2]" />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Drop your resume here, or{" "}
          <span
            className={
              displayError
                ? "text-rose-600 dark:text-rose-400 font-semibold underline decoration-rose-500/40 underline-offset-2"
                : "text-emerald-700 dark:text-[#34d399] font-semibold underline decoration-emerald-500/40 underline-offset-2"
            }
          >
            browse
          </span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          PDF or DOCX • Up to 10 MB
        </p>
      </div>

      {/* Inline Error Banner */}
      {displayError && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-[#201013] border border-rose-200 dark:border-[#3d1921] flex items-start gap-2.5 text-rose-700 dark:text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span className="flex-1 font-medium leading-relaxed">
            {displayError}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearError();
            }}
            className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 p-0.5 rounded cursor-pointer transition shrink-0"
            title="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Uploaded File Pill Card (Shown when file is selected or loaded) */}
      {fileName && (
        <div className="mt-3.5 bg-gray-50/90 dark:bg-[#131916] border border-gray-200/80 dark:border-[#1f2823] rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-[#142e20] text-emerald-700 dark:text-[#34d399] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                {fileName}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                <span>{fileSizeKb ? `${fileSizeKb} KB` : "Document"}</span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-[#34d399] flex items-center gap-0.5 font-medium">
                  <Check className="w-3 h-3 stroke-[3]" /> Ready
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              clearError();
              onRemoveFile();
            }}
            title="Remove file"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-[#1e2722] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
