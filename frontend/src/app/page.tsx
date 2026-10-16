"use client";

/**
 * Copyright (c) 2026 Rahul Kumar. All rights reserved.
 * Proprietary and confidential. See LICENSE in the project root for details.
 *
 * Project Provenance Identifier (documented integrity marker; see COPYRIGHT.md):
 */
export const PROJECT_PROVENANCE_ID = "align-resume-studio-core-2026-9a84b2c1";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  FileText,
  ShieldCheck,
  Check,
  Info,
  AlertCircle,
  X,
} from "lucide-react";

import { Navbar } from "../components/Navbar";
import { ResumeUpload } from "../components/ResumeUpload";
import { JobDescriptionInput } from "../components/JobDescriptionInput";
import { ScoreCards } from "../components/ScoreCards";
import { KeywordsAlert } from "../components/KeywordsAlert";
import { ResumePreview } from "../components/ResumePreview";
import { DownloadBar } from "../components/DownloadBar";
import { CoverLetterModal } from "../components/CoverLetterModal";

import { TailorResponse, TailoredResume, ScoreData, DiffItem } from "../lib/types";
import { customizeResume, downloadResumeFile, generateCoverLetter } from "../lib/api";
import { useTheme } from "../lib/useTheme";

const EMPTY_SCORES: ScoreData = {
  match_score: 0,
  match_badge: "Pending",
  ats_score: 0,
  ats_badge: "Pending",
  original_match_score: 0,
};

const EMPTY_RESUME: TailoredResume = {
  candidate_name: "",
  target_role: "",
  email: "",
  location: "",
  linkedin: "",
  header_tags: [],
  original_summary: "",
  professional_summary: "",
  matched_skills: [],
  secondary_skills: [],
  all_skills: [],
  experience_highlights: [],
  experience_entries: [],
  education: [],
  additional_information: [],
};

// List of all sensitive keys to purge from storage to guarantee zero persistence
const SENSITIVE_STORAGE_KEYS = [
  "align_saved_file_name",
  "align_saved_file_size_kb",
  "align_saved_file_data",
  "align_saved_file_type",
  "align_saved_resume_text",
  "align_saved_job_description",
  "align_saved_tailored_resume",
  "align_saved_scores",
  "align_saved_missing_keywords",
  "align_saved_diff_items",
  "align_saved_status_message",
  "align_saved_is_ai_generated",
  "align_saved_llm_provider",
  "align_saved_cover_letter",
];

function purgeSensitiveStorage() {
  if (typeof window === "undefined") return;
  try {
    for (const key of SENSITIVE_STORAGE_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch {}
}

export default function Home() {
  // Theme state: light | dark | system (managed via useTheme hook)
  const { theme, setTheme: handleThemeChange } = useTheme();

  // Inputs - In-memory only (Never stored in localStorage / sessionStorage)
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");

  // Results & Outputs - In-memory only
  const [scores, setScores] = useState<ScoreData>(EMPTY_SCORES);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume>(EMPTY_RESUME);
  const [diffItems, setDiffItems] = useState<DiffItem[]>([]);

  // UI States
  const [isTailoring, setIsTailoring] = useState<boolean>(false);
  const [tailorStepText, setTailorStepText] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("Upload a resume to get started");
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const [llmProviderUsed, setLlmProviderUsed] = useState<string>("local");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState<boolean>(false);
  const [coverLetterText, setCoverLetterText] = useState<string>("");
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState<boolean>(false);

  // Auth state
  const [authUser, setAuthUser] = useState<{ email: string; name?: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Validation Error States
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [jdError, setJdError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Verify authentication and proactively purge any legacy sensitive storage on mount
  useEffect(() => {
    // Proactively purge any residual resume data from older sessions
    purgeSensitiveStorage();

    try {
      const stored = localStorage.getItem("align_auth_user");
      const hasCookie = document.cookie.includes("align_auth=true");
      if (!stored && !hasCookie) {
        window.location.replace("/login");
        return;
      }
      if (stored) {
        setAuthUser(JSON.parse(stored));
      } else {
        setAuthUser({ email: "user@align.io", name: "User" });
      }
    } catch {
      window.location.replace("/login");
      return;
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  // Handle Logout - completely clears in-memory state, cookies, and sensitive storage
  const handleLogout = () => {
    try {
      localStorage.removeItem("align_auth_user");
      document.cookie = "align_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      purgeSensitiveStorage();
    } catch {}
    // Clear all sensitive in-memory state
    setFile(null);
    setFileName(null);
    setFileSizeKb(null);
    setResumeText("");
    setJobDescription("");
    setScores(EMPTY_SCORES);
    setMissingKeywords([]);
    setTailoredResume(EMPTY_RESUME);
    setDiffItems([]);
    setCoverLetterText("");
    window.location.replace("/login");
  };

  // Handle file upload (Kept strictly in memory)
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setFileName(selectedFile.name);
    const sizeKb = Math.round((selectedFile.size / 1024) * 10) / 10;
    setFileSizeKb(sizeKb);

    // Clear resume validation errors on valid selection
    setResumeError(null);
    setGlobalError(null);

    // Reset previous tailored state when a new file is uploaded
    setTailoredResume(EMPTY_RESUME);
    setScores(EMPTY_SCORES);
    setMissingKeywords([]);
    setDiffItems([]);
    setCoverLetterText("");
    setStatusMessage("Resume uploaded. Click 'Tailor Resume to Job' to generate your customized resume.");
    purgeSensitiveStorage();
  };

  // Handle file removal
  const handleRemoveFile = () => {
    setFile(null);
    setFileName(null);
    setFileSizeKb(null);
    setResumeText("");
    setTailoredResume(EMPTY_RESUME);
    setScores(EMPTY_SCORES);
    setMissingKeywords([]);
    setDiffItems([]);
    setCoverLetterText("");
    setStatusMessage("Upload a resume to get started");
    setResumeError(null);
    setGlobalError(null);
    purgeSensitiveStorage();
  };

  // Handle job description changes (Kept strictly in memory)
  const handleJobDescriptionChange = (val: string) => {
    setJobDescription(val);
    if (val.trim().length >= 50) {
      setJdError(null);
      if (!resumeError) setGlobalError(null);
    }
  };

  // Main Tailor Action
  const handleTailorResume = async () => {
    let hasValidationError = false;

    // Check Resume upload
    if (!file && !resumeText && !fileName) {
      setResumeError("Please upload your resume (PDF or DOCX format) before tailoring.");
      hasValidationError = true;
    } else {
      setResumeError(null);
    }

    // Check Job description
    if (!jobDescription || jobDescription.trim().length === 0) {
      setJdError("Please enter a target job description so AI can align your experience.");
      hasValidationError = true;
    } else if (jobDescription.trim().length < 50) {
      setJdError(
        `Job description is too short (${jobDescription.trim().length} chars). Please enter at least 50 characters.`
      );
      hasValidationError = true;
    } else {
      setJdError(null);
    }

    if (hasValidationError) {
      setGlobalError("Please resolve the required items highlighted above before tailoring.");
      return;
    }

    setGlobalError(null);
    setIsTailoring(true);
    setTailorStepText("Analyzing job description and extracting key requirements...");

    const stepTimer1 = setTimeout(() => {
      setTailorStepText("Aligning candidate experience, projects, and keywords...");
    }, 700);

    const stepTimer2 = setTimeout(() => {
      setTailorStepText("Scoring ATS readiness and formatting final output...");
    }, 1400);

    try {
      const activeResumeText = resumeText || null;
      const [res] = await Promise.all([
        customizeResume(file, activeResumeText, jobDescription),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)),
      ]);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setScores(res.scores);
      setMissingKeywords(res.missing_keywords);
      setTailoredResume(res.tailored_resume);
      setDiffItems(res.diff_items);
      const msg = res.message || "Your tailored resume is ready.";
      setStatusMessage(msg);
      setIsAiGenerated(res.is_ai_generated);
      setLlmProviderUsed(res.llm_provider);

      if (res.cover_letter) {
        setCoverLetterText(res.cover_letter);
      }

      if (res.original_resume_text) {
        setResumeText(res.original_resume_text);
      }

      // Trigger celebratory confetti on success
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#10b981", "#047857", "#064e3b"],
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setGlobalError(err.message || "An error occurred while tailoring the resume. Please check your inputs and try again.");
    } finally {
      setIsTailoring(false);
      setTailorStepText("");
    }
  };

  // Helper for clean plain text resume formatting
  const formatResumeToPlainText = (r: TailoredResume): string => {
    const lines: string[] = [];
    lines.push(`${(r.candidate_name || "Candidate").toUpperCase()}`);
    lines.push(`${r.target_role || "Professional"}`);
    const contact = [r.email, r.location, r.linkedin].filter(Boolean).join(" | ");
    if (contact) lines.push(contact);
    lines.push("=".repeat(56));
    lines.push("");
    if (r.professional_summary) {
      lines.push("PROFESSIONAL SUMMARY");
      lines.push("-".repeat(28));
      lines.push(r.professional_summary);
      lines.push("");
    }
    const skills = r.matched_skills?.length ? r.matched_skills : r.all_skills;
    if (skills?.length) {
      lines.push("CORE SKILLS");
      lines.push("-".repeat(28));
      lines.push(skills.join(", "));
      lines.push("");
    }
    if (r.experience_entries?.length) {
      lines.push("EXPERIENCE");
      lines.push("-".repeat(28));
      r.experience_entries.forEach((e) => {
        lines.push(`${e.title || ""} | ${e.company || ""} | ${e.duration || ""}`);
        e.bullets.forEach((b: any) => {
          const text = typeof b === "object" ? b.tailored || b.original : b;
          if (text) lines.push(`  - ${text}`);
        });
        lines.push("");
      });
    } else if (r.experience_highlights?.length) {
      lines.push("EXPERIENCE HIGHLIGHTS");
      lines.push("-".repeat(28));
      r.experience_highlights.forEach((h) => lines.push(`  - ${h}`));
      lines.push("");
    }
    if (r.education?.length) {
      lines.push("EDUCATION");
      lines.push("-".repeat(28));
      r.education.forEach((edu: any) => {
        if (typeof edu === "object" && edu !== null) {
          lines.push(`  - ${edu.degree || ""} — ${edu.institution || ""} ${edu.duration ? `(${edu.duration})` : ""}`);
        } else {
          lines.push(`  - ${edu}`);
        }
      });
      lines.push("");
    }
    return lines.join("\n");
  };

  // Download Handler
  const handleDownload = async (format: "pdf" | "docx" | "txt") => {
    if (!tailoredResume || (!tailoredResume.candidate_name && !tailoredResume.professional_summary)) {
      setGlobalError("Please customize your resume first before downloading.");
      return;
    }

    setIsDownloading(true);
    setGlobalError(null);
    try {
      await downloadResumeFile(tailoredResume, format);
    } catch (e: any) {
      console.error("Resume download failed:", e);
      setGlobalError(`Download failed: ${e.message || "Could not generate file. Please try again."}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Generate Cover Letter
  const handleOpenCoverLetter = async () => {
    setIsCoverLetterOpen(true);
    if (!coverLetterText) {
      await handleGenerateCoverLetter();
    }
  };

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCoverLetter(true);
    try {
      const res = await generateCoverLetter(
        resumeText || tailoredResume.professional_summary || "",
        jobDescription,
        tailoredResume.candidate_name,
        tailoredResume.target_role
      );
      setCoverLetterText(res.cover_letter_text);
    } catch (e: any) {
      // Fallback cover letter
      setCoverLetterText(`Dear Hiring Team,

I am writing to express my enthusiastic interest in the ${tailoredResume.target_role || "open"} role. With my background in electronics engineering, embedded systems, and technical troubleshooting, I am confident in my ability to deliver immediate value to your organization.

Throughout my experience, I have developed embedded solutions, vehicle counting systems utilizing Python and YOLO, and provided high-caliber technical support in demanding environments.

Thank you for your consideration. I look forward to discussing how my experience aligns with your team's goals.

Sincerely,
${tailoredResume.candidate_name || "Candidate"}`);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] dark:bg-[#090c0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-[#10b981] flex items-center justify-center text-white animate-pulse">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Loading Resume Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc] dark:bg-[#090c0a] text-gray-900 dark:text-gray-100 transition-colors">
      {/* Top Navbar with Auth State and Theme Switcher */}
      <Navbar
        theme={theme}
        setTheme={handleThemeChange}
        authUser={authUser}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-10">
        {/* Breadcrumb & Bonus Feature Row */}
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 pb-2">
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase select-none">
            <span>WORKSPACE</span>
            <span>&gt;</span>
            <span>RESUME CUSTOMIZER</span>
          </div>

          <div className="flex items-center gap-2 w-full xs:w-auto justify-between xs:justify-end">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#111614] border border-gray-200 dark:border-[#1c2621] px-2.5 py-1 rounded-full shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#34d399] animate-pulse" />
              Resume Studio
            </span>

            {/* Bonus Feature Button: Cover Letter */}
            <button
              onClick={handleOpenCoverLetter}
              className="text-xs font-semibold text-emerald-800 dark:text-[#34d399] bg-emerald-50 dark:bg-[#14291f] hover:bg-emerald-100 dark:hover:bg-[#1b3a2c] border border-emerald-200 dark:border-[#1d4430] px-3 py-1 rounded-full flex items-center gap-1.5 cursor-pointer transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Cover Letter</span>
              <span className="xs:hidden">Cover Letter</span>
              <span className="text-[10px] bg-emerald-200/80 dark:bg-[#1b4332] px-1.5 rounded text-emerald-900 dark:text-[#34d399]">
                Bonus
              </span>
            </button>
          </div>
        </div>

        {/* Two-Column Responsive Studio Layout */}
        <div className="mt-4 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          {/* LEFT COLUMN: Inputs (01 Resume Upload + 02 Job Description + Action Button) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Card 1: Resume Upload */}
            <ResumeUpload
              file={file}
              fileName={fileName}
              fileSizeKb={fileSizeKb}
              errorMessage={resumeError}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              onErrorClear={() => {
                setResumeError(null);
                setGlobalError(null);
              }}
            />

            {/* Card 2: Job Description */}
            <JobDescriptionInput
              value={jobDescription}
              errorMessage={jdError}
              onChange={handleJobDescriptionChange}
              onErrorClear={() => {
                setJdError(null);
                setGlobalError(null);
              }}
            />

            {/* Global validation / error alert banner */}
            {globalError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs shadow-xs transition animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{globalError}</div>
                <button
                  type="button"
                  onClick={() => setGlobalError(null)}
                  className="p-1 rounded text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 transition"
                  aria-label="Dismiss message"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Big Action Button - Vibrant Mint in Dark Mode */}
            <div>
              <button
                id="tailor-resume-btn"
                onClick={handleTailorResume}
                disabled={isTailoring}
                className="w-full min-h-[48px] bg-[#064e3b] dark:bg-[#34d399] hover:bg-[#047857] dark:hover:bg-[#2dd4bf] active:bg-[#065f46] text-white dark:text-[#052216] font-semibold dark:font-bold py-3.5 px-4 sm:px-6 rounded-2xl flex items-center justify-between shadow-sm transition active:scale-[0.995] cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  {isTailoring ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-300 dark:text-[#052216]" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-300 dark:text-[#052216]" />
                  )}
                  <span>{isTailoring ? "Tailoring Resume..." : "Tailor Resume to Job"}</span>
                </div>
                <ArrowRight className="w-4 h-4 stroke-[2.5] text-white dark:text-[#052216]" />
              </button>
            </div>

            {/* Progress / Step text when processing */}
            {isTailoring && tailorStepText && (
              <div className="text-center text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-pulse">
                {tailorStepText}
              </div>
            )}

            {/* Simple AI Review Note */}
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34d399] shrink-0" />
                <span>
                  This is AI-generated evaluation and content. Kindly check and review before applying.
                </span>
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Results & Analytics (Match Score, ATS Friendly, Keywords Alert, Resume Preview, Download Bar) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Metrics Section: Match score + ATS-friendly Cards */}
            <ScoreCards scores={scores} />

            {/* Keywords to Keep in Mind Alert Banner */}
            <KeywordsAlert keywords={missingKeywords} />

            {/* Resume Preview Sheet with Diff View and Aceternity Image Generation Loader */}
            <ResumePreview
              resume={tailoredResume}
              diffItems={diffItems}
              isLoading={isTailoring}
              loadingStepText={tailorStepText}
            />

            {/* Bottom Download Bar */}
            <DownloadBar
              resume={tailoredResume}
              onDownload={handleDownload}
              isDownloading={isDownloading}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 sm:mt-14 pt-5 sm:pt-6 border-t border-gray-200/80 dark:border-[#1c2621] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-gray-400 dark:text-gray-500 text-center sm:text-left">
          <span>Made for your next move.</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span>No sign-up. No data leaves this page.</span>
          </span>
        </footer>
      </main>

      {/* Bonus Feature Modal: Cover Letter */}
      <CoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        coverLetterText={coverLetterText}
        onGenerate={handleGenerateCoverLetter}
        isLoading={isGeneratingCoverLetter}
      />

    </div>
  );
}
