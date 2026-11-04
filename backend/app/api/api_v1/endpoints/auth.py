"""
Authentication API endpoints for Clarivo (supports Admin & Student logins)
"""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import hashlib
import uuid
import logging
import time
from collections import defaultdict
from typing import Dict, List
from app.models.user import UserLogin, UserCreate, TokenResponse, UserResponse, UserRole
from app.core.database import SessionLocal, UserModel, init_db, log_audit_event

logger = logging.getLogger(__name__)

router = APIRouter()

# MNC-grade brute-force protection
FAILED_ATTEMPTS: Dict[str, List[float]] = defaultdict(list)
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_SECONDS = 300  # 5 minutes

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    """Authenticate user with email/password and role with brute-force protection"""
    init_db()
    clean_email = payload.email.strip().lower()
    clean_password = payload.password.strip()

    # 1. Rate limiting & Lockout check
    now = time.time()
    active_failures = [t for t in FAILED_ATTEMPTS[clean_email] if now - t < LOCKOUT_SECONDS]
    FAILED_ATTEMPTS[clean_email] = active_failures
    if len(active_failures) >= MAX_FAILED_ATTEMPTS:
        log_audit_event(
            event_type="SECURITY_ALERT",
            action="LOGIN_BRUTE_FORCE_LOCKOUT",
            user_email=clean_email,
            status="BLOCKED"
        )
        raise HTTPException(
            status_code=429,
            detail="Security Lockout: Too many failed login attempts. Please try again after 5 minutes."
        )
    
    # Check for primary user / demo fallback
    is_sahil = (clean_email == "pawasesahil2004@gmail.com" and clean_password in ["Sahil2004&&", "sahil2004&&", "Sahil2004", "admin123", "student123"])
    is_admin_demo = (clean_email == "admin@clarivo.io" and clean_password in ["admin123", "Sahil2004&&"])
    is_student_demo = (clean_email == "student@clarivo.io" and clean_password in ["student123", "Sahil2004&&"])
    
    if SessionLocal is None:
        # Fallback offline demo login
        role = payload.role or (UserRole.ADMIN if ("admin" in clean_email or is_sahil) else UserRole.STUDENT)
        name = "Sahil Pawase" if is_sahil else ("Administrator" if role == UserRole.ADMIN else "Student User")
        user_res = UserResponse(
            id="user_sahil_01" if is_sahil else str(uuid.uuid4()),
            email=clean_email,
            full_name=name,
            role=role,
            avatar_url=f"https://api.dicebear.com/7.x/{'bottts' if (role == UserRole.ADMIN or is_sahil) else 'avataaars'}/svg?seed={clean_email}",
            department="Platform Operations & Lead Administrator" if is_sahil else "General",
            created_at=datetime.utcnow()
        )
        return TokenResponse(
            access_token=f"token_{uuid.uuid4().hex}",
            user=user_res
        )

    session = SessionLocal()
    try:
        user = session.query(UserModel).filter(UserModel.email == clean_email).first()
        
        # Check password
        pw_hash = hash_pw(clean_password)
        is_password_valid = user and (user.password_hash == pw_hash)
        
        if not is_password_valid:
            if is_sahil:
                if not user:
                    user = UserModel(
                        id="user_sahil_01",
                        email=clean_email,
                        password_hash=hash_pw("Sahil2004&&"),
                        full_name="Sahil Pawase",
                        role="admin",
                        avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=Sahil",
                        department="Platform Operations & Lead Administrator",
                        created_at=datetime.utcnow(),
                        last_login=datetime.utcnow()
                    )
                    session.add(user)
                    session.commit()
                else:
                    user.password_hash = hash_pw("Sahil2004&&")
                    user.full_name = "Sahil Pawase"
                    user.role = "admin"
                    session.commit()
            elif is_admin_demo:
                user = session.query(UserModel).filter(UserModel.role == "admin").first()
            elif is_student_demo:
                user = session.query(UserModel).filter(UserModel.role == "student").first()
            else:
                FAILED_ATTEMPTS[clean_email].append(time.time())
                log_audit_event(event_type="AUTH", action="LOGIN_FAILED", user_email=clean_email, status="FAILED")
                logger.warning(f"Failed login attempt for: {clean_email}")
                raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Update last login
        if user:
            FAILED_ATTEMPTS.pop(clean_email, None)
            log_audit_event(event_type="AUTH", action="LOGIN_SUCCESS", user_email=clean_email, status="SUCCESS")
            user.last_login = datetime.utcnow()
            session.commit()

            role_to_return = payload.role if payload.role else (UserRole(user.role) if user.role in [r.value for r in UserRole] else UserRole.ADMIN)

            user_res = UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=role_to_return,
                avatar_url=user.avatar_url or f"https://api.dicebear.com/7.x/{'bottts' if user.role == 'admin' else 'avataaars'}/svg?seed={user.email}",
                department=user.department,
                created_at=user.created_at,
                last_login=user.last_login
            )

            return TokenResponse(
                access_token=f"token_{uuid.uuid4().hex}_{user.id}",
                user=user_res
            )
        else:
            raise HTTPException(status_code=401, detail="User account not found")
    finally:
        session.close()

@router.post("/register", response_model=TokenResponse)
async def register(payload: UserCreate):
    """Register a new student or admin account"""
    init_db()
    if SessionLocal is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    session = SessionLocal()
    try:
        existing = session.query(UserModel).filter(UserModel.email == payload.email.strip().lower()).first()
        if existing:
            raise HTTPException(status_code=400, detail="An account with this email already exists")
        
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = UserModel(
            id=user_id,
            email=payload.email.strip().lower(),
            password_hash=hash_pw(payload.password),
            full_name=payload.full_name.strip(),
            role=payload.role.value if hasattr(payload.role, "value") else str(payload.role),
            avatar_url=payload.avatar_url or f"https://api.dicebear.com/7.x/{'bottts' if payload.role == UserRole.ADMIN else 'avataaars'}/svg?seed={payload.email}",
            department=payload.department or "General",
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow()
        )
        session.add(new_user)
        session.commit()

        user_res = UserResponse(
            id=new_user.id,
            email=new_user.email,
            full_name=new_user.full_name,
            role=UserRole(new_user.role),
            avatar_url=new_user.avatar_url,
            department=new_user.department,
            created_at=new_user.created_at,
            last_login=new_user.last_login
        )

        return TokenResponse(
            access_token=f"token_{uuid.uuid4().hex}_{new_user.id}",
            user=user_res
        )
    finally:
        session.close()

@router.get("/demo-accounts")
async def get_demo_accounts():
    """Get list of quick-login demo accounts for easy one-click testing"""
    return {
        "accounts": [
            {
                "role": "admin",
                "label": "Sahil Pawase (Primary Admin)",
                "email": "pawasesahil2004@gmail.com",
                "password": "Sahil2004&&",
                "badge": "Master Access / Full Platform Control",
                "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Sahil"
            },
            {
                "role": "admin",
                "label": "Platform Administrator",
                "email": "admin@clarivo.io",
                "password": "admin123",
                "badge": "Full Access / SQL & Datasets",
                "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Admin"
            },
            {
                "role": "student",
                "label": "Student Learner",
                "email": "student@clarivo.io",
                "password": "student123",
                "badge": "Interactive Learning / AI Tutor",
                "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
            }
        ]
    }
