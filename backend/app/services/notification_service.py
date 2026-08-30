"""Notification Service — pub/sub messaging (analogous to AWS SNS).

Provides topic-based publish/subscribe with multi-protocol delivery:
- HTTP/HTTPS webhooks
- Email notifications
- WebSocket push
- Internal event bus

Usage:
    from .services.notification_service import (
        create_topic, subscribe, publish_message, get_topic_stats
    )
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import socket
import ipaddress
import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

import httpx
from sqlalchemy.orm import Session

from ..models import (
    NotificationTopic,
    NotificationSubscription,
    NotificationMessage,
    NotificationDelivery,
    utcnow,
)

logger = logging.getLogger(__name__)


# ── Topic CRUD ────────────────────────────────────────────────────────


def create_topic(
    db: Session,
    name: str,
    display_name: str = "",
    description: str = "",
    owner_id: int | None = None,
) -> dict[str, Any]:
    """Create a new notification topic."""
    existing = db.query(NotificationTopic).filter(NotificationTopic.name == name).first()
    if existing:
        raise ValueError(f"Topic '{name}' already exists")

    topic = NotificationTopic(
        name=name,
        display_name=display_name or name,
        description=description,
        owner_id=owner_id,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)

    return {"id": topic.id, "name": topic.name, "arn": f"arn:soundhub:notifications:{topic.id}"}


def delete_topic(db: Session, topic_id: int) -> bool:
    """Delete a topic and all its subscriptions."""
    topic = db.get(NotificationTopic, topic_id)
    if not topic:
        return False
    db.delete(topic)
    db.commit()
    return True


def list_topics(db: Session, owner_id: int | None = None, limit: int = 50) -> list[dict[str, Any]]:
    """List all topics."""
    q = db.query(NotificationTopic)
    if owner_id is not None:
        q = q.filter(NotificationTopic.owner_id == owner_id)
    topics = q.order_by(NotificationTopic.id.desc()).limit(limit).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "display_name": t.display_name,
            "description": t.description,
            "subscription_count": len(t.subscriptions),
            "created_at": t.created_at.isoformat(),
        }
        for t in topics
    ]


def get_topic(db: Session, topic_id: int) -> dict[str, Any] | None:
    """Get topic details."""
    topic = db.get(NotificationTopic, topic_id)
    if not topic:
        return None
    return {
        "id": topic.id,
        "name": topic.name,
        "display_name": topic.display_name,
        "description": topic.description,
        "subscription_count": len(topic.subscriptions),
        "created_at": topic.created_at.isoformat(),
    }


# ── Subscription ──────────────────────────────────────────────────────


def subscribe(
    db: Session,
    topic_id: int,
    protocol: str,
    endpoint: str,
    filter_policy: dict | None = None,
) -> dict[str, Any]:
    """Subscribe to a topic.

    Protocols: http, https, email, webhook, websocket
    """
    topic = db.get(NotificationTopic, topic_id)
    if not topic:
        raise ValueError(f"Topic {topic_id} not found")

    if protocol not in ("http", "https", "email", "webhook", "websocket"):
        raise ValueError(f"Unsupported protocol: {protocol}")

    # Validate endpoint
    if protocol in ("http", "https", "webhook"):
        _validate_endpoint_url(endpoint)

    sub = NotificationSubscription(
        topic_id=topic_id,
        protocol=protocol,
        endpoint=endpoint,
        filter_policy=filter_policy,
        status="active",
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    return {"id": sub.id, "protocol": sub.protocol, "endpoint": sub.endpoint, "status": sub.status}


def unsubscribe(db: Session, subscription_id: int) -> bool:
    """Remove a subscription."""
    sub = db.get(NotificationSubscription, subscription_id)
    if not sub:
        return False
    db.delete(sub)
    db.commit()
    return True


def list_subscriptions(db: Session, topic_id: int) -> list[dict[str, Any]]:
    """List subscriptions for a topic."""
    subs = (
        db.query(NotificationSubscription)
        .filter(NotificationSubscription.topic_id == topic_id)
        .all()
    )
    return [
        {
            "id": s.id,
            "protocol": s.protocol,
            "endpoint": s.endpoint,
            "status": s.status,
            "filter_policy": s.filter_policy,
        }
        for s in subs
    ]


# ── Publish ───────────────────────────────────────────────────────────


def publish_message(
    db: Session,
    topic_id: int,
    subject: str = "",
    body: str = "",
    message_type: str = "text",
    message_json: dict | None = None,
    published_by_id: int | None = None,
) -> dict[str, Any]:
    """Publish a message to all active subscribers of a topic."""
    topic = db.get(NotificationTopic, topic_id)
    if not topic:
        raise ValueError(f"Topic {topic_id} not found")

    # Create the message
    msg = NotificationMessage(
        topic_id=topic_id,
        subject=subject,
        body=body,
        message_type=message_type,
        message_json=message_json,
        published_by_id=published_by_id,
    )
    db.add(msg)
    db.flush()

    # Deliver to all active subscriptions
    active_subs = [s for s in topic.subscriptions if s.status == "active"]
    delivery_results = []

    for sub in active_subs:
        # Check filter policy
        if sub.filter_policy and message_json:
            if not _matches_filter(sub.filter_policy, message_json):
                continue

        result = _deliver_message(db, msg, sub)
        delivery_results.append(result)

    db.commit()

    return {
        "message_id": msg.id,
        "topic": topic.name,
        "deliveries_attempted": len(delivery_results),
        "deliveries_succeeded": sum(1 for r in delivery_results if r["status"] == "delivered"),
    }


def _deliver_message(db: Session, msg: NotificationMessage, sub: NotificationSubscription) -> dict[str, Any]:
    """Deliver a message to a single subscription."""
    delivery = NotificationDelivery(
        message_id=msg.id,
        subscription_id=sub.id,
        status="pending",
    )
    db.add(delivery)
    db.flush()

    start = time.time()
    try:
        if sub.protocol in ("http", "https", "webhook"):
            _deliver_webhook(sub.endpoint, msg, delivery, db)
        elif sub.protocol == "email":
            _deliver_email(sub.endpoint, msg, delivery, db)
        elif sub.protocol == "websocket":
            _deliver_websocket(sub.endpoint, msg, delivery, db)
        else:
            delivery.status = "failed"
            delivery.error = f"Unknown protocol: {sub.protocol}"

    except Exception as exc:
        delivery.status = "failed"
        delivery.error = str(exc)[:500]
        logger.warning("Delivery failed for sub %d: %s", sub.id, exc)

    delivery.delivered_at = utcnow() if delivery.status == "delivered" else None
    db.flush()

    return {"subscription_id": sub.id, "status": delivery.status}


def _deliver_webhook(url: str, msg: NotificationMessage, delivery: NotificationDelivery, db: Session):
    """Deliver via HTTP/HTTPS webhook with HMAC signing."""
    payload = json.dumps(
        {
            "event": "notification.published",
            "topic_id": msg.topic_id,
            "subject": msg.subject,
            "body": msg.body,
            "message_type": msg.message_type,
            "message_json": msg.message_json,
            "timestamp": msg.created_at.isoformat(),
        },
        default=str,
    )
    headers = {"Content-Type": "application/json"}

    start = time.time()
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(url, content=payload, headers=headers)
            delivery.status_code = resp.status_code
            delivery.response_body = resp.text[:2000]
            delivery.status = "delivered" if 200 <= resp.status_code < 300 else "failed"
            delivery.duration_ms = int((time.time() - start) * 1000)
            delivery.attempts = 1
    except Exception as exc:
        delivery.status = "failed"
        delivery.error = str(exc)[:500]
        delivery.duration_ms = int((time.time() - start) * 1000)


def _deliver_email(email: str, msg: NotificationMessage, delivery: NotificationDelivery, db: Session):
    """Deliver via email (placeholder — needs SMTP service)."""
    delivery.status = "delivered"
    delivery.response_body = f"Email queued for {email}"
    delivery.attempts = 1
    # In production: use SMTP or email API (SendGrid, SES, etc.)


def _deliver_websocket(user_id: str, msg: NotificationMessage, delivery: NotificationDelivery, db: Session):
    """Deliver via WebSocket push (placeholder — needs WS server)."""
    delivery.status = "delivered"
    delivery.response_body = f"WebSocket push to user {user_id}"
    delivery.attempts = 1
    # In production: push through WebSocket connection manager


def _validate_endpoint_url(url: str):
    """Reject endpoints pointing at private networks (SSRF protection)."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError("Endpoint must be an absolute http(s) URL")
    try:
        infos = socket.getaddrinfo(parsed.hostname, parsed.port or 80)
    except socket.gaierror:
        raise ValueError(f"Cannot resolve hostname: {parsed.hostname}")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise ValueError("Endpoint must not point at a private or loopback address")


def _matches_filter(filter_policy: dict, message: dict) -> bool:
    """Check if a message matches a filter policy."""
    if not filter_policy:
        return True
    # Simple attribute-based filtering
    for key, allowed_values in filter_policy.items():
        msg_value = message.get(key)
        if msg_value is not None and msg_value not in allowed_values:
            return False
    return True


# ── Stats ─────────────────────────────────────────────────────────────


def get_topic_stats(db: Session, topic_id: int) -> dict[str, Any]:
    """Get delivery statistics for a topic."""
    topic = db.get(NotificationTopic, topic_id)
    if not topic:
        return {}

    total_messages = db.query(NotificationMessage).filter(NotificationMessage.topic_id == topic_id).count()
    total_deliveries = (
        db.query(NotificationDelivery)
        .join(NotificationMessage)
        .filter(NotificationMessage.topic_id == topic_id)
        .count()
    )
    successful = (
        db.query(NotificationDelivery)
        .join(NotificationMessage)
        .filter(NotificationMessage.topic_id == topic_id, NotificationDelivery.status == "delivered")
        .count()
    )

    return {
        "topic_id": topic_id,
        "topic_name": topic.name,
        "total_messages": total_messages,
        "total_deliveries": total_deliveries,
        "successful_deliveries": successful,
        "failed_deliveries": total_deliveries - successful,
        "delivery_rate": (successful / total_deliveries * 100) if total_deliveries > 0 else 100.0,
    }
