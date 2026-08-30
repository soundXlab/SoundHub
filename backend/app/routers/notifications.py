"""Notification Service API — pub/sub messaging (analogous to AWS SNS).

Endpoints:
    POST   /api/notifications/topics              Create topic
    GET    /api/notifications/topics              List topics
    GET    /api/notifications/topics/{id}         Get topic
    DELETE /api/notifications/topics/{id}         Delete topic
    POST   /api/notifications/topics/{id}/subscribe   Subscribe
    POST   /api/notifications/topics/{id}/publish     Publish message
    GET    /api/notifications/topics/{id}/subscriptions  List subscriptions
    DELETE /api/notifications/subscriptions/{id}  Unsubscribe
    GET    /api/notifications/topics/{id}/stats   Delivery stats
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..security import get_current_user
from ..services import notification_service as svc

router = APIRouter(prefix="/api/notifications", tags=["notifications", "sns"])


# ── Request / Response Models ─────────────────────────────────────────


class TopicCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    display_name: str = Field(default="", max_length=256)
    description: str = Field(default="", max_length=2000)


class SubscribeRequest(BaseModel):
    protocol: str = Field(..., description="http | https | email | webhook | websocket")
    endpoint: str = Field(..., max_length=512)
    filter_policy: Optional[dict] = None


class PublishRequest(BaseModel):
    subject: str = Field(default="", max_length=256)
    body: str = Field(default="", max_length=32000)
    message_type: str = Field(default="text", description="text | json")
    message_json: Optional[dict] = None


# ── Topic Endpoints ───────────────────────────────────────────────────


@router.post("/topics", status_code=status.HTTP_201_CREATED)
def create_topic(body: TopicCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new notification topic."""
    try:
        return svc.create_topic(db, body.name, body.display_name, body.description, owner_id=user.id)
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.get("/topics")
def list_topics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all topics."""
    return {"topics": svc.list_topics(db)}


@router.get("/topics/{topic_id}")
def get_topic(topic_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get topic details."""
    topic = svc.get_topic(db, topic_id)
    if not topic:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Topic not found")
    return topic


@router.delete("/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(topic_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a topic and all its subscriptions."""
    if not svc.delete_topic(db, topic_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Topic not found")


# ── Subscription Endpoints ────────────────────────────────────────────


@router.post("/topics/{topic_id}/subscribe", status_code=status.HTTP_201_CREATED)
def subscribe(topic_id: int, body: SubscribeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Subscribe to a topic."""
    try:
        return svc.subscribe(db, topic_id, body.protocol, body.endpoint, body.filter_policy)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.get("/topics/{topic_id}/subscriptions")
def list_subscriptions(topic_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List subscriptions for a topic."""
    return {"subscriptions": svc.list_subscriptions(db, topic_id)}


@router.delete("/subscriptions/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe(subscription_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove a subscription."""
    if not svc.unsubscribe(db, subscription_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Subscription not found")


# ── Publish ───────────────────────────────────────────────────────────


@router.post("/topics/{topic_id}/publish")
def publish_message(topic_id: int, body: PublishRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Publish a message to all subscribers of a topic."""
    try:
        return svc.publish_message(
            db, topic_id, body.subject, body.body, body.message_type, body.message_json, published_by_id=user.id
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


# ── Stats ─────────────────────────────────────────────────────────────


@router.get("/topics/{topic_id}/stats")
def get_topic_stats(topic_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get delivery statistics for a topic."""
    stats = svc.get_topic_stats(db, topic_id)
    if not stats:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Topic not found")
    return stats
