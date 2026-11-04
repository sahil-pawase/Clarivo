"""
User and Authentication models for Clarivo
"""
from datetime import datetime
from typing import Optional
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, Field
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"
    EDUCATOR = "educator"

class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole = UserRole.STUDENT
    avatar_url: Optional[str] = None
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str
    role: Optional[UserRole] = None

class UserResponse(UserBase):
    id: str
    created_at: datetime
    last_login: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
