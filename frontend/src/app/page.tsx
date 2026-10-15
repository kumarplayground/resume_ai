"use client";

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

// Helper to reconstruct File object from stored base64 Data URL
function dataURLtoFile(dataurl: string, filename: string, mimeType?: string): File | null {
  try {
    const arr = dataurl.split(",");
    if (arr.length < 2) return null;
    const match = arr[0].match(/:(.*?);/);
    const mime = mimeType || (match ? match[1] : "application/octet-stream");
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (err) {
    console.warn("Could not restore file from storage:", err);
    return null;
  }
}

export default function Home() {
  // Theme state: light | dark | system (managed via useTheme hook)
  const { theme, setTheme: handleThemeChange } = useTheme();

  // Inputs
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");

  // Results & Outputs
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

  // Verify authentication on mount (first page open rule)
  useEffect(() => {
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

  // Handle Logout
  const handleLogout = () => {
    try {
      localStorage.removeItem("align_auth_user");
      document.cookie = "align_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch {}
    window.location.replace("/login");
  };

  // Restore saved persistent resume data from localStorage on mount
  useEffect(() => {
    try {
      // 1. Saved File & Resume Text
      const savedFileName = localStorage.getItem("align_saved_file_name");
      const savedFileSizeKb = localStorage.getItem("align_saved_file_size_kb");
      const savedFileData = localStorage.getItem("align_saved_file_data");
      const savedFileType = localStorage.getItem("align_saved_file_type");
      const savedResumeText = localStorage.getItem("align_saved_resume_text");

      if (savedFileName) {
        setFileName(savedFileName);
        if (savedFileSizeKb) setFileSizeKb(parseFloat(savedFileSizeKb));
        if (savedFileData) {
          const restored = dataURLtoFile(savedFileData, savedFileName, savedFileType || undefined);
          if (restored) setFile(restored);
        }
        if (savedResumeText) setResumeText(savedResumeText);
      }

      // 3. Saved Job Description
      const savedJd = localStorage.getItem("align_saved_job_description");
      if (savedJd !== null) {
        setJobDescription(savedJd);
      }

      // 4. Saved Tailored Output
      const savedTailored = localStorage.getItem("align_saved_tailored_resume");
      if (savedTailored) {
        try {
          const parsed = JSON.parse(savedTailored);
          if (parsed && (parsed.candidate_name || parsed.professional_summary)) {
            setTailoredResume(parsed);
          }
        } catch {}
      }

      const savedScores = localStorage.getItem("align_saved_scores");
      if (savedScores) {
        try {
          setScores(JSON.parse(savedScores));
        } catch {}
      }

      const savedMissingKw = localStorage.getItem("align_saved_missing_keywords");
      if (savedMissingKw) {
        try {
          setMissingKeywords(JSON.parse(savedMissingKw));
        } catch {}
      }

      const savedDiff = localStorage.getItem("align_saved_diff_items");
      if (savedDiff) {
        try {
          setDiffItems(JSON.parse(savedDiff));
        } catch {}
      }

      const savedMsg = localStorage.getItem("align_saved_status_message");
      if (savedMsg) setStatusMessage(savedMsg);

      const savedIsAi = localStorage.getItem("align_saved_is_ai_generated");
      if (savedIsAi !== null) setIsAiGenerated(savedIsAi === "true");

      const savedProvider = localStorage.getItem("align_saved_llm_provider");
      if (savedProvider) setLlmProviderUsed(savedProvider);
    } catch (e) {
      console.warn("Storage restoration error:", e);
    }
  }, []);


  // Handle file upload and persist data
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
    setStatusMessage("Resume uploaded. Click 'Tailor Resume to Job' to generate your customized resume.");
    try {
      localStorage.removeItem("align_saved_tailored_resume");
      localStorage.removeItem("align_saved_scores");
      localStorage.removeItem("align_saved_missing_keywords");
      localStorage.removeItem("align_saved_diff_items");
    } catch {}

    try {
      localStorage.setItem("align_saved_file_name", selectedFile.name);
      localStorage.setItem("align_saved_file_size_kb", String(sizeKb));
      localStorage.setItem("align_saved_file_type", selectedFile.type || "application/pdf");

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const dataUrl = reader.result as string;
          localStorage.setItem("align_saved_file_data", dataUrl);
        } catch (e) {
          console.warn("Could not save file data to localStorage:", e);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (e) {
      console.warn("Failed saving file info to localStorage:", e);
    }
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
    setStatusMessage("Upload a resume to get started");
    setResumeError(null);
    setGlobalError(null);
    try {
      localStorage.removeItem("align_saved_file_name");
      localStorage.removeItem("align_saved_file_size_kb");
      localStorage.removeItem("align_saved_file_data");
      localStorage.removeItem("align_saved_file_type");
      localStorage.removeItem("align_saved_resume_text");
      localStorage.removeItem("align_saved_tailored_resume");
      localStorage.removeItem("align_saved_scores");
      localStorage.removeItem("align_saved_missing_keywords");
      localStorage.removeItem("align_saved_diff_items");
    } catch {}
  };

  // Handle job description changes and persist
  const handleJobDescriptionChange = (val: string) => {
    setJobDescription(val);
    if (val.trim().length >= 50) {
      setJdError(null);
      if (!resumeError) setGlobalError(null);
    }
    try {
      localStorage.setItem("align_saved_job_description", val);
    } catch {}
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
        try {
          localStorage.setItem("align_saved_cover_letter", res.cover_letter);
        } catch {}
      }

      if (res.original_resume_text) {
        setResumeText(res.original_resume_text);
        try {
          localStorage.setItem("align_saved_resume_text", res.original_resume_text);
        } catch {}
      }

      try {
        localStorage.setItem("align_saved_scores", JSON.stringify(res.scores));
        localStorage.setItem("align_saved_missing_keywords", JSON.stringify(res.missing_keywords));
        localStorage.setItem("align_saved_tailored_resume", JSON.stringify(res.tailored_resume));
        localStorage.setItem("align_saved_diff_items", JSON.stringify(res.diff_items));
        localStorage.setItem("align_saved_status_message", msg);
        localStorage.setItem("align_saved_is_ai_generated", String(res.is_ai_generated));
        localStorage.setItem("align_saved_llm_provider", res.llm_provider);
      } catch (e) {
        console.warn("Failed saving tailored output to localStorage:", e);
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Breadcrumb & Bonus Feature Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase select-none">
            <span>WORKSPACE</span>
            <span>&gt;</span>
            <span>RESUME CUSTOMIZER</span>
          </div>

          <div className="flex items-center gap-2">
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
              <span>Cover Letter Generator</span>
              <span className="text-[10px] bg-emerald-200/80 dark:bg-[#1b4332] px-1.5 rounded text-emerald-900 dark:text-[#34d399]">
                Bonus
              </span>
            </button>
          </div>
        </div>

        {/* Two-Column Responsive Studio Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
                className="w-full bg-[#064e3b] dark:bg-[#34d399] hover:bg-[#047857] dark:hover:bg-[#2dd4bf] active:bg-[#065f46] text-white dark:text-[#052216] font-semibold dark:font-bold py-3.5 px-6 rounded-2xl flex items-center justify-between shadow-sm transition active:scale-[0.995] cursor-pointer disabled:opacity-60"
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
        <footer className="mt-14 pt-6 border-t border-gray-200/80 dark:border-[#1c2621] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-gray-500">
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
