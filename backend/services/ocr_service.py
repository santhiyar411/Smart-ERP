import os
from pathlib import Path


def extract_text_from_uploaded_file(file_storage):
    filename = (getattr(file_storage, "filename", "") or "").lower()
    ext = Path(filename).suffix.lower()

    if hasattr(file_storage, "stream") and file_storage.stream is not None:
        try:
            file_storage.stream.seek(0)
        except Exception:
            pass

    if ext == ".pdf":
        try:
            from pypdf import PdfReader
        except Exception:
            try:
                from PyPDF2 import PdfReader
            except Exception as exc:
                return f"PDF text extraction unavailable: {exc}"

        temp_path = None
        try:
            upload_dir = os.path.join(os.getcwd(), "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            temp_path = os.path.join(upload_dir, f"tmp_{os.getpid()}_{Path(filename).name}")
            file_storage.save(temp_path)

            reader = PdfReader(temp_path)
            text_parts = []
            for page in reader.pages:
                text = page.extract_text() or ""
                if text:
                    text_parts.append(text)

            return "\n".join(text_parts).strip() if text_parts else "No readable text found in PDF."
        except Exception as exc:
            return f"PDF text extraction failed: {exc}"
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    if ext in {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif"}:
        try:
            from PIL import Image
            import pytesseract
        except Exception as exc:
            return f"Image OCR unavailable: {exc}"

        temp_path = None
        try:
            upload_dir = os.path.join(os.getcwd(), "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            temp_path = os.path.join(upload_dir, f"tmp_{os.getpid()}_{Path(filename).name}")
            file_storage.save(temp_path)

            text = pytesseract.image_to_string(Image.open(temp_path))
            return text.strip() or "No text detected in image."
        except Exception as exc:
            return f"Image OCR failed: {exc}"
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    return "Unsupported file type. Please upload a PDF or image."