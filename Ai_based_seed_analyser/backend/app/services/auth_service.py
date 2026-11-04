from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.schemas.auth import RegisterRequest, LoginRequest, Token
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import user_service
from app.core.security import verify_password, create_access_token

class AuthService:
    @staticmethod
    def register(db: Session, req: RegisterRequest) -> Token:
        existing_user = user_service.get_by_email(db, req.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered."
            )
        
        user_in = UserCreate(
            name=req.name,
            email=req.email,
            password=req.password
        )
        user = user_service.create(db, user_in)
        
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )

    @staticmethod
    def login(db: Session, req: LoginRequest) -> Token:
        user = user_service.get_by_email(db, req.email)
        if not user or not verify_password(req.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )

auth_service = AuthService()
