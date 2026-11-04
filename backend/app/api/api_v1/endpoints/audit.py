"""
Enterprise Audit Trail & Data Lineage API Endpoints
"""
from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
from app.core.database import get_recent_audit_logs, log_audit_event

router = APIRouter()

@router.get("/logs")
async def list_audit_logs(limit: int = Query(50, ge=1, le=200)) -> Dict[str, Any]:
    """Retrieve recent compliance and system audit events"""
    logs = get_recent_audit_logs(limit=limit)
    return {
        "total": len(logs),
        "logs": logs
    }

@router.post("/record")
async def record_audit_log(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Record a client-side or system audit event for compliance tracking"""
    success = log_audit_event(
        event_type=payload.get("event_type", "GENERAL"),
        action=payload.get("action", "Action executed"),
        user_email=payload.get("user_email"),
        resource_id=payload.get("resource_id"),
        details=payload.get("details"),
        status=payload.get("status", "SUCCESS")
    )
    return {"success": success}

