"""Version-specific endpoints for direct access to version resources."""
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import MAX_UPLOAD_SIZE
from ..database import get_db
from ..models import (
    ReviewSession,
    ReviewVersion,
    StemAsset,
    User,
    AudioAnalysis,
    utcnow,
)
from ..schemas import (
    ReviewVersionOut,
)
from ..security import get_current_user
from ..services import analysis, storage, waveform

router = APIRouter(prefix="/api/versions", tags=["versions"])


def _get_version_or_404(db: Session, version_id: int) -> ReviewVersion:
    version = db.get(ReviewVersion, version_id)
    if version is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")
    return version


def _verify_version_access(db: Session, version: ReviewVersion, user: User) -> None:
    """Verify that the user has access to the version through its session."""
    session = db.get(ReviewSession, version.session_id)
    if session is None or session.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")


@router.get("/{version_id}/stems", response_model=list[dict])
def list_version_stems(version_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all stems for a specific version."""
    version = _get_version_or_404(db, version_id)
    _verify_version_access(db, version, user)

    stems = db.scalars(
        select(StemAsset).where(StemAsset.version_id == version_id)
    ).all()

    return [
        {
            "id": stem.id,
            "logical_name": stem.logical_name,
            "display_name": stem.display_name,
            "blob_sha": stem.blob_sha,
            "size": stem.size,
            "audio_format": stem.audio_format,
            "start_offset_ms": stem.start_offset_ms,
            "created_at": stem.created_at,
        }
        for stem in stems
    ]


@router.post("/{version_id}/stems", response_model=dict, status_code=status.HTTP_201_CREATED)
def upload_version_stem(
    version_id: int,
    logical_name: str = Form(...),
    display_name: str = Form(...),
    start_offset_ms: int = Form(0),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a stem to a specific version."""
    version = _get_version_or_404(db, version_id)
    _verify_version_access(db, version, user)

    try:
        data = storage.put_upload_file(file, MAX_UPLOAD_SIZE)
    except ValueError as exc:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, str(exc))

    sha = storage.put_blob(data)
    stem = StemAsset(
        version_id=version_id,
        logical_name=logical_name,
        display_name=display_name,
        blob_sha=sha,
        size=len(data),
        audio_format=(file.filename or "stem.wav").rsplit(".", 1)[-1].lower(),
        start_offset_ms=start_offset_ms,
    )
    db.add(stem)
    db.commit()
    db.refresh(stem)

    return {
        "id": stem.id,
        "blob_sha": stem.blob_sha,
    }


@router.get("/{version_id}/stems/{stem_id}/audio")
def get_stem_audio(
    version_id: int,
    stem_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the audio blob for a specific stem."""
    version = _get_version_or_404(db, version_id)
    _verify_version_access(db, version, user)

    stem = db.get(StemAsset, stem_id)
    if stem is None or stem.version_id != version_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Stem not found")

    data = storage.read_blob(stem.blob_sha)
    return Response(
        content=data,
        media_type=f"audio/{stem.audio_format}",
        headers={"Content-Disposition": f'inline; filename="{stem.display_name}"'},
    )


@router.get("/{version_id}/audio-analysis")
def get_version_audio_analysis(version_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get audio analysis for a specific version. Runs analysis if not yet done."""
    version = _get_version_or_404(db, version_id)
    _verify_version_access(db, version, user)

    existing = db.get(AudioAnalysis, version_id)
    if existing and existing.analysis_status == "done":
        return {
            "version_id": version_id,
            "analysis_status": existing.analysis_status,
            "duration_ms": existing.duration_ms,
            "sample_rate": existing.sample_rate,
            "channels": existing.channels,
            "integrated_lufs": existing.integrated_lufs,
            "true_peak_dbtp": existing.true_peak_dbtp,
            "analysed_at": existing.analysed_at,
        }

    # Run analysis now
    if not version.blob_sha:
        return {
            "version_id": version_id,
            "analysis_status": "pending",
            "duration_ms": 0,
            "sample_rate": None,
            "channels": None,
            "integrated_lufs": None,
            "true_peak_dbtp": None,
        }

    from ..services.loudness import analyse
    data = storage.read_blob(version.blob_sha)
    result = analyse(data)
    status_val = result.get("status", "done")
    if existing:
        existing.analysis_status = status_val
        existing.sample_rate = result.get("sample_rate")
        existing.channels = result.get("channels")
        existing.integrated_lufs = result.get("integrated_lufs")
        existing.true_peak_dbtp = result.get("true_peak_dbtp")
        existing.duration_ms = int(result.get("duration_s", 0) * 1000)
        existing.analysed_at = utcnow()
    else:
        existing = AudioAnalysis(
            version_id=version_id,
            analysis_status=status_val,
            sample_rate=result.get("sample_rate"),
            channels=result.get("channels"),
            integrated_lufs=result.get("integrated_lufs"),
            true_peak_dbtp=result.get("true_peak_dbtp"),
            duration_ms=int(result.get("duration_s", 0) * 1000),
            analysed_at=utcnow(),
        )
        db.add(existing)
    db.commit()
    db.refresh(existing)

    return {
        "version_id": version_id,
        "analysis_status": existing.analysis_status,
        "duration_ms": existing.duration_ms,
        "sample_rate": existing.sample_rate,
        "channels": existing.channels,
        "integrated_lufs": existing.integrated_lufs,
        "true_peak_dbtp": existing.true_peak_dbtp,
        "analysed_at": existing.analysed_at,
    }