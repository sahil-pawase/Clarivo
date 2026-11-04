"""
Database integration module for Clarivo (supports PostgreSQL, SQLite, etc.)
"""
import json
import logging
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
from sqlalchemy import (
    create_engine, Column, String, Integer, DateTime, Text, inspect, text
)
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
from app.core.config import settings

logger = logging.getLogger(__name__)

def safe_db_json_dumps(obj: Any) -> str:
    """Safely serialize objects containing numpy / pandas / datetime types to JSON string"""
    def _default(o):
        try:
            if pd.isna(o):
                return None
        except Exception:
            pass
        if isinstance(o, (np.integer,)):
            return int(o)
        if isinstance(o, (np.floating,)):
            if np.isnan(o) or np.isinf(o):
                return None
            return float(o)
        if isinstance(o, np.ndarray):
            return o.tolist()
        if isinstance(o, (pd.Timestamp, datetime)):
            return o.isoformat()
        if isinstance(o, pd.DataFrame):
            return o.to_dict('records')
        if isinstance(o, pd.Series):
            return o.to_dict()
        return str(o)
    
    return json.dumps(obj, default=_default)

Base = declarative_base()

class DatasetModel(Base):
    __tablename__ = "clarivo_datasets"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    columns_json = Column(Text, nullable=True)
    summary_json = Column(Text, nullable=True)
    status = Column(String(50), default="ready")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChartModel(Base):
    __tablename__ = "clarivo_charts"

    id = Column(String(100), primary_key=True, index=True)
    dataset_id = Column(String(100), index=True)
    title = Column(String(255), nullable=True)
    chart_type = Column(String(100), nullable=True)
    config_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserModel(Base):
    __tablename__ = "clarivo_users"

    id = Column(String(100), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False)  # 'admin', 'student'
    avatar_url = Column(String(500), nullable=True)
    department = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)

class AuditLogModel(Base):
    __tablename__ = "clarivo_audit_logs"

    id = Column(String(100), primary_key=True, index=True)
    event_type = Column(String(100), index=True, nullable=False)  # UPLOAD, QUERY, EXPORT, CLEAN, AI_ANALYSIS, LOGIN, COMPLIANCE
    user_email = Column(String(255), nullable=True, index=True)
    action = Column(String(255), nullable=False)
    resource_id = Column(String(100), nullable=True, index=True)
    details_json = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    status = Column(String(50), default="SUCCESS")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

# Engine initialization
try:
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={"connect_timeout": 5} if "postgresql" in db_url else {}
    )
    # Test connection
    with engine.connect() as conn:
        pass
    SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
    logger.info(f"Database engine configured with URL: {db_url.split('@')[-1] if '@' in db_url else db_url}")
except Exception as e:
    logger.warning(f"Primary PostgreSQL connection failed ({e}), falling back to SQLite clarivo.db")
    try:
        engine = create_engine("sqlite:///./clarivo.db")
        SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
        logger.info("Fallback SQLite database initialized successfully")
    except Exception as sqle:
        logger.error(f"Error configuring SQLite database engine: {sqle}")
        engine = None
        SessionLocal = None

def seed_default_users():
    """Seed default admin, student accounts and primary credentials if they don't exist"""
    if engine is None or SessionLocal is None:
        return
    import hashlib
    session = SessionLocal()
    try:
        # Primary User: pawasesahil2004@gmail.com / Sahil2004&&
        sahil_email = "pawasesahil2004@gmail.com"
        sahil_pw_hash = hashlib.sha256("Sahil2004&&".encode()).hexdigest()
        existing_sahil = session.query(UserModel).filter(UserModel.email == sahil_email).first()
        if not existing_sahil:
            sahil_user = UserModel(
                id="user_sahil_01",
                email=sahil_email,
                password_hash=sahil_pw_hash,
                full_name="Sahil Pawase",
                role="admin",
                avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=Sahil",
                department="Platform Operations & Lead Administrator",
                created_at=datetime.utcnow()
            )
            session.add(sahil_user)
        else:
            existing_sahil.password_hash = sahil_pw_hash
            existing_sahil.full_name = "Sahil Pawase"
            existing_sahil.role = "admin"

        # Default Admin
        admin_email = "admin@clarivo.io"
        if not session.query(UserModel).filter(UserModel.email == admin_email).first():
            admin_user = UserModel(
                id="user_admin_01",
                email=admin_email,
                password_hash=hashlib.sha256("admin123".encode()).hexdigest(),
                full_name="Clarivo Administrator",
                role="admin",
                avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=Admin",
                department="Platform Operations",
                created_at=datetime.utcnow()
            )
            session.add(admin_user)

        # Default Student
        student_email = "student@clarivo.io"
        if not session.query(UserModel).filter(UserModel.email == student_email).first():
            student_user = UserModel(
                id="user_student_01",
                email=student_email,
                password_hash=hashlib.sha256("student123".encode()).hexdigest(),
                full_name="Alex Sharma (Student)",
                role="student",
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
                department="Computer Science & Data",
                created_at=datetime.utcnow()
            )
            session.add(student_user)

        session.commit()
    except Exception as e:
        session.rollback()
        logger.debug(f"User seed note: {e}")
    finally:
        session.close()

def init_db():
    """Create all required database tables if connected"""
    if engine is None:
        logger.warning("Database engine not initialized")
        return False
    try:
        Base.metadata.create_all(bind=engine)
        seed_default_users()
        logger.info("Database tables and default users initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")
        return False

def clean_column_name(col: str) -> str:
    """Sanitize column name for PostgreSQL"""
    clean = re.sub(r'[^a-zA-Z0-9_]', '_', str(col).strip())
    if clean and clean[0].isdigit():
        clean = f"col_{clean}"
    return clean.lower() or "unnamed_col"

def save_dataset_to_db(dataset_id: str, info: Dict[str, Any], df: Optional[pd.DataFrame] = None) -> bool:
    """Save dataset metadata and records to PostgreSQL"""
    if engine is None or SessionLocal is None:
        return False
    
    session = SessionLocal()
    try:
        # Extract row count, column count, column_info, and summary
        row_cnt = int(info.get("rows") if info.get("rows") is not None else info.get("row_count", 0))
        
        # Column info can be under "column_info" or "columns" (if list)
        col_info_raw = info.get("column_info")
        if not col_info_raw and isinstance(info.get("columns"), list):
            col_info_raw = info.get("columns")
        elif not col_info_raw and df is not None:
            col_info_raw = [{"name": str(c), "dtype": str(df[c].dtype)} for c in df.columns]
        
        if isinstance(info.get("columns"), (int, float)):
            col_cnt = int(info.get("columns"))
        elif col_info_raw:
            col_cnt = len(col_info_raw)
        else:
            col_cnt = int(info.get("column_count", 0))

        if row_cnt == 0 and df is not None:
            row_cnt = len(df)
        if col_cnt == 0 and df is not None:
            col_cnt = len(df.columns)

        columns_json_str = safe_db_json_dumps(col_info_raw or [])
        summary_json_str = safe_db_json_dumps(info.get("summary") or {})
        
        existing = session.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
        if existing:
            existing.name = info.get("name", existing.name)
            existing.original_name = info.get("original_name", existing.original_name)
            existing.file_type = info.get("file_type", existing.file_type)
            existing.row_count = row_cnt
            existing.column_count = col_cnt
            existing.columns_json = columns_json_str
            existing.summary_json = summary_json_str
            existing.status = info.get("status", "ready")
            existing.updated_at = datetime.utcnow()
        else:
            new_item = DatasetModel(
                id=dataset_id,
                name=info.get("name", "Untitled Dataset"),
                original_name=info.get("original_name", ""),
                file_type=info.get("file_type", "csv"),
                row_count=row_cnt,
                column_count=col_cnt,
                columns_json=columns_json_str,
                summary_json=summary_json_str,
                status=info.get("status", "ready"),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(new_item)
        session.commit()

        # 2. Save dataframe into native PostgreSQL table
        if df is not None and not df.empty:
            table_name = f"dataset_{dataset_id.replace('-', '_')}"
            try:
                # Create a clean copy with sanitized column names
                df_db = df.copy()
                df_db.columns = [clean_column_name(c) for c in df_db.columns]
                
                # Write to PostgreSQL
                df_db.to_sql(table_name, con=engine, if_exists="replace", index=False)
                logger.info(f"Saved dataset {dataset_id} dataframe into PostgreSQL table: {table_name}")
            except Exception as sql_err:
                logger.warning(f"Note: Could not write dataset {dataset_id} to SQL table {table_name}: {sql_err}")

        return True
    except Exception as e:
        session.rollback()
        logger.error(f"Error saving dataset {dataset_id} to DB: {e}")
        return False
    finally:
        session.close()

def load_datasets_from_db() -> Dict[str, Dict[str, Any]]:
    """Load all datasets metadata from PostgreSQL (instant)"""
    if engine is None or SessionLocal is None:
        return {}
    
    session = SessionLocal()
    results = {}
    try:
        items = session.query(DatasetModel).all()
        for item in items:
            cols = []
            if item.columns_json:
                try:
                    parsed = json.loads(item.columns_json)
                    cols = parsed if isinstance(parsed, list) else []
                except Exception:
                    cols = []
            
            summ = {}
            if item.summary_json:
                try:
                    parsed = json.loads(item.summary_json)
                    summ = parsed if isinstance(parsed, dict) else {}
                except Exception:
                    summ = {}
            
            cols_count = item.column_count or len(cols) or 0
            rows_count = item.row_count or 0
            
            ds_dict = {
                "id": item.id,
                "name": item.name,
                "original_name": item.original_name or item.name,
                "file_type": item.file_type or "csv",
                "rows": rows_count,
                "row_count": rows_count,
                "columns": cols_count,
                "column_count": cols_count,
                "column_info": cols,
                "size": rows_count * cols_count,
                "summary": summ,
                "status": item.status or "ready",
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "updated_at": item.updated_at.isoformat() if item.updated_at else None,
                "dataframe": None
            }
            results[item.id] = ds_dict
        logger.info(f"Loaded {len(results)} datasets metadata from PostgreSQL")
        return results
    except Exception as e:
        logger.error(f"Error loading datasets from DB: {e}")
        return {}
    finally:
        session.close()

def load_dataset_dataframe_from_db(dataset_id: str, limit: Optional[int] = None) -> Optional[pd.DataFrame]:
    """Load dataset rows on-demand from PostgreSQL table"""
    if engine is None:
        return None
    table_name = f"dataset_{dataset_id.replace('-', '_')}"
    try:
        if limit:
            query = f'SELECT * FROM "{table_name}" LIMIT {limit}'
            return pd.read_sql_query(query, con=engine)
        return pd.read_sql_table(table_name, con=engine)
    except Exception as e:
        logger.debug(f"Could not load sql table {table_name}: {e}")
        return None

DANGEROUS_SQL_KEYWORDS = [
    "drop table", "drop database", "drop schema", "drop view",
    "truncate", "alter table", "grant ", "revoke ",
    "shutdown", "pragma writable_schema", "attach database", "detach database"
]

def execute_raw_sql(query: str, limit: int = 1000) -> Dict[str, Any]:
    """Execute SQL query against connected database with Zero-Trust Security validation"""
    if engine is None:
        return {"success": False, "error": "Database not connected"}
    
    clean_query = query.strip().rstrip(";")
    query_lower = clean_query.lower()

    # 1. Zero-Trust Security Gate: Block destructive DDL/DML
    for kw in DANGEROUS_SQL_KEYWORDS:
        if kw in query_lower:
            log_audit_event(
                event_type="SECURITY_ALERT",
                action="BLOCKED_DESTRUCTIVE_SQL",
                details={"query": clean_query, "matched_rule": kw},
                status="BLOCKED"
            )
            return {
                "success": False,
                "error": f"Security Policy Violation: Destructive statement '{kw.strip().upper()}' is blocked by Clarivo Zero-Trust Security Gate."
            }

    # Block stacked queries / multi-statement injection
    if ";" in clean_query:
        parts = [p.strip() for p in clean_query.split(";") if p.strip()]
        if len(parts) > 1:
            return {
                "success": False,
                "error": "Security Policy Violation: Multi-statement query execution is prohibited to prevent SQL injection."
            }

    # Analytics queries must be non-destructive reads
    allowed_prefixes = ("select", "with", "explain", "show", "describe", "pragma")
    if not query_lower.startswith(allowed_prefixes):
        return {
            "success": False,
            "error": "Security Policy: Only read-only analytical queries (SELECT, WITH, EXPLAIN) are permitted in the workspace."
        }
    
    engine_str = str(getattr(engine, "url", "")).lower()
    
    # If SQLite and querying information_schema, translate to sqlite_master
    if "sqlite" in engine_str and "information_schema.tables" in query_lower:
        clean_query = "SELECT name AS table_name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text(clean_query))
            if result.returns_rows:
                rows = result.fetchmany(limit)
                cols = list(result.keys())
                data = [dict(zip(cols, row)) for row in rows]
                return {
                    "success": True,
                    "columns": cols,
                    "data": data,
                    "row_count": len(data)
                }
            else:
                conn.commit()
                return {"success": True, "message": "Query executed successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_db_tables_info() -> List[Dict[str, Any]]:
    """List all tables in connected database with column details"""
    if engine is None:
        return []
    
    try:
        inspector = inspect(engine)
        tables_list = []
        for table_name in inspector.get_table_names():
            columns = []
            try:
                for col in inspector.get_columns(table_name):
                    columns.append({"name": col["name"], "type": str(col.get("type", "TEXT"))})
            except Exception as ce:
                logger.warning(f"Could not get columns for {table_name}: {ce}")
            tables_list.append({"name": table_name, "columns": columns})
        return tables_list
    except Exception as e:
        logger.error(f"Error getting DB tables: {e}")
        return []

def log_audit_event(
    event_type: str,
    action: str,
    user_email: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    status: str = "SUCCESS"
) -> bool:
    """Enterprise audit logger for compliance, governance and data lineage tracking"""
    if engine is None or SessionLocal is None:
        return False
    import uuid
    session = SessionLocal()
    try:
        log_entry = AuditLogModel(
            id=f"audit_{uuid.uuid4().hex[:12]}",
            event_type=event_type,
            user_email=user_email or "system@clarivo.io",
            action=action,
            resource_id=resource_id,
            details_json=safe_db_json_dumps(details or {}),
            ip_address=ip_address or "127.0.0.1",
            status=status,
            timestamp=datetime.utcnow()
        )
        session.add(log_entry)
        session.commit()
        return True
    except Exception as e:
        session.rollback()
        logger.warning(f"Could not record audit log: {e}")
        return False
    finally:
        session.close()

def get_recent_audit_logs(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve recent enterprise audit events"""
    if engine is None or SessionLocal is None:
        return []
    session = SessionLocal()
    try:
        logs = session.query(AuditLogModel).order_by(AuditLogModel.timestamp.desc()).limit(limit).all()
        result = []
        for l in logs:
            result.append({
                "id": l.id,
                "event_type": l.event_type,
                "user_email": l.user_email,
                "action": l.action,
                "resource_id": l.resource_id,
                "details": json.loads(l.details_json) if l.details_json else {},
                "ip_address": l.ip_address,
                "status": l.status,
                "timestamp": l.timestamp.isoformat() if l.timestamp else datetime.utcnow().isoformat()
            })
        return result
    except Exception as e:
        logger.warning(f"Error reading audit logs: {e}")
        return []
    finally:
        session.close()
