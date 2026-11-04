import time
import numpy as np
from typing import Dict, Any, Tuple, List
from app.core.config import settings
from app.core.logging import logger
from app.ai.model_loader import ModelLoader
from app.ai.preprocessing import preprocess_image
from app.ai.postprocessing import aggregate_seed_statistics
from app.ai.quality import calculate_quality_score, assign_quality_grade
from app.ai.visualizer import draw_seed_annotations
from app.schemas.analysis import SeedPredictionDetail

def run_seed_analysis_pipeline(
    image_bgr: np.ndarray,
    seed_type: str = "general"
) -> Tuple[Dict[str, Any], np.ndarray]:
    """
    Executes the end-to-end computer-vision seed quality assessment pipeline:
    1. Preprocessing (resizing/optimizing)
    2. Model inference (YOLO or Mock)
    3. Defect classification & aggregation
    4. Quality score & grade calculation
    5. Annotated visualization rendering
    """
    start_time = time.perf_counter()

    # 1. Preprocessing
    processed_img = preprocess_image(image_bgr)

    # 2. AI Model Inference
    model = ModelLoader.get_model()
    predictions: List[SeedPredictionDetail] = model.predict(
        processed_img,
        confidence_threshold=settings.CONFIDENCE_THRESHOLD
    )

    # 3. Post-processing & Aggregation
    stats = aggregate_seed_statistics(predictions)

    # 4. Quality calculation
    quality_score = calculate_quality_score(
        total=stats["total"],
        healthy=stats["healthy"],
        damaged=stats["damaged"],
        discolored=stats["discolored"],
        broken=stats["broken"],
        other=stats["other"]
    )
    grade = assign_quality_grade(quality_score)

    # 5. Visualizer / Annotation
    annotated_img = draw_seed_annotations(
        image_bgr=image_bgr,
        predictions=predictions,
        quality_score=quality_score,
        grade=grade
    )

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    result_data = {
        "seed_type": seed_type,
        "total_seeds": stats["total"],
        "healthy": stats["healthy"],
        "damaged": stats["damaged"],
        "discolored": stats["discolored"],
        "broken": stats["broken"],
        "other_defects": stats["other"],
        "quality_score": quality_score,
        "grade": grade,
        "model_version": model.model_version,
        "processing_time_ms": elapsed_ms,
        "predictions": predictions
    }

    return result_data, annotated_img
