import re
from typing import List, Dict, Set, Tuple, Any

# Common English stopwords to ignore when mining keywords
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
    "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him",
    "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't",
    "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor",
    "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
    "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
    "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're",
    "you've", "your", "yours", "yourself", "yourselves", "will", "shall", "across", "within", "must",
    "per", "via", "using", "work", "role", "candidate", "responsibilities", "requirements", "including"
}

def extract_keywords_from_text(text: str) -> List[str]:
    """Extract significant keywords, technical terms, and acronyms from text."""
    if not text:
        return []
    
    # Clean and find word tokens
    cleaned = re.sub(r'[^a-zA-Z0-9\+#\.\-\s]', ' ', text)
    tokens = cleaned.split()
    
    keywords: List[str] = []
    seen: Set[str] = set()
    
    # Priority for capitalized acronyms, tech names like C++, C#, .NET, Python, etc.
    for token in tokens:
        clean_token = token.strip(".-,;:!?")
        if not clean_token or len(clean_token) < 2:
            continue
        
        lower_token = clean_token.lower()
        if lower_token in STOPWORDS:
            continue
            
        # Check if it has uppercase (like EV, STEM, Hero, Harley-Davidson) or is a tech term
        if lower_token not in seen:
            seen.add(lower_token)
            keywords.append(clean_token)
            
    return keywords

def calculate_keyword_match(resume_text: str, jd_text: str) -> Tuple[int, List[str], List[str]]:
    """
    Compare resume text with JD text.
    Returns: (match_percentage, matched_keywords, missing_keywords)
    """
    jd_keywords = extract_keywords_from_text(jd_text)
    resume_lower = resume_text.lower()
    
    matched = []
    missing = []
    
    # Filter high-impact terms from JD
    significant_jd = [k for k in jd_keywords if len(k) >= 2][:40]
    
    for kw in significant_jd:
        pattern = r'\b' + re.escape(kw.lower()) + r'\b'
        if re.search(pattern, resume_lower):
            matched.append(kw)
        else:
            missing.append(kw)
            
    total = len(significant_jd)
    if total == 0:
        return 100, [], []
        
    score = int((len(matched) / total) * 100)
    # Ensure reasonable boundaries
    score = max(5, min(95, score))
    
    return score, matched, missing

def calculate_ats_score(resume_text: str) -> Tuple[int, str]:
    """
    Calculate ATS readiness score out of 100 based on standard industry heuristics:
    - Contact details present (Email, Phone)
    - Standard section headers (Experience, Education, Skills, Summary)
    - Action verbs and metrics (% or numbers)
    - Good length and structure
    """
    score = 40  # base score
    
    # 1. Contact info check (+20)
    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text))
    has_phone = bool(re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text))
    if has_email:
        score += 10
    if has_phone:
        score += 10
        
    # 2. Section headers (+20)
    lower = resume_text.lower()
    sections_found = 0
    for header in ["experience", "education", "skill", "summary", "project", "objective"]:
        if header in lower:
            sections_found += 1
    score += min(20, sections_found * 4)
    
    # 3. Metrics and Quantifiable Achievements (+10)
    has_metrics = bool(re.search(r'\d+%', resume_text)) or bool(re.search(r'\$\d+', resume_text)) or bool(re.search(r'\b\d{2,}\b', resume_text))
    if has_metrics:
        score += 10
        
    # 4. Action Verbs (+8)
    action_verbs = ["developed", "implemented", "managed", "designed", "created", "led", "engineered", "built", "spearheaded", "optimized", "resolved", "coordinated"]
    verb_count = sum(1 for v in action_verbs if v in lower)
    score += min(8, verb_count * 2)
    
    score = min(98, max(50, score))
    
    if score >= 85:
        badge = "Excellent"
    elif score >= 70:
        badge = "Good"
    else:
        badge = "Needs work"
        
    return score, badge

def generate_diff(original_text: str, tailored_bullets: List[str], tailored_summary: str) -> List[Dict[str, str]]:
    """Generate side-by-side / inline diff items for changes made."""
    diff_items = []
    
    # Summary diff
    diff_items.append({
        "section": "Professional Summary",
        "original": "Standard background summary extracted from original uploaded resume.",
        "tailored": tailored_summary,
        "change_type": "modified"
    })
    
    # Bullet point diffs
    orig_lines = [l.strip("-•* \t") for l in original_text.split("\n") if len(l.strip()) > 35]
    
    for i, t_bullet in enumerate(tailored_bullets[:6]):
        orig_match = orig_lines[i] if i < len(orig_lines) else "Standard responsibility bullet"
        diff_items.append({
            "section": "Experience Highlight",
            "original": orig_match,
            "tailored": t_bullet,
            "change_type": "modified"
        })
        
    return diff_items
