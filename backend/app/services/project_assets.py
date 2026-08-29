"""
Project-aware asset management service.
Handles project dependencies, asset usage tracking, and context-aware recommendations.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta

from .. import models
from ..services.catalog import list_assets as list_marketplace_assets


def get_project_assets(
    db: Session,
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    filters: Optional[Dict[str, Any]] = None
) -> List[models.Deliverable]:
    """
    Get assets used in a specific project.
    Returns deliverables that are part of the project's file snapshots.
    """
    query = db.query(models.Deliverable).join(
        models.FileSnapshot,
        models.Deliverable.package_id == models.FileSnapshot.content_hash
    ).join(
        models.Commit,
        models.FileSnapshot.commit_id == models.Commit.id
    ).filter(
        models.Commit.project_id == project_id
    ).distinct(models.Deliverable.id)

    # Apply filters if provided
    if filters:
        if filters.get('license'):
            query = query.filter(models.Deliverable.license == filters['license'])
        if filters.get('genre'):
            query = query.join(models.Package).filter(
                models.Package.genre == filters['genre']
            )
        if filters.get('key'):
            query = query.join(models.Package).filter(
                models.Package.key == filters['key']
            )
        if filters.get('format'):
            query = query.join(models.Package).filter(
                models.Package.format == filters['format']
            )
        if filters.get('plugin'):
            # Filter by package_type = "plugin" (VST/AU/etc plugins)
            query = query.join(models.Package).filter(
                models.Package.package_type == "plugin"
            )
        if filters.get('q'):
            search_term = f"%{filters['q']}%"
            query = query.join(models.Package).filter(
                or_(
                    models.Package.name.ilike(search_term),
                    models.Package.description.ilike(search_term)
                )
            )
        # Handle BPM range filtering
        if filters.get('bpmMin') is not None or filters.get('bpmMax') is not None:
            query = query.join(models.Package)
            if filters.get('bpmMin') is not None:
                try:
                    bpm_min = int(filters['bpmMin'])
                    query = query.filter(models.Package.bpm >= bpm_min)
                except ValueError:
                    pass  # Invalid value, ignore filter
            if filters.get('bpmMax') is not None:
                try:
                    bpm_max = int(filters['bpmMax'])
                    query = query.filter(models.Package.bpm <= bpm_max)
                except ValueError:
                    pass  # Invalid value, ignore filter

    return query.offset(skip).limit(limit).all()


def add_asset_to_project(
    db: Session,
    project_id: int,
    asset_id: int,
    user_id: int,
    commit_message: Optional[str] = None
) -> models.Commit:
    """
    Add an asset to a project by creating a commit that references the asset.
    This simulates adding the asset to the project files.
    """
    # Verify project exists and user has access
    project = db.query(models.Project).filter(
        and_(models.Project.id == project_id, models.Project.owner_id == user_id)
    ).first()
    if not project:
        raise ValueError("Project not found or access denied")

    # Verify asset exists
    asset = db.query(models.Deliverable).filter(
        models.Deliverable.id == asset_id
    ).first()
    if not asset:
        raise ValueError("Asset not found")

    # Get the latest commit on the main branch
    latest_commit = db.query(models.Commit).filter(
        models.Commit.project_id == project_id
    ).order_by(desc(models.Commit.created_at)).first()

    # Create a new commit (in real implementation, this would involve actual file changes)
    # For now, we'll create a commit that references the asset usage
    commit_msg = commit_message or f"Add asset: {asset.package.name}"

    new_commit = models.Commit(
        project_id=project_id,
        branch_id=latest_commit.branch_id if latest_commit else None,
        message=commit_msg,
        author_id=user_id
    )

    db.add(new_commit)
    db.flush()

    # Create file snapshot linking to the asset
    # In a real implementation, this would be the actual file path in the project
    file_snapshot = models.FileSnapshot(
        commit_id=new_commit.id,
        file_path=f"assets/{asset.package.name}.wav",  # Placeholder path
        content_hash=str(asset.package.id),  # Link to package ID
        size=0  # Would be actual file size
    )

    db.add(file_snapshot)
    db.commit()
    db.refresh(new_commit)

    return new_commit


def remove_asset_from_project(
    db: Session,
    project_id: int,
    asset_id: int,
    user_id: int
) -> bool:
    """
    Remove an asset from a project by creating a commit that removes the asset reference.
    """
    # Verify project exists and user has access
    project = db.query(models.Project).filter(
        and_(models.Project.id == project_id, models.Project.owner_id == user_id)
    ).first()
    if not project:
        raise ValueError("Project not found or access denied")

    # Verify asset exists in project
    asset_usage = db.query(models.FileSnapshot).join(
        models.Deliverable,
        models.FileSnapshot.content_hash == models.Deliverable.package_id
    ).join(
        models.Commit,
        models.FileSnapshot.commit_id == models.Commit.id
    ).filter(
        and_(
            models.Commit.project_id == project_id,
            models.Deliverable.id == asset_id
        )
    ).first()

    if not asset_usage:
        return False  # Asset not found in project

    # Get the latest commit on the main branch
    latest_commit = db.query(models.Commit).filter(
        models.Commit.project_id == project_id
    ).order_by(desc(models.Commit.created_at)).first()

    # Create a new commit that removes the asset
    asset = db.query(models.Deliverable).filter(
        models.Deliverable.id == asset_id
    ).first()
    commit_msg = f"Remove asset: {asset.package.name}"

    new_commit = models.Commit(
        project_id=project_id,
        branch_id=latest_commit.branch_id if latest_commit else None,
        message=commit_msg,
        author_id=user_id
    )

    db.add(new_commit)
    db.flush()

    # Create file snapshot indicating removal (negative size or special marker)
    file_snapshot = models.FileSnapshot(
        commit_id=new_commit.id,
        file_path=f"assets/{asset.package.name}.wav",
        content_hash="",  # Empty hash indicates removal
        size=0
    )

    db.add(file_snapshot)
    db.commit()
    return True


def get_context_aware_recommendations(
    db: Session,
    project_id: int,
    limit: int = 20
) -> List[models.Package]:
    """
    Get context-aware asset recommendations based on project metadata.
    Analyzes project's existing assets to recommend similar ones.
    """
    # Get project's existing assets to understand context
    project_assets = get_project_assets(db, project_id, limit=50)

    if not project_assets:
        # If no assets in project, return popular marketplace items
        return list_marketplace_assets(
            db,
            limit=limit,
            sort_by="popular"
        )

    # Extract metadata from project's assets
    asset_ids = [asset.package.id for asset in project_assets]

    # Get detailed info about project's assets
    project_packages = db.query(models.Package).filter(
        models.Package.id.in_(asset_ids)
    ).all()

    # Analyze common characteristics
    genres = []
    keys = []
    bpms = []
    licenses = set()

    for pkg in project_packages:
        if pkg.genres:
            genres.extend(pkg.genres)
        if pkg.key:
            keys.append(pkg.key)
        if hasattr(pkg, 'bpm') and pkg.bpm:
            bpms.append(pkg.bpm)
        if pkg.license:
            licenses.add(pkg.license)

    # Determine most common characteristics
    from collections import Counter
    top_genre = Counter(genres).most_common(1)[0][0] if genres else None
    top_key = Counter(keys).most_common(1)[0][0] if keys else None
    avg_bpm = sum(bpms) / len(bpms) if bpms else None
    top_license = Counter(licenses).most_common(1)[0][0] if licenses else None

    # Build filters for recommendation
    filters = {}
    if top_genre:
        filters['genre'] = top_genre
    if top_key:
        filters['key'] = top_key
    if avg_bpm:
        # Create BPM range around average
        filters['bpmMin'] = str(max(60, int(avg_bpm) - 10))
        filters['bpmMax'] = str(int(avg_bpm) + 10)
    if top_license:
        filters['license'] = str(top_license)

    # Exclude assets already in project
    # In a real implementation, we'd filter out asset_ids
    # For now, we'll just get recommendations and let deduplication happen elsewhere

    return list_marketplace_assets(
        db,
        filters=filters if filters else None,
        limit=limit
    )


def check_asset_licenses_for_release(
    db: Session,
    project_id: int
) -> Dict[str, Any]:
    """
    Check if all assets in a project have valid licenses for release.
    Returns validation results with any issues.
    """
    project_assets = get_project_assets(db, project_id, limit=1000)  # Get all assets

    issues = []
    warnings = []
    asset_details = []

    # Define licenses that permit commercial use
    COMMERCIAL_LICENSES = {
        "cc0", "cc-by", "cc-by-sa", "cc-by-nc", "cc-by-nd",
        "cc-by-nc-sa", "cc-by-nc-nd", "gpl", "lgpl", "mit",
        "apache-2.0", "bsd", "isc", "mozilla", "epl",
        "royalty-free", "standard", "extended"
    }

    # Define licenses that require warnings (restrictive but may allow commercial with conditions)
    WARNING_LICENSES = {
        "proprietary", "all-rights-reserved", "custom"
    }

    for asset in project_assets:
        package = asset.package
        license_info = {
            "asset_id": asset.id,
            "asset_name": package.name,
            "license_id": package.license,
            "status": "valid",
            "issues": []
        }

        # Check if license exists and is valid
        if not package.license:
            license_info["status"] = "invalid"
            license_info["issues"].append("No license assigned")
            issues.append(f"Asset '{package.name}' has no license")
        else:
            license_lower = package.license.lower()
            if license_lower in WARNING_LICENSES:
                # License requires warning
                license_info["status"] = "warning"
                license_info["issues"].append("License may have restrictions - review terms")
                warnings.append(f"Asset '{package.name}' has license '{package.license}' which may have restrictions")
            elif license_lower not in COMMERCIAL_LICENSES:
                # License not in commercial licenses list
                license_info["status"] = "invalid"
                license_info["issues"].append(f"License '{package.license}' does not permit commercial use")
                issues.append(f"Asset '{package.name}' has license '{package.license}' which does not permit commercial use")
            # else: license is valid (keep status as "valid", no issues added)

        asset_details.append(license_info)

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "asset_details": asset_details,
        "total_assets": len(project_assets),
        "checked_at": datetime.utcnow().isoformat()
    }


def get_asset_usage_stats(
    db: Session,
    project_id: int
) -> Dict[str, Any]:
    """
    Get statistics about asset usage in a project.
    """
    project_assets = get_project_assets(db, project_id, limit=1000)

    # Group by license type
    license_counts = {}
    for asset in project_assets:
        license_id = asset.package.license
        license_counts[license_id] = license_counts.get(license_id, 0) + 1

    # Get unique assets (by package)
    unique_packages = set(asset.package_id for asset in project_assets)

    return {
        "total_asset_instances": len(project_assets),
        "unique_assets": len(unique_packages),
        "license_breakdown": license_counts,
        "most_used_asset": max(
            [(asset.package_id, asset.package.name) for asset in project_assets],
            key=lambda x: sum(1 for a in project_assets if a.package_id == x[0])
        )[1] if project_assets else None
    }