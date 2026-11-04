from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class SeedPredictionDetail(BaseModel):
    id: Optional[int] = None
    class_name: str
    confidence: float
    bbox: BoundingBox

    model_config = ConfigDict(from_attributes=True)

class ImageQualityMetrics(BaseModel):
    blur_score: float
    brightness: float
    contrast: float
    is_valid: bool
    issue_message: Optional[str] = None

class AnalysisDataResponse(BaseModel):
    analysis_id: int
    seed_type: str
    image_url: str
    annotated_image_url: Optional[str] = None
    total_seeds: int
    healthy: int
    damaged: int
    discolored: int
    broken: int
    other_defects: int
    quality_score: float
    grade: str
    model_version: str
    processing_time_ms: int
    created_at: datetime
    notes: Optional[str] = None
    predictions: List[SeedPredictionDetail] = []

    model_config = ConfigDict(from_attributes=True)

class AnalysisSummaryResponse(BaseModel):
    analysis_id: int
    seed_type: str
    image_url: str
    annotated_image_url: Optional[str] = None
    total_seeds: int
    healthy: int
    damaged: int
    discolored: int
    broken: int
    quality_score: float
    grade: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DashboardStats(BaseModel):
    total_analyses: int
    average_quality_score: float
    highest_quality_score: float
    lowest_quality_score: float
    total_seeds_analyzed: int
    healthy_rate: float
    grade_distribution: Dict[str, int]
    seed_type_breakdown: Dict[str, int]
    recent_analyses: List[AnalysisSummaryResponse]
