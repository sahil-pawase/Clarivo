# ==============================================================================
# Clarivo Enterprise Platform - Production Multi-Stage Dockerfile
# Security Hardened, Non-Root User, Healthcheck Enabled
# ==============================================================================

# --- Stage 1: Build React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ ./
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV NODE_ENV=production
RUN npm run build

# --- Stage 2: Production Python Backend & Static Server ---
FROM python:3.11-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root security user
RUN groupadd -g 1001 clarivogroup && \
    useradd -u 1001 -g clarivogroup -m -s /bin/bash clarivouser

WORKDIR /app

# Install Python requirements
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /tmp/requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Copy built frontend assets to static distribution folder
COPY --from=frontend-builder /app/frontend/build /app/frontend/build

# Ensure directory permissions for non-root user
RUN mkdir -p /app/backend/data /app/backend/uploads && \
    chown -R clarivouser:clarivogroup /app

USER clarivouser

EXPOSE 8000

# Enterprise healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

WORKDIR /app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
