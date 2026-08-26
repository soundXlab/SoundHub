"""SoundHub API — GitHub for music production projects."""
from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from .config import CORS_ORIGINS
from .database import get_db, init_db
from .routers import (
    activity,
    ai_mix,
    analytics,
    assets,
    storage as storage_router,
    jobs as jobs_router,
    audio_checks,
    auth,
    branch_protection,
    change_orders,
    codeowners_milestones,
    comparisons,
    dashboard,
    discussions,
    diffs,
    files,
    groups,
    integrations,
    kanban,
    metadata,
    notifications_social,
    notifications as notifications_router,
    packages_gist_sponsors,
    pins,
    portfolio,
    projects,
    pull_requests,
    references,
    release_packages,
    reminders,
    roles,
    search,
    secrets_envs,
    sessions,
    tags,
    tags_releases,
    tasks,
    templates,
    two_factor,
    webhooks,
    workflows_security,
    wiki_time_epics,
    gitlab_features,
    code_search_and_insights,
    pipelines_ci,
    test_plans,
    deployments_artifacts,
    agile_delivery,
    search_engine as search_engine_router,
    versions,
    demo,
    monitoring,
    compute,
    api_gateway,
    iam,
)

# GraphQL endpoint
from strawberry.fastapi import GraphQLRouter
from .graphql.schema import schema as graphql_schema

app = FastAPI(
    title="SoundHub API",
    description="Version control and collaboration for music production projects.",
    version="0.1.0",
)

# Initialize database tables on startup
@app.on_event("startup")
def _startup_db():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# API routes
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(branch_protection.router)
app.include_router(files.router)
app.include_router(diffs.router)
app.include_router(assets.router)
app.include_router(sessions.router)
app.include_router(demo.router)
app.include_router(change_orders.router)
app.include_router(release_packages.router)
app.include_router(comparisons.router)
app.include_router(portfolio.router)
app.include_router(references.router)
app.include_router(reminders.router)
app.include_router(roles.router)
app.include_router(search.router)
app.include_router(activity.router)
app.include_router(analytics.router)
app.include_router(templates.router)
app.include_router(tags.router)
app.include_router(groups.router)
app.include_router(pins.router)
app.include_router(webhooks.router)
app.include_router(metadata.router)
app.include_router(pull_requests.router)
app.include_router(tasks.router)
app.include_router(tags_releases.router)
app.include_router(audio_checks.router)
app.include_router(discussions.router)
app.include_router(kanban.router)
app.include_router(ai_mix.router)
app.include_router(dashboard.router)
app.include_router(integrations.router)
app.include_router(two_factor.router)
app.include_router(codeowners_milestones.router)
app.include_router(notifications_social.router)
app.include_router(secrets_envs.router)
app.include_router(packages_gist_sponsors.router)
app.include_router(workflows_security.router)
app.include_router(wiki_time_epics.router)
app.include_router(gitlab_features.router)
app.include_router(code_search_and_insights.router)
app.include_router(pipelines_ci.router)
app.include_router(test_plans.router)
app.include_router(deployments_artifacts.router)
app.include_router(agile_delivery.router)
app.include_router(search_engine_router.router)
app.include_router(versions.router)
app.include_router(storage_router.router)
app.include_router(jobs_router.router)
app.include_router(notifications_router.router)
app.include_router(monitoring.router)
app.include_router(compute.router)
app.include_router(api_gateway.router)
app.include_router(iam.router)

# Register background job handlers
from .services import job_handlers as _job_handlers  # noqa: F401

graphql_app = GraphQLRouter(graphql_schema)
app.include_router(graphql_app, prefix="/graphql")

# Serve static files (frontend build) - must come after API routes
# SPA fallback: serves index.html for unmatched frontend paths (React Router)
import os as _os
_static_dir = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "static")
if _os.path.isdir(_static_dir) and _os.path.isfile(_os.path.join(_static_dir, "index.html")):
    app.frontend("/", directory=_static_dir, fallback="index.html")
else:
    _dev_dist = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "..", "frontend", "dist")
    if _os.path.isdir(_dev_dist) and _os.path.isfile(_os.path.join(_dev_dist, "index.html")):
        app.frontend("/", directory=_dev_dist, fallback="index.html")
