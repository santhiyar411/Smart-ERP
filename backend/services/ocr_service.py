import os
import io
import fitz  # PyMuPDF
from PIL import Image
import pytesseract
from pathlib import Path

# Configure pytesseract path for Windows if it exists at standard locations
tesseract_paths = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]
for p in tesseract_paths:
    if os.path.exists(p):
        pytesseract.pytesseract.tesseract_cmd = p
        break

def extract_text_from_file_path(file_path):
    """
    Extracts text from a given file path based on file extension.
    For PDF, tries text-based extraction first, falling back to scanned OCR if empty.
    """
    file_path = Path(file_path)
    filename = file_path.name
    ext = file_path.suffix.lower()

    print(f"[OCR LOG] Starting extraction for file: {filename}, type: {ext}")

    if ext == ".pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            text_parts = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
            
            raw_text = "\n".join(text_parts).strip()
            
            if not raw_text:
                print(f"[OCR LOG] No readable text found in PDF: {filename}. Triggering PyMuPDF + Tesseract OCR fallback.")
                doc = fitz.open(file_path)
                ocr_parts = []
                for index in range(len(doc)):
                    page = doc.load_page(index)
                    # Use relatively high DPI for OCR accuracy
                    pix = page.get_pixmap(dpi=150)
                    img_data = pix.tobytes("png")
                    img = Image.open(io.BytesIO(img_data))
                    page_text = pytesseract.image_to_string(img)
                    if page_text:
                        ocr_parts.append(page_text)
                raw_text = "\n".join(ocr_parts).strip()
                status = "scanned (OCR)"
            else:
                status = "text (pypdf)"
            
            return raw_text, status

        except Exception as exc:
            print(f"[OCR ERROR] PDF extraction failed: {exc}")
            return f"[PDF Extraction Error]: {str(exc)}", "failed"

    elif ext in {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif"}:
        try:
            img = Image.open(file_path)
            text = pytesseract.image_to_string(img)
            return text.strip(), "image (OCR)"
        except Exception as exc:
            print(f"[OCR ERROR] Image OCR failed: {exc}")
            return f"[Image OCR Error]: {str(exc)}", "failed"

    elif ext == ".txt":
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read().strip()
            return content, "text (raw)"
        except Exception as exc:
            return f"[TXT Read Error]: {str(exc)}", "failed"

    return "Unsupported file type. Please upload a PDF, TXT or Image file.", "unsupported"

def extract_text_from_uploaded_file(file_storage):
    """
    Deprecated/compatibility wrapper for Werkzeug FileStorage. Save first, process, and delete.
    """
    filename = (getattr(file_storage, "filename", "") or "").lower()
    if not filename:
        return "No filename provided", "failed"

    upload_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    temp_path = os.path.join(upload_dir, f"tmp_legacy_{os.getpid()}_{Path(filename).name}")
    
    try:
        file_storage.save(temp_path)
        text, status = extract_text_from_file_path(temp_path)
        return text
    except Exception as e:
        return f"Legacy upload processing failed: {e}"
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)