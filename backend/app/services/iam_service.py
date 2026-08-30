"""IAM Service — Identity and Access Management (analogous to AWS IAM).

Provides:
- Fine-grained roles with attached policies
- Role assignments to users and API keys
- Permission checking for API operations
- Audit logging for all security events

Usage:
    from .services.iam_service import (
        create_role, attach_policy, assign_role, check_permission, get_audit_log
    )
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from ..models import (
    IamRole,
    IamPolicy,
    IamRoleAssignment,
    AuditLog,
    utcnow,
)

logger = logging.getLogger(__name__)

# ── Built-in system roles ─────────────────────────────────────────────

SYSTEM_ROLES = {
    "admin": {
        "description": "Full access to all resources",
        "policies": [{"effect": "Allow", "service": "*", "actions": "*", "resources": "*"}],
    },
    "owner": {
        "description": "Full access to owned projects",
        "policies": [{"effect": "Allow", "service": "*", "actions": "*", "resources": "*"}],
    },
    "collaborator": {
        "description": "Read/write access to assigned projects",
        "policies": [
            {"effect": "Allow", "service": "projects", "actions": "read,write", "resources": "*"},
            {"effect": "Allow", "service": "jobs", "actions": "read,create", "resources": "*"},
            {"effect": "Allow", "service": "storage", "actions": "read,upload", "resources": "*"},
        ],
    },
    "viewer": {
        "description": "Read-only access to projects",
        "policies": [
            {"effect": "Allow", "service": "*", "actions": "read", "resources": "*"},
        ],
    },
    "api_consumer": {
        "description": "Access via API key for external integrations",
        "policies": [
            {"effect": "Allow", "service": "projects", "actions": "read", "resources": "*"},
            {"effect": "Allow", "service": "jobs", "actions": "read,create", "resources": "*"},
        ],
    },
}


def init_system_roles(db: Session) -> int:
    """Initialize built-in system roles if they don't exist."""
    created = 0
    for role_name, role_def in SYSTEM_ROLES.items():
        existing = db.query(IamRole).filter(IamRole.name == role_name).first()
        if not existing:
            role = IamRole(name=role_name, description=role_def["description"], is_system=True)
            db.add(role)
            db.flush()

            for policy_def in role_def["policies"]:
                policy = IamPolicy(
                    role_id=role.id,
                    effect=policy_def["effect"],
                    service=policy_def["service"],
                    actions=policy_def["actions"],
                    resources=policy_def["resources"],
                )
                db.add(policy)

            created += 1

    if created > 0:
        db.commit()
    return created


# ── Role CRUD ─────────────────────────────────────────────────────────


def create_role(
    db: Session,
    name: str,
    description: str = "",
    owner_id: int | None = None,
) -> dict[str, Any]:
    """Create a custom IAM role."""
    existing = db.query(IamRole).filter(IamRole.name == name).first()
    if existing:
        raise ValueError(f"Role '{name}' already exists")

    role = IamRole(name=name, description=description, owner_id=owner_id)
    db.add(role)
    db.commit()
    db.refresh(role)
    return {"id": role.id, "name": role.name, "is_system": role.is_system}


def delete_role(db: Session, role_id: int) -> bool:
    """Delete a role (cannot delete system roles)."""
    role = db.get(IamRole, role_id)
    if not role or role.is_system:
        return False
    db.delete(role)
    db.commit()
    return True


def get_role(db: Session, role_id: int) -> dict[str, Any] | None:
    """Get role details with policies."""
    role = db.get(IamRole, role_id)
    if not role:
        return None
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "is_system": role.is_system,
        "policies": [
            {
                "id": p.id,
                "effect": p.effect,
                "service": p.service,
                "actions": p.actions,
                "resources": p.resources,
            }
            for p in role.policies
        ],
        "created_at": role.created_at.isoformat(),
    }


def list_roles(db: Session, include_system: bool = True, limit: int = 50) -> list[dict[str, Any]]:
    """List all roles."""
    q = db.query(IamRole)
    if not include_system:
        q = q.filter(IamRole.is_system == False)
    roles = q.order_by(IamRole.id).limit(limit).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "is_system": r.is_system,
            "policy_count": len(r.policies),
            "assignment_count": len(r.assignments),
        }
        for r in roles
    ]


# ── Policies ──────────────────────────────────────────────────────────


def attach_policy(
    db: Session,
    role_id: int,
    effect: str,
    service: str,
    actions: str,
    resources: str = "*",
    conditions: dict | None = None,
) -> dict[str, Any]:
    """Attach a permission policy to a role."""
    role = db.get(IamRole, role_id)
    if not role:
        raise ValueError(f"Role {role_id} not found")
    if role.is_system:
        raise ValueError("Cannot modify system roles")

    if effect not in ("Allow", "Deny"):
        raise ValueError("Effect must be 'Allow' or 'Deny'")

    policy = IamPolicy(
        role_id=role_id,
        effect=effect,
        service=service,
        actions=actions,
        resources=resources,
        conditions=conditions,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return {"id": policy.id, "effect": effect, "service": service, "actions": actions}


def detach_policy(db: Session, policy_id: int) -> bool:
    """Remove a policy from a role."""
    policy = db.get(IamPolicy, policy_id)
    if not policy:
        return False
    role = db.get(IamRole, policy.role_id)
    if role and role.is_system:
        return False
    db.delete(policy)
    db.commit()
    return True


# ── Role Assignments ──────────────────────────────────────────────────


def assign_role(
    db: Session,
    role_id: int,
    principal_type: str,
    principal_id: int,
    scope: str = "global",
) -> dict[str, Any]:
    """Assign a role to a user, API key, or service."""
    role = db.get(IamRole, role_id)
    if not role:
        raise ValueError(f"Role {role_id} not found")

    if principal_type not in ("user", "api_key", "service"):
        raise ValueError("Principal type must be 'user', 'api_key', or 'service'")

    # Check for duplicate assignment
    existing = (
        db.query(IamRoleAssignment)
        .filter(
            IamRoleAssignment.role_id == role_id,
            IamRoleAssignment.principal_type == principal_type,
            IamRoleAssignment.principal_id == principal_id,
            IamRoleAssignment.scope == scope,
        )
        .first()
    )
    if existing:
        return {"id": existing.id, "role": role.name, "already_assigned": True}

    assignment = IamRoleAssignment(
        role_id=role_id,
        principal_type=principal_type,
        principal_id=principal_id,
        scope=scope,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return {"id": assignment.id, "role": role.name, "principal_type": principal_type, "scope": scope}


def unassign_role(db: Session, assignment_id: int) -> bool:
    """Remove a role assignment."""
    assignment = db.get(IamRoleAssignment, assignment_id)
    if not assignment:
        return False
    db.delete(assignment)
    db.commit()
    return True


def list_role_assignments(
    db: Session,
    principal_type: str | None = None,
    principal_id: int | None = None,
) -> list[dict[str, Any]]:
    """List role assignments."""
    q = db.query(IamRoleAssignment)
    if principal_type:
        q = q.filter(IamRoleAssignment.principal_type == principal_type)
    if principal_id is not None:
        q = q.filter(IamRoleAssignment.principal_id == principal_id)

    assignments = q.all()
    return [
        {
            "id": a.id,
            "role_id": a.role_id,
            "principal_type": a.principal_type,
            "principal_id": a.principal_id,
            "scope": a.scope,
        }
        for a in assignments
    ]


# ── Permission Checking ───────────────────────────────────────────────


def check_permission(
    db: Session,
    principal_type: str,
    principal_id: int,
    service: str,
    action: str,
    resource: str = "*",
    scope: str | None = None,
) -> dict[str, Any]:
    """Check if a principal has permission for a specific action.

    Returns {"allowed": bool, "role": str, "policy": dict}
    """
    # Get all role assignments for this principal
    assignments = (
        db.query(IamRoleAssignment)
        .filter(
            IamRoleAssignment.principal_type == principal_type,
            IamRoleAssignment.principal_id == principal_id,
        )
        .all()
    )

    if not assignments:
        return {"allowed": False, "reason": "No roles assigned"}

    # Check each assignment's policies
    for assignment in assignments:
        # Scope check
        if scope and assignment.scope != "global" and assignment.scope != scope:
            continue

        role = db.get(IamRole, assignment.role_id)
        if not role:
            continue

        for policy in role.policies:
            if _policy_matches(policy, service, action, resource):
                if policy.effect == "Deny":
                    return {"allowed": False, "role": role.name, "policy": _policy_to_dict(policy), "reason": "Explicit deny"}
                if policy.effect == "Allow":
                    return {"allowed": True, "role": role.name, "policy": _policy_to_dict(policy)}

    return {"allowed": False, "reason": "No matching Allow policy found"}


def _policy_matches(policy: IamPolicy, service: str, action: str, resource: str) -> bool:
    """Check if a policy matches a permission request."""
    # Service match
    if policy.service != "*" and policy.service != service:
        return False

    # Action match
    if policy.actions != "*":
        allowed_actions = [a.strip() for a in policy.actions.split(",")]
        if action not in allowed_actions:
            return False

    # Resource match
    if policy.resources != "*":
        allowed_resources = [r.strip() for r in policy.resources.split(",")]
        if resource not in allowed_resources and resource != "*":
            return False

    return True


def _policy_to_dict(policy: IamPolicy) -> dict:
    """Convert a policy to a dict."""
    return {
        "effect": policy.effect,
        "service": policy.service,
        "actions": policy.actions,
        "resources": policy.resources,
    }


# ── Audit Logging ─────────────────────────────────────────────────────


def log_audit_event(
    db: Session,
    event_type: str,
    actor_id: int | None = None,
    actor_type: str = "user",
    target_type: str = "",
    target_id: int | None = None,
    detail: dict | None = None,
    ip_address: str = "",
    user_agent: str = "",
) -> dict[str, Any]:
    """Record an audit log entry."""
    entry = AuditLog(
        event_type=event_type,
        actor_id=actor_id,
        actor_type=actor_type,
        target_type=target_type,
        target_id=target_id,
        detail=detail,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": entry.id, "event_type": event_type}


def get_audit_log(
    db: Session,
    event_type: str | None = None,
    actor_id: int | None = None,
    target_type: str | None = None,
    target_id: int | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    """Query audit log entries."""
    q = db.query(AuditLog)
    if event_type:
        q = q.filter(AuditLog.event_type == event_type)
    if actor_id is not None:
        q = q.filter(AuditLog.actor_id == actor_id)
    if target_type:
        q = q.filter(AuditLog.target_type == target_type)
    if target_id is not None:
        q = q.filter(AuditLog.target_id == target_id)

    entries = q.order_by(AuditLog.id.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "actor_id": e.actor_id,
            "actor_type": e.actor_type,
            "target_type": e.target_type,
            "target_id": e.target_id,
            "detail": e.detail,
            "ip_address": e.ip_address,
            "created_at": e.created_at.isoformat(),
        }
        for e in entries
    ]
