"""Reference tracks for sessions — upload, stream, compare."""
import hashlib

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ReferenceTrack, ReferenceComparison, ReviewSession, ReviewVersion, User, utcnow
from ..schemas import ReferenceTrackCreate, ReferenceTrackOut
from ..security import get_current_user
from ..services import ledger, storage, waveform

router = APIRouter(prefix="/api/sessions/{session_id}/references", tags=["references"])

ALLOWED_AUDIO = {"wav", "mp3", "flac", "ogg", "aif", "aiff", "m4a"}


def _get_session(db: Session, session_id: int, user: User) -> ReviewSession:
    session = db.get(ReviewSession, session_id)
    if session is None or session.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session


def _get_public_session(db: Session, session_id: int) -> ReviewSession:
    session = db.get(ReviewSession, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session


@router.get("", response_model=list[ReferenceTrackOut])
def list_references(session_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_session(db, session_id, user)
    refs = db.scalars(
        select(ReferenceTrack).where(ReferenceTrack.session_id == session_id)
    ).all()
    return [ReferenceTrackOut.model_validate(r, from_attributes=True) for r in refs]


@router.post("", response_model=ReferenceTrackOut, status_code=status.HTTP_201_CREATED)
def create_reference(session_id: int, payload: ReferenceTrackCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_session(db, session_id, user)
    ref = ReferenceTrack(
        session_id=session_id,
        title=payload.title,
        artist=payload.artist,
        source_type=payload.source_type,
        external_url=payload.external_url,
        purpose=payload.purpose,
        visibility=payload.visibility,
        note=payload.note,
        created_by=user.username,
        analysis_status="pending",
    )
    db.add(ref)
    ledger.append(db, "reference.created", session_id=session_id, actor=user.username, entity_type="reference", entity_id=ref.id, payload={"title": ref.title})
    db.commit()
    db.refresh(ref)
    return ReferenceTrackOut.model_validate(ref, from_attributes=True)


@router.post("/upload", response_model=ReferenceTrackOut, status_code=status.HTTP_201_CREATED)
def upload_reference(
    session_id: int,
    title: str = Form(""),
    artist: str = Form(""),
    purpose: str = Form("overall"),
    visibility: str = Form("reviewers"),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload an audio reference file."""
    _get_session(db, session_id, user)
    ext = (file.filename or "ref.wav").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else ""
    if ext not in ALLOWED_AUDIO:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unsupported audio format '{ext}'")
    data = file.file.read()
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Empty file")
    sha = storage.put_blob(data)
    wf = waveform.generate(sha, data, file.filename or "ref.wav", ext)

    # Extract loudness metadata
    from ..services.loudness import analyse
    loudness = analyse(data)

    ref = ReferenceTrack(
        session_id=session_id,
        title=title,
        artist=artist,
        source_type="private_upload",
        blob_sha=sha,
        filename=file.filename or "ref.wav",
        size=len(data),
        audio_format=ext,
        duration_s=wf["duration_s"],
        purpose=purpose,
        visibility=visibility,
        created_by=user.username,
        analysis_status="done" if loudness.get("integrated_lufs") is not None else "failed",
        integrated_lufs=loudness.get("integrated_lufs"),
        true_peak_dbtp=loudness.get("true_peak_dbtp"),
        sample_rate=loudness.get("sample_rate"),
        channels=loudness.get("channels"),
    )
    db.add(ref)
    ledger.append(db, "reference.created", session_id=session_id, actor=user.username, entity_type="reference", entity_id=ref.id, payload={"title": ref.title})
    db.commit()
    db.refresh(ref)
    out = ReferenceTrackOut.model_validate(ref, from_attributes=True)
    out.waveform = wf.get("peaks")
    return out


@router.patch("/{reference_id}", response_model=ReferenceTrackOut)
def update_reference(session_id: int, reference_id: int, payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update reference metadata (visibility, note, etc.)."""
    _get_session(db, session_id, user)
    ref = db.get(ReferenceTrack, reference_id)
    if ref is None or ref.session_id != session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reference not found")
    if "visibility" in payload:
        ref.visibility = payload["visibility"]
    if "note" in payload:
        ref.note = payload["note"]
    if "title" in payload:
        ref.title = payload["title"]
    ledger.append(db, "reference.updated", session_id=session_id, actor=user.username, entity_type="reference", entity_id=ref.id, payload={"title": ref.title})
    db.commit()
    db.refresh(ref)
    return ReferenceTrackOut.model_validate(ref, from_attributes=True)


@router.get("/{reference_id}/audio")
def get_reference_audio(session_id: int, reference_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Stream reference audio (owner only)."""
    _get_session(db, session_id, user)
    ref = db.get(ReferenceTrack, reference_id)
    if ref is None or ref.session_id != session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reference not found")
    if not ref.blob_sha:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No audio")
    data = storage.read_blob(ref.blob_sha)
    return Response(content=data, media_type=f"audio/{ref.audio_format or 'wav'}")


@router.delete("/{reference_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reference(session_id: int, reference_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_session(db, session_id, user)
    ref = db.get(ReferenceTrack, reference_id)
    if ref is None or ref.session_id != session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reference not found")
    ledger.append(db, "reference.removed", session_id=session_id, actor=user.username, entity_type="reference", entity_id=ref.id, payload={"title": ref.title})
    db.delete(ref)
    db.commit()


@router.post("/compare", status_code=status.HTTP_201_CREATED)
def compare_reference(
    session_id: int,
    payload: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Compare a version against a reference track (A/B loudness-matched)."""
    _get_session(db, session_id, user)
    version_id = payload.get("version_id")
    reference_id = payload.get("reference_id")
    start_ms = payload.get("start_ms", 0)
    end_ms = payload.get("end_ms")

    version = db.get(ReviewVersion, version_id)
    if version is None or version.session_id != session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")

    ref = db.get(ReferenceTrack, reference_id)
    if ref is None or ref.session_id != session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reference not found")

    # URL references can't be compared in-app
    if ref.source_type == "external_url":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot compare external URL references")

    # Compute gain adjustments for level matching
    mix_gain_db = 0.0
    ref_gain_db = 0.0
    if ref.integrated_lufs is not None:
        # Simple level matching: attenuate the louder one
        # For now, use a simplified model: ref is attenuated if louder
        ref_gain_db = min(0.0, -(abs(ref.integrated_lufs + 14.0)))  # rough LUFS normalization

    comp = ReferenceComparison(
        session_id=session_id,
        version_id=version_id,
        reference_id=reference_id,
        start_ms=start_ms,
        end_ms=end_ms or 0,
        level_match="short_term_lufs",
        mix_gain_db=mix_gain_db,
        ref_gain_db=ref_gain_db,
    )
    db.add(comp)
    ledger.append(db, "reference.compared", session_id=session_id, actor=user.username, entity_type="reference", entity_id=reference_id, payload={"version_id": version_id})
    db.commit()

    return {
        "id": comp.id,
        "version_id": version_id,
        "reference_id": reference_id,
        "level_match": "short_term_lufs",
        "mix_gain_db": mix_gain_db,
        "ref_gain_db": ref_gain_db,
        "reference_label": ref.title,
        "mix_audio_url": f"/api/sessions/{session_id}/versions/{version_id}/audio",
        "ref_audio_url": f"/api/sessions/{session_id}/references/{reference_id}/audio",
        "start_ms": start_ms,
        "end_ms": end_ms or 0,
    }
