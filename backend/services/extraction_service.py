import re
from pathlib import Path


def _normalize_name(name):
    if not name:
        return None

    name = re.sub(r"[_\-.]+", " ", name).strip()
    name = re.sub(r"\s+", " ", name).strip()
    name = re.sub(r"^[^A-Za-z]+|[^A-Za-z]+$", "", name)

    if not name:
        return None

    return name.title()


def _infer_name_from_filename(source_name):
    if not source_name:
        return None

    stem = Path(source_name).stem

    stem = re.sub(r"\([^)]*\)", " ", stem)
    stem = re.sub(r"\b\d+\b", " ", stem)
    stem = re.sub(r"[-_\.]+", " ", stem)
    stem = re.sub(r"\b(resume|cv|profile|document|pdf|doc|docx)\b", " ", stem, flags=re.I)
    stem = re.sub(r"\s+", " ", stem).strip()

    if not stem or not re.search(r"[A-Za-z]", stem):
        return None

    words = re.findall(r"[A-Za-z]+", stem)
    if not words:
        return None

    generic_terms = {
        "resume", "cv", "profile", "document", "pdf", "doc", "docx",
        "final", "latest", "updated", "draft", "copy", "version"
    }
    if any(word.lower() in generic_terms for word in words):
        return None

    return _normalize_name(stem)


def _looks_like_name(candidate):
    cleaned = re.sub(r"\s+", " ", candidate or "").strip()
    if not cleaned:
        return False

    lowered = cleaned.lower()

    if len(cleaned) <= 2 or len(cleaned.split()) > 3:
        return False
    if ":" in cleaned or "@" in cleaned:
        return False
    if any(ch in cleaned for ch in [",", "/", "\\", "(", ")", "|", "&", "[", "]", "{", "}", ";"]):
        return False
    if re.search(r"\d", cleaned):
        return False
    if len(re.findall(r"[A-Za-z]", cleaned)) < 2:
        return False

    forbidden_terms = {
        "resume", "cv", "objective", "internship", "summary", "skills", "experience",
        "education", "contact", "phone", "email", "linkedin", "github", "projects",
        "certifications", "achievements", "hobbies", "references", "technologies",
        "programming", "database", "tools", "soft", "technical", "problem", "solving",
        "communication", "teamwork", "adaptability", "management", "learning",
        "confusion", "matrix", "student", "engineering", "college", "school",
        "university", "department", "faculty", "certificate", "application",
        "developer", "intern", "system"
    }

    if any(term in lowered for term in forbidden_terms):
        return False

    tokens = re.findall(r"[A-Za-z]+", cleaned)
    if not tokens:
        return False

    if any(token.lower() in {"and", "of", "the", "for"} for token in tokens):
        return False

    return cleaned.isupper() or bool(re.search(r"[A-Z][a-z]", cleaned))


def extract_certifications(text):
    certs = []
    lines = text.splitlines()
    cert_keywords = ["certified", "certification", "certificate", "credential", "license"]
    for line in lines:
        line_strip = line.strip()
        if len(line_strip) < 3 or len(line_strip) > 100:
            continue
        if any(kw in line_strip.lower() for kw in cert_keywords):
            cleaned = re.sub(r"^[*+\-\s•\d.]+", "", line_strip).strip()
            # Avoid section headers
            if cleaned.lower() in ["certifications", "certificates", "certification & licenses", "licenses & certifications"]:
                continue
            certs.append(cleaned)
    return list(dict.fromkeys(certs)) if certs else []


def extract_experience(text):
    # Try searching for years of experience
    match = re.search(r"(\b\d+\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience\b)", text, re.I)
    if match:
        return match.group(1).strip()

    # Try searching for "Experience" section
    lines = text.splitlines()
    exp_header = False
    exp_lines = []
    for line in lines:
        line_strip = line.strip()
        if re.search(r"^(?:work\s+|professional\s+)?experience\b", line_strip, re.I):
            exp_header = True
            continue
        if exp_header:
            # Stop when hitting another header
            if re.search(r"^(?:education|skills|certifications|projects|summary|about|languages|contact)\b", line_strip, re.I):
                break
            if line_strip:
                exp_lines.append(line_strip)
                if len(exp_lines) >= 4:
                    break

    if exp_lines:
        return "\n".join(exp_lines).strip()
    return None


def extract_employee_info(text, source_name=None):
    if not text:
        return {
            "name": None,
            "email": None,
            "phone": None,
            "skills": [],
            "degree": None,
            "certifications": [],
            "experience": None,
            "raw_text": ""
        }

    text = str(text)

    # 1. Email Extraction
    email_matches = re.findall(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text)
    email = email_matches[0] if email_matches else None

    # 2. Phone Extraction (returning None instead of N/A if missing)
    phone_matches = re.findall(r"(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)", text)
    phone = None
    for candidate in phone_matches:
        digits = re.sub(r"\D", "", candidate)
        if len(digits) >= 10:
            phone = candidate.strip()
            break

    # 3. Name Extraction
    name = None
    filename_name = _infer_name_from_filename(source_name)
    if filename_name and _looks_like_name(filename_name):
        name = filename_name

    if not name:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        scored_names = []
        for index, line in enumerate(lines[:12]):
            cleaned = re.sub(r"\s+", " ", line).strip()
            if not _looks_like_name(cleaned):
                continue

            score = 0
            if cleaned.isupper():
                score += 4
            if len(cleaned.split()) <= 2:
                score += 2
            if index <= 6:
                score += 2
            if len(cleaned.split()) == 2:
                score += 1
            if re.search(r"[A-Z][a-z]", cleaned):
                score += 1

            scored_names.append((score, cleaned))

        if scored_names:
            _, best_name = max(scored_names, key=lambda item: item[0])
            name = best_name

    if not name and email:
        local = email.split("@")[0]
        local = re.sub(r"\d+", "", local)
        name = local.replace(".", " ").replace("_", " ")

    name = _normalize_name(name)

    # 4. Skills Dictionary matching: case-insensitive & exact boundaries
    SKILL_MAP = {
        "python": "Python",
        "java": "Java",
        "c\\+\\+": "C++",
        "sql": "SQL",
        "react": "React",
        "node\\.js": "Node.js",
        "node": "Node.js",
        "express\\.js": "Express.js",
        "express": "Express.js",
        "mongodb": "MongoDB",
        "postgresql": "PostgreSQL",
        "postgres": "PostgreSQL",
        "flask": "Flask",
        "django": "Django",
        "machine\\s+learning": "Machine Learning",
        "deep\\s+learning": "Deep Learning",
        "data\\s+analytics": "Data Analytics",
        "power\\s+bi": "Power BI",
        "aws": "AWS",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "html": "HTML",
        "css": "CSS",
        "javascript": "JavaScript",
        "js": "JavaScript",
        "git": "Git",
        "rest\\s+api": "REST API",
        "tensorflow": "TensorFlow",
        "pytorch": "PyTorch",
        "mern\\s+stack": "MERN Stack",
        "mern": "MERN Stack",
        "ocr": "OCR",
        "tesseract": "OCR",
        "pymupdf": "OCR"
    }

    found_skills_set = set()
    for regex_pattern, skill_display in SKILL_MAP.items():
        if re.search(rf"\b{regex_pattern}\b", text, flags=re.I):
            found_skills_set.add(skill_display)

    found_skills = sorted(list(found_skills_set))

    # 5. Degree Extraction (e.g. Master, B.Tech, etc.)
    degree_patterns = [
        r"\b(B\.?Tech|BTech|B\.?E|BE|M\.?Tech|MTech|MBA|MCA|B\.?Sc|M\.?Sc|BCA|BBA|Ph\.?D|Bachelor\s+of\s+[A-Za-z]+|Master\s+of\s+[A-Za-z]+|BS\b|MS\b)\b"
    ]
    degree = None
    for pattern in degree_patterns:
        match = re.search(pattern, text, flags=re.I)
        if match:
            # Clean dot notations
            deg_val = match.group(0).upper().replace(".", "")
            if deg_val == "BS":
                degree = "B.Sc"
            elif deg_val == "MS":
                degree = "M.Sc"
            else:
                degree = match.group(0).strip()
            break

    # 6. Certifications
    certifications = extract_certifications(text)

    # 7. Experience
    experience = extract_experience(text)

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": found_skills,
        "degree": degree,
        "certifications": certifications,
        "experience": experience,
        "raw_text": text
    }