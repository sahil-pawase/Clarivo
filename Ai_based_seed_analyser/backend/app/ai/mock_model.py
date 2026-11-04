import random
import cv2
import numpy as np
from typing import List
from app.ai.base import BaseAIModel
from app.schemas.analysis import SeedPredictionDetail, BoundingBox

class MockAIModel(BaseAIModel):
    def __init__(self, version: str = "mock-seed-v1.0"):
        self._version = version
        self._is_ready = True

    def load(self, model_path: str) -> bool:
        self._is_ready = True
        return True

    @property
    def model_version(self) -> str:
        return self._version

    @property
    def is_ready(self) -> bool:
        return self._is_ready

    def predict(self, image: np.ndarray, confidence_threshold: float = 0.45) -> List[SeedPredictionDetail]:
        """
        Generates realistic seed detections. Uses OpenCV contour detection on image
        if available to detect actual blobs, or generates realistic scattered bounding boxes.
        """
        predictions: List[SeedPredictionDetail] = []
        height, width = image.shape[:2]

        # Try image-based blob detection for realistic coordinates
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)
        # Adaptive or Otsu threshold
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        valid_boxes = []
        min_seed_area = (width * height) * 0.0002
        max_seed_area = (width * height) * 0.05

        for c in contours:
            area = cv2.contourArea(c)
            if min_seed_area < area < max_seed_area:
                x, y, w, h = cv2.boundingRect(c)
                valid_boxes.append((float(x), float(y), float(w), float(h)))

        # If image contouring found between 8 and 150 seeds, use them; otherwise synthesize
        if len(valid_boxes) < 8 or len(valid_boxes) > 150:
            valid_boxes = []
            num_seeds = random.randint(35, 75)
            seed_w = max(18.0, width * 0.04)
            seed_h = max(18.0, height * 0.04)
            margin_x = width * 0.08
            margin_y = height * 0.08
            
            for _ in range(num_seeds):
                rx = random.uniform(margin_x, width - margin_x - seed_w)
                ry = random.uniform(margin_y, height - margin_y - seed_h)
                rw = seed_w * random.uniform(0.85, 1.25)
                rh = seed_h * random.uniform(0.85, 1.25)
                valid_boxes.append((rx, ry, rw, rh))

        # Distribute classes realistically
        # ~78% healthy, ~10% damaged, ~7% discolored, ~5% broken
        classes_pool = (
            ["healthy"] * 78 +
            ["damaged"] * 10 +
            ["discolored"] * 7 +
            ["broken"] * 5
        )

        for idx, (bx, by, bw, bh) in enumerate(valid_boxes, start=1):
            class_name = random.choice(classes_pool)
            confidence = round(random.uniform(0.86, 0.98), 2)
            
            if confidence >= confidence_threshold:
                predictions.append(
                    SeedPredictionDetail(
                        id=idx,
                        class_name=class_name,
                        confidence=confidence,
                        bbox=BoundingBox(
                            x=round(bx, 1),
                            y=round(by, 1),
                            width=round(bw, 1),
                            height=round(bh, 1)
                        )
                    )
                )

        return predictions
