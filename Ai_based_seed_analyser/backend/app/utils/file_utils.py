import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile
from app.core.config import settings

def ensure_upload_dirs():
    orig_dir = Path(settings.UPLOAD_DIR) / "original"
    ann_dir = Path(settings.UPLOAD_DIR) / "annotated"
    orig_dir.mkdir(parents=True, exist_ok=True)
    ann_dir.mkdir(parents=True, exist_ok=True)
    return orig_dir, ann_dir

def generate_unique_filename(extension: str) -> str:
    if not extension.startswith('.'):
        extension = f".{extension}"
    return f"{uuid.uuid4().hex}{extension}"

def get_file_extension(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return ext if ext else ".jpg"
