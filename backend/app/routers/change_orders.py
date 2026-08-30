"""Change orders router — late change requests after approval."""
from datetime import timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ChangeOrder, ReviewSession, User, utcnow
from ..schemas import ChangeOrderCreate, ChangeOrderOut, ChangeOrderQuote
from ..security import get_current_user
from ..services import ledger

router = APIRouter(prefix="/api/sessions/{session_id}/change-orders", tags=["change orders"])


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


@router.get("", response_model=list[ChangeOrderOut])
def list_change_orders(session_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_session(db, session_id, user)
    orders = db.scalars(
        select(ChangeOrder).where(ChangeOrder.session_id == session_id).order_by(ChangeOrder.created_at.desc())
    ).all()
    return [ChangeOrderOut.model_validate(o, from_attributes=True) for o in orders]


@router.post("", response_model=ChangeOrderOut, status_code=status.HTTP_201_CREATED)
def create_change_order(session_id: int, payload: ChangeOrderCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = _get_session(db, session_id, user)
    order = ChangeOrder(
        session_id=session_id,
        created_by=user.username,
        reason=payload.reason,
        description=payload.description,
    )
    db.add(order)
    ledger.append(db, "change_order.created", session_id=session_id, actor=user.username, entity_type="change_order", entity_id=order.id, payload={"reason": payload.reason})
    db.commit()
    db.refresh(order)
    return ChangeOrderOut.model_validate(order, from_attributes=True)


@router.patch("/{order_id}", response_model=ChangeOrderOut)
def update_change_order(session_id: int, order_id: int, payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Quote a change order (PATCH without /quote suffix)."""
    _get_session(db, session_id, user)
    order = db.get(ChangeOrder, order_id)
    if order is None or order.session_id != session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Change order not found")
    # Reject re-quoting after acceptance (quote is final)
    if order.status in ("accepted", "paid", "declined"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Cannot re-quote a change order in '{order.status}' status — quote is final")
    was_quoted = order.status == "quoted"
    if "decision" in payload:
        order.decision = payload["decision"]
        # Auto-set price from session revision_fee_cents
        if order.price_cents is None:
            if payload.get("decision") == "paid_round":
                session = db.get(ReviewSession, session_id)
                if session and session.revision_fee_cents:
                    order.price_cents = session.revision_fee_cents
            elif payload.get("decision") == "courtesy":
                order.price_cents = 0
            elif payload.get("decision") == "new_mastering_pass":
                session = db.get(ReviewSession, session_id)
                if session and session.recall_fee_cents:
                    order.price_cents = session.recall_fee_cents
    if "price_cents" in payload:
        order.price_cents = payload["price_cents"]
    if "deadline_at" in payload:
        from datetime import datetime as dt
        val = payload["deadline_at"]
        order.deadline_at = dt.fromisoformat(val.replace("Z", "+00:00")) if val else None
    order.status = "quoted"
    order.quoted_at = utcnow()
    order.quote_version += 1
    from datetime import timedelta
    order.quote_expires_at = utcnow() + timedelta(days=7)
    ledger.append(db, "change_order.quoted", session_id=session_id, actor=user.username, entity_type="change_order", entity_id=order.id, payload={"decision": order.decision})
    if was_quoted and order.quote_version > 1:
        ledger.append(db, "change_order.requoted", session_id=session_id, actor=user.username, entity_type="change_order", entity_id=order.id, payload={"quote_version": order.quote_version})
    db.commit()
    db.refresh(order)
    return ChangeOrderOut.model_validate(order, from_attributes=True)


@router.patch("/{order_id}/quote", response_model=ChangeOrderOut)
def quote_change_order(session_id: int, order_id: int, payload: ChangeOrderQuote, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_session(db, session_id, user)
    order = db.get(ChangeOrder, order_id)
    if order is None or order.session_id != session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Change order not found")
    order.decision = payload.decision
    order.price_cents = payload.price_cents
    order.deadline_at = payload.deadline_at
    order.status = "quoted"
    order.quoted_at = utcnow()
    order.quote_version += 1
    from datetime import timedelta
    order.quote_expires_at = utcnow() + timedelta(days=7)
    db.commit()
    return ChangeOrderOut.model_validate(order, from_attributes=True)


@router.patch("/{order_id}/accept", response_model=ChangeOrderOut)
def accept_change_order(session_id: int, order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_session(db, session_id, user)
    order = db.get(ChangeOrder, order_id)
    if order is None or order.session_id != session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Change order not found")
    if order.quote_expires_at:
        expires = order.quote_expires_at.replace(tzinfo=timezone.utc) if order.quote_expires_at.tzinfo is None else order.quote_expires_at
        if expires < utcnow():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Quote has expired")
    order.status = "accepted"
    order.accepted_at = utcnow()
    ledger.append(db, "change_order.accepted", session_id=session_id, actor=user.username, entity_type="change_order", entity_id=order.id, payload={})
    # Grant the round
    if not order.round_granted:
        session = db.get(ReviewSession, session_id)
        if session:
            session.change_rounds_granted += 1
        order.round_granted = True
    db.commit()
    return ChangeOrderOut.model_validate(order, from_attributes=True)


@router.post("/{order_id}/decline", response_model=ChangeOrderOut)
def decline_change_order(session_id: int, order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_session(db, session_id, user)
    order = db.get(ChangeOrder, order_id)
    if order is None or order.session_id != session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Change order not found")
    order.status = "declined"
    order.declined_at = utcnow()
    db.commit()
    return ChangeOrderOut.model_validate(order, from_attributes=True)


@router.post("/{order_id}/mark-paid", response_model=ChangeOrderOut)
def mark_paid(session_id: int, order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mark a change order as paid, granting a revision round."""
    _get_session(db, session_id, user)
    order = db.get(ChangeOrder, order_id)
    if order is None or order.session_id != session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Change order not found")
    if order.status == "paid":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Already paid")
    if order.status not in ("accepted",):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Cannot mark as paid from status '{order.status}'")
    order.status = "paid"
    order.paid_at = utcnow()
    # Grant the round and reopen
    if not order.round_granted:
        session = db.get(ReviewSession, session_id)
        if session:
            session.change_rounds_granted += 1
            session.rounds_open = True
            session.status = "in_review"
        order.round_granted = True
    else:
        session = db.get(ReviewSession, session_id)
        if session:
            session.rounds_open = True
            session.status = "in_review"
    ledger.append(db, "change_order.paid", session_id=session_id, actor=user.username, entity_type="change_order", entity_id=order.id, payload={})
    ledger.append(db, "change_order.round_opened", session_id=session_id, actor=user.username, entity_type="change_order", entity_id=order.id, payload={})
    db.commit()
    db.refresh(order)
    return ChangeOrderOut.model_validate(order, from_attributes=True)


# ---------- Public (guest) endpoints ----------

@router.post("/public/{share_token}", response_model=ChangeOrderOut, status_code=status.HTTP_201_CREATED)
def public_create_change_order(session_id: int, share_token: str, payload: ChangeOrderCreate, actor: str = Query(""), db: Session = Depends(get_db)):
    """Guest creates a change order via the share link."""
    session = _get_public_session(db, session_id)
    if session.share_token != share_token:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invalid share token")
    # Check no active change order already exists
    active = db.scalars(
        select(ChangeOrder).where(
            ChangeOrder.session_id == session_id,
            ChangeOrder.status.in_("requested", "quoted", "accepted"),
        )
    ).all()
    if active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "An active change order already exists")
    order = ChangeOrder(
        session_id=session_id,
        created_by=actor or "guest",
        reason=payload.reason,
        description=payload.description,
        target_round=session.round_number,
    )
    db.add(order)
    ledger.append(db, "change_order.created", session_id=session_id, actor=actor, entity_type="change_order", entity_id=order.id, payload={"reason": payload.reason})
    db.commit()
    db.refresh(order)
    return ChangeOrderOut.model_validate(order, from_attributes=True)


@router.post("/public/{share_token}/{order_id}/accept", response_model=ChangeOrderOut)
def public_accept_change_order(session_id: int, share_token: str, order_id: int, actor: str = Query(""), db: Session = Depends(get_db)):
    """Guest accepts a quoted change order via the share link."""
    session = _get_public_session(db, session_id)
    if session.share_token != share_token:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invalid share token")
    order = db.get(ChangeOrder, order_id)
    if order is None or order.session_id != session_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Change order not found")
    order.status = "accepted"
    order.accepted_at = utcnow()
    ledger.append(db, "change_order.accepted", session_id=session_id, actor=actor, entity_type="change_order", entity_id=order.id, payload={})
    db.commit()
    db.refresh(order)
    return ChangeOrderOut.model_validate(order, from_attributes=True)
