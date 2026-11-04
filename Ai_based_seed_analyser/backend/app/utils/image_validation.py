import io
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Optional
from app.core.config import settings
from app.schemas.analysis import ImageQualityMetrics

SUPPORTED_MIME_TYPES = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/webp": [b"RIFF"]
}

def validate_image_header(content: bytes) -> bool:
    if len(content) < 12:
        return False
    # Check JPEG
    if content.startswith(b"\xff\xd8\xff"):
        return True
    # Check PNG
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return True
    # Check WEBP (RIFF....WEBP)
    if content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return True
    return False

def check_image_quality(image_bytes: bytes) -> Tuple[bool, ImageQualityMetrics, Optional[np.ndarray]]:
    """
    Validates image integrity and calculates blur, brightness, and contrast metrics.
    Returns (is_valid, metrics, cv2_image_bgr)
    """
    # 1. Size check
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(image_bytes) > max_bytes:
        return False, ImageQualityMetrics(
            blur_score=0.0, brightness=0.0, contrast=0.0,
            is_valid=False,
            issue_message=f"Image file size exceeds limit of {settings.MAX_IMAGE_SIZE_MB}MB."
        ), None

    # 2. Magic bytes / header check
    if not validate_image_header(image_bytes):
        return False, ImageQualityMetrics(
            blur_score=0.0, brightness=0.0, contrast=0.0,
            is_valid=False,
            issue_message="Invalid image format. Supported formats are JPG, PNG, and WEBP."
        ), None

    # 3. Decode into OpenCV image
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_bgr is None or img_bgr.size == 0:
        return False, ImageQualityMetrics(
            blur_score=0.0, brightness=0.0, contrast=0.0,
            is_valid=False,
            issue_message="Corrupted or unreadable image file."
        ), None

    height, width = img_bgr.shape[:2]
    if width < settings.MIN_IMAGE_DIMENSION or height < settings.MIN_IMAGE_DIMENSION:
        return False, ImageQualityMetrics(
            blur_score=0.0, brightness=0.0, contrast=0.0,
            is_valid=False,
            issue_message=f"Image resolution too low ({width}x{height}px). Minimum required is {settings.MIN_IMAGE_DIMENSION}x{settings.MIN_IMAGE_DIMENSION}px."
        ), None

    # 4. Convert to Grayscale for metrics
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # 4a. Blur estimation via Laplacian variance
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    blur_score = float(laplacian.var())

    # 4b. Brightness (Mean pixel luminance)
    brightness = float(np.mean(gray))

    # 4c. RMS Contrast (Standard deviation of luminance)
    contrast = float(np.std(gray))

    issue_message = None
    is_valid = True

    if brightness < settings.MIN_BRIGHTNESS:
        is_valid = False
        issue_message = "The image is too dark. Please capture the seeds under better lighting."
    elif brightness > settings.MAX_BRIGHTNESS:
        is_valid = False
        issue_message = "The image is overexposed (too bright). Please reduce direct glare or flash."
    elif contrast < settings.MIN_CONTRAST:
        is_valid = False
        issue_message = "The image lacks sufficient contrast between seeds and background."
    elif blur_score < settings.BLUR_THRESHOLD:
        is_valid = False
        issue_message = "The image is too blurry. Please hold the camera steady and refocus."

    metrics = ImageQualityMetrics(
        blur_score=round(blur_score, 2),
        brightness=round(brightness, 2),
        contrast=round(contrast, 2),
        is_valid=is_valid,
        issue_message=issue_message
    )

    return is_valid, metrics, img_bgr
