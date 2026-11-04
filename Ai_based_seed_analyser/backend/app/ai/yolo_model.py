import os
import numpy as np
from typing import List
from app.ai.base import BaseAIModel
from app.schemas.analysis import SeedPredictionDetail, BoundingBox
from app.core.logging import logger

class YOLOAIModel(BaseAIModel):
    def __init__(self, version: str = "seed-yolo-v1"):
        self._version = version
        self._model = None
        self._is_ready = False

    def load(self, model_path: str) -> bool:
        if not os.path.exists(model_path):
            logger.warning(f"YOLO model weights file not found at: {model_path}")
            self._is_ready = False
            return False

        try:
            from ultralytics import YOLO
            self._model = YOLO(model_path)
            self._is_ready = True
            logger.info(f"Successfully loaded YOLO model from {model_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {str(e)}")
            self._is_ready = False
            return False

    @property
    def model_version(self) -> str:
        return self._version

    @property
    def is_ready(self) -> bool:
        return self._is_ready

    def predict(self, image: np.ndarray, confidence_threshold: float = 0.45) -> List[SeedPredictionDetail]:
        if not self._is_ready or self._model is None:
            raise RuntimeError("YOLO Model is not loaded or ready.")

        predictions: List[SeedPredictionDetail] = []
        # Inference with Ultralytics
        results = self._model(image, conf=confidence_threshold, verbose=False)

        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for idx, box in enumerate(boxes, start=1):
                cls_id = int(box.cls[0])
                cls_name = result.names.get(cls_id, "seed").lower()
                conf = float(box.conf[0])
                
                # Format: xywh (center x, center y, width, height) or xyxy (xmin, ymin, xmax, ymax)
                # xyxy format conversion:
                xyxy = box.xyxy[0].cpu().numpy()
                x_min, y_min, x_max, y_max = xyxy
                width = x_max - x_min
                height = y_max - y_min

                predictions.append(
                    SeedPredictionDetail(
                        id=idx,
                        class_name=cls_name,
                        confidence=round(conf, 2),
                        bbox=BoundingBox(
                            x=round(float(x_min), 1),
                            y=round(float(y_min), 1),
                            width=round(float(width), 1),
                            height=round(float(height), 1)
                        )
                    )
                )

        return predictions
