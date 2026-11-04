from typing import Optional
from app.core.config import settings
from app.core.logging import logger
from app.ai.base import BaseAIModel
from app.ai.mock_model import MockAIModel
from app.ai.yolo_model import YOLOAIModel

class ModelLoader:
    _instance: Optional[BaseAIModel] = None

    @classmethod
    def initialize(cls) -> BaseAIModel:
        if cls._instance is not None:
            return cls._instance

        mode = settings.AI_MODE.lower().strip()
        logger.info(f"Initializing AI Model subsystem in mode: '{mode}'")

        if mode == "real":
            model = YOLOAIModel(version=settings.MODEL_VERSION)
            loaded = model.load(settings.MODEL_PATH)
            if not loaded:
                logger.warning("Falling back to Mock AI Model because real weights could not be loaded.")
                model = MockAIModel(version=f"{settings.MODEL_VERSION}-fallback-mock")
                model.load("")
        else:
            model = MockAIModel(version=f"{settings.MODEL_VERSION}-mock")
            model.load("")

        cls._instance = model
        logger.info(f"AI Model subsystem initialized. Active model version: {model.model_version}")
        return cls._instance

    @classmethod
    def get_model(cls) -> BaseAIModel:
        if cls._instance is None:
            return cls.initialize()
        return cls._instance
