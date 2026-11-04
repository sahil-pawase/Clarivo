from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.core.config import settings
from app.ai.model_loader import ModelLoader

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("", summary="System Health Check")
def health_check(db: Session = Depends(get_db)):
    # Check Database connectivity
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # Check AI Model
    model = ModelLoader.get_model()
    ai_status = "loaded" if model.is_ready else "not_ready"

    return {
        "status": "healthy" if db_status == "connected" and model.is_ready else "degraded",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "ai_model": ai_status,
        "ai_mode": settings.AI_MODE,
        "model_version": model.model_version
    }
