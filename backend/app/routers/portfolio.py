"""Public portfolio and engineer profiles."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import ReviewSession, User, ReviewVersion
from ..schemas import UserOut
from ..security import get_current_user
from ..services import catalog, reputation

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.get("", response_model=list[dict])
def list_public_portfolios(db: Session = Depends(get_db)):
    return catalog.list_engineers(db)


@router.get("/{username}")
def get_portfolio(username: str, db: Session = Depends(get_db)):
    try:
        user = db.scalar(select(User).where(User.username == username))
        if user is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Engineer not found")

        # Get sessions that are public and approved
        sessions = db.scalars(
            select(ReviewSession).where(
                ReviewSession.owner_id == user.id,
                ReviewSession.portfolio_public == True,
                ReviewSession.status == "approved",
            ).options(joinedload(ReviewSession.versions))
            .order_by(ReviewSession.updated_at.desc())
        ).unique().all()

        # For each session, find approved version details
        tracks = []
        for session in sessions:
            # Find approved version (status approved) with highest number
            approved_version = db.scalars(
                select(ReviewVersion).where(
                    ReviewVersion.session_id == session.id,
                    ReviewVersion.status == "approved",
                ).order_by(ReviewVersion.number.desc())
            ).first()

            tracks.append({
                "session_id": session.id,
                "name": session.name,
                "status": session.status,  # should be "approved"
                "version_count": len(session.versions),
                "has_approved": approved_version is not None,
                "approved_label": approved_version.label if approved_version else None,
                "approved_filename": approved_version.filename if approved_version else None,
                "approved_version_id": approved_version.id if approved_version else None,
                "approved_duration_s": approved_version.duration_s if approved_version else None,
                "approved_at": approved_version.created_at if approved_version else None,
                "delivery_token": session.share_token,
            })

        rep = reputation.compute_reputation(db, user.id)
        badge = reputation.badge_for_score(rep["score"])

        return {
            "username": user.username,
            "track_count": len(tracks),
            "tracks": tracks,
            "reputation": rep,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
