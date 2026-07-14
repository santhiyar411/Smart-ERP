import os
import uuid
from pathlib import Path

from werkzeug.utils import secure_filename


def upload_file(file_storage, upload_dir=None):
    if file_storage is None:
        raise ValueError("No file provided")

    filename = getattr(file_storage, "filename", None) or ""
    if not filename:
        raise ValueError("No file selected")

    safe_name = secure_filename(filename)
    if not safe_name:
        raise ValueError("Invalid file name")

    upload_dir = upload_dir or os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    ext = Path(safe_name).suffix.lower()
    stored_name = f"{uuid.uuid4().hex}{ext}"
    destination = os.path.join(upload_dir, stored_name)

    if hasattr(file_storage, "stream") and file_storage.stream is not None:
        try:
            file_storage.stream.seek(0)
        except Exception:
            pass

    file_storage.save(destination)

    return {
        "file_path": destination,
        "original_name": safe_name,
        "stored_name": stored_name,
    }