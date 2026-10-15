export interface ScoreData {
  match_score: number;
  match_badge: string;
  ats_score: number;
  ats_badge: string;
  original_match_score?: number;
}

export interface DiffItem {
  section: string;
  original: string;
  tailored: string;
  change_type: "modified" | "added" | "unchanged";
}

export interface DiffBullet {
  original?: string;
  tailored: string;
  is_modified?: boolean;
}

export interface ExperienceEntry {
  title?: string;
  company?: string;
  duration?: string;
  bullets: (string | DiffBullet)[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  duration?: string;
}

export interface TailoredResume {
  candidate_name: string;
  target_role: string;
  email?: string;
  location?: string;
  linkedin?: string;
  header_tags: string[];
  career_objective?: string;
  original_summary?: string;
  professional_summary: string;
  matched_skills: string[];
  secondary_skills?: string[];
  all_skills: string[];
  experience_highlights: string[];
  experience_entries: ExperienceEntry[];
  education: (string | EducationEntry)[];
  additional_information: string[];
  raw_markdown?: string;
}

export interface TailorResponse {
  success: boolean;
  message: string;
  filename?: string;
  filesize_kb?: number;
  scores: ScoreData;
  missing_keywords: string[];
  tailored_resume: TailoredResume;
  original_resume_text: string;
  diff_items: DiffItem[];
  cover_letter?: string;
  is_ai_generated: boolean;
  llm_provider: string;
}

export interface SampleDataResponse {
  sample_resume_filename: string;
  sample_resume_size_kb: number;
  sample_resume_text: string;
  sample_job_description: string;
}

export interface CoverLetterResponse {
  success: boolean;
  cover_letter_text: string;
  company_name?: string;
  target_role?: string;
}
