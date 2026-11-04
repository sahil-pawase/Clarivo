from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[T] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: str = "INTERNAL_ERROR"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
