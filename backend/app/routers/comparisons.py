"""Version and reference A/B comparisons."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import LedgerEvent, ReferenceComparison, ReferenceTrack, ReviewSession, ReviewVersion, StemAsset, VersionComparison, utcnow
from ..schemas import ReferenceComparisonCreate, ReferenceComparisonOut, VersionComparisonCreate, VersionComparisonOut
from ..security import get_current_user
from ..services import ledger, loudness, storage

router = APIRouter(prefix="/api/comparisons", tags=["comparisons"])


def _own_version(db: Session, version_id: int, user) -> ReviewVersion:
    version = db.get(ReviewVersion, version_id)
    session = db.get(ReviewSession, version.session_id) if version else None
    if version is None or session is None or session.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")
    return version


@router.post("", response_model=VersionComparisonOut, status_code=status.HTTP_201_CREATED)
def create_comparison(payload: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a version comparison (A/B) with optional loudness level matching."""
    base_id = payload.get("base_version_id")
    compare_id = payload.get("compare_version_id")
    start_ms = payload.get("start_ms", 0)
    end_ms = payload.get("end_ms")
    request_id = payload.get("request_id")
    level_match = payload.get("level_match", "integrated_lufs")
    mode = payload.get("mode", "full_mix")
    stem_logical_name = payload.get("stem_logical_name")

    base = _own_version(db, base_id, user)
    compare = _own_version(db, compare_id, user)
    if base.session_id != compare.session_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Versions belong to different sessions")

    # Stem mode validation
    if mode == "stem":
        if not stem_logical_name:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "stem_logical_name is required for stem mode")
        base_stem_check = db.scalar(
            select(StemAsset).where(
                StemAsset.version_id == base.id,
                StemAsset.logical_name == stem_logical_name,
            )
        )
        if base_stem_check is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Stem '{stem_logical_name}' is unavailable in v{base.number}")
        compare_stem_check = db.scalar(
            select(StemAsset).where(
                StemAsset.version_id == compare.id,
                StemAsset.logical_name == stem_logical_name,
            )
        )
        if compare_stem_check is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Stem '{stem_logical_name}' is unavailable in v{compare.number}")

    # Compute loudness for level matching
    base_gain_db = 0.0
    compare_gain_db = 0.0
    short_term = {}
    label = "Level match unavailable"
    effective_level_match = "none"

    if level_match != "none":
        # Analyze loudness from stems if mode is stem, otherwise from full mix
        if mode == "stem" and stem_logical_name:
            base_stem = db.scalar(
                select(StemAsset).where(
                    StemAsset.version_id == base.id,
                    StemAsset.logical_name == stem_logical_name,
                )
            )
            compare_stem = db.scalar(
                select(StemAsset).where(
                    StemAsset.version_id == compare.id,
                    StemAsset.logical_name == stem_logical_name,
                )
            )
            if base_stem and compare_stem and base_stem.blob_sha and compare_stem.blob_sha:
                try:
                    base_data = storage.read_blob(base_stem.blob_sha)
                    compare_data = storage.read_blob(compare_stem.blob_sha)
                    base_lufs = loudness.analyse(base_data).get("integrated_lufs")
                    compare_lufs = loudness.analyse(compare_data).get("integrated_lufs")
                    base_gain_db, compare_gain_db = loudness.gain_to_match(base_lufs, compare_lufs)
                    effective_level_match = "short_term_lufs"
                    label = f"Level matched (stem: {stem_logical_name})"
                    short_term = {"base": base_lufs, "compare": compare_lufs}
                except Exception:
                    pass
        else:
            # Full mix analysis
            if base.blob_sha and compare.blob_sha:
                try:
                    base_data = storage.read_blob(base.blob_sha)
                    compare_data = storage.read_blob(compare.blob_sha)
                    base_lufs = loudness.analyse(base_data).get("integrated_lufs")
                    compare_lufs = loudness.analyse(compare_data).get("integrated_lufs")
                    base_gain_db, compare_gain_db = loudness.gain_to_match(base_lufs, compare_lufs)
                    effective_level_match = "short_term_lufs"
                    label = f"Level matched: v{base.number} vs v{compare.number}"
                    short_term = {"v" + str(base.number): base_lufs, "v" + str(compare.number): compare_lufs}
                except Exception:
                    pass

    comparison = VersionComparison(
        session_id=base.session_id,
        base_version_id=base_id,
        compare_version_id=compare_id,
        request_id=request_id,
        start_ms=start_ms,
        end_ms=end_ms,
        base_gain_db=base_gain_db,
        compare_gain_db=compare_gain_db,
        level_match=effective_level_match,
        short_term_lufs=short_term,
        mode=mode,
        stem_logical_name=stem_logical_name,
    )
    db.add(comparison)
    ledger.append(db, "comparison.created", session_id=base.session_id, actor=user.username, entity_type="comparison", entity_id=comparison.id, payload={"mode": mode, "stem": stem_logical_name})
    db.commit()
    db.refresh(comparison)
    out = VersionComparisonOut.model_validate(comparison, from_attributes=True)
    out.label = label
    return out


@router.get("/{comparison_id}", response_model=VersionComparisonOut)
def get_comparison(comparison_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a comparison by ID."""
    comp = db.get(VersionComparison, comparison_id)
    if comp is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comparison not found")
    session = db.get(ReviewSession, comp.session_id)
    if session is None or session.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comparison not found")
    return VersionComparisonOut.model_validate(comp, from_attributes=True)


@router.post("/versions", response_model=VersionComparisonOut, status_code=status.HTTP_201_CREATED)
def create_version_comparison(payload: VersionComparisonCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    base = _own_version(db, payload.base_version_id, user)
    compare = _own_version(db, payload.compare_version_id, user)
    if base.session_id != compare.session_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Versions belong to different sessions")
    comparison = VersionComparison(
        session_id=base.session_id,
        base_version_id=payload.base_version_id,
        compare_version_id=payload.compare_version_id,
        start_ms=payload.start_ms,
        end_ms=payload.end_ms,
        level_match=payload.level_match,
    )
    db.add(comparison)
    db.commit()
    db.refresh(comparison)
    return VersionComparisonOut.model_validate(comparison, from_attributes=True)


@router.post("/references", response_model=ReferenceComparisonOut, status_code=status.HTTP_201_CREATED)
def create_reference_comparison(payload: ReferenceComparisonCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    version = _own_version(db, payload.version_id, user)
    reference = db.get(ReferenceTrack, payload.reference_id)
    if reference is None or reference.session_id != version.session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reference not found")
    comparison = ReferenceComparison(
        session_id=version.session_id,
        version_id=payload.version_id,
        reference_id=payload.reference_id,
        start_ms=payload.start_ms,
        end_ms=payload.end_ms,
        level_match=payload.level_match,
    )
    db.add(comparison)
    db.commit()
    db.refresh(comparison)
    return ReferenceComparisonOut.model_validate(comparison, from_attributes=True)
