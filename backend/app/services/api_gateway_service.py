"""API Gateway — API key management and rate limiting.

Provides:
- API key CRUD with scoped permissions
- Per-minute and per-hour rate limiting
- Usage tracking and analytics
- Request validation middleware

Usage:
    from .services.api_gateway_service import (
        create_api_key, validate_api_key, check_rate_limit, record_usage
    )
"""

from __future__ import annotations

import hashlib
import logging
import os
import secrets
import string
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import ApiKey, ApiKeyUsage, RateLimitRule, utcnow

logger = logging.getLogger(__name__)


def _generate_api_key() -> str:
    """Generate a cryptographically secure API key."""
    alphabet = string.ascii_letters + string.digits
    return "sh_" + "".join(secrets.choice(alphabet) for _ in range(40))


def _hash_key(key: str) -> str:
    """Hash an API key for storage."""
    return hashlib.sha256(key.encode()).hexdigest()


# ── API Key CRUD ──────────────────────────────────────────────────────


def create_api_key(
    db: Session,
    name: str,
    owner_id: int,
    scopes: list[str] | None = None,
    rate_limit_rpm: int = 60,
    expires_at: datetime | None = None,
) -> dict[str, Any]:
    """Create a new API key. Returns the raw key (shown once)."""
    raw_key = _generate_api_key()
    key_hash = _hash_key(raw_key)
    key_prefix = raw_key[:8]

    api_key = ApiKey(
        key_hash=key_hash,
        key_prefix=key_prefix,
        name=name,
        owner_id=owner_id,
        scopes=scopes,
        rate_limit_rpm=rate_limit_rpm,
        expires_at=expires_at,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return {
        "id": api_key.id,
        "key": raw_key,  # Only shown at creation time
        "key_prefix": key_prefix,
        "name": api_key.name,
        "scopes": api_key.scopes,
        "rate_limit_rpm": api_key.rate_limit_rpm,
    }


def revoke_api_key(db: Session, key_id: int) -> bool:
    """Revoke an API key."""
    api_key = db.get(ApiKey, key_id)
    if not api_key:
        return False
    api_key.is_active = False
    db.commit()
    return True


def delete_api_key(db: Session, key_id: int) -> bool:
    """Permanently delete an API key."""
    api_key = db.get(ApiKey, key_id)
    if not api_key:
        return False
    db.delete(api_key)
    db.commit()
    return True


def list_api_keys(db: Session, owner_id: int, limit: int = 50) -> list[dict[str, Any]]:
    """List API keys for a user (never returns the raw key)."""
    keys = (
        db.query(ApiKey)
        .filter(ApiKey.owner_id == owner_id)
        .order_by(ApiKey.id.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": k.id,
            "name": k.name,
            "key_prefix": k.key_prefix,
            "scopes": k.scopes,
            "rate_limit_rpm": k.rate_limit_rpm,
            "is_active": k.is_active,
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
            "expires_at": k.expires_at.isoformat() if k.expires_at else None,
            "created_at": k.created_at.isoformat(),
        }
        for k in keys
    ]


# ── Validation ────────────────────────────────────────────────────────


def validate_api_key(db: Session, raw_key: str) -> dict[str, Any] | None:
    """Validate an API key and return its metadata.

    Returns None if invalid/expired/revoked.
    """
    key_hash = _hash_key(raw_key)

    api_key = db.query(ApiKey).filter(ApiKey.key_hash == key_hash).first()
    if not api_key:
        return None
    if not api_key.is_active:
        return None
    if api_key.expires_at and api_key.expires_at < utcnow():
        return None

    # Update last used timestamp
    api_key.last_used_at = utcnow()
    db.commit()

    return {
        "id": api_key.id,
        "name": api_key.name,
        "owner_id": api_key.owner_id,
        "scopes": api_key.scopes or [],
        "rate_limit_rpm": api_key.rate_limit_rpm,
    }


# ── Rate Limiting ─────────────────────────────────────────────────────


def check_rate_limit(db: Session, api_key_id: int, rpm_limit: int = 60) -> dict[str, Any]:
    """Check if an API key has exceeded its rate limit.

    Returns {"allowed": bool, "remaining": int, "reset_at": str}
    """
    now = utcnow()
    window_minute = now.strftime("%Y-%m-%dT%H:%M")

    usage = (
        db.query(ApiKeyUsage)
        .filter(
            ApiKeyUsage.api_key_id == api_key_id,
            ApiKeyUsage.window_minute == window_minute,
        )
        .first()
    )

    if usage is None:
        usage = ApiKeyUsage(api_key_id=api_key_id, window_minute=window_minute, request_count=0)
        db.add(usage)
        db.flush()

    remaining = max(0, rpm_limit - usage.request_count)
    allowed = usage.request_count < rpm_limit

    return {
        "allowed": allowed,
        "remaining": remaining,
        "limit": rpm_limit,
        "window_minute": window_minute,
    }


def record_usage(db: Session, api_key_id: int) -> None:
    """Record a request for rate limiting."""
    now = utcnow()
    window_minute = now.strftime("%Y-%m-%dT%H:%M")

    usage = (
        db.query(ApiKeyUsage)
        .filter(
            ApiKeyUsage.api_key_id == api_key_id,
            ApiKeyUsage.window_minute == window_minute,
        )
        .first()
    )

    if usage is None:
        usage = ApiKeyUsage(api_key_id=api_key_id, window_minute=window_minute, request_count=0)
        db.add(usage)

    usage.request_count += 1
    db.commit()


def get_usage_stats(db: Session, api_key_id: int, days: int = 7) -> dict[str, Any]:
    """Get usage statistics for an API key."""
    api_key = db.get(ApiKey, api_key_id)
    if not api_key:
        return {}

    usages = (
        db.query(ApiKeyUsage)
        .filter(ApiKeyUsage.api_key_id == api_key_id)
        .order_by(ApiKeyUsage.window_minute.desc())
        .limit(days * 24 * 60)  # worst case: every minute for N days
        .all()
    )

    total_requests = sum(u.request_count for u in usages)
    avg_per_minute = total_requests / max(1, len(usages))

    return {
        "api_key_id": api_key_id,
        "name": api_key.name,
        "total_requests": total_requests,
        "windows_recorded": len(usages),
        "avg_requests_per_minute": round(avg_per_minute, 2),
        "current_rpm_limit": api_key.rate_limit_rpm,
    }


# ── Rate Limit Rules ──────────────────────────────────────────────────


def create_rate_limit_rule(
    db: Session,
    path_pattern: str,
    method: str = "*",
    requests_per_minute: int = 60,
    requests_per_hour: int = 1000,
    enabled: bool = True,
) -> dict[str, Any]:
    """Create a rate limit rule for an endpoint path."""
    rule = RateLimitRule(
        path_pattern=path_pattern,
        method=method,
        requests_per_minute=requests_per_minute,
        requests_per_hour=requests_per_hour,
        enabled=enabled,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {"id": rule.id, "path_pattern": rule.path_pattern, "method": rule.method}


def list_rate_limit_rules(db: Session, limit: int = 100) -> list[dict[str, Any]]:
    """List all rate limit rules."""
    rules = db.query(RateLimitRule).order_by(RateLimitRule.id).limit(limit).all()
    return [
        {
            "id": r.id,
            "path_pattern": r.path_pattern,
            "method": r.method,
            "requests_per_minute": r.requests_per_minute,
            "requests_per_hour": r.requests_per_hour,
            "enabled": r.enabled,
        }
        for r in rules
    ]


def delete_rate_limit_rule(db: Session, rule_id: int) -> bool:
    """Delete a rate limit rule."""
    rule = db.get(RateLimitRule, rule_id)
    if not rule:
        return False
    db.delete(rule)
    db.commit()
    return True
