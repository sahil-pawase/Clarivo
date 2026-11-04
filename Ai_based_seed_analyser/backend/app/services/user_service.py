from typing import Optional
from sqlalchemy.orm import Session
from app.db.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

class UserService:
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower().strip()).first()

    @staticmethod
    def create(db: Session, user_in: UserCreate) -> User:
        user = User(
            name=user_in.name.strip(),
            email=user_in.email.lower().strip(),
            password_hash=get_password_hash(user_in.password)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

user_service = UserService()
