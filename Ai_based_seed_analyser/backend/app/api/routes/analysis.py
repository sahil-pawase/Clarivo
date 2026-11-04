from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.analysis import (
    AnalysisDataResponse,
    AnalysisSummaryResponse,
    DashboardStats
)
from app.services.analysis_service import analysis_service
from app.api.dependencies import get_current_user_optional, get_current_user

router = APIRouter(prefix="/analysis", tags=["Seed Analysis"])

@router.post("/analyze", response_model=ApiResponse[AnalysisDataResponse], status_code=status.HTTP_201_CREATED, summary="Analyze Seed Quality from Image")
async def analyze_seeds(
    image: UploadFile = File(..., description="Seed sample photograph (JPG, PNG, WEBP)"),
    seed_type: str = Form(default="general", description="Seed crop type (e.g. wheat, corn, rice, soybean, general)"),
    notes: Optional[str] = Form(default=None, description="Optional user notes or batch ID"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    user_id = current_user.id if current_user else None
    result = await analysis_service.analyze_seed_image(
        db=db,
        image_file=image,
        seed_type=seed_type,
        user_id=user_id,
        notes=notes
    )
    return ApiResponse(
        success=True,
        message="Seed analysis completed successfully.",
        data=result
    )

@router.get("/history", response_model=ApiResponse[List[AnalysisSummaryResponse]], summary="Get Seed Analysis History")
def get_history(
    seed_type: Optional[str] = Query(default=None, description="Filter by crop type"),
    grade: Optional[str] = Query(default=None, description="Filter by quality grade"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    user_id = current_user.id if current_user else None
    history = analysis_service.get_history(
        db=db,
        user_id=user_id,
        seed_type=seed_type,
        grade=grade,
        limit=limit,
        offset=offset
    )
    return ApiResponse(
        success=True,
        message="Analysis history retrieved.",
        data=history
    )

@router.get("/dashboard", response_model=ApiResponse[DashboardStats], summary="Get Analytics Dashboard Statistics")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    user_id = current_user.id if current_user else None
    stats = analysis_service.get_dashboard_stats(db=db, user_id=user_id)
    return ApiResponse(
        success=True,
        message="Dashboard statistics retrieved.",
        data=stats
    )

@router.get("/{analysis_id}", response_model=ApiResponse[AnalysisDataResponse], summary="Get Detailed Seed Analysis by ID")
def get_analysis_detail(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    user_id = current_user.id if current_user else None
    detail = analysis_service.get_by_id(db=db, analysis_id=analysis_id, user_id=user_id)
    return ApiResponse(
        success=True,
        message="Analysis details retrieved.",
        data=detail
    )

@router.delete("/{analysis_id}", response_model=ApiResponse[bool], summary="Delete an Analysis Record")
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    user_id = current_user.id if current_user else None
    analysis_service.delete(db=db, analysis_id=analysis_id, user_id=user_id)
    return ApiResponse(
        success=True,
        message="Analysis deleted successfully.",
        data=True
    )
