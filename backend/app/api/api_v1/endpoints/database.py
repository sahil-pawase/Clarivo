"""
Database API endpoints for inspecting tables, running queries, and managing Neon PostgreSQL
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from app.core.config import settings
from app.core.database import (
    engine, init_db, get_db_tables_info, execute_raw_sql, save_dataset_to_db, load_datasets_from_db
)
from app.services.dataset_service import dataset_service
import pandas as pd
import uuid

logger = logging.getLogger(__name__)

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    limit: Optional[int] = 1000

class TextToSqlRequest(BaseModel):
    natural_query: str
    target_table: Optional[str] = None

class ImportTableRequest(BaseModel):
    table_name: str
    dataset_name: Optional[str] = None

@router.get("/status")
async def get_database_status():
    """Get connection status and overview of connected database"""
    if engine is None:
        return {
            "connected": False,
            "database_url_configured": bool(settings.DATABASE_URL),
            "error": "Engine could not be initialized"
        }
    
    try:
        tables = get_db_tables_info()
        engine_str = str(getattr(engine, "url", "")).lower()
        is_sqlite = "sqlite" in engine_str
        db_type = getattr(getattr(engine, "dialect", None), "name", "sqlite" if is_sqlite else "postgresql")
        host = getattr(engine.url, "host", None) or ("localhost" if is_sqlite else settings.DATABASE_URL.split("@")[-1].split("/")[0] if "@" in settings.DATABASE_URL else "local")
        db_name = getattr(engine.url, "database", None) or ("clarivo.db" if is_sqlite else "neondb")

        return {
            "connected": True,
            "type": db_type,
            "host": host,
            "database": db_name,
            "total_tables": len(tables),
            "tables": tables
        }
    except Exception as e:
        logger.error(f"Error checking database status: {e}")
        return {
            "connected": False,
            "error": str(e)
        }

@router.get("/tables")
async def get_database_tables():
    """List all tables and column schemas in the connected database"""
    tables = get_db_tables_info()
    return {"tables": tables}

@router.post("/query")
async def run_sql_query(payload: QueryRequest):
    """Execute raw SQL query against the database"""
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    result = execute_raw_sql(payload.query, limit=payload.limit or 1000)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Query execution failed"))
    
    # Audit log
    try:
        from app.core.database import log_audit_event
        log_audit_event(
            event_type="QUERY",
            action=f"Executed SQL ({result.get('row_count', 0)} rows)",
            details={"query": payload.query[:200], "row_count": result.get("row_count", 0)}
        )
    except Exception:
        pass

    return result

@router.post("/text-to-sql")
async def generate_sql_from_text(payload: TextToSqlRequest):
    """Translate natural language questions into executable and optimized SQL"""
    if not payload.natural_query or not payload.natural_query.strip():
        raise HTTPException(status_code=400, detail="Natural query cannot be empty")
    
    tables = get_db_tables_info()
    if payload.target_table:
        tables = [t for t in tables if t["name"] == payload.target_table] + [t for t in tables if t["name"] != payload.target_table]
    
    engine_str = str(getattr(engine, "url", "")).lower() if engine else "sqlite"
    dialect = "sqlite" if "sqlite" in engine_str else "postgresql"
    
    from app.services.gemini_service import gemini_service
    result = await gemini_service.generate_sql_from_natural_language(
        payload.natural_query.strip(), tables, dialect=dialect
    )
    return result

@router.post("/sync")
async def sync_all_datasets_to_db():
    """Sync all datasets from local storage to PostgreSQL tables"""
    try:
        init_db()
        synced = 0
        for ds_id, info in dataset_service.datasets.items():
            df = info.get("dataframe")
            if save_dataset_to_db(ds_id, info, df):
                synced += 1
        
        tables = get_db_tables_info()
        return {
            "success": True,
            "synced_datasets": synced,
            "total_tables": len(tables),
            "tables": tables
        }
    except Exception as e:
        logger.error(f"Error syncing datasets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import-table")
async def import_table_as_dataset(payload: ImportTableRequest):
    """Import an existing PostgreSQL table as a Clarivo dataset"""
    if engine is None:
        raise HTTPException(status_code=400, detail="Database not connected")
    
    table_name = payload.table_name.strip()
    try:
        df = pd.read_sql_table(table_name, con=engine)
        if df.empty:
            raise HTTPException(status_code=400, detail=f"Table '{table_name}' has no data")
        
        ds_id = str(uuid.uuid4())
        name = payload.dataset_name or table_name
        
        analysis = dataset_service._analyze_dataframe(df)
        dataset_info = {
            'id': ds_id,
            'name': name,
            'file_path': f"sql://{table_name}",
            'dataframe': df,
            'uploaded_at': pd.Timestamp.now(),
            'status': 'ready',
            'rows': len(df),
            'columns': len(df.columns),
            'column_info': analysis['column_info'],
            'summary': analysis['summary'],
            'data_quality': analysis['data_quality'],
            'ai_insights': {'analysis': f'Imported from PostgreSQL table {table_name}', 'recommendations': []}
        }
        
        dataset_service.datasets[ds_id] = dataset_info
        dataset_service._save_dataframe(ds_id, df)
        dataset_service._save_datasets()
        
        return {
            "success": True,
            "dataset_id": ds_id,
            "name": name,
            "rows": len(df),
            "columns": len(df.columns)
        }
    except Exception as e:
        logger.error(f"Error importing table {table_name}: {e}")
        raise HTTPException(status_code=400, detail=f"Could not import table: {str(e)}")
