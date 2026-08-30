"""Monitoring & Logging Service — metrics, logs, alarms (analogous to AWS CloudWatch).

Provides:
- Custom metric publishing and querying
- Log groups/streams/events storage
- Alarm creation and evaluation
- Dashboard-friendly data aggregation

Usage:
    from .services.monitoring_service import (
        put_metric_data, get_metric_statistics,
        create_log_group, create_log_stream, put_log_events,
        create_alarm, evaluate_alarms
    )
"""

from __future__ import annotations

import logging
import json
from datetime import datetime, timezone, timedelta
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import (
    MetricNamespace,
    MetricDatum,
    LogGroup,
    LogStream,
    LogEvent,
    Alarm,
    utcnow,
)

logger = logging.getLogger(__name__)


# ── Metric Namespaces ─────────────────────────────────────────────────


def create_namespace(db: Session, name: str, description: str = "", owner_id: int | None = None) -> dict[str, Any]:
    """Create a metric namespace."""
    existing = db.query(MetricNamespace).filter(MetricNamespace.name == name).first()
    if existing:
        raise ValueError(f"Namespace '{name}' already exists")

    ns = MetricNamespace(name=name, description=description, owner_id=owner_id)
    db.add(ns)
    db.commit()
    db.refresh(ns)
    return {"id": ns.id, "name": ns.name}


def list_namespaces(db: Session, limit: int = 50) -> list[dict[str, Any]]:
    """List all metric namespaces."""
    ns_list = db.query(MetricNamespace).order_by(MetricNamespace.id.desc()).limit(limit).all()
    return [{"id": ns.id, "name": ns.name, "description": ns.description} for ns in ns_list]


# ── Put Metric Data ───────────────────────────────────────────────────


def put_metric_data(
    db: Session,
    namespace_name: str,
    metric_name: str,
    value: float,
    unit: str = "None",
    dimensions: dict | None = None,
    timestamp: datetime | None = None,
) -> dict[str, Any]:
    """Publish a metric data point."""
    ns = db.query(MetricNamespace).filter(MetricNamespace.name == namespace_name).first()
    if not ns:
        ns = MetricNamespace(name=namespace_name)
        db.add(ns)
        db.flush()

    datum = MetricDatum(
        namespace_id=ns.id,
        metric_name=metric_name,
        dimensions=dimensions,
        value=value,
        unit=unit,
        timestamp=timestamp or utcnow(),
    )
    db.add(datum)
    db.commit()
    return {"namespace": namespace_name, "metric_name": metric_name, "value": value}


def get_metric_statistics(
    db: Session,
    namespace_name: str,
    metric_name: str,
    start_time: datetime,
    end_time: datetime,
    period_seconds: int = 300,
    statistic: str = "Average",
    dimensions: dict | None = None,
) -> dict[str, Any]:
    """Get aggregated metric statistics over a time range."""
    ns = db.query(MetricNamespace).filter(MetricNamespace.name == namespace_name).first()
    if not ns:
        return {"statistics": [], "datapoints": 0}

    q = (
        db.query(MetricDatum)
        .filter(
            MetricDatum.namespace_id == ns.id,
            MetricDatum.metric_name == metric_name,
            MetricDatum.timestamp >= start_time,
            MetricDatum.timestamp <= end_time,
        )
    )

    data_points = q.all()
    if not data_points:
        return {"statistics": [], "datapoints": 0}

    values = [d.value for d in data_points]
    stats = {
        "Average": sum(values) / len(values) if values else 0,
        "Sum": sum(values),
        "Minimum": min(values) if values else 0,
        "Maximum": max(values) if values else 0,
        "SampleCount": len(values),
    }

    return {
        "namespace": namespace_name,
        "metric_name": metric_name,
        "statistic": statistic,
        "value": stats.get(statistic, 0),
        "datapoints": len(values),
        "unit": data_points[0].unit if data_points else "None",
    }


def list_metrics(
    db: Session, namespace_name: str | None = None, limit: int = 100
) -> list[dict[str, Any]]:
    """List unique metric names."""
    q = db.query(MetricNamespace)
    if namespace_name:
        q = q.filter(MetricNamespace.name == namespace_name)
    namespaces = q.all()
    ns_ids = [ns.id for ns in namespaces]

    if not ns_ids:
        return []

    # Get distinct metric names
    rows = (
        db.query(MetricDatum.metric_name, func.count(MetricDatum.id).label("count"))
        .filter(MetricDatum.namespace_id.in_(ns_ids))
        .group_by(MetricDatum.metric_name)
        .limit(limit)
        .all()
    )

    return [{"metric_name": r.metric_name, "datapoints": r.count} for r in rows]


# ── Log Groups ────────────────────────────────────────────────────────


def create_log_group(
    db: Session, name: str, retention_days: int = 30, description: str = "",
    owner_id: int | None = None,
) -> dict[str, Any]:
    """Create a log group."""
    existing = db.query(LogGroup).filter(LogGroup.name == name).first()
    if existing:
        raise ValueError(f"Log group '{name}' already exists")

    lg = LogGroup(name=name, retention_days=retention_days, description=description, owner_id=owner_id)
    db.add(lg)
    db.commit()
    db.refresh(lg)
    return {"id": lg.id, "name": lg.name, "retention_days": lg.retention_days}


def delete_log_group(db: Session, name: str) -> bool:
    """Delete a log group and all its streams/events."""
    lg = db.query(LogGroup).filter(LogGroup.name == name).first()
    if not lg:
        return False
    db.delete(lg)
    db.commit()
    return True


def list_log_groups(db: Session, limit: int = 50) -> list[dict[str, Any]]:
    """List all log groups."""
    groups = db.query(LogGroup).order_by(LogGroup.id.desc()).limit(limit).all()
    return [
        {"id": g.id, "name": g.name, "retention_days": g.retention_days, "description": g.description}
        for g in groups
    ]


# ── Log Streams ───────────────────────────────────────────────────────


def create_log_stream(db: Session, log_group_name: str, stream_name: str, source: str = "api") -> dict[str, Any]:
    """Create a log stream within a log group."""
    lg = db.query(LogGroup).filter(LogGroup.name == log_group_name).first()
    if not lg:
        raise ValueError(f"Log group '{log_group_name}' not found")

    existing = (
        db.query(LogStream)
        .filter(LogStream.log_group_id == lg.id, LogStream.name == stream_name)
        .first()
    )
    if existing:
        return {"id": existing.id, "name": existing.name}

    stream = LogStream(log_group_id=lg.id, name=stream_name, source=source)
    db.add(stream)
    db.commit()
    db.refresh(stream)
    return {"id": stream.id, "name": stream.name}


def list_log_streams(db: Session, log_group_name: str, limit: int = 50) -> list[dict[str, Any]]:
    """List log streams in a log group."""
    lg = db.query(LogGroup).filter(LogGroup.name == log_group_name).first()
    if not lg:
        return []

    streams = (
        db.query(LogStream)
        .filter(LogStream.log_group_id == lg.id)
        .order_by(LogStream.id.desc())
        .limit(limit)
        .all()
    )
    return [{"id": s.id, "name": s.name, "source": s.source, "status": s.status} for s in streams]


# ── Log Events ────────────────────────────────────────────────────────


def put_log_events(
    db: Session,
    log_group_name: str,
    stream_name: str,
    events: list[dict[str, Any]],
) -> dict[str, Any]:
    """Write log events to a stream.

    Each event dict: {"message": str, "level": str, "source": str, "metadata": dict}
    """
    lg = db.query(LogGroup).filter(LogGroup.name == log_group_name).first()
    if not lg:
        raise ValueError(f"Log group '{log_group_name}' not found")

    stream = (
        db.query(LogStream)
        .filter(LogStream.log_group_id == lg.id, LogStream.name == stream_name)
        .first()
    )
    if not stream:
        # Auto-create stream
        stream = LogStream(log_group_id=lg.id, name=stream_name)
        db.add(stream)
        db.flush()

    written = 0
    for event_data in events:
        event = LogEvent(
            stream_id=stream.id,
            message=event_data.get("message", ""),
            level=event_data.get("level", "INFO").upper(),
            source=event_data.get("source", ""),
            metadata_json=event_data.get("metadata"),
        )
        db.add(event)
        written += 1

    db.commit()
    return {"log_group": log_group_name, "stream": stream_name, "events_written": written}


def get_log_events(
    db: Session,
    log_group_name: str,
    stream_name: str,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    level: str | None = None,
    filter_pattern: str | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    """Query log events from a stream."""
    lg = db.query(LogGroup).filter(LogGroup.name == log_group_name).first()
    if not lg:
        return []

    stream = (
        db.query(LogStream)
        .filter(LogStream.log_group_id == lg.id, LogStream.name == stream_name)
        .first()
    )
    if not stream:
        return []

    q = db.query(LogEvent).filter(LogEvent.stream_id == stream.id)

    if start_time:
        q = q.filter(LogEvent.timestamp >= start_time)
    if end_time:
        q = q.filter(LogEvent.timestamp <= end_time)
    if level:
        q = q.filter(LogEvent.level == level.upper())

    events = q.order_by(LogEvent.timestamp.desc()).limit(limit).all()

    result = []
    for e in events:
        # Simple text filter
        if filter_pattern and filter_pattern.lower() not in (e.message or "").lower():
            continue
        result.append({
            "id": e.id,
            "timestamp": e.timestamp.isoformat(),
            "level": e.level,
            "source": e.source,
            "message": e.message,
            "metadata": e.metadata_json,
        })

    return result


def get_log_group_stats(db: Session, log_group_name: str) -> dict[str, Any]:
    """Get statistics for a log group."""
    lg = db.query(LogGroup).filter(LogGroup.name == log_group_name).first()
    if not lg:
        return {}

    stream_count = db.query(LogStream).filter(LogStream.log_group_id == lg.id).count()
    event_count = (
        db.query(LogEvent)
        .join(LogStream)
        .filter(LogStream.log_group_id == lg.id)
        .count()
    )

    # Error count
    error_count = (
        db.query(LogEvent)
        .join(LogStream)
        .filter(LogStream.log_group_id == lg.id, LogEvent.level.in_(["ERROR", "FATAL"]))
        .count()
    )

    return {
        "log_group": log_group_name,
        "stream_count": stream_count,
        "total_events": event_count,
        "error_events": error_count,
        "retention_days": lg.retention_days,
    }


# ── Alarms ────────────────────────────────────────────────────────────


def create_alarm(
    db: Session,
    name: str,
    namespace_name: str,
    metric_name: str,
    comparison_operator: str,
    threshold: float,
    statistic: str = "Average",
    period_seconds: int = 300,
    evaluation_periods: int = 1,
    alarm_actions: list[dict] | None = None,
    ok_actions: list[dict] | None = None,
    owner_id: int | None = None,
) -> dict[str, Any]:
    """Create a metric alarm."""
    existing = db.query(Alarm).filter(Alarm.name == name).first()
    if existing:
        raise ValueError(f"Alarm '{name}' already exists")

    ns = db.query(MetricNamespace).filter(MetricNamespace.name == namespace_name).first()
    if not ns:
        ns = MetricNamespace(name=namespace_name)
        db.add(ns)
        db.flush()

    alarm = Alarm(
        name=name,
        namespace_id=ns.id,
        metric_name=metric_name,
        statistic=statistic,
        period_seconds=period_seconds,
        evaluation_periods=evaluation_periods,
        comparison_operator=comparison_operator,
        threshold=threshold,
        alarm_actions=alarm_actions,
        ok_actions=ok_actions,
        owner_id=owner_id,
    )
    db.add(alarm)
    db.commit()
    db.refresh(alarm)
    return {"id": alarm.id, "name": alarm.name, "state": alarm.state}


def update_alarm(db: Session, alarm_id: int, **kwargs) -> dict[str, Any] | None:
    """Update alarm configuration."""
    alarm = db.get(Alarm, alarm_id)
    if not alarm:
        return None
    for key, value in kwargs.items():
        if hasattr(alarm, key):
            setattr(alarm, key, value)
    alarm.updated_at = utcnow()
    db.commit()
    return {"id": alarm.id, "name": alarm.name}


def delete_alarm(db: Session, alarm_id: int) -> bool:
    """Delete an alarm."""
    alarm = db.get(Alarm, alarm_id)
    if not alarm:
        return False
    db.delete(alarm)
    db.commit()
    return True


def list_alarms(db: Session, namespace_name: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
    """List alarms."""
    q = db.query(Alarm)
    if namespace_name:
        q = q.join(MetricNamespace).filter(MetricNamespace.name == namespace_name)
    alarms = q.order_by(Alarm.id.desc()).limit(limit).all()
    return [
        {
            "id": a.id,
            "name": a.name,
            "metric_name": a.metric_name,
            "comparison_operator": a.comparison_operator,
            "threshold": a.threshold,
            "state": a.state,
        }
        for a in alarms
    ]


def evaluate_alarms(db: Session) -> list[dict[str, Any]]:
    """Evaluate all active alarms against recent metrics.

    Returns list of alarms that changed state.
    """
    alarms = db.query(Alarm).filter(Alarm.state.in_(["OK", "ALARM", "INSUFFICIENT_DATA"])).all()
    changes = []

    for alarm in alarms:
        now = utcnow()
        start = now - timedelta(seconds=alarm.period_seconds * alarm.evaluation_periods)

        stats = get_metric_statistics(
            db,
            namespace_name=alarm.namespace.name,
            metric_name=alarm.metric_name,
            start_time=start,
            end_time=now,
            period_seconds=alarm.period_seconds,
            statistic=alarm.statistic,
        )

        value = stats.get("value", 0)
        datapoints = stats.get("datapoints", 0)

        if datapoints == 0:
            new_state = "INSUFFICIENT_DATA"
            reason = "No data points in evaluation period"
        else:
            triggered = _compare(value, alarm.comparison_operator, alarm.threshold)
            new_state = "ALARM" if triggered else "OK"
            reason = f"{alarm.statistic} value {value} {alarm.comparison_operator} {alarm.threshold}"

        if new_state != alarm.state:
            old_state = alarm.state
            alarm.state = new_state
            alarm.state_reason = reason
            alarm.updated_at = now
            db.commit()

            # Fire alarm actions
            if new_state == "ALARM" and alarm.alarm_actions:
                _fire_alarm_actions(alarm.alarm_actions, alarm, value, reason)
            elif new_state == "OK" and alarm.ok_actions:
                _fire_alarm_actions(alarm.ok_actions, alarm, value, reason)

            changes.append({
                "alarm_id": alarm.id,
                "alarm_name": alarm.name,
                "old_state": old_state,
                "new_state": new_state,
                "reason": reason,
            })

    return changes


def _compare(value: float, operator: str, threshold: float) -> bool:
    """Compare a value against a threshold."""
    ops = {
        ">=": value >= threshold,
        "<=": value <= threshold,
        ">": value > threshold,
        "<": value < threshold,
        "==": value == threshold,
        "!=": value != threshold,
    }
    return ops.get(operator, False)


def _fire_alarm_actions(actions: list[dict], alarm: Alarm, value: float, reason: str):
    """Fire alarm actions (webhooks, notifications)."""
    import httpx
    for action in actions:
        if action.get("type") == "webhook":
            try:
                payload = json.dumps({
                    "alarm": alarm.name,
                    "state": alarm.state,
                    "metric": alarm.metric_name,
                    "value": value,
                    "reason": reason,
                })
                with httpx.Client(timeout=5) as client:
                    client.post(action["url"], content=payload, headers={"Content-Type": "application/json"})
            except Exception as exc:
                logger.warning("Alarm action failed for %s: %s", alarm.name, exc)
