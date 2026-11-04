from typing import Dict, Tuple
from app.core.config import settings

def calculate_quality_score(
    total: int,
    healthy: int,
    damaged: int,
    discolored: int,
    broken: int,
    other: int = 0
) -> float:
    """
    Computes a model-derived visual seed quality score (0.0 - 100.0) based on weighted defect severity.
    
    Formula:
      WeightedSum = (healthy * W_h) + (damaged * W_dam) + (discolored * W_disc) + (broken * W_brk) + (other * W_oth)
      QualityScore = (WeightedSum / total) * 100
    
    IMPORTANT: This metric quantifies visual morphology and surface integrity only.
    It does not measure seed germination percentage, internal embryo viability,
    or biochemical moisture content.
    """
    if total <= 0:
        return 0.0

    w_healthy = settings.HEALTHY_WEIGHT
    w_damaged = settings.DAMAGED_WEIGHT
    w_discolored = settings.DISCOLORED_WEIGHT
    w_broken = settings.BROKEN_WEIGHT
    w_other = settings.OTHER_DEFECT_WEIGHT

    weighted_points = (
        (healthy * w_healthy) +
        (damaged * w_damaged) +
        (discolored * w_discolored) +
        (broken * w_broken) +
        (other * w_other)
    )

    score = (weighted_points / float(total)) * 100.0
    return round(min(100.0, max(0.0, score)), 2)

def assign_quality_grade(quality_score: float) -> str:
    """
    Assigns a standardized quality grade based on configurable thresholds.
    """
    thresholds = settings.GRADE_THRESHOLDS
    # Sort thresholds descending by score
    sorted_grades = sorted(thresholds.items(), key=lambda item: item[1], reverse=True)

    for grade, min_score in sorted_grades:
        if quality_score >= min_score:
            return grade

    return "D"
