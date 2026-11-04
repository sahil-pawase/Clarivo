from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, Token
from app.schemas.user import UserResponse
from app.schemas.common import ApiResponse
from app.services.auth_service import auth_service
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=ApiResponse[Token], status_code=status.HTTP_201_CREATED, summary="Register a new user")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    token = auth_service.register(db, req)
    return ApiResponse(
        success=True,
        message="User registered successfully.",
        data=token
    )

@router.post("/login", response_model=ApiResponse[Token], summary="User Login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    token = auth_service.login(db, req)
    return ApiResponse(
        success=True,
        message="Login successful.",
        data=token
    )

@router.get("/me", response_model=ApiResponse[UserResponse], summary="Get Current Authenticated User")
def get_me(current_user: User = Depends(get_current_user)):
    return ApiResponse(
        success=True,
        message="Current user fetched.",
        data=UserResponse.model_validate(current_user)
    )
