import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.db.database import init_db
from app.ai.model_loader import ModelLoader
from app.utils.file_utils import ensure_upload_dirs
from app.exceptions.handlers import (
    http_exception_handler,
    validation_exception_handler,
    global_exception_handler
)
from app.api.routes import health, auth, users, analysis

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    setup_logging()
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.APP_ENV}]...")
    
    # 1. Initialize DB tables
    try:
        init_db()
        logger.info("Database schema initialized.")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")

    # 2. Ensure upload directories exist
    ensure_upload_dirs()

    # 3. Pre-load AI Model subsystem (Singleton)
    try:
        ModelLoader.initialize()
    except Exception as e:
        logger.error(f"Error initializing AI model: {str(e)}")

    logger.info("Application startup completed successfully.")
    yield
    # --- Shutdown ---
    logger.info("Shutting down Application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-grade AI-Based Seed Quality Assessment API.\n\n"
        "**Important Distinction:** This service performs visual seed morphological "
        "and surface defect assessment (detection, counting, discoloration, brokenness). "
        "It does not replace laboratory germination or biochemical testing."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Static Files for Uploads (Original & Annotated Images)
uploads_path = os.path.abspath(settings.UPLOAD_DIR)
os.makedirs(uploads_path, exist_ok=True)
app.mount(settings.STATIC_URL_PREFIX, StaticFiles(directory=uploads_path), name="static")

# Include API Routers under /api
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
