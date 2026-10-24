from datetime import datetime
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
import psutil

from app.core.config import settings
from app.database.session import get_db

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
def check_health(db: Session = Depends(get_db)):
    """
    Comprehensive system health check.
    Validates backend status, database connectivity, and host metrics.
    """
    db_status = "healthy"
    db_error = None
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "unhealthy"
        db_error = str(e)

    # Collect host metrics via psutil safely
    try:
        cpu_usage = psutil.cpu_percent(interval=None)
        memory_info = psutil.virtual_memory()
        memory_usage = memory_info.percent
    except Exception:
        cpu_usage = 0.0
        memory_usage = 0.0

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "database": {
            "status": db_status,
            "error": db_error
        },
        "system": {
            "cpu_usage_percent": cpu_usage,
            "memory_usage_percent": memory_usage
        }
    }
