import cv2
import numpy as np

def preprocess_image(img_bgr: np.ndarray, target_size: int = 640) -> np.ndarray:
    """
    Standard preprocessing for AI vision models.
    Keeps aspect ratio and resizes if dimensions are excessively large (>2000px)
    to optimize inference throughput.
    """
    h, w = img_bgr.shape[:2]
    max_dim = max(h, w)
    
    if max_dim > 1920:
        scale = 1920 / max_dim
        new_w = int(w * scale)
        new_h = int(h * scale)
        return cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)
    
    return img_bgr
