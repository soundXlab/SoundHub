"""Built-in job handlers — wrap existing services for background execution.

Import this module at startup to register all handlers:
    import app.services.job_handlers  # noqa: F401
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from .job_queue import register_handler

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from ..models import Job

logger = logging.getLogger(__name__)


# ── parse_daw ───────────────────────────────────────────────────────────


@register_handler("parse_daw")
def handle_parse_daw(job: "Job", db: "Session") -> dict:
    """Parse a DAW project file and extract metadata."""
    from .daw.registry import get_daw_info
    from . import storage

    if not job.storage_object_id:
        raise ValueError("storage_object_id required for parse_daw")

    from ..models import StorageObject

    obj = db.get(StorageObject, job.storage_object_id)
    if obj is None:
        raise ValueError(f"StorageObject {job.storage_object_id} not found")

    data = storage.read_blob(obj.sha256)
    result = get_daw_info(obj.original_filename, data)
    return {"parsed": True, "metadata": result}


# ── generate_waveform ───────────────────────────────────────────────────


@register_handler("generate_waveform")
def handle_generate_waveform(job: "Job", db: "Session") -> dict:
    """Generate waveform peak data for an audio blob."""
    from . import waveform
    from . import storage

    input_data = job.input_json or {}
    sha = input_data.get("sha256")
    filename = input_data.get("filename", "audio.wav")
    audio_format = input_data.get("format", "wav")

    if not sha and job.storage_object_id:
        from ..models import StorageObject

        obj = db.get(StorageObject, job.storage_object_id)
        if obj:
            sha = obj.sha256
            filename = obj.original_filename or filename

    if not sha:
        raise ValueError("sha256 required (via input_json or storage_object_id)")

    data = storage.read_blob(sha)
    result = waveform.generate(sha, data, filename, audio_format)
    return result


# ── analyze_loudness ────────────────────────────────────────────────────


@register_handler("analyze_loudness")
def handle_analyze_loudness(job: "Job", db: "Session") -> dict:
    """Run loudness analysis (LUFS, True Peak, sample rate, channels)."""
    from . import loudness
    from . import storage

    input_data = job.input_json or {}
    sha = input_data.get("sha256")

    if not sha and job.storage_object_id:
        from ..models import StorageObject

        obj = db.get(StorageObject, job.storage_object_id)
        if obj:
            sha = obj.sha256

    if not sha:
        raise ValueError("sha256 required")

    data = storage.read_blob(sha)
    result = loudness.analyse(data)
    return result


# ── extract_audio_metadata ──────────────────────────────────────────────


@register_handler("extract_audio_metadata")
def handle_extract_audio_metadata(job: "Job", db: "Session") -> dict:
    """Extract audio metadata (sample rate, channels, duration, format)."""
    from . import storage

    input_data = job.input_json or {}
    sha = input_data.get("sha256")
    filename = input_data.get("filename", "")

    if not sha and job.storage_object_id:
        from ..models import StorageObject

        obj = db.get(StorageObject, job.storage_object_id)
        if obj:
            sha = obj.sha256
            filename = obj.original_filename or filename

    if not sha:
        raise ValueError("sha256 required")

    data = storage.read_blob(sha)

    # Basic metadata extraction
    result = {"sha256": sha, "size": len(data), "filename": filename}

    # Try WAV header parsing
    if data[:4] == b"RIFF" and data[8:12] == b"WAVE":
        import struct
        from io import BytesIO

        buf = BytesIO(data)
        buf.seek(12)
        while True:
            header = buf.read(8)
            if len(header) < 8:
                break
            cid, csize = struct.unpack("<4sI", header)
            if cid == b"fmt ":
                chunk = buf.read(csize)
                if len(chunk) >= 16:
                    af, channels, sr = struct.unpack("<HHI", chunk[:8])
                    bits = struct.unpack("<H", chunk[14:16])[0]
                    result.update({
                        "sample_rate": sr,
                        "channels": channels,
                        "bits": bits,
                        "audio_format": "wav",
                    })
            elif cid == b"data":
                sr = result.get("sample_rate", 44100)
                channels = result.get("channels", 1)
                bits = result.get("bits", 16)
                bytes_per_sample = bits // 8
                frame_size = bytes_per_sample * channels
                duration_s = csize / (sr * frame_size) if frame_size > 0 and sr > 0 else 0
                result["duration_s"] = round(duration_s, 2)
                break
            else:
                buf.seek(csize + (csize % 2), 1)

    return result


# ── transcode_audio ─────────────────────────────────────────────────────


@register_handler("transcode_audio")
def handle_transcode_audio(job: "Job", db: "Session") -> dict:
    """Transcode audio to a target format (placeholder — needs ffmpeg)."""
    from . import storage

    input_data = job.input_json or {}
    target_format = input_data.get("target_format", "wav")
    sha = input_data.get("sha256")

    if not sha and job.storage_object_id:
        from ..models import StorageObject

        obj = db.get(StorageObject, job.storage_object_id)
        if obj:
            sha = obj.sha256

    if not sha:
        raise ValueError("sha256 required")

    data = storage.read_blob(sha)

    # Placeholder: in production, use ffmpeg or pydub
    # For now, just store as-is
    new_sha = storage.put_blob(data)

    return {
        "source_sha256": sha,
        "output_sha256": new_sha,
        "target_format": target_format,
        "note": "Transcoding placeholder — implement with ffmpeg",
    }


# ── watermark_preview ───────────────────────────────────────────────────


@register_handler("watermark_preview")
def handle_watermark_preview(job: "Job", db: "Session") -> dict:
    """Generate a watermarked preview of an audio file."""
    from . import storage
    from .watermark import generate_watermark_key

    input_data = job.input_json or {}
    sha = input_data.get("sha256")
    version_id = job.version_id

    if not sha and job.storage_object_id:
        from ..models import StorageObject

        obj = db.get(StorageObject, job.storage_object_id)
        if obj:
            sha = obj.sha256

    if not sha:
        raise ValueError("sha256 required")

    data = storage.read_blob(sha)
    watermark_key = generate_watermark_key(version_id or 0)

    # Placeholder: in production, apply audible watermark
    watermarked_sha = storage.put_blob(data)

    return {
        "original_sha256": sha,
        "watermarked_sha256": watermarked_sha,
        "watermark_key": watermark_key,
        "note": "Watermarking placeholder — implement DSP",
    }


# ── execute_workflow ────────────────────────────────────────────────────

@register_handler("execute_workflow")
def handle_execute_workflow(job: "Job", db: "Session") -> dict:
    """Execute a workflow by running its steps as jobs.

    Expects job.input_json to contain:
        {
            "workflow_id": int,
            "run_id": int | None   # if provided, updates that run; else creates a new run
        }
    """
    from . import job_queue, storage
    from ..models import Workflow, WorkflowRun
    from datetime import datetime, timezone
    import yaml
    import time

    input_data = job.input_json or {}
    workflow_id = input_data.get("workflow_id")
    run_id = input_data.get("run_id")

    if not workflow_id:
        raise ValueError("workflow_id required for execute_workflow")

    # Get the workflow
    wf = db.get(Workflow, workflow_id)
    if not wf:
        raise ValueError(f"Workflow {workflow_id} not found")
    if not wf.enabled:
        raise ValueError(f"Workflow {workflow_id} is disabled")

    # Get or create the workflow run
    if run_id:
        run = db.get(WorkflowRun, run_id)
        if not run or run.workflow_id != workflow_id:
            raise ValueError(f"Workflow run {run_id} not found for workflow {workflow_id}")
    else:
        run = WorkflowRun(
            workflow_id=workflow_id,
            status="running",
            trigger="api",
            logs="Workflow execution started\n",
        )
        db.add(run)
        db.flush()
        run_id = run.id

    # Update run status to running
    run.status = "running"
    run.logs += f"Workflow execution started at {datetime.now(timezone.utc).isoformat()}\n"
    db.commit()

    # Parse workflow YAML
    try:
        workflow_def = yaml.safe_load(wf.yaml_content)
    except Exception as e:
        run.status = "failure"
        run.logs += f"Failed to parse workflow YAML: {e}\n"
        run.completed_at = datetime.now(timezone.utc)
        db.commit()
        raise

    steps = workflow_def.get("steps", [])
    if not isinstance(steps, list):
        run.status = "failure"
        run.logs += "Workflow 'steps' must be a list\n"
        run.completed_at = datetime.now(timezone.utc)
        db.commit()
        raise ValueError("Workflow 'steps' must be a list")

    # We'll execute each step in sequence
    step_job_ids = []
    for i, step in enumerate(steps):
        if not isinstance(step, dict):
            run.status = "failure"
            run.logs += f"Step {i} must be a dictionary\n"
            run.completed_at = datetime.now(timezone.utc)
            db.commit()
            raise ValueError(f"Step {i} must be a dictionary")

        step_name = step.get("name", f"step_{i}")
        job_type = step.get("job")
        job_input = step.get("input", {})

        if not job_type:
            run.status = "failure"
            run.logs += f"Step {i} ({step_name}) missing 'job' field\n"
            run.completed_at = datetime.now(timezone.utc)
            db.commit()
            raise ValueError(f"Step {i} ({step_name}) missing 'job' field")

        # Enqueue the job for this step
        try:
            step_job_id = job_queue.enqueue_job(
                job_type,
                input_json=job_input,
                created_by_id=job.created_by_id,  # use the same user who triggered the workflow
                delay_seconds=None,
                priority=0,
            )
            step_job_ids.append(step_job_id)
            run.logs += f"Enqueued step {i} ({step_name}) as job {step_job_id}\n"
            db.commit()
        except Exception as e:
            run.status = "failure"
            run.logs += f"Failed to enqueue step {i} ({step_name}): {e}\n"
            run.completed_at = datetime.now(timezone.utc)
            db.commit()
            raise

    # Wait for all step jobs to complete (with timeout)
    timeout_seconds = 300  # 5 minutes per step, but we'll wait for all with a total timeout
    start_time = time.time()
    completed = [False] * len(step_job_ids)
    failed = [False] * len(step_job_ids)
    step_results = [None] * len(step_job_ids)

    while time.time() - start_time < timeout_seconds:
        all_done = True
        for idx, job_id in enumerate(step_job_ids):
            if completed[idx]:
                continue
            job_status = job_queue.get_job_status(job_id)
            if job_status is None:
                # Job not found (should not happen)
                completed[idx] = True
                failed[idx] = True
                step_results[idx] = {"error": "Job not found"}
                continue

            status = job_status["status"]
            if status == "completed":
                completed[idx] = True
                step_results[idx] = job_status.get("output_json", {})
            elif status == "failed":
                completed[idx] = True
                failed[idx] = True
                step_results[idx] = {"error": job_status.get("error_message", "Unknown error")}
            elif status in ("queued", "running"):
                all_done = False
            else:  # cancelled
                completed[idx] = True
                failed[idx] = True
                step_results[idx] = {"error": "Job cancelled"}
        if all_done:
            break
        time.sleep(1)  # poll every second

    # Check results
    any_failed = False
    for idx, (job_id, is_completed, is_failed, result) in enumerate(zip(step_job_ids, completed, failed, step_results)):
        step_name = steps[idx].get("name", f"step_{idx}")
        if not is_completed:
            run.status = "failure"
            run.logs += f"Step {idx} ({step_name}) timed out\n"
            any_failed = True
            break
        if is_failed:
            run.status = "failure"
            run.logs += f"Step {idx} ({step_name}) failed: {result.get('error')}\n"
            any_failed = True
            break
        else:
            run.logs += f"Step {idx} ({step_name}) completed successfully\n"

    if not any_failed:
        run.status = "success"
        run.logs += "All workflow steps completed successfully\n"
    else:
        run.status = "failure"

    run.completed_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "workflow_id": workflow_id,
        "run_id": run_id,
        "status": run.status,
        "steps_total": len(steps),
        "steps_succeeded": sum(1 for i in range(len(steps)) if completed[i] and not failed[i]),
        "steps_failed": sum(1 for i in range(len(steps)) if failed[i]),
    }


# ── manage_storage_lifecycle ──────────────────────────────────────────────


@register_handler("manage_storage_lifecycle")
def handle_manage_storage_lifecycle(job: "Job", db: "Session") -> dict:
    """Manage storage lifecycle transitions for objects in a project.

    This job scans storage objects and moves them to appropriate storage tiers
    based on the project's storage lifecycle policy.
    """
    from . import storage
    from .policy import StorageTier, determine_storage_tier
    from datetime import datetime, timezone
    from sqlalchemy import select

    input_data = job.input_json or {}
    project_id = input_data.get("project_id")

    if not project_id:
        raise ValueError("project_id required for manage_storage_lifecycle")

    from ..models import Project, StorageObject

    # Get the project to retrieve its storage policy
    project = db.get(Project, project_id)
    if not project:
        raise ValueError(f"Project {project_id} not found")

    # Get all storage objects for this project
    storage_objects = db.scalars(
        select(StorageObject)
        .where(StorageObject.project_id == project_id)
        .where(StorageObject.status != "deleted")
    ).all()

    updated_count = 0
    current_timestamp = datetime.now(timezone.utc).timestamp()

    for obj in storage_objects:
        # Determine the appropriate tier based on the object's age and project policy
        tier = determine_storage_tier(
            created_timestamp=obj.created_at.timestamp(),
            current_timestamp=current_timestamp,
            hot_days=project.hot_days,
            warm_days=project.warm_days,
            cold_days=project.cold_days,
            enabled=project.storage_enabled
        )

        # If the tier has changed, update the object and move it in storage
        current_tier = StorageTier(obj.storage_tier)
        if tier != current_tier:
            # Update the database record
            obj.storage_tier = tier.value

            # Move the object in the storage backend
            try:
                storage_backend = storage.get_storage()
                storage_backend.set_tier(obj.sha256, tier)
                updated_count += 1
            except Exception as e:
                # Log the error but continue with other objects
                logger.warning(
                    f"Failed to set storage tier for object {obj.sha256}: {e}"
                )

    db.commit()

    return {
        "project_id": project_id,
        "objects_scanned": len(storage_objects),
        "objects_updated": updated_count,
        "policy": {
            "hot_days": project.hot_days,
            "warm_days": project.warm_days,
            "cold_days": project.cold_days,
            "enabled": project.storage_enabled
        }
    }
