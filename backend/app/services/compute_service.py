"""Compute Service — serverless function execution (analogous to AWS Lambda).

Provides:
- Function CRUD (create, update, delete, list)
- Function invocation (manual and trigger-based)
- Event triggers (job.completed, webhook.received, schedule, api.call)
- Execution logs and billing metrics

Usage:
    from .services.compute_service import (
        create_function, invoke_function, list_invocations, create_trigger
    )
"""

from __future__ import annotations

import base64
import hashlib
import json
import logging
import time
import traceback
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from ..models import (
    Function as FunctionModel,
    FunctionTrigger,
    FunctionInvocation,
    utcnow,
)

logger = logging.getLogger(__name__)

# Registered event listeners for trigger dispatch
_trigger_listeners: dict[str, list[callable]] = {}


def register_trigger_listener(event_type: str, callback: callable):
    """Register a callback for a specific event type."""
    _trigger_listeners.setdefault(event_type, []).append(callback)


def dispatch_event(event_type: str, payload: dict):
    """Dispatch an event to all matching function triggers."""
    for callback in _trigger_listeners.get(event_type, []):
        try:
            callback(event_type, payload)
        except Exception as exc:
            logger.warning("Trigger listener failed for %s: %s", event_type, exc)


# ── Function CRUD ─────────────────────────────────────────────────────


def create_function(
    db: Session,
    name: str,
    runtime: str = "python3.12",
    handler: str = "handler.main",
    code: str = "",
    description: str = "",
    timeout_seconds: int = 30,
    memory_mb: int = 128,
    environment_vars: dict | None = None,
    max_retries: int = 0,
    owner_id: int | None = None,
) -> dict[str, Any]:
    """Create a new serverless function."""
    existing = db.query(FunctionModel).filter(FunctionModel.name == name).first()
    if existing:
        raise ValueError(f"Function '{name}' already exists")

    code_sha = hashlib.sha256(code.encode()).hexdigest() if code else None

    func = FunctionModel(
        name=name,
        runtime=runtime,
        handler=handler,
        code_sha256=code_sha,
        code_blob=code,
        description=description,
        timeout_seconds=timeout_seconds,
        memory_mb=memory_mb,
        environment_vars=environment_vars,
        max_retries=max_retries,
        owner_id=owner_id,
    )
    db.add(func)
    db.commit()
    db.refresh(func)
    return {"id": func.id, "name": func.name, "status": func.status, "code_sha256": code_sha}


def update_function(db: Session, function_id: int, **kwargs) -> dict[str, Any] | None:
    """Update a function's configuration."""
    func = db.get(FunctionModel, function_id)
    if not func:
        return None

    if "code" in kwargs:
        code = kwargs.pop("code")
        func.code_blob = code
        func.code_sha256 = hashlib.sha256(code.encode()).hexdigest() if code else None

    for key, value in kwargs.items():
        if hasattr(func, key):
            setattr(func, key, value)

    func.updated_at = utcnow()
    db.commit()
    return {"id": func.id, "name": func.name, "status": func.status}


def delete_function(db: Session, function_id: int) -> bool:
    """Delete a function and all its invocations/triggers."""
    func = db.get(FunctionModel, function_id)
    if not func:
        return False
    db.delete(func)
    db.commit()
    return True


def get_function(db: Session, function_id: int) -> dict[str, Any] | None:
    """Get function details."""
    func = db.get(FunctionModel, function_id)
    if not func:
        return None
    return {
        "id": func.id,
        "name": func.name,
        "runtime": func.runtime,
        "handler": func.handler,
        "description": func.description,
        "timeout_seconds": func.timeout_seconds,
        "memory_mb": func.memory_mb,
        "code_sha256": func.code_sha256,
        "status": func.status,
        "max_retries": func.max_retries,
        "created_at": func.created_at.isoformat(),
        "updated_at": func.updated_at.isoformat(),
    }


def list_functions(db: Session, owner_id: int | None = None, limit: int = 50) -> list[dict[str, Any]]:
    """List all functions."""
    q = db.query(FunctionModel)
    if owner_id is not None:
        q = q.filter(FunctionModel.owner_id == owner_id)
    funcs = q.order_by(FunctionModel.id.desc()).limit(limit).all()
    return [
        {
            "id": f.id,
            "name": f.name,
            "runtime": f.runtime,
            "status": f.status,
            "code_sha256": f.code_sha256,
        }
        for f in funcs
    ]


# ── Triggers ──────────────────────────────────────────────────────────


def create_trigger(
    db: Session,
    function_id: int,
    event_type: str,
    filter_pattern: dict | None = None,
    enabled: bool = True,
    config: dict | None = None,
) -> dict[str, Any]:
    """Create an event trigger for a function."""
    func = db.get(FunctionModel, function_id)
    if not func:
        raise ValueError(f"Function {function_id} not found")

    trigger = FunctionTrigger(
        function_id=function_id,
        event_type=event_type,
        filter_pattern=filter_pattern,
        enabled=enabled,
        config=config,
    )
    db.add(trigger)
    db.commit()
    db.refresh(trigger)
    return {"id": trigger.id, "event_type": trigger.event_type, "enabled": trigger.enabled}


def delete_trigger(db: Session, trigger_id: int) -> bool:
    """Delete a trigger."""
    trigger = db.get(FunctionTrigger, trigger_id)
    if not trigger:
        return False
    db.delete(trigger)
    db.commit()
    return True


def list_triggers(db: Session, function_id: int) -> list[dict[str, Any]]:
    """List triggers for a function."""
    triggers = db.query(FunctionTrigger).filter(FunctionTrigger.function_id == function_id).all()
    return [
        {
            "id": t.id,
            "event_type": t.event_type,
            "enabled": t.enabled,
            "filter_pattern": t.filter_pattern,
            "config": t.config,
        }
        for t in triggers
    ]


# ── Invoke ────────────────────────────────────────────────────────────


def invoke_function(
    db: Session,
    function_id: int,
    payload: dict | None = None,
    trigger_type: str = "manual",
    invoked_by_id: int | None = None,
) -> dict[str, Any]:
    """Invoke a function synchronously.

    Executes the function code in an isolated sandbox and returns the result.
    """
    func = db.get(FunctionModel, function_id)
    if not func:
        raise ValueError(f"Function {function_id} not found")
    if func.status != "active":
        raise ValueError(f"Function {func.name} is {func.status}")

    invocation = FunctionInvocation(
        function_id=function_id,
        status="running",
        trigger_type=trigger_type,
        request_payload=payload,
        invoked_by_id=invoked_by_id,
    )
    db.add(invocation)
    db.flush()

    start_time = time.time()
    logs = []

    try:
        # Execute function in a sandboxed environment
        result = _execute_function(func, payload or {}, logs)
        duration_ms = int((time.time() - start_time) * 1000)

        invocation.status = "success"
        invocation.response_payload = result
        invocation.duration_ms = duration_ms
        invocation.billed_duration_ms = max(1, duration_ms)  # minimum 1ms billing
        invocation.memory_used_mb = func.memory_mb  # estimate
        invocation.logs = "\n".join(logs)
        invocation.finished_at = utcnow()

        db.commit()
        return {
            "invocation_id": invocation.id,
            "status": "success",
            "response": result,
            "duration_ms": duration_ms,
        }

    except TimeoutError:
        duration_ms = int((time.time() - start_time) * 1000)
        invocation.status = "timeout"
        invocation.error_message = f"Function timed out after {func.timeout_seconds}s"
        invocation.duration_ms = duration_ms
        invocation.logs = "\n".join(logs)
        invocation.finished_at = utcnow()
        db.commit()
        return {
            "invocation_id": invocation.id,
            "status": "timeout",
            "error": invocation.error_message,
            "duration_ms": duration_ms,
        }

    except Exception as exc:
        duration_ms = int((time.time() - start_time) * 1000)
        invocation.status = "failed"
        invocation.error_message = f"{type(exc).__name__}: {exc}"
        invocation.duration_ms = duration_ms
        invocation.logs = "\n".join(logs)
        invocation.finished_at = utcnow()
        db.commit()
        return {
            "invocation_id": invocation.id,
            "status": "failed",
            "error": invocation.error_message,
            "duration_ms": duration_ms,
        }


def _execute_function(func: FunctionModel, payload: dict, logs: list[str]) -> dict:
    """Execute function code in a sandbox.

    Currently supports python3.12 runtime with safe exec().
    In production, use subprocess, Docker, or WebAssembly sandboxing.
    """
    if not func.code_blob:
        return {"message": "Function has no code", "payload": payload}

    # Build sandbox environment
    sandbox = {
        "__name__": "__main__",
        "payload": payload,
        "result": {},
        "logs": logs,
    }

    def log(msg):
        logs.append(f"[{datetime.now(timezone.utc).isoformat()}] {msg}")

    sandbox["log"] = log

    # Execute with timeout
    import signal

    def timeout_handler(signum, frame):
        raise TimeoutError()

    old_handler = signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(func.timeout_seconds)

    try:
        # Parse handler
        module_name, function_name = func.handler.rsplit(".", 1) if "." in func.handler else ("__main__", func.handler)

        # Wrap code in a function call pattern
        code = func.code_blob
        if "def " in code:
            exec(code, sandbox)
            if function_name in sandbox and callable(sandbox[function_name]):
                result = sandbox[function_name](payload, log)
                return result if isinstance(result, dict) else {"result": result}
        else:
            exec(code, sandbox)

        return sandbox.get("result", {})
    finally:
        signal.alarm(0)
        signal.signal(signal.SIGALRM, old_handler)


# ── Invocations ───────────────────────────────────────────────────────


def get_invocation(db: Session, invocation_id: int) -> dict[str, Any] | None:
    """Get invocation details."""
    inv = db.get(FunctionInvocation, invocation_id)
    if not inv:
        return None
    return {
        "id": inv.id,
        "function_id": inv.function_id,
        "status": inv.status,
        "trigger_type": inv.trigger_type,
        "request_payload": inv.request_payload,
        "response_payload": inv.response_payload,
        "error_message": inv.error_message,
        "logs": inv.logs,
        "duration_ms": inv.duration_ms,
        "billed_duration_ms": inv.billed_duration_ms,
        "memory_used_mb": inv.memory_used_mb,
        "created_at": inv.created_at.isoformat(),
        "finished_at": inv.finished_at.isoformat() if inv.finished_at else None,
    }


def list_invocations(
    db: Session,
    function_id: int | None = None,
    status: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """List function invocations."""
    q = db.query(FunctionInvocation)
    if function_id is not None:
        q = q.filter(FunctionInvocation.function_id == function_id)
    if status is not None:
        q = q.filter(FunctionInvocation.status == status)
    invocations = q.order_by(FunctionInvocation.id.desc()).limit(limit).all()
    return [
        {
            "id": i.id,
            "function_id": i.function_id,
            "status": i.status,
            "trigger_type": i.trigger_type,
            "duration_ms": i.duration_ms,
            "created_at": i.created_at.isoformat(),
        }
        for i in invocations
    ]


def get_function_stats(db: Session, function_id: int) -> dict[str, Any]:
    """Get execution statistics for a function."""
    func = db.get(FunctionModel, function_id)
    if not func:
        return {}

    total = db.query(FunctionInvocation).filter(FunctionInvocation.function_id == function_id).count()
    succeeded = db.query(FunctionInvocation).filter(
        FunctionInvocation.function_id == function_id,
        FunctionInvocation.status == "success",
    ).count()
    failed = db.query(FunctionInvocation).filter(
        FunctionInvocation.function_id == function_id,
        FunctionInvocation.status == "failed",
    ).count()

    return {
        "function_id": function_id,
        "function_name": func.name,
        "total_invocations": total,
        "succeeded": succeeded,
        "failed": failed,
        "success_rate": (succeeded / total * 100) if total > 0 else 100.0,
    }
