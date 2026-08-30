"""API Gateway API — API key management and rate limiting.

Endpoints:
    POST   /api/gateway/keys                  Create API key
    GET    /api/gateway/keys                  List API keys
    DELETE /api/gateway/keys/{id}             Revoke API key
    DELETE /api/gateway/keys/{id}/permanent   Permanently delete
    GET    /api/gateway/keys/{id}/usage       Usage statistics
    POST   /api/gateway/keys/{id}/validate    Validate key (internal)
    POST   /api/gateway/keys/{id}/check-limit Check rate limit
    POST   /api/gateway/rules                 Create rate limit rule
    GET    /api/gateway/rules                 List rate limit rules
    DELETE /api/gateway/rules/{id}            Delete rate limit rule
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..security import get_current_user
from ..services import api_gateway_service as svc

router = APIRouter(prefix="/api/gateway", tags=["api-gateway"])


# ── Request Models ────────────────────────────────────────────────────


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    scopes: Optional[list[str]] = Field(default=None, description="Permission scopes")
    rate_limit_rpm: int = Field(default=60, ge=1, le=10000)
    expires_at: Optional[str] = None  # ISO datetime


class RateLimitRuleCreate(BaseModel):
    path_pattern: str = Field(..., max_length=256)
    method: str = Field(default="*", description="GET|POST|PUT|DELETE|*")
    requests_per_minute: int = Field(default=60, ge=1)
    requests_per_hour: int = Field(default=1000, ge=1)
    enabled: bool = True


# ── API Key Endpoints ────────────────────────────────────────────────


@router.post("/keys", status_code=status.HTTP_201_CREATED)
def create_api_key(body: ApiKeyCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new API key. The key is returned only at creation time."""
    expires = None
    if body.expires_at:
        from datetime import datetime, timezone
        expires = datetime.fromisoformat(body.expires_at)
    result = svc.create_api_key(db, body.name, user.id, body.scopes, body.rate_limit_rpm, expires)
    return result


@router.get("/keys")
def list_api_keys(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List API keys (never returns the raw key)."""
    return {"keys": svc.list_api_keys(db, user.id)}


@router.delete("/keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(key_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Revoke an API key (soft delete — key stops working)."""
    if not svc.revoke_api_key(db, key_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "API key not found")


@router.delete("/keys/{key_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key(key_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Permanently delete an API key."""
    if not svc.delete_api_key(db, key_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "API key not found")


@router.get("/keys/{key_id}/usage")
def get_usage_stats(key_id: int, days: int = 7, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get usage statistics for an API key."""
    stats = svc.get_usage_stats(db, key_id, days)
    if not stats:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "API key not found")
    return stats


@router.post("/keys/{key_id}/validate")
def validate_api_key_endpoint(key_id: int, body: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Validate an API key (internal use)."""
    raw_key = body.get("key", "")
    result = svc.validate_api_key(db, raw_key)
    if not result:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired API key")
    return result


@router.post("/keys/{key_id}/check-limit")
def check_rate_limit(key_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Check rate limit for an API key."""
    api_key = db.get("ApiKey", key_id)
    rpm = 60
    if api_key:
        rpm = api_key.rate_limit_rpm
    return svc.check_rate_limit(db, key_id, rpm)


# ── Rate Limit Rules ──────────────────────────────────────────────────


@router.post("/rules", status_code=status.HTTP_201_CREATED)
def create_rate_limit_rule(body: RateLimitRuleCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a rate limit rule for an endpoint path."""
    return svc.create_rate_limit_rule(db, body.path_pattern, body.method, body.requests_per_minute, body.requests_per_hour, body.enabled)


@router.get("/rules")
def list_rate_limit_rules(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all rate limit rules."""
    return {"rules": svc.list_rate_limit_rules(db)}


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rate_limit_rule(rule_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a rate limit rule."""
    if not svc.delete_rate_limit_rule(db, rule_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Rule not found")
