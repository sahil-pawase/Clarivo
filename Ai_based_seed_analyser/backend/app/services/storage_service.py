import os
import cv2
import numpy as np
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Tuple, Optional
from app.core.config import settings
from app.utils.file_utils import ensure_upload_dirs, generate_unique_filename

class BaseStorageService(ABC):
    @abstractmethod
    def save_images(
        self, original_bytes: bytes, annotated_bgr: np.ndarray, ext: str
    ) -> Tuple[str, str, str, str]:
        pass

    @abstractmethod
    def delete_images(self, orig_path: str, ann_path: Optional[str]) -> bool:
        pass

class LocalStorageService(BaseStorageService):
    def __init__(self):
        self.orig_dir, self.ann_dir = ensure_upload_dirs()

    def save_images(
        self, original_bytes: bytes, annotated_bgr: np.ndarray, ext: str = ".jpg"
    ) -> Tuple[str, str, str, str]:
        """
        Saves original and annotated images to local filesystem.
        Returns (orig_rel_path, ann_rel_path, orig_url, ann_url)
        """
        orig_filename = generate_unique_filename(ext)
        ann_filename = f"annotated_{orig_filename}"

        orig_full_path = self.orig_dir / orig_filename
        ann_full_path = self.ann_dir / ann_filename

        # Write original bytes
        with open(orig_full_path, "wb") as f:
            f.write(original_bytes)

        # Write annotated image with OpenCV
        cv2.imwrite(str(ann_full_path), annotated_bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])

        # Relative paths for DB storage
        orig_rel = f"original/{orig_filename}"
        ann_rel = f"annotated/{ann_filename}"

        # URLs for client consumption
        orig_url = f"{settings.STATIC_URL_PREFIX}/{orig_rel}"
        ann_url = f"{settings.STATIC_URL_PREFIX}/{ann_rel}"

        return str(orig_full_path), str(ann_full_path), orig_url, ann_url

    def delete_images(self, orig_path: str, ann_path: Optional[str]) -> bool:
        try:
            if orig_path and os.path.exists(orig_path):
                os.remove(orig_path)
            if ann_path and os.path.exists(ann_path):
                os.remove(ann_path)
            return True
        except Exception:
            return False

storage_service = LocalStorageService()
