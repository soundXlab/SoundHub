"""Compute Service API — serverless functions (analogous to AWS Lambda).

Endpoints:
    POST   /api/functions                  Create function
    GET    /api/functions                  List functions
    GET    /api/functions/{id}             Get function details
    PUT    /api/functions/{id}             Update function
    DELETE /api/functions/{id}             Delete function
    POST   /api/functions/{id}/invoke      Invoke function
    GET    /api/functions/{id}/stats       Execution stats
    POST   /api/functions/{id}/triggers    Create trigger
    GET    /api/functions/{id}/triggers    List triggers
    DELETE /api/functions/triggers/{id}    Delete trigger
    GET    /api/functions/invocations      List all invocations
    GET    /api/functions/invocations/{id} Invocation details
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..security import get_current_user
from ..services import compute_service as svc

router = APIRouter(prefix="/api/functions", tags=["compute", "lambda"])


# ── Request / Response Models ─────────────────────────────────────────


class FunctionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    runtime: str = Field(default="python3.12", description="python3.12 | nodejs20 | wasm")
    handler: str = Field(default="handler.main")
    code: str = Field(default="")
    description: str = Field(default="", max_length=2000)
    timeout_seconds: int = Field(default=30, ge=1, le=900)
    memory_mb: int = Field(default=128, ge=128, le=10240)
    environment_vars: Optional[dict] = None
    max_retries: int = Field(default=0, ge=0, le=3)


class FunctionUpdate(BaseModel):
    code: Optional[str] = None
    handler: Optional[str] = None
    description: Optional[str] = None
    timeout_seconds: Optional[int] = None
    memory_mb: Optional[int] = None
    environment_vars: Optional[dict] = None
    max_retries: Optional[int] = None
    status: Optional[str] = None


class InvokeRequest(BaseModel):
    payload: Optional[dict] = None


class TriggerCreate(BaseModel):
    event_type: str = Field(..., description="job.completed | webhook.received | schedule | api.call")
    filter_pattern: Optional[dict] = None
    enabled: bool = True
    config: Optional[dict] = None


# ── Function CRUD ─────────────────────────────────────────────────────


@router.post("", status_code=status.HTTP_201_CREATED)
def create_function(body: FunctionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return svc.create_function(
            db, body.name, body.runtime, body.handler, body.code, body.description,
            body.timeout_seconds, body.memory_mb, body.environment_vars, body.max_retries, owner_id=user.id,
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.get("")
def list_functions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"functions": svc.list_functions(db, owner_id=user.id)}


@router.get("/{function_id}")
def get_function(function_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    func = svc.get_function(db, function_id)
    if not func:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Function not found")
    return func


@router.put("/{function_id}")
def update_function(function_id: int, body: FunctionUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    update_data = body.model_dump(exclude_unset=True)
    result = svc.update_function(db, function_id, **update_data)
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Function not found")
    return result


@router.delete("/{function_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_function(function_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not svc.delete_function(db, function_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Function not found")


# ── Invoke ────────────────────────────────────────────────────────────


@router.post("/{function_id}/invoke")
def invoke_function(function_id: int, body: InvokeRequest = InvokeRequest(), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return svc.invoke_function(db, function_id, body.payload, "manual", user.id)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.get("/{function_id}/stats")
def get_function_stats(function_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stats = svc.get_function_stats(db, function_id)
    if not stats:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Function not found")
    return stats


# ── Triggers ──────────────────────────────────────────────────────────


@router.post("/{function_id}/triggers", status_code=status.HTTP_201_CREATED)
def create_trigger(function_id: int, body: TriggerCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return svc.create_trigger(db, function_id, body.event_type, body.filter_pattern, body.enabled, body.config)
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.get("/{function_id}/triggers")
def list_triggers(function_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"triggers": svc.list_triggers(db, function_id)}


@router.delete("/triggers/{trigger_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trigger(trigger_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not svc.delete_trigger(db, trigger_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trigger not found")


# ── Invocations ───────────────────────────────────────────────────────


@router.get("/invocations")
def list_invocations(
    function_id: Optional[int] = None,
    invocation_status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"invocations": svc.list_invocations(db, function_id, invocation_status)}


@router.get("/invocations/{invocation_id}")
def get_invocation(invocation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = svc.get_invocation(db, invocation_id)
    if not inv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invocation not found")
    return inv
