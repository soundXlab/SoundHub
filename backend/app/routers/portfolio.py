"""Public portfolio and engineer profiles."""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import ReleasePackage, ReviewSession, User, ReviewVersion
from ..schemas import UserOut
from ..security import get_current_user
from ..services import catalog, reputation, storage, watermark

logger = logging.getLogger(__name__)

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

            # Find locked release package for delivery token
            pkg = db.scalars(
                select(ReleasePackage).where(
                    ReleasePackage.session_id == session.id,
                    ReleasePackage.status == "ready",
                )
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
                "delivery_token": pkg.delivery_token if pkg else session.share_token,
            })

        rep = reputation.compute_reputation(db, user.id)
        badge = reputation.badge_for_score(rep["score"])

        return {
            "username": user.username,
            "track_count": len(tracks),
            "tracks": tracks,
            "reputation": rep,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in get_portfolio for user %s", username)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{username}/preview/{version_id}")
def portfolio_preview(username: str, version_id: int, db: Session = Depends(get_db)):
    """Watermarked preview of a version from the public portfolio."""
    user = db.scalar(select(User).where(User.username == username))
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Engineer not found")
    version = db.get(ReviewVersion, version_id)
    if version is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")
    # Verify the version belongs to a session owned by this user and is portfolio-public
    session = db.get(ReviewSession, version.session_id)
    if session is None or session.owner_id != user.id or not session.portfolio_public:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")
    # Always serve watermarked preview for portfolio
    data = storage.read_blob(version.blob_sha)
    if session.watermark_enabled:
        data = watermark.watermarked_blob(db, version)
    return Response(
        content=data,
        media_type=f"audio/{version.audio_format}",
        headers={"Content-Disposition": f'inline; filename="{version.filename}"'},
    )
