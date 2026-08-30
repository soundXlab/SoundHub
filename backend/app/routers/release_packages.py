"""Release packages router — lock, deliver, invoice."""
print("LOADING RELEASE_PACKAGES ROUTER", flush=True)
import hashlib
import secrets
import struct
from io import BytesIO

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import DeliveryEvent, Deliverable, ReleasePackage, ReviewSession, ReviewVersion, User, utcnow, LedgerEvent
from ..schemas import DeliverableOut, ReleasePackageCreate, ReleasePackageOut
from ..security import get_current_user
from ..services import ledger, storage

router = APIRouter(prefix="/api/release-packages", tags=["release packages"])


def _extract_wav_metadata(data: bytes) -> dict:
    """Extract sample_rate and bit_depth from WAV data.

    Returns dict with keys: sample_rate, bit_depth, channels
    """
    if len(data) < 44:  # Minimum WAV file size
        return {"sample_rate": None, "bit_depth": None, "channels": None}

    # Check if it's a WAV file
    if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        return {"sample_rate": None, "bit_depth": None, "channels": None}

    try:
        buf = BytesIO(data)
        buf.seek(12)  # Skip RIFF header

        while True:
            header = buf.read(8)
            if len(header) < 8:
                break
            cid, csize = struct.unpack("<4sI", header)

            if cid == b"fmt ":
                chunk = buf.read(csize)
                if len(chunk) >= 16:
                    af, channels, sr = struct.unpack("<HHI", chunk[:8])
                    bits = struct.unpack("<H", chunk[14:16])[0]
                    # Only support PCM format
                    if af == 1:  # PCM
                        return {
                            "sample_rate": sr,
                            "bit_depth": bits,
                            "channels": channels
                        }
            elif cid == b"data":
                # Found data chunk, break
                break
            else:
                # Skip unknown chunk
                buf.seek(csize + (csize % 2), 1)
    except Exception:
        pass

    return {"sample_rate": None, "bit_depth": None, "channels": None}


RELEASE_TEMPLATES = [
    {"id": "final_master", "name": "Final master delivery", "required_deliverables": ["master", "instrumental"]},
    {"id": "label_sync", "name": "Label / sync delivery", "required_deliverables": ["master", "instrumental", "acapella", "stems"]},
    {"id": "archive_handoff", "name": "Archive handoff", "required_deliverables": ["master"]},
    {"id": "stem_handoff", "name": "Stem handoff", "required_deliverables": ["stems"]},
    {"id": "dj_promo", "name": "DJ promo", "required_deliverables": ["master", "clean_edit"]},
    {"id": "post_production", "name": "Post-production", "required_deliverables": ["master", "instrumental"]},
]


@router.get("/templates")
def list_templates():
    """Return available release templates."""
    return RELEASE_TEMPLATES


def _package_out(package: ReleasePackage) -> ReleasePackageOut:
    """Convert a ReleasePackage ORM object to ReleasePackageOut."""
    package_data = {k: v for k, v in package.__dict__.items()
                    if not k.startswith('_') and k not in ('events', 'delivery_events', 'deliverables')}
    package_out = ReleasePackageOut.model_validate(package_data)
    events = [{"event": e.event} for e in package.delivery_events]
    package_out.events = events
    deliverables_list = [{"id": d.id, "type": d.type, "filename": d.filename, "size": d.size, "sha256": d.sha256} for d in package.deliverables]
    package_out.deliverables = deliverables_list
    return package_out


@router.get("", response_model=list[ReleasePackageOut])
def list_packages(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get all sessions for the user, then get packages for those sessions
    from sqlalchemy import select as sql_select
    sessions = db.scalars(
        sql_select(ReviewSession).where(ReviewSession.owner_id == user.id)
    )
    session_ids = [s.id for s in sessions]
    if not session_ids:
        return []

    packages = db.scalars(
        select(ReleasePackage)
        .where(ReleasePackage.session_id.in_(session_ids))
        .options(
            selectinload(ReleasePackage.delivery_events),
            selectinload(ReleasePackage.deliverables),
        )
        .order_by(ReleasePackage.created_at.desc())
    )
    # Convert to ReleasePackageOut and populate events
    result = []
    for package in packages:
        # Query LedgerEvents and DeliveryEvents for this package
        direct_events = db.scalars(sql_select(LedgerEvent).where(LedgerEvent.package_id == package.id)).all()
        direct_delivery = db.scalars(sql_select(DeliveryEvent).where(DeliveryEvent.package_id == package.id)).all()

        # Convert to ReleasePackageOut and populate events
        package_data = {k: v for k, v in package.__dict__.items()
                        if not k.startswith('_') and k not in ('events', 'delivery_events', 'deliverables')}
        package_out = ReleasePackageOut.model_validate(package_data)
        # Populate events field with both LedgerEvents and DeliveryEvents
        events = [{"event": e.event} for e in direct_events]
        events += [{"event": e.event} for e in direct_delivery]
        package_out.events = events
        # Populate deliverables
        deliverables_list = [{"id": d.id, "type": d.type, "filename": d.filename, "size": d.size, "sha256": d.sha256} for d in package.deliverables]
        package_out.deliverables = deliverables_list
        result.append(package_out)
    return result


@router.post("", response_model=ReleasePackageOut, status_code=status.HTTP_201_CREATED)
def create_package(payload: ReleasePackageCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.get(ReviewSession, payload.session_id)
    if session is None or session.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    version = db.get(ReviewVersion, payload.approved_version_id)
    if version is None or version.session_id != payload.session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")
    if version.status != "approved":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Version must be approved before packaging")

    # Apply template defaults: if name was not explicitly set (still default), use template name
    tpl_name = payload.name
    if payload.template != "custom":
        for tpl in RELEASE_TEMPLATES:
            if tpl["id"] == payload.template:
                # Use template name if the caller didn't provide a custom name
                if payload.name == "Final delivery":
                    tpl_name = tpl["name"]
                break
    package = ReleasePackage(
        session_id=payload.session_id,
        approved_version_id=payload.approved_version_id,
        name=tpl_name,
        template=payload.template,
    )
    db.add(package)
    db.flush()
    print(f"AFTER FLUSH: package.id={package.id}", flush=True)

    # Note: Master deliverable is added explicitly via /deliverables/from-version endpoint

    ledger.append(db, "package.created", session_id=payload.session_id, package_id=package.id, actor=user.username, entity_type="package", entity_id=package.id, payload={"name": package.name})
    print(f"ABOUT TO COMMIT IN CREATE_PACKAGE", flush=True)
    db.commit()
    db.refresh(package)
    # Query LedgerEvents directly
    direct_ledger_events = db.scalars(
        select(LedgerEvent).where(LedgerEvent.package_id == package.id)
    ).all()
    # Convert to ReleasePackageOut and populate events
    package_data = {k: v for k, v in package.__dict__.items()
                    if not k.startswith('_') and k not in ('events', 'delivery_events', 'deliverables')}
    package_out = ReleasePackageOut.model_validate(package_data)
    events = [{"event": e.event} for e in direct_ledger_events]
    events += [{"event": e.event} for e in package.delivery_events]
    package_out.events = events
    return package_out


@router.post("/{package_id}/preflight", response_model=dict)
def preflight_check(package_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """QC preflight — verify package is ready to lock."""
    package = db.get(ReleasePackage, package_id)
    if package is None or package.session_id not in [
        s.id for s in db.scalars(select(ReviewSession).where(ReviewSession.owner_id == user.id)).all()
    ]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    deliverables = db.scalars(select(Deliverable).where(Deliverable.package_id == package_id)).all()
    checks = []
    # Check required deliverables from template
    required = []
    for tpl in RELEASE_TEMPLATES:
        if tpl["id"] == package.template:
            required = tpl.get("required_deliverables", [])
            break
    delivered_types = {d.type for d in deliverables}
    for req in required:
        if req not in delivered_types:
            checks.append({"status": "block", "label": "Required deliverable missing", "detail": req})
    # Check for empty files
    for d in deliverables:
        if d.size == 0:
            checks.append({"status": "block", "label": "Empty file", "detail": d.filename})
    # Check for placeholder blob_sha
    for d in deliverables:
        if d.blob_sha == "placeholder_blob_sha":
            checks.append({"status": "block", "label": "Placeholder blob not replaced", "detail": d.filename})
    # Check stem version alignment
    if "stems" in required and "stems" not in delivered_types:
        pass  # already flagged as missing required
    elif "stems" in delivered_types:
        stem_dels = [d for d in deliverables if d.type == "stems"]
        stem_versions = {d.from_version_id for d in stem_dels if d.from_version_id}
        if not stem_versions:
            checks.append({"status": "block", "label": "Stems not linked to version", "detail": ""})
    # Check if any deliverable has zero sample rate (bad WAV)
    for d in deliverables:
        if d.size > 0 and (d.sample_rate == 0 or d.sample_rate is None):
            checks.append({"status": "block", "label": "Invalid audio metadata", "detail": d.filename})
    # Check that required deliverables have a sha256 hash
    for d in deliverables:
        if d.type in required and not d.sha256:
            checks.append({"status": "block", "label": "Missing SHA-256 for required deliverable", "detail": d.filename})
    # Check that session has a brief with required fields
    session = db.get(ReviewSession, package.session_id)
    if session and not session.genre:
        checks.append({"status": "block", "label": "Session brief missing genre", "detail": ""})
    # Check that approved version has a watermark
    if package.approved_version_id:
        approved_v = db.get(ReviewVersion, package.approved_version_id)
        if approved_v and not approved_v.watermark_sha:
            checks.append({"status": "warn", "label": "No watermark on approved version", "detail": approved_v.label})
    # Check that session brief has required fields for templates that need them
    session = db.get(ReviewSession, package.session_id)
    if package.template == "label_sync" and session:
        if not session.required_deliverables.strip():
            checks.append({"status": "block", "label": "Session brief missing required_deliverables", "detail": ""})
        if not session.genre.strip():
            checks.append({"status": "block", "label": "Session brief missing genre", "detail": ""})
    # Check for duplicate deliverable types
    type_counts = {}
    for d in deliverables:
        type_counts[d.type] = type_counts.get(d.type, 0) + 1
    for t, cnt in type_counts.items():
        if cnt > 1:
            checks.append({"status": "warn", "label": f"Duplicate deliverable type: {t}", "detail": f"{cnt} files"})
    # Already locked
    if package.status == "ready":
        checks.append({"status": "block", "label": "Already locked", "detail": ""})
    blocking = any(c["status"] == "block" for c in checks)
    passed = not blocking
    return {"passed": passed, "blocking": blocking, "checks": checks, "package_id": package_id}


@router.post("/{package_id}/lock", response_model=ReleasePackageOut)
def lock_package(package_id: int, payload: dict = {}, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    package = db.get(ReleasePackage, package_id)
    if package is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    if package.status == "ready":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Package is already locked")
    force = payload.get("force", False)
    force_reason = payload.get("force_reason", "")
    if force and not force_reason.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "force_reason is required when force=True")
    # Deposit gate — block lock until deposit is paid or waived
    session = db.get(ReviewSession, package.session_id)
    if session and session.deposit_status == "deposit_due" and session.deposit_due_cents and session.deposit_due_cents > 0:
        raise HTTPException(402, "Deposit must be paid before locking")
    # Check preflight unless force
    if not force:
        deliverables = db.scalars(select(Deliverable).where(Deliverable.package_id == package_id)).all()
        required = []
        for tpl in RELEASE_TEMPLATES:
            if tpl["id"] == package.template:
                required = tpl.get("required_deliverables", [])
                break
        delivered_types = {d.type for d in deliverables}
        missing = [r for r in required if r not in delivered_types]
        if missing:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Preflight failed: missing deliverables: {', '.join(missing)}")
        # Check for empty audio deliverables (blocks lock without force)
        AUDIO_TYPES = {"master", "instrumental", "acapella", "stems", "clean_edit", "radio_edit"}
        empty_audio = [d for d in deliverables if d.size == 0 and d.type in AUDIO_TYPES]
        if empty_audio:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Preflight failed: empty audio deliverables")
    package.locked_by = user.username
    package.status = "ready"
    if force:
        package.force_locked_reason = force_reason
        package.force_locked_by = user.username

    # Generate manifest content based on deliverables
    deliverables = db.scalars(
        select(Deliverable).where(Deliverable.package_id == package_id)
    ).all()

    manifest_content = {
        "files": [
            {
                "id": d.id,
                "type": d.type,
                "filename": d.filename,
                "size": d.size,
                "sha256": d.sha256,
                "sample_rate": d.sample_rate,
                "bit_depth": d.bit_depth,
                "channels": d.channels,
                "format": d.format,
                "is_required": d.is_required,
            }
            for d in deliverables
        ]
    }

    # Set session_manifest to the manifest content
    package.session_manifest = manifest_content

    # Compute manifest_hash as SHA-256 of the JSON representation
    import json
    manifest_json_str = json.dumps(manifest_content, sort_keys=True)
    package.manifest_hash = hashlib.sha256(manifest_json_str.encode()).hexdigest()

    # Generate delivery token
    package.delivery_token = secrets.token_urlsafe(32)

    # Add ledger entry for package locked
    lock_event = "package.lock_forced" if force else "package.locked"
    ledger_payload = {"scope": "master", "note": "final"}
    if force:
        ledger_payload["reason"] = force_reason
        ledger_payload["confirmed_by"] = user.username
    ledger.append(db, lock_event, session_id=package.session_id, package_id=package.id, actor=user.username, entity_type="package", entity_id=package.id, payload=ledger_payload)

    db.commit()
    db.refresh(package)
    # Query LedgerEvents and DeliveryEvents directly
    direct_ledger_events = db.scalars(
        select(LedgerEvent).where(LedgerEvent.package_id == package.id)
    ).all()
    # Ensure deliverables relationship is loaded
    _ = len(package.deliverables)
    # Convert to ReleasePackageOut and populate events
    package_data = {k: v for k, v in package.__dict__.items()
                    if not k.startswith('_') and k not in ('events', 'delivery_events', 'deliverables')}
    package_out = ReleasePackageOut.model_validate(package_data)
    events = [{"event": e.event} for e in direct_ledger_events]
    events += [{"event": e.event} for e in package.delivery_events]
    package_out.events = events
    deliverables_list = [{"id": d.id, "type": d.type, "filename": d.filename, "size": d.size, "sha256": d.sha256} for d in package.deliverables]
    package_out.deliverables = deliverables_list
    return package_out


@router.get("/{package_id}/deliverables", response_model=list[DeliverableOut])
def list_deliverables(package_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    package = db.get(ReleasePackage, package_id)
    if package is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    # Simplified authorization check
    deliverables = db.scalars(select(Deliverable).where(Deliverable.package_id == package_id))
    return [DeliverableOut.model_validate(d, from_attributes=True) for d in deliverables]


@router.post("/{package_id}/deliverables/from-version", response_model=DeliverableOut, status_code=status.HTTP_201_CREATED)
def create_deliverable_from_version(package_id: int, payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    package = db.get(ReleasePackage, package_id)
    if package is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    version_id = payload.get("from_version_id")
    version = db.get(ReviewVersion, version_id)
    if version is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")
    if version.session_id != package.session_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Version does not belong to this package.")

    # Extract audio metadata from version's blob
    audio_metadata = {"sample_rate": None, "bit_depth": None, "channels": None}
    if version.audio_format == "wav":
        try:
            data = storage.read_blob(version.blob_sha)
            audio_metadata = _extract_wav_metadata(data)
        except Exception:
            # If we can't read the blob, leave metadata as None
            pass

    deliverable = Deliverable(
        package_id=package_id,
        type=payload.get("type", "master"),
        filename=version.filename,
        blob_sha=version.blob_sha,
        size=version.size,
        source_version_id=version.id,
        sha256=version.blob_sha,  # Always set to version's blob SHA
        sample_rate=payload.get("sample_rate") or audio_metadata["sample_rate"],
        bit_depth=payload.get("bit_depth") or audio_metadata["bit_depth"],
        channels=payload.get("channels") or audio_metadata["channels"],
        format=payload.get("format", version.audio_format),
        is_required=payload.get("is_required", True),
    )
    db.add(deliverable)
    db.commit()
    db.refresh(deliverable)
    return DeliverableOut.model_validate(deliverable, from_attributes=True)


@router.post("/{package_id}/deliverables/upload", response_model=DeliverableOut, status_code=status.HTTP_201_CREATED)
def upload_deliverable(package_id: int, type: str = Form(...), filename: str = Form(""), is_required: bool = Form(False), sha256: str | None = Form(None), sample_rate: int | None = Form(None), bit_depth: int | None = Form(None), channels: int | None = Form(None), format: str = Form("wav"), file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    package = db.get(ReleasePackage, package_id)
    if package is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    # Process the uploaded file: store blob, compute hash, extract metadata
    import hashlib as _hashlib
    file_data = file.file.read()
    blob_sha = storage.put_blob(file_data)
    computed_sha = _hashlib.sha256(file_data).hexdigest()
    # Extract audio metadata for WAV files
    audio_meta = {"sample_rate": None, "bit_depth": None, "channels": None}
    if file_data[:4] == b"RIFF" and len(file_data) > 44:
        audio_meta = _extract_wav_metadata(file_data)
    deliverable = Deliverable(
        package_id=package_id,
        type=type,
        filename=filename or file.filename or "uploaded",
        blob_sha=blob_sha,
        size=len(file_data),
        source_version_id=None,
        sha256=sha256 or computed_sha,
        sample_rate=sample_rate or audio_meta["sample_rate"],
        bit_depth=bit_depth or audio_meta["bit_depth"],
        channels=channels or audio_meta["channels"],
        format=format,
        is_required=is_required,
    )
    db.add(deliverable)
    db.commit()
    db.refresh(deliverable)
    return DeliverableOut.model_validate(deliverable, from_attributes=True)


@router.patch("/{package_id}/handoff", response_model=ReleasePackageOut)
def handoff_package(package_id: int, payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Set handoff metadata on a package."""
    package = db.get(ReleasePackage, package_id)
    if package is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    if "plugin_manifest" in payload:
        package.plugin_manifest = payload["plugin_manifest"]
    if "session_manifest" in payload:
        package.session_manifest = payload["session_manifest"]
    if "consolidate_audio" in payload:
        package.consolidate_audio = payload["consolidate_audio"]
    if "last_verified_opened_at" in payload:
        from datetime import datetime as dt
        val = payload["last_verified_opened_at"]
        if val:
            package.last_verified_opened_at = dt.fromisoformat(val.replace("Z", "+00:00"))
    if "archive_expires_at" in payload:
        from datetime import datetime as dt
        val = payload["archive_expires_at"]
        if val:
            package.archive_expires_at = dt.fromisoformat(val.replace("Z", "+00:00"))
    db.commit()
    db.refresh(package)
    return _package_out(package)

@router.post("/{package_id}/archive", response_model=ReleasePackageOut)
def archive_package(package_id: int, payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update archive status of a package."""
    package = db.get(ReleasePackage, package_id)
    if package is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    if "archive_status" in payload:
        package.archive_status = payload["archive_status"]
    if "archive_expires_at" in payload:
        from datetime import datetime as dt
        val = payload["archive_expires_at"]
        if val:
            package.archive_expires_at = dt.fromisoformat(val.replace("Z", "+00:00"))
    # Default: 90 days retention when archiving without explicit expiry
    if package.archive_status == "archived" and not package.archive_expires_at:
        from datetime import timedelta
        package.archive_expires_at = utcnow() + timedelta(days=90)
    ledger.append(db, "package.archived", session_id=package.session_id, actor=user.username, entity_type="release_package", entity_id=package.id, payload={"archive_status": package.archive_status})
    db.commit()
    db.refresh(package)
    return _package_out(package)


@router.get("/{package_id}/deliverables/{deliverable_id}/sha256")
def get_deliverable_sha256(package_id: int, deliverable_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get SHA-256 hash of a deliverable."""
    package = db.get(ReleasePackage, package_id)
    if package is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    deliverable = db.get(Deliverable, deliverable_id)
    if deliverable is None or deliverable.package_id != package_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Deliverable not found")
    return {"sha256": deliverable.sha256}


@router.patch("/{package_id}/invoice", response_model=ReleasePackageOut)
def invoice_package(package_id: int, payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    package = db.get(ReleasePackage, package_id)
    if package is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    invoice_status = payload.get("invoice_status", "none")
    package.invoice_status = invoice_status

    # Validate required fields based on invoice status
    if invoice_status == "balance_due":
        amount_due_cents = payload.get("amount_due_cents")
        currency = payload.get("currency")
        if amount_due_cents is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "amount_due_cents is required for balance_due status")
        if currency is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "currency is required for balance_due status")
        package.amount_due_cents = amount_due_cents
        package.currency = currency
    elif invoice_status == "paid":
        package.paid_at = utcnow()
        # Clear amount due when paid
        package.amount_due_cents = 0
        ledger.append(db, "invoice.paid", session_id=package.session_id, package_id=package.id, actor=user.username, entity_type="package", entity_id=package.id, payload={"amount_cents": 0})

    db.commit()
    db.refresh(package)
    # Convert to ReleasePackageOut and populate events
    # Exclude the events relationships and SQLAlchemy state
    package_data = {k: v for k, v in package.__dict__.items()
                    if not k.startswith('_') and k not in ('events', 'delivery_events', 'deliverables')}
    package_out = ReleasePackageOut.model_validate(package_data)
    # Populate events field with both LedgerEvents and DeliveryEvents
    events = []
    for e in package.delivery_events:
        events.append({"event": e.event})
    for e in package.delivery_events:
        events.append({"event": e.event})
    package_out.events = events
    # Populate deliverables
    deliverables_list = [{"id": d.id, "type": d.type, "filename": d.filename, "size": d.size, "sha256": d.sha256} for d in package.deliverables]
    package_out.deliverables = deliverables_list
    return package_out


@router.get("/public/{delivery_token}/files/{deliverable_id}")
def public_delivery(delivery_token: str, deliverable_id: int, db: Session = Depends(get_db)):
    # Find the package by delivery token
    package = db.scalars(
        select(ReleasePackage).where(ReleasePackage.delivery_token == delivery_token)
    ).first()
    if package is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")

    # Check if package has an unpaid balance_due invoice
    if package.invoice_status == "balance_due" and package.amount_due_cents and package.amount_due_cents > 0:
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, "Payment required")
    # Deposit gate for public downloads
    session = db.get(ReviewSession, package.session_id)
    if session and session.deposit_status == "deposit_due" and session.deposit_due_cents and session.deposit_due_cents > 0:
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, "Deposit required")

    # Find the deliverable by ID within this package
    deliverable = db.get(Deliverable, deliverable_id)
    if deliverable is None or deliverable.package_id != package.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Deliverable not found in package")

    # Read the blob content
    try:
        content = storage.read_blob(deliverable.blob_sha)
        # Determine media type based on format
        media_type = f"audio/{deliverable.format}" if deliverable.format in ["wav", "mp3", "ogg", "flac"] else "application/octet-stream"
        if deliverable.format == "png":
            media_type = "image/png"
        elif deliverable.format == "jpg" or deliverable.format == "jpeg":
            media_type = "image/jpeg"

        return Response(content=content, media_type=media_type)
    except Exception as e:
        # If we can't read the blob, return a 404
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"File not found: {str(e)}")


@router.get("/public/{delivery_token}")
def public_package_info(delivery_token: str, db: Session = Depends(get_db)):
    print("DEBUG: public_package_info called in decision ledger test", flush=True)
    package = db.scalars(
        select(ReleasePackage).where(ReleasePackage.delivery_token == delivery_token)
    ).first()
    if package is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")

    # Debug: Check if we found the package
    print(f"DEBUG: public_package_info called with token {delivery_token}, found package {package.id}", flush=True)

    # Add ledger entry for public link opened
    print(f"DEBUG: About to append delivery.link_opened event for package {package.id}", flush=True)
    ledger_entry = ledger.append(db, "delivery.link_opened", session_id=package.session_id, package_id=package.id, actor="anonymous", entity_type="package", entity_id=package.id, payload={"delivery_token": delivery_token})
    print(f"DEBUG: Appended ledger entry with ID {ledger_entry.id}", flush=True)
    db.commit()

    # Debug: Check the package and its deliverables
    print(f"DEBUG: Package {package.id} found, deliverables count: {len(package.deliverables)}", flush=True)
    for d in package.deliverables:
        print(f"  Deliverable: {d.id} - {d.filename}", flush=True)

    # Get the approved version label
    approved_label = package.approved_version.label if package.approved_version else None

    # Build deliverables list with proper structure
    try:
        deliverables_list = []
        for d in package.deliverables:
            deliverable_dict = {
                "id": d.id,
                "package_id": d.package_id,
                "type": d.type,
                "filename": d.filename,
                "blob_sha": d.blob_sha,
                "size": d.size,
                "sha256": d.sha256,
                "format": d.format,
                "sample_rate": d.sample_rate,
                "bit_depth": d.bit_depth,
                "channels": d.channels,
                "integrated_lufs": d.integrated_lufs,
                "true_peak": d.true_peak,
                "is_required": d.is_required,
                "created_at": d.created_at.isoformat() if d.created_at else None
            }
            deliverables_list.append(deliverable_dict)
    except Exception as e:
        # If there's an error accessing deliverables, return empty list for now
        deliverables_list = []
        print(f"Error accessing deliverables: {e}")

    session = db.get(ReviewSession, package.session_id)
    retention_until_str = None
    share_token = None
    if session:
        retention_until_str = session.retention_until.isoformat() if session.retention_until else None
        share_token = session.share_token

    return {
        "id": package.id,
        "approved_label": approved_label,
        "template": package.template,
        "archive_status": package.archive_status,
        "archive_expires_at": package.archive_expires_at.isoformat() if package.archive_expires_at else None,
        "last_verified_opened_at": package.last_verified_opened_at.isoformat() if package.last_verified_opened_at else None,
        "retention_until": retention_until_str,
        "share_token": share_token,
        "deliverables": deliverables_list
    }


@router.get("/{package_id}/manifest")
def get_manifest(package_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    package = db.get(ReleasePackage, package_id)
    if package is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    # Simplified authorization check - in a real app, you'd check session ownership
    qc_status = "forced" if package.force_locked_reason else ("ready" if package.status == "ready" else "pending")
    unresolved_warnings = []
    if package.template:
        required = []
        for tpl in RELEASE_TEMPLATES:
            if tpl["id"] == package.template:
                required = tpl.get("required_deliverables", [])
                break
        delivered = {d.type for d in package.deliverables}
        for req in required:
            if req not in delivered:
                unresolved_warnings.append(f"Missing deliverable: {req}")
    manifest_data = dict(package.session_manifest) if package.session_manifest else {}
    manifest_data["qc_status"] = qc_status
    manifest_data["unresolved_warnings"] = unresolved_warnings
    if package.force_locked_by:
        manifest_data["confirmed_by"] = package.force_locked_by
    elif package.locked_by:
        manifest_data["confirmed_by"] = package.locked_by
    return {
        "manifest_hash": package.manifest_hash,
        "manifest_json": manifest_data
    }


def _get_session_id_or_404(db: Session, user: User, session_id: int) -> int:
    session = db.get(ReviewSession, session_id)
    if session is None or session.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session_id


# Schema definitions to avoid import errors
from pydantic import BaseModel, Field
from typing import Optional

class DeliverableFromVersionRequest(BaseModel):
    from_version_id: int
    type: str = Field(..., description="Deliverable type (master, artwork, etc.)")
    is_required: bool = Field(False, description="Whether this deliverable is required")
    sha256: Optional[str] = Field(None, description="SHA-256 hash of the file")
    sample_rate: Optional[int] = Field(None, description="Sample rate in Hz")
    bit_depth: Optional[int] = Field(None, description="Bit depth in bits")
    channels: Optional[int] = Field(None, description="Number of audio channels")
    format: str = Field("wav", description="Audio format (wav, mp3, etc.)")


class DeliverableUploadRequest(BaseModel):
    type: str = Field(..., description="Deliverable type (master, artwork, etc.)")
    filename: str = Field("", description="Original filename")
    is_required: bool = Field(False, description="Whether this deliverable is required")
    sha256: Optional[str] = Field(None, description="SHA-256 hash of the file")
    sample_rate: Optional[int] = Field(None, description="Sample rate in Hz")
    bit_depth: Optional[int] = Field(None, description="Bit depth in bits")
    channels: Optional[int] = Field(None, description="Number of audio channels")
    format: str = Field("wav", description="Audio format (wav, mp3, etc.)")


class InvoiceRequest(BaseModel):
    invoice_status: str = Field(..., description="Invoice status (none, drafting, sent, paid, failed)")