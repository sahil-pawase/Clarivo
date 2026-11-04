from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.user import UserResponse
from app.schemas.common import ApiResponse
from app.api.dependencies import get_current_user
from app.services.analysis_service import analysis_service

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile", summary="Get user profile and summary statistics")
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dashboard_stats = analysis_service.get_dashboard_stats(db, user_id=current_user.id)
    return ApiResponse(
        success=True,
        message="User profile fetched.",
        data={
            "user": UserResponse.model_validate(current_user),
            "stats": dashboard_stats
        }
    )
