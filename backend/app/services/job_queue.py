"""Background job queue — in-process worker with thread pool.

Designed for development and self-hosted deployments.
For production scale, swap the executor for Celery + Redis or Arq + Redis.

Usage:
    from .services.job_queue import enqueue_job, get_job_status

    job_id = enqueue_job("generate_waveform", storage_object_id=42, input_json={"filename": "mix.wav"})
    status = get_job_status(job_id)
"""

import json
import logging
import os
import threading
import time
import traceback
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, List, Dict
from queue import PriorityQueue

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from ..config import DATABASE_URL
from ..models import Job

logger = logging.getLogger(__name__)
_engine = create_engine(DATABASE_URL, echo=False)
_SessionFactory = sessionmaker(bind=_engine)

# ── Shutdown handling ───────────────────────────────────────────────────
def shutdown():
    """Gracefully shutdown the job queue workers and delay checker."""
    global _delay_checker_running, _shutdown_event, _delay_checker_thread, _worker_threads
    print(f"DEBUG: shutdown() called, _worker_threads={len(_worker_threads)}, _delay_checker_thread={_delay_checker_thread is not None}")
    _shutdown_event.set()
    _delay_checker_running = False
    if _delay_checker_thread is not None:
        print(f"DEBUG: shutdown() waiting for delay checker thread to join")
        _delay_checker_thread.join(timeout=5.0)
        _delay_checker_thread = None
        print(f"DEBUG: shutdown() delay checker thread joined")
    # Wait for worker threads to finish
    print(f"DEBUG: shutdown() waiting for {len(_worker_threads)} worker threads to join")
    for i, t in enumerate(_worker_threads):
        t.join(timeout=5.0)
    _worker_threads.clear()
    print(f"DEBUG: shutdown() finished")

# ── Worker pool with priority queuing ───────────────────────────────────

_WORKERS = int(os.environ.get("SOUNDHUB_JOB_WORKERS", "4"))
_job_queue = PriorityQueue()
_worker_threads = []
_shutdown_event = threading.Event()
_insertion_order = 0  # To maintain FIFO for same priority
_insertion_order_lock = threading.Lock()

# Function to start worker threads
def _start_worker_threads():
    global _worker_threads
    print(f"DEBUG: _start_worker_threads() called, starting {_WORKERS} worker threads")
    _shutdown_event.clear()  # Clear shutdown flag so new workers can run
    for i in range(_WORKERS):
        t = threading.Thread(target=_worker_loop, daemon=True)
        t.start()
        _worker_threads.append(t)
        print(f"DEBUG: Started worker thread {i} ({t.name})")
    print(f"DEBUG: _start_worker_threads() finished, now have {len(_worker_threads)} worker threads")

def _worker_loop():
    """Worker loop that processes jobs from the priority queue."""
    import logging
    logger = logging.getLogger(__name__)
    while not _shutdown_event.is_set():
        try:
            priority, insertion_order, job_id = _job_queue.get(timeout=1)
            logger.info("Processing job %s (priority %s)", job_id, priority)
            _run_job(job_id)
            _job_queue.task_done()
        except Exception as e:
            if type(e).__name__ == 'Empty':
                continue  # Normal queue timeout, no log
            import traceback
            traceback.print_exc()
            continue

# Start the worker threads when the module is loaded
_start_worker_threads()

# ── Delay checker ───────────────────────────────────────────────────────
_delay_checker_running = False
_delay_checker_thread = None

# ── Job type → handler mapping ──────────────────────────────────────────

_HANDLERS: dict[str, callable] = {}


def register_handler(job_type: str):
    """Decorator to register a job handler function."""

    def decorator(fn):
        _HANDLERS[job_type] = fn
        return fn

    return decorator


# ── Public API ──────────────────────────────────────────────────────────


def enqueue_job(
    job_type: str,
    *,
    storage_object_id: int | None = None,
    project_id: int | None = None,
    commit_id: int | None = None,
    version_id: int | None = None,
    session_id: int | None = None,
    input_json: dict[str, Any] | None = None,
    created_by_id: int | None = None,
    delay_seconds: int | None = None,
    priority: int = 0,
) -> int:
    """Create a job record and submit it to the worker pool.

    Returns the job id.
    """
    if job_type not in _HANDLERS:
        raise ValueError(
            f"Invalid job type {job_type!r}. "
            f"Registered: {sorted(_HANDLERS)}"
        )

    # Validate priority (0-9, where 0 is highest)
    if not 0 <= priority <= 9:
        raise ValueError("Priority must be between 0 and 9")

    db = _SessionFactory()
    try:
        # Determine initial status based on delay
        status = "queued"
        delay_until = None
        if delay_seconds is not None and delay_seconds > 0:
            # Job is delayed - it will be made available later by a delay checker
            status = "delayed"
            from datetime import datetime, timezone, timedelta
            delay_until = datetime.now(timezone.utc) + timedelta(seconds=delay_seconds)

        job = Job(
            type=job_type,
            status=status,
            storage_object_id=storage_object_id,
            project_id=project_id,
            commit_id=commit_id,
            version_id=version_id,
            session_id=session_id,
            input_json=input_json or {},
            created_by_id=created_by_id,
            delay_until=delay_until,
            priority=priority,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        job_id = job.id
    finally:
        db.close()

    # Add non-delayed jobs to the priority queue for worker threads to pick up
    # Delayed jobs will be picked up by a delay checker process
    print(f"DEBUG: Job {job_id} has status {status}")
    if status == "queued":
        print(f"DEBUG: Adding job {job_id} to queue with priority {priority}")
        global _insertion_order
        with _insertion_order_lock:
            _job_queue.put((priority, _insertion_order, job_id))
            _insertion_order += 1
            print(f"DEBUG: Job {job_id} added to queue, queue size now {_job_queue.qsize()}")
    return job_id


def get_job_status(job_id: int) -> dict[str, Any] | None:
    """Fetch current job state from the database."""
    db = _SessionFactory()
    try:
        job = db.get(Job, job_id)
        if job is None:
            return None
        return {
            "id": job.id,
            "type": job.type,
            "status": job.status,
            "progress": job.progress,
            "input_json": job.input_json,
            "output_json": job.output_json,
            "error_message": job.error_message,
            "attempts": job.attempts,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "finished_at": job.finished_at.isoformat() if job.finished_at else None,
            "delay_until": job.delay_until.isoformat() if job.delay_until else None,
            "priority": job.priority,
            "dlq_reason": job.dlq_reason,
        }
    finally:
        db.close()


def cancel_job(job_id: int) -> bool:
    """Mark a queued job as cancelled (no-op if already running)."""
    db = _SessionFactory()
    try:
        job = db.get(Job, job_id)
        if job is None or job.status not in ("queued",):
            return False
        job.status = "cancelled"
        job.finished_at = datetime.now(timezone.utc)
        db.commit()
        return True
    finally:
        db.close()


def list_jobs(
    *,
    project_id: int | None = None,
    status: str | None = None,
    job_type: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """List jobs with optional filters."""
    db = _SessionFactory()
    try:
        q = db.query(Job)
        if project_id is not None:
            q = q.filter(Job.project_id == project_id)
        if status is not None:
            q = q.filter(Job.status == status)
        if job_type is not None:
            q = q.filter(Job.type == job_type)
        jobs = q.order_by(Job.id.desc()).limit(limit).all()
        return [
            {
                "id": j.id,
                "type": j.type,
                "status": j.status,
                "progress": j.progress,
                "storage_object_id": j.storage_object_id,
                "project_id": j.project_id,
                "commit_id": j.commit_id,
                "created_by_id": j.created_by_id,
                "created_at": j.created_at.isoformat() if j.created_at else None,
                "finished_at": j.finished_at.isoformat() if j.finished_at else None,
                "dlq_reason": j.dlq_reason,
            }
            for j in jobs
        ]
    finally:
        db.close()


# ── Internal worker ─────────────────────────────────────────────────────


def _run_job(job_id: int) -> None:
    """Execute a job in a background thread."""
    print(f"DEBUG: _run_job called for job {job_id}")
    db = _SessionFactory()
    try:
        job = db.get(Job, job_id)
        print(f"DEBUG: Retrieved job {job_id}, status={job.status if job else 'None'}")
        if job is None:
            logger.warning("Job %d not found", job_id)
            return

        if job.status == "cancelled":
            print(f"DEBUG: Job {job_id} is cancelled, returning")
            return

        # Skip delayed jobs - they should be processed by a delay checker
        if job.status == "delayed":
            print(f"DEBUG: Job {job_id} is delayed, returning")
            return

        handler = _HANDLERS.get(job.type)
        print(f"DEBUG: Handler for job {job_id} type {job.type}: {handler}")
        if handler is None:
            job.status = "dlq"
            job.dlq_reason = "no_handler"
            job.error_message = f"No handler for job type {job.type!r}"
            job.finished_at = datetime.now(timezone.utc)
            db.commit()
            return

        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        job.attempts += 1
        print(f"DEBUG: Setting job {job_id} to running")
        db.commit()

        try:
            result = handler(job, db)
            print(f"DEBUG: Handler for job {job_id} succeeded, result={result}")
            job.status = "completed"
            job.progress = 100
            job.output_json = result or {}
            job.finished_at = datetime.now(timezone.utc)

            # Persist results into domain models (DAW metadata, loudness, etc.)
            try:
                from .job_result_persistence import persist_job_result
                persist_job_result(job, result or {}, db)
            except Exception:
                logger.exception("Result persistence failed for job %d", job_id)

        except Exception as exc:
            print(f"DEBUG: Handler for job {job_id} failed: {exc}")
            logger.exception("Job %d failed", job_id)
            job.error_message = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
            if job.attempts >= job.max_attempts:
                # Move to DLQ
                job.status = "dlq"
                job.dlq_reason = "max_attempts_exceeded"
                job.finished_at = datetime.now(timezone.utc)
            else:
                # Retry: reset to queued
                job.status = "queued"
                job.progress = 0

        db.commit()
        print(f"DEBUG: Job {job_id} final status: {job.status}")

        # If we are retrying (i.e., we set status to queued above), then add to the priority queue.
        if job.status == "queued":
            global _insertion_order
            with _insertion_order_lock:
                _job_queue.put((job.priority, _insertion_order, job.id))
                _insertion_order += 1

        # Emit webhook events for job lifecycle (best-effort)
        try:
            from ..routers.integrations import dispatch_event
            event_data = {
                "job_id": job.id,
                "job_type": job.type,
                "status": job.status,
                "project_id": job.project_id,
                "commit_id": job.commit_id,
            }
            if job.status == "completed":
                dispatch_event("job.completed", event_data, job.created_by_id)
            elif job.status == "failed":
                event_data["error"] = (job.error_message or "")[:200]
                dispatch_event("job.failed", event_data, job.created_by_id)
        except Exception:
            pass  # Best-effort webhook delivery
    finally:
        db.close()
        print(f"DEBUG: _run_job finished for job {job_id}")


# ── Delay checker ───────────────────────────────────────────────────────
_delay_checker_running = False
_delay_checker_thread = None


def check_delayed_jobs():
    """Check for delayed jobs that are ready to be processed and move them to queued status.

    This function should be called periodically (e.g., every 10-30 seconds) to check
    for jobs whose delay has expired and move them from 'delayed' to 'queued' status.
    """
    db = _SessionFactory()
    try:
        # Find jobs that are delayed and whose delay has expired
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)

        delayed_jobs = db.query(Job).filter(
            Job.status == "delayed",
            Job.delay_until <= now
        ).all()

        promoted_count = 0
        for job in delayed_jobs:
            job.status = "queued"
            job.delay_until = None  # Clear the delay timestamp
            promoted_count += 1
            # Add the job to the priority queue so workers can pick it up
            global _insertion_order
            with _insertion_order_lock:
                _job_queue.put((job.priority, _insertion_order, job.id))
                _insertion_order += 1

        if promoted_count > 0:
            db.commit()
            logger.info(f"Promoted {promoted_count} delayed jobs to queued status")

        return promoted_count
    finally:
        db.close()


def _run_delay_checker_loop():
    global _delay_checker_running
    import logging
    logger = logging.getLogger(__name__)
    while _delay_checker_running:
        try:
            check_delayed_jobs()
        except Exception as e:
            logger.warning("Delay checker error: %s", e)
        time.sleep(10)


def start_delay_checker():
    global _delay_checker_running, _delay_checker_thread
    if not _delay_checker_running:
        _delay_checker_running = True
        _delay_checker_thread = threading.Thread(target=_run_delay_checker_loop, daemon=True)
        _delay_checker_thread.start()


# Start the delay checker thread when the module is loaded
start_delay_checker()


def enqueue_job_batch(
    jobs: List[Dict[str, Any]],
) -> List[int]:
    """Enqueue a batch of jobs and return their IDs.

    Args:
        jobs: List of job specifications, each a dict with keys:
            - job_type: str
            - storage_object_id: int | None
            - project_id: int | None
            - commit_id: int | None
            - version_id: int | None
            - session_id: int | None
            - input_json: dict[str, Any] | None
            - created_by_id: int | None
            - delay_seconds: int | None
            - priority: int (default 0)

    Returns:
        List of job IDs in the same order as the input.
    """
    db = _SessionFactory()
    try:
        job_ids = []
        for job_spec in jobs:
            job_type = job_spec["job_type"]
            if job_type not in _HANDLERS:
                raise ValueError(
                    f"Invalid job type {job_type!r}. "
                    f"Registered: {sorted(_HANDLERS)}"
                )

            # Validate priority (0-9, where 0 is highest)
            priority = job_spec.get("priority", 0)
            if not 0 <= priority <= 9:
                raise ValueError("Priority must be between 0 and 9")

            # Determine initial status based on delay
            status = "queued"
            delay_until = None
            delay_seconds = job_spec.get("delay_seconds")
            if delay_seconds is not None and delay_seconds > 0:
                # Job is delayed - it will be made available later by a delay checker
                status = "delayed"
                from datetime import datetime, timezone, timedelta
                delay_until = datetime.now(timezone.utc) + timedelta(seconds=delay_seconds)

            job = Job(
                type=job_type,
                status=status,
                storage_object_id=job_spec.get("storage_object_id"),
                project_id=job_spec.get("project_id"),
                commit_id=job_spec.get("commit_id"),
                version_id=job_spec.get("version_id"),
                session_id=job_spec.get("session_id"),
                input_json=job_spec.get("input_json") or {},
                created_by_id=job_spec.get("created_by_id"),
                delay_until=delay_until,
                priority=priority,
            )
            db.add(job)
            db.flush()  # Flush to get the ID without committing yet
            job_ids.append(job.id)

        db.commit()

        # Add non-delayed jobs to the priority queue for worker threads to pick up
        # Delayed jobs will be picked up by a delay checker process
        for i, job_spec in enumerate(jobs):
            job_type = job_spec["job_type"]
            priority = job_spec.get("priority", 0)
            delay_seconds = job_spec.get("delay_seconds")
            status = "queued"
            if delay_seconds is not None and delay_seconds > 0:
                status = "delayed"
            if status == "queued":
                job_id = job_ids[i]
                global _insertion_order
                with _insertion_order_lock:
                    _job_queue.put((priority, _insertion_order, job_id))
                    _insertion_order += 1

        return job_ids
    finally:
        db.close()
