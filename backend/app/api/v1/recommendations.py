from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.recommendation import Recommendation
from app.schemas.analytics import RecommendationOut
from app.ml.recommender import RecommendationEngine
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[RecommendationOut])
def list_recommendations(
    project_id: str = None,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """List AI resource optimization recommendations."""
    query = db.query(Recommendation)
    if project_id:
        query = query.filter(Recommendation.project_id == project_id)
    return query.order_by(Recommendation.created_at.desc()).all()


@router.post("/generate/{project_id}", response_model=List[RecommendationOut])
def generate_recommendations_for_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """Trigger AI analysis to generate fresh optimization recommendations for a project."""
    return RecommendationEngine.generate_recommendations(db, project_id)


@router.post("/{rec_id}/apply", response_model=RecommendationOut)
def apply_recommendation(
    rec_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """Mark a recommendation as applied."""
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")
    rec.is_applied = True
    db.commit()
    db.refresh(rec)
    return rec
