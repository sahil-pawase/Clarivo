from abc import ABC, abstractmethod
from typing import List
import numpy as np
from app.schemas.analysis import SeedPredictionDetail

class BaseAIModel(ABC):
    @abstractmethod
    def load(self, model_path: str) -> bool:
        pass

    @abstractmethod
    def predict(self, image: np.ndarray, confidence_threshold: float = 0.45) -> List[SeedPredictionDetail]:
        pass

    @property
    @abstractmethod
    def model_version(self) -> str:
        pass

    @property
    @abstractmethod
    def is_ready(self) -> bool:
        pass
