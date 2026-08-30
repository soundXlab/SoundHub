"""Monitoring & Logging API — metrics, logs, alarms (analogous to AWS CloudWatch).

Endpoints:
    POST   /api/monitoring/namespaces           Create namespace
    GET    /api/monitoring/namespaces           List namespaces
    POST   /api/monitoring/metrics              Put metric data
    GET    /api/monitoring/metrics              List metrics
    POST   /api/monitoring/metrics/statistics   Get metric statistics
    POST   /api/monitoring/logs/groups          Create log group
    GET    /api/monitoring/logs/groups          List log groups
    DELETE /api/monitoring/logs/groups/{name}   Delete log group
    POST   /api/monitoring/logs/streams         Create log stream
    GET    /api/monitoring/logs/streams         List log streams
    POST   /api/monitoring/logs/events          Put log events
    POST   /api/monitoring/logs/events/query    Query log events
    GET    /api/monitoring/logs/groups/{name}/stats  Log group stats
    POST   /api/monitoring/alarms               Create alarm
    GET    /api/monitoring/alarms               List alarms
    PUT    /api/monitoring/alarms/{id}          Update alarm
    DELETE /api/monitoring/alarms/{id}          Delete alarm
    POST   /api/monitoring/alarms/evaluate      Evaluate all alarms
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..security import get_current_user
from ..services import monitoring_service as svc

router = APIRouter(prefix="/api/monitoring", tags=["monitoring", "cloudwatch"])


# ── Namespace Models ──────────────────────────────────────────────────


class NamespaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    description: str = Field(default="", max_length=2000)


class MetricPutRequest(BaseModel):
    namespace: str = Field(..., min_length=1, max_length=128)
    metric_name: str = Field(..., min_length=1, max_length=128)
    value: float
    unit: str = Field(default="None", description="Count|Seconds|Bytes|Percent|None|...")
    dimensions: Optional[dict] = None
    timestamp: Optional[str] = None


class MetricStatisticsRequest(BaseModel):
    namespace: str
    metric_name: str
    start_time: str  # ISO datetime
    end_time: str  # ISO datetime
    period_seconds: int = Field(default=300, ge=60, le=86400)
    statistic: str = Field(default="Average", description="Average|Sum|Minimum|Maximum|SampleCount")
    dimensions: Optional[dict] = None


class LogGroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=256)
    retention_days: int = Field(default=30, ge=1, le=3650)
    description: str = Field(default="", max_length=2000)


class LogStreamCreate(BaseModel):
    log_group_name: str
    stream_name: str = Field(..., min_length=1, max_length=256)
    source: str = Field(default="api", description="api | job | workflow | user")


class LogEventPutRequest(BaseModel):
    log_group_name: str
    stream_name: str
    events: list[dict] = Field(..., min_length=1, max_length=1000)


class LogEventQueryRequest(BaseModel):
    log_group_name: str
    stream_name: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    level: Optional[str] = None
    filter_pattern: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=10000)


class AlarmCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    namespace: str
    metric_name: str
    comparison_operator: str = Field(..., description=">=, <=, >, <, ==, !=")
    threshold: float
    statistic: str = Field(default="Average")
    period_seconds: int = Field(default=300, ge=60)
    evaluation_periods: int = Field(default=1, ge=1)
    alarm_actions: Optional[list[dict]] = None
    ok_actions: Optional[list[dict]] = None


class AlarmUpdate(BaseModel):
    comparison_operator: Optional[str] = None
    threshold: Optional[float] = None
    statistic: Optional[str] = None
    period_seconds: Optional[int] = None
    evaluation_periods: Optional[int] = None
    alarm_actions: Optional[list[dict]] = None
    ok_actions: Optional[list[dict]] = None


# ── Namespace Endpoints ───────────────────────────────────────────────


@router.post("/namespaces", status_code=status.HTTP_201_CREATED)
def create_namespace(body: NamespaceCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return svc.create_namespace(db, body.name, body.description, owner_id=user.id)
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.get("/namespaces")
def list_namespaces(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"namespaces": svc.list_namespaces(db)}


# ── Metric Endpoints ──────────────────────────────────────────────────


@router.post("/metrics")
def put_metric_data(body: MetricPutRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ts = None
    if body.timestamp:
        ts = datetime.fromisoformat(body.timestamp)
    return svc.put_metric_data(db, body.namespace, body.metric_name, body.value, body.unit, body.dimensions, ts)


@router.get("/metrics")
def list_metrics(namespace: Optional[str] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"metrics": svc.list_metrics(db, namespace)}


@router.post("/metrics/statistics")
def get_metric_statistics(body: MetricStatisticsRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        start = datetime.fromisoformat(body.start_time)
        end = datetime.fromisoformat(body.end_time)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid datetime format")
    return svc.get_metric_statistics(
        db, body.namespace, body.metric_name, start, end, body.period_seconds, body.statistic, body.dimensions
    )


# ── Log Group Endpoints ───────────────────────────────────────────────


@router.post("/logs/groups", status_code=status.HTTP_201_CREATED)
def create_log_group(body: LogGroupCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return svc.create_log_group(db, body.name, body.retention_days, body.description, owner_id=user.id)
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.get("/logs/groups")
def list_log_groups(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"log_groups": svc.list_log_groups(db)}


@router.delete("/logs/groups/{name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log_group(name: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not svc.delete_log_group(db, name):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Log group not found")


@router.get("/logs/groups/{name}/stats")
def get_log_group_stats(name: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stats = svc.get_log_group_stats(db, name)
    if not stats:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Log group not found")
    return stats


# ── Log Stream Endpoints ──────────────────────────────────────────────


@router.post("/logs/streams", status_code=status.HTTP_201_CREATED)
def create_log_stream(body: LogStreamCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return svc.create_log_stream(db, body.log_group_name, body.stream_name, body.source)
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.get("/logs/streams")
def list_log_streams(log_group_name: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"streams": svc.list_log_streams(db, log_group_name)}


# ── Log Event Endpoints ───────────────────────────────────────────────


@router.post("/logs/events")
def put_log_events(body: LogEventPutRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return svc.put_log_events(db, body.log_group_name, body.stream_name, body.events)
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.post("/logs/events/query")
def query_log_events(body: LogEventQueryRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    start = datetime.fromisoformat(body.start_time) if body.start_time else None
    end = datetime.fromisoformat(body.end_time) if body.end_time else None
    events = svc.get_log_events(db, body.log_group_name, body.stream_name, start, end, body.level, body.filter_pattern, body.limit)
    return {"events": events, "count": len(events)}


# ── Alarm Endpoints ───────────────────────────────────────────────────


@router.post("/alarms", status_code=status.HTTP_201_CREATED)
def create_alarm(body: AlarmCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return svc.create_alarm(
            db, body.name, body.namespace, body.metric_name, body.comparison_operator,
            body.threshold, body.statistic, body.period_seconds, body.evaluation_periods,
            body.alarm_actions, body.ok_actions, owner_id=user.id,
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.get("/alarms")
def list_alarms(namespace: Optional[str] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"alarms": svc.list_alarms(db, namespace)}


@router.put("/alarms/{alarm_id}")
def update_alarm(alarm_id: int, body: AlarmUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    update_data = body.model_dump(exclude_unset=True)
    result = svc.update_alarm(db, alarm_id, **update_data)
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Alarm not found")
    return result


@router.delete("/alarms/{alarm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alarm(alarm_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not svc.delete_alarm(db, alarm_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Alarm not found")


@router.post("/alarms/evaluate")
def evaluate_alarms(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Evaluate all alarms against recent metrics."""
    changes = svc.evaluate_alarms(db)
    return {"evaluated": True, "state_changes": changes}
