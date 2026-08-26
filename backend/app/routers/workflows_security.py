"""Workflows + Dependabot + Security Advisories + GraphQL endpoint."""
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SecurityAlert, Workflow, WorkflowRun, Project, User, utcnow
from ..schemas import WorkflowUpdate
from ..security import get_current_user

router = APIRouter(tags=["workflows, security, graphql"])


# ── Workflows ───────────────────────────────────────────────────────────────

@router.get("/api/projects/{pid}/workflows")
def list_workflows(pid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.get(Project, pid)
    if project is None or project.owner_id != user.id:
        raise HTTPException(404, "Not found")
    wfs = db.scalars(select(Workflow).where(Workflow.project_id == pid)).all()
    return [{"id": w.id, "name": w.name, "filename": w.filename, "enabled": w.enabled, "created_at": w.created_at.isoformat()} for w in wfs]


class WorkflowCreate(BaseModel):
    name: str
    filename: str = ".soundhub/workflow.yml"
    yaml_content: str = ""
    enabled: bool = True

@router.post("/api/projects/{pid}/workflows", status_code=201)
def create_workflow(pid: int, payload: WorkflowCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.get(Project, pid)
    if project is None or project.owner_id != user.id:
        raise HTTPException(404, "Not found")
    wf = Workflow(project_id=pid, name=payload.name, filename=payload.filename, yaml_content=payload.yaml_content, enabled=payload.enabled)
    db.add(wf)
    db.commit()
    return {"id": wf.id, "name": wf.name}


@router.get("/api/projects/{pid}/workflows/{wid}/runs")
def list_runs(pid: int, wid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    runs = db.scalars(select(WorkflowRun).where(WorkflowRun.workflow_id == wid).order_by(WorkflowRun.created_at.desc()).limit(20)).all()
    return [{"id": r.id, "status": r.status, "trigger": r.trigger, "duration_ms": r.duration_ms, "created_at": r.created_at.isoformat(), "completed_at": r.completed_at.isoformat() if r.completed_at else None} for r in runs]


@router.post("/api/projects/{pid}/workflows/{wid}/trigger", status_code=201)
def trigger_workflow(pid: int, wid: int, trigger: str = "manual", user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wf = db.get(Workflow, wid)
    if wf is None or wf.project_id != pid:
        raise HTTPException(404, "Workflow not found")
    run = WorkflowRun(
        workflow_id=wid,
        status="queued",
        trigger=trigger,
        logs="Workflow triggered and queued for execution\n",
    )
    db.add(run)
    db.flush()
    run_id = run.id

    # Enqueue the workflow execution job
    from ..services import job_queue
    job_queue.enqueue_job(
        "execute_workflow",
        input_json={"workflow_id": wid, "run_id": run_id},
        created_by_id=user.id,
        delay_seconds=None,
        priority=0,
    )

    db.commit()
    return {"id": run.id, "status": run.status}


@router.patch("/api/projects/{pid}/workflows/{wid}/runs/{rid}")
def update_run_status(pid: int, wid: int, rid: int, status_val: str = Query(..., alias="status"), duration_ms: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    run = db.get(WorkflowRun, rid)
    if run is None or run.workflow_id != wid:
        raise HTTPException(404, "Not found")
    run.status = status_val
    if duration_ms is not None:
        run.duration_ms = duration_ms
    if status_val in ("success", "failure", "cancelled"):
        run.completed_at = utcnow()
    db.commit()
    return {"ok": True, "status": run.status}


# ── Workflow Management Endpoints ────────────────────────────────────────────

@router.get("/api/projects/{pid}/workflows/{wid}")
def get_workflow(pid: int, wid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wf = db.get(Workflow, wid)
    if wf is None or wf.project_id != pid:
        raise HTTPException(404, "Workflow not found")
    return {"id": wf.id, "name": wf.name, "filename": wf.filename, "yaml_content": wf.yaml_content, "enabled": wf.enabled, "created_at": wf.created_at.isoformat(), "updated_at": wf.updated_at.isoformat()}


@router.put("/api/projects/{pid}/workflows/{wid}")
def update_workflow(pid: int, wid: int, payload: WorkflowUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wf = db.get(Workflow, wid)
    if wf is None or wf.project_id != pid:
        raise HTTPException(404, "Workflow not found")
    if payload.name is not None:
        wf.name = payload.name
    if payload.filename is not None:
        wf.filename = payload.filename
    if payload.yaml_content is not None:
        wf.yaml_content = payload.yaml_content
    if payload.enabled is not None:
        wf.enabled = payload.enabled
    wf.updated_at = utcnow()
    db.commit()
    return {"id": wf.id, "name": wf.name}


@router.delete("/api/projects/{pid}/workflows/{wid}")
def delete_workflow(pid: int, wid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wf = db.get(Workflow, wid)
    if wf is None or wf.project_id != pid:
        raise HTTPException(404, "Workflow not found")
    db.delete(wf)
    db.commit()
    return {"id": wid}


@router.post("/api/projects/{pid}/workflows/{wid}/runs/{runId}/cancel")
def cancel_workflow_run(pid: int, wid: int, runId: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    run = db.get(WorkflowRun, runId)
    if run is None or run.workflow_id != wid:
        raise HTTPException(404, "Workflow run not found")
    if run.status in ("success", "failure", "cancelled"):
        raise HTTPException(400, "Cannot cancel completed workflow run")
    run.status = "cancelled"
    run.completed_at = utcnow()
    db.commit()
    return {"id": runId, "status": run.status}


@router.get("/api/projects/{pid}/workflows/{wid}/runs/{runId}/logs")
def get_workflow_run_logs(pid: int, wid: int, runId: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    run = db.get(WorkflowRun, runId)
    if run is None or run.workflow_id != wid:
        raise HTTPException(404, "Workflow run not found")
    return {"id": run.id, "logs": run.logs}


# ── Dependabot / Security Alerts ────────────────────────────────────────────

@router.get("/api/projects/{pid}/security-alerts")
def list_security_alerts(pid: int, status_filter: str | None = Query(None, alias="status"), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = select(SecurityAlert).where(SecurityAlert.project_id == pid)
    if status_filter:
        q = q.where(SecurityAlert.status == status_filter)
    alerts = db.scalars(q.order_by(SecurityAlert.created_at.desc())).all()
    return [{"id": a.id, "severity": a.severity, "title": a.title, "package": a.package_name, "status": a.status, "created_at": a.created_at.isoformat()} for a in alerts]


class AlertCreate(BaseModel):
    severity: str = "medium"
    title: str
    description: str = ""
    package_name: str = ""
    vulnerable_version: str = ""
    patched_version: str = ""

@router.post("/api/projects/{pid}/security-alerts", status_code=201)
def create_security_alert(pid: int, payload: AlertCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = SecurityAlert(project_id=pid, **payload.model_dump())
    db.add(a)
    db.commit()
    return {"id": a.id, "severity": a.severity}


@router.patch("/api/projects/{pid}/security-alerts/{aid}")
def update_alert(pid: int, aid: int, status_val: str = Query(..., alias="status"), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.get(SecurityAlert, aid)
    if a is None or a.project_id != pid:
        raise HTTPException(404, "Not found")
    a.status = status_val
    if status_val in ("fixed", "dismissed"):
        a.resolved_at = utcnow()
    db.commit()
    return {"ok": True, "status": a.status}


# ── GraphQL (simplified) ────────────────────────────────────────────────────

GRAPHQL_SCHEMA = {
    "query": {
        "project": "Project",
        "projects": "[Project]",
        "commit": "Commit",
        "branch": "Branch",
        "pullRequest": "PullRequest",
    },
    "types": {
        "Project": {"id": "Int!", "name": "String!", "slug": "String!", "description": "String!", "default_branch": "String!"},
        "Commit": {"id": "Int!", "message": "String!", "author": "User!", "created_at": "DateTime!"},
        "Branch": {"id": "Int!", "name": "String!", "is_default": "Boolean!"},
        "PullRequest": {"id": "Int!", "title": "String!", "status": "String!", "source_branch": "String!", "target_branch": "String!"},
        "User": {"id": "Int!", "username": "String!"},
        "DateTime": "scalar",
    },
}


@router.get("/api/graphql", response_class=HTMLResponse)
def graphql_playground():
    """GraphQL Playground (simplified)."""
    return """<!DOCTYPE html>
<html><head><title>SoundHub GraphQL</title>
<style>body{font-family:monospace;background:#1a1a2e;color:#e0e0e0;padding:20px;max-width:800px;margin:0 auto}
h1{color:#ff5e1a}pre{background:#0d0d1a;padding:16px;border-radius:8px;overflow-x:auto;font-size:13px}
code{color:#7fd08a}</style></head>
<body><h1>🎵 SoundHub GraphQL API</h1>
<p>Available at <code>GET /api/graphql/schema</code></p>
<p>Full GraphQL support coming soon. Use REST API at <code>/api/</code> for now.</p>
<h2>Schema:</h2>
<pre>""" + json.dumps(GRAPHQL_SCHEMA, indent=2) + """</pre>
</body></html>"""


@router.get("/api/graphql/schema")
def graphql_schema():
    return GRAPHQL_SCHEMA
