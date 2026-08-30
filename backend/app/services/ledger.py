"""Tamper-evident decision ledger.

event_hash = SHA-256(prev_event_hash || canonical_payload) makes the
history tamper-evident: rewriting an old event invalidates every
subsequent hash.
"""
import hashlib
import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..models import LedgerEvent


def _as_utc(value: datetime) -> datetime:
    """Normalize datetime to UTC.
    If value is naive (no tzinfo), assume UTC.
    If value is timezone-aware, convert to UTC.
    """
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def append(
    db: Session,
    event: str,
    session_id: int | None = None,
    package_id: int | None = None,
    actor: str = "",
    entity_type: str = "",
    entity_id: int | None = None,
    payload: dict | None = None,
) -> LedgerEvent:
    """Append an event to the ledger, chaining hashes."""
    # Find the previous event hash
    prev_hash = None
    if session_id:
        prev = (
            db.query(LedgerEvent)
            .filter(LedgerEvent.session_id == session_id)
            .order_by(LedgerEvent.id.desc())
            .first()
        )
        if prev:
            prev_hash = prev.event_hash
    elif package_id:
        prev = (
            db.query(LedgerEvent)
            .filter(LedgerEvent.package_id == package_id)
            .order_by(LedgerEvent.id.desc())
            .first()
        )
        if prev:
            prev_hash = prev.event_hash

    # Use a single datetime object for consistency between hash and storage
    now = _as_utc(datetime.now(timezone.utc))
    # Canonical payload
    canonical = json.dumps(
        {
            "event": event,
            "actor": actor,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "payload": payload or {},
            "occurred_at": now.isoformat(),
            "prev_event_hash": prev_hash,
        },
        sort_keys=True,
        separators=(",", ":"),
    )

    event_hash = hashlib.sha256(canonical.encode()).hexdigest()

    entry = LedgerEvent(
        event=event,
        session_id=session_id,
        package_id=package_id,
        actor=actor,
        entity_type=entity_type,
        entity_id=entity_id,
        payload=payload or {},
        occurred_at=now,  # Use the SAME datetime object as used in hash
        prev_event_hash=prev_hash,
        event_hash=event_hash,
    )
    db.add(entry)
    return entry


def verify_history(db: Session, session_id: int | None = None, package_id: int | None = None) -> dict:
    """Walk the hash chain and report whether any event was tampered with."""
    import hashlib
    import json

    query = db.query(LedgerEvent).order_by(LedgerEvent.id)
    if session_id:
        query = query.filter(LedgerEvent.session_id == session_id)
    elif package_id:
        query = query.filter(LedgerEvent.package_id == package_id)

    events = query.all()
    if not events:
        return {"valid": True, "total": 0, "broken_at": None}

    prev_hash = None
    for e in events:
        # Recompute what the hash should be for this event based on its data
        occurred_at_utc = _as_utc(e.occurred_at) if e.occurred_at is not None else None
        canonical = json.dumps(
            {
                "event": e.event,
                "actor": e.actor,
                "entity_type": e.entity_type,
                "entity_id": e.entity_id,
                "payload": e.payload or {},
                "occurred_at": occurred_at_utc.isoformat() if occurred_at_utc is not None else None,
                "prev_event_hash": prev_hash,
            },
            sort_keys=True,
            separators=(",", ":"),
        )
        expected_hash = hashlib.sha256(canonical.encode()).hexdigest()

        # If the stored hash doesn't match what it should be, the chain is broken
        if e.event_hash != expected_hash:
            return {
                "valid": False,
                "total": len(events),
                "broken_at": e.id,
                "broken_event": e.event,
                "problems": [f"Event {e.id} ({e.event}): hash mismatch"],
            }

        # Update prev_hash for next iteration
        prev_hash = e.event_hash

    return {"valid": True, "total": len(events), "broken_at": None, "head_hash": events[-1].event_hash, "problems": []}
