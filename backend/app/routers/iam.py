"""IAM API — Identity and Access Management (analogous to AWS IAM).

Endpoints:
    POST   /api/iam/roles                    Create role
    GET    /api/iam/roles                    List roles
    GET    /api/iam/roles/{id}               Get role with policies
    DELETE /api/iam/roles/{id}               Delete role
    POST   /api/iam/roles/{id}/policies      Attach policy
    DELETE /api/iam/policies/{id}            Detach policy
    POST   /api/iam/roles/{id}/assign        Assign role to principal
    DELETE /api/iam/assignments/{id}         Remove assignment
    GET    /api/iam/assignments              List assignments
    POST   /api/iam/check-permission         Check permission
    POST   /api/iam/audit                    Query audit log
    POST   /api/iam/init-system-roles        Initialize system roles
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..security import get_current_user
from ..services import iam_service as svc

router = APIRouter(prefix="/api/iam", tags=["iam", "access-control"])


# ── Request Models ────────────────────────────────────────────────────


class RoleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    description: str = Field(default="", max_length=2000)


class PolicyAttach(BaseModel):
    effect: str = Field(..., description="Allow | Deny")
    service: str = Field(..., description="projects | jobs | storage | workflows | ...")
    actions: str = Field(..., description="Comma-separated: read,write,delete")
    resources: str = Field(default="*", description="Wildcard or resource IDs")
    conditions: Optional[dict] = None


class RoleAssign(BaseModel):
    principal_type: str = Field(..., description="user | api_key | service")
    principal_id: int
    scope: str = Field(default="global", description="global | project:42")


class PermissionCheck(BaseModel):
    principal_type: str
    principal_id: int
    service: str
    action: str
    resource: str = "*"
    scope: Optional[str] = None


class AuditQuery(BaseModel):
    event_type: Optional[str] = None
    actor_id: Optional[int] = None
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    limit: int = Field(default=100, ge=1, le=10000)


# ── Role Endpoints ────────────────────────────────────────────────────


@router.post("/roles", status_code=status.HTTP_201_CREATED)
def create_role(body: RoleCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return svc.create_role(db, body.name, body.description, owner_id=user.id)
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.get("/roles")
def list_roles(include_system: bool = True, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"roles": svc.list_roles(db, include_system)}


@router.get("/roles/{role_id}")
def get_role(role_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role = svc.get_role(db, role_id)
    if not role:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    return role


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not svc.delete_role(db, role_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete system role or role not found")


# ── Policy Endpoints ──────────────────────────────────────────────────


@router.post("/roles/{role_id}/policies", status_code=status.HTTP_201_CREATED)
def attach_policy(role_id: int, body: PolicyAttach, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return svc.attach_policy(db, role_id, body.effect, body.service, body.actions, body.resources, body.conditions)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.delete("/policies/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def detach_policy(policy_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not svc.detach_policy(db, policy_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Policy not found")


# ── Role Assignment Endpoints ─────────────────────────────────────────


@router.post("/roles/{role_id}/assign")
def assign_role(role_id: int, body: RoleAssign, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return svc.assign_role(db, role_id, body.principal_type, body.principal_id, body.scope)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def unassign_role(assignment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not svc.unassign_role(db, assignment_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assignment not found")


@router.get("/assignments")
def list_role_assignments(
    principal_type: Optional[str] = None,
    principal_id: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"assignments": svc.list_role_assignments(db, principal_type, principal_id)}


# ── Permission Check ──────────────────────────────────────────────────


@router.post("/check-permission")
def check_permission(body: PermissionCheck, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Check if a principal has permission for a specific action."""
    return svc.check_permission(
        db, body.principal_type, body.principal_id, body.service, body.action, body.resource, body.scope
    )


# ── Audit Log ─────────────────────────────────────────────────────────


@router.post("/audit")
def query_audit_log(body: AuditQuery, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Query the audit log."""
    entries = svc.get_audit_log(db, body.event_type, body.actor_id, body.target_type, body.target_id, body.limit)
    return {"entries": entries, "count": len(entries)}


# ── System Init ───────────────────────────────────────────────────────


@router.post("/init-system-roles")
def init_system_roles(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Initialize built-in system roles (admin, owner, collaborator, viewer, api_consumer)."""
    created = svc.init_system_roles(db)
    return {"created": created, "message": f"Initialized {created} system roles"}
