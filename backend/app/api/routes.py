import io
import re
import json
import time
import secrets
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response, Request
from fastapi.responses import StreamingResponse

from app.config import settings, save_gemini_api_key
from app.models.schemas import (
    TailorResponse,
    CoverLetterRequest,
    CoverLetterResponse,
    SampleDataResponse,
    TailoredResume
)
from app.services.parser import parse_resume_file
from app.services.llm_service import customize_resume, generate_cover_letter_text
from app.services.exporter import (
    generate_pdf_resume,
    generate_docx_resume,
    generate_txt_resume
)

router = APIRouter()

# Exact sample resume matching the user's UI/UX screenshot
SAMPLE_RESUME_TEXT = """Rahul Kumar
CAREER OBJECTIVE
To obtain a challenging position as an Electronics Engineer where I can apply my knowledge of embedded systems, circuit design, and programming. I aim to contribute to innovative projects, continually enhance my technical skills, and support organizational growth through efficient problem-solving and hands-on engineering work.

EDUCATION & QUALIFICATIONS
2015 - 2018 Intermediate (Mathematics)
BRIGH IN NIKETAN I C OBRA SONEBHADRA

2018 - 2021 Three-Year Diploma Engineering (Electronics)
LUCKNOW POLYTECHNIC LUCKNOW, LUCKNOW

2013 - 2015 High School (Science)
BRIGH IN NIKETAN I C OBRA SONEBHADRA

CONTACT INFORMATION
Email: rahulsumesh797@gmail.com
Mob No: 8400300797
Address: Agrawal Nagar, Obra Sonebhadra (UP)
Languages: English, Hindi

PROFESSIONAL EXPERIENCE
Dec 2018 - Aug 2020: Energies IT Services Pvt. Noida
Customer Support Executive (Paytm Process)
• Handled Paytm recharge-related queries via email support, resolving transaction issues and ensuring smooth payment processing while maintaining service quality.

Oct 2020 - Nov 2021: Tech Mahindra Pvt. Limited Noida
Customer Support Executive (Flipkart Process)
• Provided technical and non-technical support for Flipkart customers via calls and emails, resolving order, payment, and product-related issues while ensuring high customer satisfaction.

TECHNICAL PROJECTS
Vehicle Detection & Counting Software (Python, OpenCV, PySerial)
• Developed a full-stack remote-based vehicle detection system with real-time counting, GUI interface, and database storage. Integrated OV7670 camera feeder and used YOLO for object detection.

Metal Detector Robot Vehicle [College Project]
• Developed a mobile vehicle equipped with a metal detector module and controlled via Bluetooth using an Android smartphone app for remote navigation and detection.

TECHNICAL SKILLS & CERTIFICATIONS
• Embedded Systems & Microcontrollers (AVR)
• Embedded C / C++ Programming
• Sensor Integration, Bluetooth (HC-05)
• Software Development & Computer Vision (OpenCV, YOLO)
• Python Programming & Database Management (DBMS)
• Microsoft Excel & PowerPoint
• Hardware & Networking
• Google Play Store Listing Certificate of Excellence in Flutter Development
"""

# Exact sample JD matching the user's UI/UX screenshot
SAMPLE_JD_TEXT = """Strategic alliances with Harley-Davidson and Zero Motorcycles support the design and development of premium and electric motorcycles, respectively. Further demonstrating its commitment to the EV future, the Company has made strategic investments in two- and three-wheeler EV manufacturers, Ather Energy and Euler Motors. Hero MotoCorp is the only Indian two-wheeler manufacturer listed on the prestigious Dow Jones Sustainability Index (DJSI).

Hero MotoCorp's Executive Chairman, Dr. Pawan Munjal, was named to the 2023 TIME100 Climate List of the 100 most influential leaders driving business climate action.

Beyond mobility, Hero MotoCorp is a major global promoter of sports, including golf, football, field hockey, and cricket. Hero MotoSports Team Rally is India's flag bearer in global rally racing.

Requirements & Responsibilities:
• Lead technical design and development of electric vehicle systems, telemetry, and mobility electronics.
• Collaborate on microcontroller firmware, sensor integration (Bluetooth, wireless modules), and diagnostic instrumentation.
• Apply robust problem-solving, circuit design, and embedded software practices to ensure vehicle safety and efficiency.
• Demonstrate proficiency in Python, C++, communication protocols, and hardware diagnostics.
• Strong analytical, documentation, and cross-functional communication abilities.
"""

@router.get("/health")
def health_check():
    return {"status": "ok", "app": "Align Resume Studio Backend"}

@router.get("/sample-data", response_model=SampleDataResponse)
def get_sample_data():
    """Returns sample resume and JD matching the UI/UX mockups."""
    return SampleDataResponse(
        sample_resume_filename="electronics_engineer (1).pdf",
        sample_resume_size_kb=47.6,
        sample_resume_text=SAMPLE_RESUME_TEXT,
        sample_job_description=SAMPLE_JD_TEXT
    )

@router.get("/settings/status")
def get_settings_status():
    """Check whether a Gemini API key is configured and active."""
    return {
        "has_gemini_key": bool(settings.GEMINI_API_KEY),
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL
    }

@router.post("/settings/gemini-key")
def update_gemini_key_endpoint(payload: dict):
    """Set or update the Gemini API key."""
    key = payload.get("api_key", "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key is required.")
    success = save_gemini_api_key(key)
    return {"success": success, "message": "Gemini API key saved successfully."}

@router.post("/customize", response_model=TailorResponse)
async def customize_resume_endpoint(
    request: Request,
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    job_description: str = Form(...),
    gemini_api_key: Optional[str] = Form(None),
):
    """
    Accepts either an uploaded resume file (PDF or DOCX) or raw resume text,
    validates the inputs, parses content, and tailors the resume to the JD using Gemini AI.
    """
    if not job_description or len(job_description.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Job description must be at least 50 characters long."
        )

    parsed_resume_text = ""
    filename = "pasted_resume.txt"
    filesize_kb = 0.0

    if file:
        filename = file.filename
        lower_name = filename.lower()
        if not (lower_name.endswith(".pdf") or lower_name.endswith(".docx") or lower_name.endswith(".doc")):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format for '{filename}'. Please upload a valid PDF or DOCX file."
            )

        content = await file.read()
        filesize_kb = round(len(content) / 1024, 1)

        # File size check: 10MB limit
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File size exceeds the 10 MB limit."
            )

        try:
            parsed_resume_text = parse_resume_file(content, filename)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse resume: {str(e)}"
            )
    elif resume_text and len(resume_text.strip()) >= 30:
        parsed_resume_text = resume_text.strip()
        filesize_kb = round(len(parsed_resume_text.encode('utf-8')) / 1024, 1)
        filename = "pasted_resume.txt"
    else:
        raise HTTPException(
            status_code=400,
            detail="Please upload a resume file (PDF or DOCX) to continue."
        )

    # Determine active Gemini API Key
    header_key = request.headers.get("x-gemini-api-key")
    active_key = (gemini_api_key or header_key or "").strip() or None

    # Perform tailoring and score calculations
    try:
        result = customize_resume(parsed_resume_text, job_description, api_key=active_key)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while customizing the resume: {str(e)}"
        )

    return TailorResponse(
        success=True,
        message=result.get("message", "Your tailored resume is ready."),
        filename=filename,
        filesize_kb=filesize_kb,
        scores=result["scores"],
        missing_keywords=result["missing_keywords"],
        tailored_resume=result["tailored_resume"],
        original_resume_text=parsed_resume_text,
        diff_items=result["diff_items"],
        cover_letter=result.get("cover_letter"),
        is_ai_generated=result["is_ai_generated"],
        llm_provider=result["llm_provider"]
    )

@router.post("/cover-letter", response_model=CoverLetterResponse)
def generate_cover_letter(payload: CoverLetterRequest):
    """Generate tailored cover letter using Gemini AI based on resume and JD."""
    if not payload.job_description or not payload.resume_text:
        raise HTTPException(
            status_code=400,
            detail="Both resume and job description are required."
        )

    cover_letter = generate_cover_letter_text(
        resume_text=payload.resume_text,
        jd_text=payload.job_description,
        candidate_name=payload.candidate_name or "Candidate",
        target_role=payload.target_role or "Electronics / Systems Engineer",
        company_name=payload.company_name,
        api_key=payload.gemini_api_key
    )

    return CoverLetterResponse(
        success=True,
        cover_letter_text=cover_letter,
        company_name=payload.company_name,
        target_role=payload.target_role
    )

from urllib.parse import quote

def get_safe_resume_filename(resume: TailoredResume, ext: str) -> str:
    raw_name = (resume.candidate_name or "Tailored").strip()
    safe_name = re.sub(r'[^\w\s-]', '', raw_name).strip()
    safe_name = re.sub(r'\s+', '_', safe_name) or "Tailored"
    return f"{safe_name}_Resume.{ext}"

def make_content_disposition(filename: str) -> str:
    encoded = quote(filename)
    return f'attachment; filename="{filename}"; filename*=UTF-8\'\'{encoded}'

@router.post("/export/pdf")
def export_pdf(resume: TailoredResume):
    """Export tailored resume as styled PDF document."""
    pdf_bytes = generate_pdf_resume(resume)
    filename = get_safe_resume_filename(resume, "pdf")
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": make_content_disposition(filename),
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.post("/export/docx")
def export_docx(resume: TailoredResume):
    """Export tailored resume as formatted Microsoft Word document."""
    docx_bytes = generate_docx_resume(resume)
    filename = get_safe_resume_filename(resume, "docx")
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": make_content_disposition(filename),
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.post("/export/txt")
def export_txt(resume: TailoredResume):
    """Export tailored resume as plain text document."""
    txt_bytes = generate_txt_resume(resume)
    filename = get_safe_resume_filename(resume, "txt")
    return StreamingResponse(
        io.BytesIO(txt_bytes),
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": make_content_disposition(filename),
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.post("/export/download")
def export_download_form(
    resume_json: str = Form(...),
    format: str = Form("pdf")
):
    """Native browser form download endpoint ensuring standard HTTP Content-Disposition attachment."""
    fmt = (format or "pdf").lower().strip()
    try:
        data = json.loads(resume_json)
        resume = TailoredResume(**data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid resume data: {e}")

    filename = get_safe_resume_filename(resume, fmt)
    if fmt == "docx":
        content = generate_docx_resume(resume)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif fmt == "txt":
        content = generate_txt_resume(resume)
        media_type = "text/plain; charset=utf-8"
    else:
        content = generate_pdf_resume(resume)
        media_type = "application/pdf"

    return StreamingResponse(
        io.BytesIO(content),
        media_type=media_type,
        headers={
            "Content-Disposition": make_content_disposition(filename),
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

# In-memory download cache for reliable, direct HTTP file downloads
# Maps token -> {"content": bytes, "media_type": str, "filename": str, "expires_at": float}
DOWNLOAD_CACHE = {}

def clean_download_cache():
    now = time.time()
    expired = [k for k, v in DOWNLOAD_CACHE.items() if v.get("expires_at", 0) < now]
    for k in expired:
        DOWNLOAD_CACHE.pop(k, None)
    # Bounded cache: purge oldest entries if over capacity
    if len(DOWNLOAD_CACHE) > 50:
        sorted_keys = sorted(DOWNLOAD_CACHE.keys(), key=lambda k: DOWNLOAD_CACHE[k].get("expires_at", 0))
        for old_key in sorted_keys[: len(DOWNLOAD_CACHE) - 50]:
            DOWNLOAD_CACHE.pop(old_key, None)

@router.post("/export/prepare")
def export_prepare(payload: dict):
    """
    Prepares a resume download file and returns a direct HTTP URL ending with the
    proper filename (e.g., /api/export/file/Rahul_Kumar_Resume.pdf?token=...).
    This guarantees that all browsers (specifically Google Chrome) and Chrome download extensions
    recognize the true file extension and name, completely bypassing blob UUID naming issues.
    """
    clean_download_cache()
    
    resume_data = payload.get("resume")
    if not resume_data and "resume_json" in payload:
        try:
            resume_data = json.loads(payload["resume_json"])
        except Exception:
            resume_data = None

    if not resume_data:
        raise HTTPException(status_code=400, detail="Missing resume data.")

    try:
        resume = TailoredResume(**resume_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid resume data: {e}")

    fmt = str(payload.get("format", "pdf")).lower().strip()
    filename = get_safe_resume_filename(resume, fmt)

    if fmt == "docx":
        content = generate_docx_resume(resume)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif fmt == "txt":
        content = generate_txt_resume(resume)
        media_type = "text/plain; charset=utf-8"
    else:
        content = generate_pdf_resume(resume)
        media_type = "application/pdf"

    # 256-bit cryptographically secure URL-safe token
    token = secrets.token_urlsafe(32)
    DOWNLOAD_CACHE[token] = {
        "content": content,
        "media_type": media_type,
        "filename": filename,
        "expires_at": time.time() + 300  # Strict 5 minutes validity
    }

    return {
        "success": True,
        "token": token,
        "filename": filename,
        "download_url": f"/api/export/file/{filename}?token={token}"
    }

@router.get("/export/file/{filename}")
def export_file_get(filename: str, token: str):
    """
    Direct HTTP file download endpoint. Because the URL path itself ends with the
    proper filename and extension, Google Chrome and Chrome download extensions
    are guaranteed to name and categorize the file correctly without falling back to UUIDs.
    """
    clean_download_cache()
    
    entry = DOWNLOAD_CACHE.get(token)
    if not entry or entry.get("expires_at", 0) < time.time():
        DOWNLOAD_CACHE.pop(token, None)
        raise HTTPException(status_code=404, detail="Download link expired or invalid. Please click download again.")

    # Strict isolation check: validate that requested filename matches cached file
    safe_target_name = entry.get("filename")
    if filename != safe_target_name:
        raise HTTPException(status_code=404, detail="File not found or token mismatch.")

    # Accelerate post-access expiration to 30 seconds to prevent reuse
    entry["expires_at"] = min(entry["expires_at"], time.time() + 30)

    return StreamingResponse(
        io.BytesIO(entry["content"]),
        media_type=entry["media_type"],
        headers={
            "Content-Disposition": make_content_disposition(safe_target_name),
            "Content-Length": str(len(entry["content"])),
            "Access-Control-Expose-Headers": "Content-Disposition, Content-Length, Content-Type",
            "Cache-Control": "no-cache, no-store, must-revalidate"
        }
    )


