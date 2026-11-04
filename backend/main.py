"""
Clarivo Backend - FastAPI Application Entry Point
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.core.database import init_db, log_audit_event
import logging
import time
import uuid

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Clarivo Enterprise Data Intelligence Platform",
    description="Enterprise-grade AI-powered local-first analytics, SQL copilot, automated governance & decision intelligence platform.",
    version="1.0.0-enterprise",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS: allow localhost dev, Electron (file:// -> Origin: null)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "null"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EnterpriseSecurityAndTracingMiddleware(BaseHTTPMiddleware):
    """MNC-grade middleware injecting Correlation IDs, Timing metrics & Security Headers"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        correlation_id = request.headers.get("X-Correlation-ID") or f"req_{uuid.uuid4().hex[:12]}"
        
        # Attach to request state
        request.state.correlation_id = correlation_id
        
        response = await call_next(request)
        
        # Calculate response time
        duration_ms = round((time.time() - start_time) * 1000, 2)
        
        # Inject enterprise response headers
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Response-Time-Ms"] = str(duration_ms)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        return response


class JSONSerializationMiddleware:
    """Middleware to catch JSON serialization errors"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        try:
            await self.app(scope, receive, send)
        except (ValueError, TypeError) as e:
            if "JSON" in str(e) or "serializ" in str(e).lower() or "nan" in str(e).lower():
                logger.error(f"JSON serialization error caught by middleware: {e}")
                response = JSONResponse(
                    status_code=500,
                    content={"detail": "Data serialization error. Please check your data for invalid values."}
                )
                await response(scope, receive, send)
            else:
                raise


# Add Enterprise middleware
app.add_middleware(EnterpriseSecurityAndTracingMiddleware)
app.add_middleware(JSONSerializationMiddleware)

@app.on_event("startup")
async def on_startup():
    """Initialize database tables, default accounts, and log startup event"""
    logger.info("Initializing Clarivo Enterprise Database & Services...")
    init_db()
    log_audit_event(
        event_type="SYSTEM",
        action="Clarivo Enterprise Core Services Online",
        details={"version": "1.0.0-enterprise", "environment": "production"}
    )
    logger.info("Clarivo Enterprise Engine Ready.")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle ValueError exceptions, often related to JSON serialization"""
    logger.error(f"ValueError in {request.url}: {exc}")
    if "JSON" in str(exc) or "serializ" in str(exc).lower():
        return JSONResponse(
            status_code=500,
            content={"detail": "Data serialization error. Please check your data for invalid values."}
        )
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )


@app.exception_handler(TypeError)
async def type_error_handler(request: Request, exc: TypeError):
    """Handle TypeError exceptions, often related to JSON serialization"""
    logger.error(f"TypeError in {request.url}: {exc}")
    if "JSON" in str(exc) or "serializ" in str(exc).lower():
        return JSONResponse(
            status_code=500,
            content={"detail": "Data serialization error. Please check your data for invalid values."}
        )
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )


@app.get("/")
async def root():
    return {"message": "Clarivo API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "clarivo-api"}

@app.get("/test-api")
async def test_api():
    return {"message": "Test API endpoint working", "routes": len(api_router.routes)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
