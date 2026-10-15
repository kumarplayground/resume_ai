import io
import re
from typing import Tuple, Dict, Any, List

def clean_extracted_text(text: str) -> str:
    """Normalize whitespace and remove non-printable characters."""
    if not text:
        return ""
    # Replace carriage returns
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse 3+ newlines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Strip trailing whitespace on each line
    lines = [line.strip() for line in text.split("\n")]
    return "\n".join(lines).strip()

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pypdf with fallback."""
    text_content = []
    
    # Try pypdf first
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
    except Exception as e:
        print(f"pypdf extraction warning: {e}")
        
    # If pypdf extracted minimal or no text, try pdfplumber
    if not text_content or len("".join(text_content).strip()) < 50:
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                plumber_texts = []
                for page in pdf.pages:
                    pt = page.extract_text()
                    if pt:
                        plumber_texts.append(pt)
                if plumber_texts:
                    text_content = plumber_texts
        except Exception as e:
            print(f"pdfplumber extraction warning: {e}")

    extracted = "\n\n".join(text_content)
    return clean_extracted_text(extracted)

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        
        # Also extract table text if any
        table_texts = []
        for table in doc.tables:
            for row in table.rows:
                row_cells = [c.text.strip() for c in row.cells if c.text.strip()]
                if row_cells:
                    table_texts.append(" | ".join(row_cells))
                    
        combined = "\n".join(paragraphs)
        if table_texts:
            combined += "\n\n" + "\n".join(table_texts)
        return clean_extracted_text(combined)
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX file: {str(e)}")

def parse_resume_file(file_bytes: bytes, filename: str) -> str:
    """Parse resume from uploaded bytes based on filename extension."""
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        text = extract_text_from_pdf(file_bytes)
    elif lower_name.endswith(".docx") or lower_name.endswith(".doc"):
        text = extract_text_from_docx(file_bytes)
    else:
        # Try as plain text fallback
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text = file_bytes.decode("latin-1")
            except Exception:
                raise ValueError("Unsupported file format. Please upload a PDF or DOCX file.")
                
    if not text or len(text.strip()) < 30:
        raise ValueError("Could not extract readable text from the uploaded resume. Please ensure it is not an image-only/scanned document.")
        
    return text

def extract_candidate_metadata(text: str) -> Dict[str, Any]:
    """Basic extraction of email, phone, and potential name."""
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    
    email = email_match.group(0) if email_match else ""
    phone = phone_match.group(0) if phone_match else ""
    
    first_lines = [l.strip() for l in text.split("\n") if l.strip()][:5]
    name = "Candidate"
    for line in first_lines:
        if len(line.split()) in [2, 3] and not re.search(r'[@0-9]|resume|curriculum', line, re.IGNORECASE):
            name = line
            break
            
    return {
        "name": name,
        "email": email,
        "phone": phone
    }
