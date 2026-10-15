"use client";

import React, { useState } from "react";
import { Mail, MapPin, ExternalLink, Calendar, GraduationCap, FileText, Sparkles } from "lucide-react";
import { TailoredResume, DiffItem, DiffBullet, EducationEntry } from "../lib/types";

import { ImageGenerationLoader } from "./ui/image-generation-loader";

interface ResumePreviewProps {
  resume: TailoredResume;
  diffItems?: DiffItem[];
  defaultDiffOn?: boolean;
  isLoading?: boolean;
  loadingStepText?: string;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  resume,
  defaultDiffOn = true,
  isLoading = false,
  loadingStepText,
}) => {
  const [diffViewActive, setDiffViewActive] = useState<boolean>(defaultDiffOn);
  const [previewEffectActive, setPreviewEffectActive] = useState<boolean>(false);

  const showLoader = isLoading || previewEffectActive;
  const hasResumeContent = Boolean(resume && (resume.candidate_name || resume.professional_summary));

  // Normalize experience bullets
  const renderBullet = (bullet: string | DiffBullet, idx: number) => {
    const isObject = typeof bullet === "object" && bullet !== null;
    const isModified = isObject && bullet.is_modified && Boolean(bullet.original);
    const originalText = isObject ? bullet.original : "";
    const tailoredText = isObject ? bullet.tailored : bullet;

    return (
      <li key={idx} className="flex items-start gap-2 text-xs sm:text-[13px] leading-relaxed">
        <span className="text-gray-400 dark:text-gray-600 select-none mt-1 text-sm leading-none shrink-0">•</span>
        <div className="flex-1">
          {diffViewActive && isModified ? (
            <div>
              {/* Deleted / Replaced text in muted gray with strikethrough */}
              <div className="line-through text-gray-400 dark:text-gray-500 select-none">
                {originalText}
              </div>
              {/* Newly added / Replacement text highlighted with light green background and green text */}
              <div className="bg-[#dcfce7] dark:bg-[#0e2c1e] text-[#065f46] dark:text-[#4ade80] border border-transparent dark:border-[#184832] px-1.5 py-0.5 rounded mt-0.5 inline-block font-medium">
                {tailoredText}
              </div>
            </div>
          ) : (
            <span className="text-gray-700 dark:text-gray-300">
              {tailoredText}
            </span>
          )}
        </div>
      </li>
    );
  };

  // If there is no resume content and loading animation is NOT active, show awaiting input card
  if (!hasResumeContent && !showLoader) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-bold text-gray-900 dark:text-white text-base">
            Resume preview
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewEffectActive(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200 dark:border-[#1c2621] bg-gray-100 dark:bg-[#14291f] text-gray-600 dark:text-gray-300 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-[#34d399] transition cursor-pointer"
              title="Click to test the Aceternity AI scanning effect"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-[#34d399]" />
              <span>Preview Effect</span>
            </button>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#14291f] px-2 py-0.5 rounded-full">
              Awaiting input
            </span>
          </div>
        </div>
        <div className="border border-gray-200/90 dark:border-[#1c2621] rounded-2xl p-10 sm:p-14 text-center bg-white dark:bg-[#111614] shadow-xs flex flex-col items-center justify-center min-h-[440px] transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#14291f] border border-emerald-200 dark:border-[#1d4430] flex items-center justify-center text-emerald-600 dark:text-[#34d399] mb-4 shadow-2xs">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
            Your tailored resume preview will appear here
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
            Upload your resume and enter a target job description on the left, then click <strong className="text-emerald-700 dark:text-[#34d399]">Tailor Resume to Job</strong> to generate your tailored preview with inline diffs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Bar with Diff View Toggle & Effect Preview Button */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-900 dark:text-white text-base">
            Resume preview
          </h2>
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-[#34d399] bg-emerald-100/80 dark:bg-[#14291f] border border-transparent dark:border-[#1d4430] px-2 py-0.5 rounded-full">
            {showLoader ? "Tailoring in progress..." : "Tailored"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Manual Effect Demo Toggle Button */}
          <button
            type="button"
            onClick={() => setPreviewEffectActive(!previewEffectActive)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition cursor-pointer ${
              previewEffectActive
                ? "bg-emerald-500/20 text-emerald-700 dark:text-[#34d399] border-emerald-500/40"
                : "bg-gray-100 dark:bg-[#14291f] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#1c2621] hover:border-emerald-500/40"
            }`}
            title="Toggle Aceternity AI scanning effect"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-[#34d399]" />
            <span>{previewEffectActive ? "Stop Effect" : "Preview Effect"}</span>
          </button>

          {/* Diff View Switch */}
          {hasResumeContent && (
            <div
              onClick={() => setDiffViewActive(!diffViewActive)}
              className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none"
            >
              <span>Diff view {diffViewActive ? "ON" : "OFF"}</span>
              <button
                id="diff-view-toggle"
                type="button"
                role="switch"
                aria-checked={diffViewActive}
                aria-label="Toggle Diff View"
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer focus:outline-none shrink-0 ${
                  diffViewActive ? "bg-[#047857] dark:bg-[#34d399]" : "bg-gray-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white dark:bg-zinc-950 rounded-full transition-transform absolute top-0.5 left-0.5 shadow-xs pointer-events-none ${
                    diffViewActive ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resume Document Paper Card Sheet */}
      <div
        className={`resume-sheet border border-gray-200/90 dark:border-[#1c2621] rounded-2xl p-6 sm:p-9 relative bg-white dark:bg-[#111614] shadow-xs transition-colors overflow-hidden min-h-[560px] ${
          showLoader ? "ring-2 ring-emerald-500/40" : ""
        }`}
      >
        {/* Aceternity Image Generation Loader overlay */}
        {showLoader && (
          <div className="absolute inset-0 z-30 overflow-hidden pointer-events-none rounded-2xl">
            {/* The canvas-based Aceternity Image Generation Loader */}
            <ImageGenerationLoader
              effect="scale-wave"
              easing="ease-in-out"
              text="ANALYZING"
              cellSize={4}
              gap={1}
              bandHeight={56}
              duration={3500}
              colors={["#34d399", "#059669"]}
              overlayOpacity={0.2}
            />

            {/* Glowing Laser Scan Line synchronized with band scan */}
            <div
              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#34d399] to-transparent shadow-[0_0_15px_#34d399,0_0_5px_#34d399] pointer-events-none animate-scan-line"
            />

            {/* Step notification badge */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/85 dark:bg-[#090c0a]/90 backdrop-blur-md border border-[#34d399]/40 text-white shadow-2xl">
              <span className="w-2 h-2 rounded-full bg-[#34d399] animate-ping shrink-0" />
              <span className="text-xs font-semibold tracking-wide text-emerald-300 whitespace-nowrap">
                {loadingStepText || (previewEffectActive ? "Aceternity AI scanning effect active" : "Customizing resume to job description with AI...")}
              </span>
            </div>
          </div>
        )}

        {/* Top-Right Label Watermark */}
        <div className="absolute top-7 right-7 text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500 select-none">
          TAILORED RESUME
        </div>

        {/* Realistic Skeleton placeholder when loading without prior resume content */}
        {!hasResumeContent && showLoader ? (
          <div className="space-y-6 animate-pulse select-none opacity-85">
            {/* Candidate Header Skeleton */}
            <div className="border-b border-gray-200/70 dark:border-[#1c2621] pb-5">
              <div className="h-7 w-56 bg-gray-200 dark:bg-[#192b20] rounded-lg mb-2" />
              <div className="h-4 w-40 bg-emerald-100 dark:bg-[#153b27] rounded mb-3" />
              <div className="flex flex-wrap gap-4 pt-1">
                <div className="h-3 w-36 bg-gray-200 dark:bg-[#16261d] rounded" />
                <div className="h-3 w-28 bg-gray-200 dark:bg-[#16261d] rounded" />
                <div className="h-3 w-32 bg-gray-200 dark:bg-[#16261d] rounded" />
              </div>
            </div>

            {/* Summary Skeleton */}
            <div>
              <div className="h-3.5 w-44 bg-gray-200 dark:bg-[#192b20] rounded mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-100 dark:bg-[#14231a] rounded" />
                <div className="h-3 w-[94%] bg-gray-100 dark:bg-[#14231a] rounded" />
                <div className="h-3 w-[88%] bg-gray-100 dark:bg-[#14231a] rounded" />
              </div>
            </div>

            {/* Experience Skeleton */}
            <div>
              <div className="h-3.5 w-36 bg-gray-200 dark:bg-[#192b20] rounded mb-3" />
              <div className="space-y-4">
                <div>
                  <div className="h-4 w-48 bg-gray-200 dark:bg-[#192b20] rounded mb-1.5" />
                  <div className="h-3 w-32 bg-gray-100 dark:bg-[#14231a] rounded mb-2" />
                  <div className="space-y-1.5 pl-3 border-l-2 border-emerald-500/30">
                    <div className="h-3 w-full bg-gray-100 dark:bg-[#14231a] rounded" />
                    <div className="h-3 w-[90%] bg-gray-100 dark:bg-[#14231a] rounded" />
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Badges Skeleton */}
            <div>
              <div className="h-3.5 w-28 bg-gray-200 dark:bg-[#192b20] rounded mb-3" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-20 bg-emerald-50 dark:bg-[#14291f] border border-emerald-200 dark:border-[#1d4430] rounded-md"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>


        {/* Candidate Header */}
        <div className="border-b border-gray-200/70 dark:border-[#1c2621] pb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {resume.candidate_name}
          </h1>

          <p className="text-sm sm:text-base font-semibold text-emerald-700 dark:text-[#34d399] mt-0.5">
            {resume.target_role}
          </p>

          {/* Contact Information Row */}
          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            {resume.email && (
              <div className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition">
                <Mail className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                <span>{resume.email}</span>
              </div>
            )}
            {resume.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                <span>{resume.location}</span>
              </div>
            )}
            {resume.linkedin && (
              <div className="flex items-center gap-1.5 hover:text-emerald-700 dark:hover:text-[#34d399] transition">
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                <span>{resume.linkedin}</span>
              </div>
            )}

            {/* Fallback to header tags if specific contact fields aren't set */}
            {!resume.email &&
              !resume.location &&
              !resume.linkedin &&
              resume.header_tags &&
              resume.header_tags.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  {idx === 0 ? (
                    <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  ) : (
                    <GraduationCap className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  )}
                  <span>{tag}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Section 1: PROFESSIONAL SUMMARY */}
        <div className="mt-6">
          <h3 className="text-xs font-bold tracking-wider text-gray-800 dark:text-gray-200 uppercase mb-2">
            PROFESSIONAL SUMMARY
          </h3>

          {diffViewActive && resume.original_summary ? (
            <div className="text-xs sm:text-[13px] leading-relaxed space-y-1.5">
              {/* Deleted / Replaced original summary in muted gray with strikethrough */}
              <p className="line-through text-gray-400 dark:text-gray-500">
                {resume.original_summary}
              </p>
              {/* Newly added / replacement text highlighted with light green background and green text */}
              <p className="bg-[#dcfce7] dark:bg-[#0e2c1e] text-[#065f46] dark:text-[#4ade80] border border-transparent dark:border-[#184832] px-1.5 py-1 rounded font-medium">
                {resume.professional_summary}
              </p>
            </div>
          ) : (
            <p className="text-xs sm:text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">
              {resume.professional_summary}
            </p>
          )}
        </div>

        {/* Section 2: MATCHED SKILLS */}
        {((resume.matched_skills && resume.matched_skills.length > 0) ||
          (resume.secondary_skills && resume.secondary_skills.length > 0)) && (
            <div className="mt-6">
              <h3 className="text-xs font-bold tracking-wider text-gray-800 dark:text-gray-200 uppercase mb-2.5">
                MATCHED SKILLS
              </h3>
              <div className="flex flex-wrap gap-2">
                {/* Green matched skills */}
                {resume.matched_skills?.map((skill, idx) => (
                  <span
                    key={`matched-${idx}`}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#dcfce7] dark:bg-[#122b1f] text-[#065f46] dark:text-[#34d399] border border-emerald-200/60 dark:border-[#1c4733]"
                  >
                    {skill}
                  </span>
                ))}

                {/* Neutral secondary skills */}
                {resume.secondary_skills?.map((skill, idx) => (
                  <span
                    key={`sec-${idx}`}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-[#181e1a] text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-[#242e27]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Section 3: EXPERIENCE */}
        <div className="mt-7">
          <h3 className="text-xs font-bold tracking-wider text-gray-800 dark:text-gray-200 uppercase mb-3">
            EXPERIENCE
          </h3>

          {/* Structured Experience Entries */}
          {resume.experience_entries && resume.experience_entries.length > 0 ? (
            <div className="space-y-6">
              {resume.experience_entries.map((entry, idx) => (
                <div key={idx}>
                  {/* Role Title and Duration Row */}
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                      {entry.title}
                    </h4>
                    {entry.duration && (
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
                        {entry.duration}
                      </span>
                    )}
                  </div>

                  {/* Company Name */}
                  {entry.company && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2.5">
                      {entry.company}
                    </p>
                  )}

                  {/* Bullets with Inline Diff View */}
                  <ul className="space-y-2 mt-2">
                    {entry.bullets.map((bullet, bIdx) => renderBullet(bullet, bIdx))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            /* Fallback flat experience highlights */
            <div className="mt-2 space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              {resume.experience_highlights?.map((highlight, idx) => {
                const isModified =
                  diffViewActive &&
                  (highlight.includes("demonstrating") ||
                    highlight.includes("innovative") ||
                    highlight.includes("expertise"));

                return (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-gray-400 dark:text-gray-600 select-none mt-1 shrink-0">•</span>
                    <div>
                      {isModified ? (
                        <div>
                          <div className="line-through text-gray-400 dark:text-gray-500 select-none">
                            {highlight.replace(/,\s*demonstrating\s*technical\s*expertise,*/gi, "")}
                          </div>
                          <div className="bg-[#dcfce7] dark:bg-[#0e2c1e] text-[#065f46] dark:text-[#4ade80] border border-transparent dark:border-[#184832] px-1.5 py-0.5 rounded mt-0.5 inline-block font-medium">
                            {highlight}
                          </div>
                        </div>
                      ) : (
                        <span>{highlight}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 4: EDUCATION */}
        {resume.education && resume.education.length > 0 && (
          <div className="mt-7 pt-5 border-t border-gray-100 dark:border-[#1c2621]">
            <h3 className="text-xs font-bold tracking-wider text-gray-800 dark:text-gray-200 uppercase mb-3">
              EDUCATION
            </h3>
            <div className="space-y-3">
              {resume.education.map((edu, idx) => {
                if (typeof edu === "object" && edu !== null) {
                  return (
                    <div key={idx}>
                      <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                        {edu.degree}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {edu.institution} {edu.duration ? `• ${edu.duration}` : ""}
                      </p>
                    </div>
                  );
                }
                return (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <span className="text-gray-400 select-none">•</span>
                    <span>{edu}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 5: ADDITIONAL INFORMATION (if present) */}
        {resume.additional_information && resume.additional_information.length > 0 && (
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-[#1c2621]">
            <h3 className="text-xs font-bold tracking-wider text-gray-800 dark:text-gray-200 uppercase mb-2">
              ADDITIONAL INFORMATION
            </h3>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {resume.additional_information.map((info, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400 select-none">•</span>
                  <span>{info}</span>
                </div>
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
