from typing import List, Any
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.cost import CostEstimate
from app.schemas.analytics import CostEstimateCreate, CostEstimateOut
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[CostEstimateOut])
def list_cost_estimates(
    project_id: str = None,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """List historical cloud cost estimates."""
    query = db.query(CostEstimate)
    if project_id:
        query = query.filter(CostEstimate.project_id == project_id)
    return query.order_by(CostEstimate.created_at.desc()).limit(20).all()


@router.post("", response_model=CostEstimateOut)
def record_cost_estimate(
    cost_in: CostEstimateCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """Save an infrastructure cost snapshot."""
    cost = CostEstimate(
        project_id=cost_in.project_id or "cluster-wide",
        cloud_provider=cost_in.cloud_provider,
        monthly_cost=cost_in.monthly_cost,
        breakdown_json=cost_in.breakdown_json,
        created_at=datetime.utcnow()
    )
    db.add(cost)
    db.commit()
    db.refresh(cost)
    return cost
