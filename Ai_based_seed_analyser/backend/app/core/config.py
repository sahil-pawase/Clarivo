import os
from typing import List, Dict
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Seed Quality Assessment"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    APP_ENV: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite:///./seed_quality.db"
    
    # JWT Authentication
    JWT_SECRET: str = "a9c8b74f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # AI & Computer Vision Settings
    AI_MODE: str = "mock" # 'mock' or 'real'
    MODEL_PATH: str = "models/seed_model.pt"
    MODEL_VERSION: str = "seed-yolo-v1"
    CONFIDENCE_THRESHOLD: float = 0.45
    IOU_THRESHOLD: float = 0.50
    
    # Image Quality Checks
    MIN_IMAGE_DIMENSION: int = 150
    MAX_IMAGE_SIZE_MB: int = 10
    BLUR_THRESHOLD: float = 35.0 # Laplacian variance
    MIN_BRIGHTNESS: float = 25.0 # 0-255
    MAX_BRIGHTNESS: float = 240.0
    MIN_CONTRAST: float = 18.0 # RMS Contrast
    
    # Quality Scoring Formula Weights (Customizable)
    HEALTHY_WEIGHT: float = 1.0
    DAMAGED_WEIGHT: float = 0.2
    DISCOLORED_WEIGHT: float = 0.5
    BROKEN_WEIGHT: float = 0.0
    OTHER_DEFECT_WEIGHT: float = 0.1
    
    # Grading Scale Thresholds
    GRADE_THRESHOLDS: Dict[str, float] = {
        "A+": 90.0,
        "A": 80.0,
        "B": 70.0,
        "C": 60.0,
        "D": 0.0
    }
    
    # Storage
    UPLOAD_DIR: str = "uploads"
    STATIC_URL_PREFIX: str = "/static"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:80",
        "http://localhost",
        "*"
    ]

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="allow"
    )

settings = Settings()
