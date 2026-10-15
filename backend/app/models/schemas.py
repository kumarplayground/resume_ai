from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class ScoreData(BaseModel):
    match_score: int = Field(..., description="Match percentage against JD, 0-100")
    match_badge: str = Field(..., description="E.g. Needs work, Moderate, Great match, Strong match")
    ats_score: int = Field(..., description="ATS readiness score, 0-100")
    ats_badge: str = Field(..., description="E.g. Excellent, Good, Fair")
    original_match_score: Optional[int] = Field(None, description="Original match percentage before tailoring")

class DiffItem(BaseModel):
    section: str
    original: str
    tailored: str
    change_type: str = "modified"  # modified, added, unchanged

class DiffBullet(BaseModel):
    model_config = {"extra": "ignore"}
    original: Optional[str] = None
    tailored: Optional[str] = ""
    is_modified: Optional[bool] = False

class ExperienceEntry(BaseModel):
    model_config = {"extra": "ignore"}
    title: Optional[str] = ""
    company: Optional[str] = ""
    duration: Optional[str] = ""
    bullets: List[Any] = []

class EducationEntry(BaseModel):
    model_config = {"extra": "ignore"}
    degree: Optional[str] = ""
    institution: Optional[str] = ""
    duration: Optional[str] = None

class TailoredResume(BaseModel):
    model_config = {"extra": "ignore"}
    candidate_name: Optional[str] = "Candidate"
    target_role: Optional[str] = "Professional"
    email: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    header_tags: List[Any] = []
    career_objective: Optional[str] = None
    original_summary: Optional[str] = None
    professional_summary: Optional[str] = ""
    matched_skills: List[Any] = []
    secondary_skills: List[Any] = []
    all_skills: List[Any] = []
    experience_highlights: List[Any] = []
    experience_entries: List[Any] = []
    education: List[Any] = []
    additional_information: List[Any] = []
    raw_markdown: Optional[str] = ""

class TailorResponse(BaseModel):
    success: bool = True
    message: str = "Your tailored resume is ready."
    filename: Optional[str] = None
    filesize_kb: Optional[float] = None
    scores: ScoreData
    missing_keywords: List[str] = []
    tailored_resume: TailoredResume
    original_resume_text: str
    diff_items: List[DiffItem] = []
    cover_letter: Optional[str] = None
    is_ai_generated: bool = False
    llm_provider: str = "local"

class CoverLetterRequest(BaseModel):
    resume_text: str
    job_description: str
    candidate_name: Optional[str] = "Candidate"
    company_name: Optional[str] = None
    target_role: Optional[str] = None
    gemini_api_key: Optional[str] = None

class CoverLetterResponse(BaseModel):
    success: bool = True
    cover_letter_text: str
    company_name: Optional[str] = None
    target_role: Optional[str] = None

class SampleDataResponse(BaseModel):
    sample_resume_filename: str
    sample_resume_size_kb: float
    sample_resume_text: str
    sample_job_description: str
