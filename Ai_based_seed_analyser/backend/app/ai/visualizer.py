import cv2
import numpy as np
from typing import List, Dict
from app.schemas.analysis import SeedPredictionDetail

CLASS_COLORS: Dict[str, tuple] = {
    "healthy": (46, 204, 113),     # Emerald Green in BGR
    "damaged": (46, 46, 231),      # Crimson Red in BGR
    "discolored": (0, 165, 255),   # Amber/Orange in BGR
    "broken": (180, 105, 255),     # Purple/Magenta in BGR
    "other": (160, 160, 160)       # Slate Gray in BGR
}

def get_color_for_class(class_name: str) -> tuple:
    cn = class_name.lower().strip()
    for k, color in CLASS_COLORS.items():
        if k in cn:
            return color
    return CLASS_COLORS["other"]

def draw_seed_annotations(
    image_bgr: np.ndarray,
    predictions: List[SeedPredictionDetail],
    quality_score: float,
    grade: str
) -> np.ndarray:
    annotated = image_bgr.copy()
    h, w = annotated.shape[:2]

    # Calculate proportional font scaling based on image width
    scale = max(0.4, min(1.0, w / 1200.0))
    thickness = max(1, int(round(scale * 2.0)))
    font = cv2.FONT_HERSHEY_SIMPLEX

    # 1. Draw individual seed bounding boxes & badges
    for pred in predictions:
        bbox = pred.bbox
        x1 = int(max(0, bbox.x))
        y1 = int(max(0, bbox.y))
        x2 = int(min(w - 1, bbox.x + bbox.width))
        y2 = int(min(h - 1, bbox.y + bbox.height))

        color = get_color_for_class(pred.class_name)

        # Draw bounding rectangle
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, thickness)

        # Label tag text
        label = f"{pred.class_name.capitalize()} {int(pred.confidence * 100)}%"
        (lbl_w, lbl_h), baseline = cv2.getTextSize(label, font, scale * 0.7, 1)

        # Draw label background tag
        lbl_y1 = max(0, y1 - lbl_h - 6)
        lbl_y2 = y1
        cv2.rectangle(annotated, (x1, lbl_y1), (x1 + lbl_w + 6, lbl_y2), color, -1)

        # Draw label text (white or dark depending on background)
        cv2.putText(
            annotated,
            label,
            (x1 + 3, lbl_y2 - 3),
            font,
            scale * 0.7,
            (255, 255, 255),
            1,
            cv2.LINE_AA
        )

    # 2. Draw modern top summary header banner
    banner_height = int(max(48, h * 0.08))
    overlay = annotated.copy()
    cv2.rectangle(overlay, (0, 0), (w, banner_height), (20, 24, 33), -1)
    cv2.addWeighted(overlay, 0.85, annotated, 0.15, 0, annotated)

    # Summary Text
    total_seeds = len(predictions)
    summary_text = f"Total Seeds: {total_seeds}  |  Visual Quality Score: {quality_score:.1f}%  |  Grade: {grade}"
    (tw, th), _ = cv2.getTextSize(summary_text, font, scale * 0.85, 2)
    text_x = 20
    text_y = int((banner_height + th) / 2)

    cv2.putText(
        annotated,
        summary_text,
        (text_x, text_y),
        font,
        scale * 0.85,
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )

    return annotated
