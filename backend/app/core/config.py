"""
Core configuration settings for Clarivo backend
"""
import os
from typing import Optional, List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_size_to_bytes(value: Union[str, int]) -> int:
    """Parse values like '100MB', '512KB', '1GB' or plain ints into bytes."""
    if isinstance(value, int):
        return value
    if not isinstance(value, str):
        raise ValueError("MAX_FILE_SIZE must be int or size string")
    s = value.strip().lower().replace(" ", "")
    try:
        if s.endswith("kb"):
            return int(float(s[:-2]) * 1024)
        if s.endswith("mb"):
            return int(float(s[:-2]) * 1024 * 1024)
        if s.endswith("gb"):
            return int(float(s[:-2]) * 1024 * 1024 * 1024)
        if s.endswith("k"):
            return int(float(s[:-1]) * 1024)
        if s.endswith("m"):
            return int(float(s[:-1]) * 1024 * 1024)
        if s.endswith("g"):
            return int(float(s[:-1]) * 1024 * 1024 * 1024)
        # plain integer string
        return int(float(s))
    except Exception as exc:
        raise ValueError(f"Invalid MAX_FILE_SIZE: {value}") from exc


class Settings(BaseSettings):
    # Pydantic v2 settings config
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Clarivo"

    # Runtime
    DEBUG: bool = False
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    ENVIRONMENT: Optional[str] = None

    # Database
    DATABASE_URL: str = "sqlite:///./clarivo.db"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # File storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: Union[int, str] = 100 * 1024 * 1024  # 100MB default

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "null",
    ]

    # Optional external APIs
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # Ollama (local LLM)
    OLLAMA_HOST: Optional[str] = "http://localhost:11434"
    OLLAMA_MODEL: Optional[str] = "llama3.1"

    # App metadata
    APP_NAME: Optional[str] = None
    APP_VERSION: Optional[str] = None

    # Redis (optional)
    REDIS_URL: Optional[str] = None

    # NLP
    SPACY_MODEL: str = "en_core_web_sm"

    @field_validator("MAX_FILE_SIZE", mode="before")
    @classmethod
    def validate_max_file_size(cls, v):  # type: ignore[no-untyped-def]
        return _parse_size_to_bytes(v)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def validate_cors_origins(cls, v):  # type: ignore[no-untyped-def]
        # Accept JSON string, comma-separated string, or list
        if v is None:
            return v
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            s = v.strip()
            # Try JSON list
            if s.startswith("[") and s.endswith("]"):
                try:
                    import json
                    parsed = json.loads(s)
                    if isinstance(parsed, list):
                        return [str(x) for x in parsed]
                except Exception:
                    pass
            # Fallback: comma separated
            return [item.strip() for item in s.split(",") if item.strip()]
        return v


settings = Settings()