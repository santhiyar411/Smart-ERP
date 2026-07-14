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


def extract_employee_info(text, source_name=None):
    if not text:
        return {
            "name": None,
            "email": None,
            "phone_number": None,
            "skills": [],
            "degree": None,
        }

    text = str(text)

    email_matches = re.findall(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text)
    email = email_matches[0] if email_matches else None

    phone_matches = re.findall(r"(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)", text)
    phone = None
    for candidate in phone_matches:
        digits = re.sub(r"\D", "", candidate)
        if len(digits) >= 10:
            phone = candidate.strip()
            break

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
        name = _normalize_name(local.replace(".", " ").replace("_", " "))

    skills_keywords = [
        "python", "javascript", "react", "java", "sql", "flask", "django", "fastapi",
        "html", "css", "node", "typescript", "postgresql", "postgres", "mysql",
        "mongodb", "docker", "aws", "azure", "git", "linux", "bootstrap", "tailwind",
        "c++", "c#", "php", "pandas", "numpy", "pytorch", "tensorflow"
    ]

    found_skills = []
    for skill in skills_keywords:
        if re.search(rf"\b{re.escape(skill)}\b", text, flags=re.I):
            found_skills.append(skill.title())

    degree_patterns = [
        r"\b(B\.?Tech|BTech|B\.?E|BE|M\.?Tech|MTech|MBA|MCA|B\.?Sc|M\.?Sc|BCA|BBA|Ph\.?D)\b"
    ]
    degree = None
    for pattern in degree_patterns:
        match = re.search(pattern, text, flags=re.I)
        if match:
            degree = match.group(0).upper()
            break

    return {
        "name": _normalize_name(name),
        "email": email,
        "phone_number": phone,
        "skills": found_skills,
        "degree": degree,
    }