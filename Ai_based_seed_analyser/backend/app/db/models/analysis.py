from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class SeedAnalysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    seed_type = Column(String(50), default="general", nullable=False, index=True)
    image_path = Column(String(500), nullable=False)
    annotated_image_path = Column(String(500), nullable=True)
    total_seeds = Column(Integer, default=0, nullable=False)
    healthy_count = Column(Integer, default=0, nullable=False)
    damaged_count = Column(Integer, default=0, nullable=False)
    discolored_count = Column(Integer, default=0, nullable=False)
    broken_count = Column(Integer, default=0, nullable=False)
    other_defect_count = Column(Integer, default=0, nullable=False)
    quality_score = Column(Float, default=0.0, nullable=False)
    grade = Column(String(10), default="N/A", nullable=False)
    model_version = Column(String(50), nullable=False)
    processing_time_ms = Column(Integer, default=0, nullable=False)
    image_quality_status = Column(String(50), default="VALID", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="analyses")
    predictions = relationship("SeedPrediction", back_populates="analysis", cascade="all, delete-orphan")
