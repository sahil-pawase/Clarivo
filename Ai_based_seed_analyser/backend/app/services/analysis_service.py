import os
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status, UploadFile
from app.core.config import settings
from app.core.logging import logger
from app.db.models.analysis import SeedAnalysis
from app.db.models.prediction import SeedPrediction
from app.schemas.analysis import (
    AnalysisDataResponse,
    AnalysisSummaryResponse,
    SeedPredictionDetail,
    BoundingBox,
    DashboardStats
)
from app.utils.image_validation import check_image_quality
from app.utils.file_utils import get_file_extension
from app.ai.inference import run_seed_analysis_pipeline
from app.services.storage_service import storage_service

class AnalysisService:
    @staticmethod
    async def analyze_seed_image(
        db: Session,
        image_file: UploadFile,
        seed_type: str = "general",
        user_id: Optional[int] = None,
        notes: Optional[str] = None
    ) -> AnalysisDataResponse:
        content = await image_file.read()

        # 1. Validation & Image Quality Check
        is_valid, quality_metrics, img_bgr = check_image_quality(content)
        if not is_valid or img_bgr is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=quality_metrics.issue_message or "Invalid image provided."
            )

        # 2. Run Computer Vision Pipeline
        pipeline_result, annotated_bgr = run_seed_analysis_pipeline(
            image_bgr=img_bgr,
            seed_type=seed_type
        )

        # 3. Save Files to Storage
        ext = get_file_extension(image_file.filename or "image.jpg")
        orig_path, ann_path, orig_url, ann_url = storage_service.save_images(
            original_bytes=content,
            annotated_bgr=annotated_bgr,
            ext=ext
        )

        # 4. Save to Database
        try:
            analysis = SeedAnalysis(
                user_id=user_id,
                seed_type=seed_type,
                image_path=orig_path,
                annotated_image_path=ann_path,
                total_seeds=pipeline_result["total_seeds"],
                healthy_count=pipeline_result["healthy"],
                damaged_count=pipeline_result["damaged"],
                discolored_count=pipeline_result["discolored"],
                broken_count=pipeline_result["broken"],
                other_defect_count=pipeline_result["other_defects"],
                quality_score=pipeline_result["quality_score"],
                grade=pipeline_result["grade"],
                model_version=pipeline_result["model_version"],
                processing_time_ms=pipeline_result["processing_time_ms"],
                image_quality_status="VALID",
                notes=notes
            )
            db.add(analysis)
            db.flush() # Flush to populate analysis.id

            # Save individual seed predictions
            prediction_records = []
            for pred in pipeline_result["predictions"]:
                p_rec = SeedPrediction(
                    analysis_id=analysis.id,
                    class_name=pred.class_name,
                    confidence=pred.confidence,
                    x=pred.bbox.x,
                    y=pred.bbox.y,
                    width=pred.bbox.width,
                    height=pred.bbox.height
                )
                prediction_records.append(p_rec)

            db.add_all(prediction_records)
            db.commit()
            db.refresh(analysis)

            # Build and return response
            predictions_detail = [
                SeedPredictionDetail(
                    id=p.id,
                    class_name=p.class_name,
                    confidence=p.confidence,
                    bbox=BoundingBox(
                        x=p.x,
                        y=p.y,
                        width=p.width,
                        height=p.height
                    )
                ) for p in analysis.predictions
            ]

            return AnalysisDataResponse(
                analysis_id=analysis.id,
                seed_type=analysis.seed_type,
                image_url=orig_url,
                annotated_image_url=ann_url,
                total_seeds=analysis.total_seeds,
                healthy=analysis.healthy_count,
                damaged=analysis.damaged_count,
                discolored=analysis.discolored_count,
                broken=analysis.broken_count,
                other_defects=analysis.other_defect_count,
                quality_score=analysis.quality_score,
                grade=analysis.grade,
                model_version=analysis.model_version,
                processing_time_ms=analysis.processing_time_ms,
                created_at=analysis.created_at,
                notes=analysis.notes,
                predictions=predictions_detail
            )
        except Exception as e:
            db.rollback()
            # Clean up saved files if DB transaction fails
            storage_service.delete_images(orig_path, ann_path)
            logger.error(f"Failed to persist analysis to database: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save analysis result to database."
            )

    @staticmethod
    def get_history(
        db: Session,
        user_id: Optional[int] = None,
        seed_type: Optional[str] = None,
        grade: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[AnalysisSummaryResponse]:
        query = db.query(SeedAnalysis)
        if user_id is not None:
            query = query.filter(SeedAnalysis.user_id == user_id)
        if seed_type and seed_type != "all":
            query = query.filter(SeedAnalysis.seed_type == seed_type)
        if grade and grade != "all":
            query = query.filter(SeedAnalysis.grade == grade)

        analyses = query.order_by(SeedAnalysis.created_at.desc()).offset(offset).limit(limit).all()

        results = []
        for a in analyses:
            # Construct relative URLs from file paths
            orig_filename = os.path.basename(a.image_path)
            ann_filename = os.path.basename(a.annotated_image_path) if a.annotated_image_path else None
            
            orig_url = f"{settings.STATIC_URL_PREFIX}/original/{orig_filename}"
            ann_url = f"{settings.STATIC_URL_PREFIX}/annotated/{ann_filename}" if ann_filename else None

            results.append(
                AnalysisSummaryResponse(
                    analysis_id=a.id,
                    seed_type=a.seed_type,
                    image_url=orig_url,
                    annotated_image_url=ann_url,
                    total_seeds=a.total_seeds,
                    healthy=a.healthy_count,
                    damaged=a.damaged_count,
                    discolored=a.discolored_count,
                    broken=a.broken_count,
                    quality_score=a.quality_score,
                    grade=a.grade,
                    created_at=a.created_at
                )
            )
        return results

    @staticmethod
    def get_by_id(db: Session, analysis_id: int, user_id: Optional[int] = None) -> AnalysisDataResponse:
        query = db.query(SeedAnalysis).filter(SeedAnalysis.id == analysis_id)
        if user_id is not None:
            query = query.filter(SeedAnalysis.user_id == user_id)
        analysis = query.first()

        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis with ID {analysis_id} not found."
            )

        orig_filename = os.path.basename(analysis.image_path)
        ann_filename = os.path.basename(analysis.annotated_image_path) if analysis.annotated_image_path else None

        orig_url = f"{settings.STATIC_URL_PREFIX}/original/{orig_filename}"
        ann_url = f"{settings.STATIC_URL_PREFIX}/annotated/{ann_filename}" if ann_filename else None

        predictions_detail = [
            SeedPredictionDetail(
                id=p.id,
                class_name=p.class_name,
                confidence=p.confidence,
                bbox=BoundingBox(
                    x=p.x,
                    y=p.y,
                    width=p.width,
                    height=p.height
                )
            ) for p in analysis.predictions
        ]

        return AnalysisDataResponse(
            analysis_id=analysis.id,
            seed_type=analysis.seed_type,
            image_url=orig_url,
            annotated_image_url=ann_url,
            total_seeds=analysis.total_seeds,
            healthy=analysis.healthy_count,
            damaged=analysis.damaged_count,
            discolored=analysis.discolored_count,
            broken=analysis.broken_count,
            other_defects=analysis.other_defect_count,
            quality_score=analysis.quality_score,
            grade=analysis.grade,
            model_version=analysis.model_version,
            processing_time_ms=analysis.processing_time_ms,
            created_at=analysis.created_at,
            notes=analysis.notes,
            predictions=predictions_detail
        )

    @staticmethod
    def delete(db: Session, analysis_id: int, user_id: Optional[int] = None) -> bool:
        query = db.query(SeedAnalysis).filter(SeedAnalysis.id == analysis_id)
        if user_id is not None:
            query = query.filter(SeedAnalysis.user_id == user_id)
        analysis = query.first()

        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis with ID {analysis_id} not found."
            )

        storage_service.delete_images(analysis.image_path, analysis.annotated_image_path)
        db.delete(analysis)
        db.commit()
        return True

    @staticmethod
    def get_dashboard_stats(db: Session, user_id: Optional[int] = None) -> DashboardStats:
        query = db.query(SeedAnalysis)
        if user_id is not None:
            query = query.filter(SeedAnalysis.user_id == user_id)

        analyses = query.all()
        total_analyses = len(analyses)

        if total_analyses == 0:
            return DashboardStats(
                total_analyses=0,
                average_quality_score=0.0,
                highest_quality_score=0.0,
                lowest_quality_score=0.0,
                total_seeds_analyzed=0,
                healthy_rate=0.0,
                grade_distribution={"A+": 0, "A": 0, "B": 0, "C": 0, "D": 0},
                seed_type_breakdown={},
                recent_analyses=[]
            )

        scores = [a.quality_score for a in analyses]
        avg_score = round(sum(scores) / total_analyses, 2)
        highest_score = round(max(scores), 2)
        lowest_score = round(min(scores), 2)
        total_seeds = sum(a.total_seeds for a in analyses)
        total_healthy = sum(a.healthy_count for a in analyses)
        healthy_rate = round((total_healthy / total_seeds * 100.0) if total_seeds > 0 else 0.0, 2)

        grade_distribution = {"A+": 0, "A": 0, "B": 0, "C": 0, "D": 0}
        seed_type_breakdown = {}

        for a in analyses:
            g = a.grade
            if g in grade_distribution:
                grade_distribution[g] += 1
            else:
                grade_distribution[g] = 1

            st = a.seed_type
            seed_type_breakdown[st] = seed_type_breakdown.get(st, 0) + 1

        recent_items = AnalysisService.get_history(db, user_id=user_id, limit=5)

        return DashboardStats(
            total_analyses=total_analyses,
            average_quality_score=avg_score,
            highest_quality_score=highest_score,
            lowest_quality_score=lowest_score,
            total_seeds_analyzed=total_seeds,
            healthy_rate=healthy_rate,
            grade_distribution=grade_distribution,
            seed_type_breakdown=seed_type_breakdown,
            recent_analyses=recent_items
        )

analysis_service = AnalysisService()
