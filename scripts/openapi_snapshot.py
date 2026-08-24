#!/usr/bin/env python3
"""
OpenAPI snapshot and diff tool for SoundHub FastAPI project.
Supports --update-baseline flag to intentionally refresh baseline.
"""
import json
import os
import sys
import subprocess
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path("/home/scatter/SoundHub")
BASELINE_PATH = REPO_ROOT / "openapi_baseline.json"
CURRENT_PATH = REPO_ROOT / "openapi_current.json"
DIFF_PATH = REPO_ROOT / "OPENAPI_DIFF.md"
SCRIPTS_DIR = REPO_ROOT / "scripts"

# Ensure we can import the app
sys.path.insert(0, str(REPO_ROOT / "backend"))

def import_app():
    try:
        from app.main import app  # type: ignore
        return app
    except Exception as e:
        print(f"Failed to import FastAPI app: {e}", file=sys.stderr)
        sys.exit(1)

def get_openapi_dict(app):
    try:
        openapi = app.openapi()
        if not isinstance(openapi, dict):
            raise ValueError("openapi() did not return a dict")
        return openapi
    except Exception as e:
        print(f"Failed to get OpenAPI schema: {e}", file=sys.stderr)
        sys.exit(1)

def serialize_openapi(openapi_dict):
    """Return a deterministic JSON string."""
    return json.dumps(openapi_dict, ensure_ascii=False, indent=2, sort_keys=True)

def write_json_file(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(serialize_openapi(data), encoding="utf-8")

def load_json_file(path):
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"Failed to load JSON from {path}: {e}", file=sys.stderr)
        return None

def git_is_dirty():
    """Return True if there are uncommitted changes (ignoring untracked files)."""
    try:
        result = subprocess.run(
            ["git", "diff-index", "--quiet", "HEAD", "--"],
            cwd=REPO_ROOT,
            capture_output=True,
        )
        return result.returncode != 0
    except Exception:
        # If git fails, assume not dirty to avoid blocking
        return False

def compare_schemas(baseline, current):
    """
    Compare two OpenAPI dicts.
    Returns a dict with keys: breaking, nonbreaking, manual.
    Each is a list of finding dicts.
    """
    breaking = []
    nonbreaking = []
    manual = []

    def add_finding(category, method, path, component, before, after):
        finding = {
            "category": category,
            "method": method,
            "path": path,
            "component": component,
            "before": before,
            "after": after,
        }
        if category == "breaking":
            breaking.append(finding)
        elif category == "nonbreaking":
            nonbreaking.append(finding)
        else:
            manual.append(finding)

    base_paths = baseline.get("paths", {})
    cur_paths = current.get("paths", {})

    # Removed paths
    for path in set(base_paths) - set(cur_paths):
        add_finding("breaking", "", path, "path removed", "present", "absent")

    # Added paths
    for path in set(cur_paths) - set(base_paths):
        add_finding("nonbreaking", "", path, "path added", "absent", "present")

    # Common paths
    for path in set(base_paths) & set(cur_paths):
        base_ops = base_paths[path]
        cur_ops = cur_paths[path]
        # Removed operations
        for method in set(base_ops) - set(cur_ops):
            add_finding("breaking", method.upper(), path, "operation removed", "present", "absent")
        # Added operations
        for method in set(cur_ops) - set(base_ops):
            add_finding("nonbreaking", method.upper(), path, "operation added", "absent", "present")
        # Common operations
        for method in set(base_ops) & set(cur_ops):
            base_op = base_ops[method]
            cur_op = cur_ops[method]
            # Security requirements
            base_sec = base_op.get("security", [])
            cur_sec = cur_op.get("security", [])
            if base_sec != cur_sec:
                if base_sec and not cur_sec:
                    add_finding("breaking", method.upper(), path, "security removed", json.dumps(base_sec), json.dumps(cur_sec))
                else:
                    add_finding("manual", method.upper(), path, "security changed", json.dumps(base_sec), json.dumps(cur_sec))
            # Parameters
            base_params = { (p.get("name"), p.get("in")): p for p in base_op.get("parameters", []) }
            cur_params = { (p.get("name"), p.get("in")): p for p in cur_op.get("parameters", []) }
            # Removed parameters
            for key in set(base_params) - set(cur_params):
                p = base_params[key]
                required = p.get("required", False)
                if required:
                    add_finding("breaking", method.upper(), path, f"parameter {key[0]} ({key[1]}) removed", json.dumps(p), "absent")
                else:
                    add_finding("nonbreaking", method.upper(), path, f"optional parameter {key[0]} ({key[1]}) removed", json.dumps(p), "absent")
            # Added parameters
            for key in set(cur_params) - set(base_params):
                p = cur_params[key]
                required = p.get("required", False)
                if required:
                    add_finding("breaking", method.upper(), path, f"required parameter {key[0]} ({key[1]}) added", "absent", json.dumps(p))
                else:
                    add_finding("nonbreaking", method.upper(), path, f"optional parameter {key[0]} ({key[1]}) added", "absent", json.dumps(p))
            # Common parameters
            for key in set(base_params) & set(cur_params):
                base_p = base_params[key]
                cur_p = cur_params[key]
                base_req = base_p.get("required", False)
                cur_req = cur_p.get("required", False)
                if not base_req and cur_req:
                    add_finding("breaking", method.upper(), path, f"parameter {key[0]} ({key[1]}) became required", json.dumps(base_p), json.dumps(cur_p))
                elif base_req and not cur_req:
                    add_finding("nonbreaking", method.upper(), path, f"parameter {key[0]} ({key[1]}) became optional", json.dumps(base_p), json.dumps(cur_p))
                else:
                    if base_p != cur_p:
                        add_finding("manual", method.upper(), path, f"parameter {key[0]} ({key[1]}) changed", json.dumps(base_p), json.dumps(cur_p))
            # Request body
            base_req_body = base_op.get("requestBody")
            cur_req_body = cur_op.get("requestBody")
            if base_req_body and not cur_req_body:
                add_finding("breaking", method.upper(), path, "requestBody removed", json.dumps(base_req_body), "absent")
            elif not base_req_body and cur_req_body:
                add_finding("nonbreaking", method.upper(), path, "requestBody added", "absent", json.dumps(cur_req_body))
            elif base_req_body and cur_req_body:
                base_req = base_req_body.get("required", False)
                cur_req = cur_req_body.get("required", False)
                if not base_req and cur_req:
                    add_finding("breaking", method.upper(), path, "requestBody became required", json.dumps(base_req_body), json.dumps(cur_req_body))
                elif base_req and not cur_req:
                    add_finding("nonbreaking", method.upper(), path, "requestBody became optional", json.dumps(base_req_body), json.dumps(cur_req_body))
                base_content = base_req_body.get("content", {})
                cur_content = cur_req_body.get("content", {})
                base_media = set(base_content.keys())
                cur_media = set(cur_content.keys())
                for m in base_media - cur_media:
                    add_finding("breaking", method.upper(), path, f"requestBody media type {m} removed", json.dumps(base_content.get(m)), "absent")
                for m in cur_media - base_media:
                    add_finding("nonbreaking", method.upper(), path, f"requestBody media type {m} added", "absent", json.dumps(cur_content.get(m)))
                for m in base_media & cur_media:
                    base_schema = base_content[m].get("schema")
                    cur_schema = cur_content[m].get("schema")
                    if base_schema != cur_schema:
                        add_finding("manual", method.upper(), path, f"requestBody media {m} schema changed", json.dumps(base_schema), json.dumps(cur_schema))
            # Responses
            base_resp = base_op.get("responses", {})
            cur_resp = cur_op.get("responses", {})
            for code in set(base_resp) - set(cur_resp):
                add_finding("breaking", method.upper(), path, f"response {code} removed", json.dumps(base_resp[code]), "absent")
            for code in set(cur_resp) - set(base_resp):
                add_finding("nonbreaking", method.upper(), path, f"response {code} added", "absent", json.dumps(cur_resp[code]))
            for code in set(base_resp) & set(cur_resp):
                base_res = base_resp[code]
                cur_res = cur_resp[code]
                if base_res.get("description") != cur_res.get("description"):
                    add_finding("nonbreaking", method.upper(), path, f"response {code} description changed", json.dumps(base_res.get("description")), json.dumps(cur_res.get("description")))
                base_content = base_res.get("content", {})
                cur_content = cur_res.get("content", {})
                base_media = set(base_content.keys())
                cur_media = set(cur_content.keys())
                for m in base_media - cur_media:
                    add_finding("breaking", method.upper(), path, f"response {code} media type {m} removed", json.dumps(base_content.get(m)), "absent")
                for m in cur_media - base_media:
                    add_finding("nonbreaking", method.upper(), path, f"response {code} media type {m} added", "absent", json.dumps(cur_content.get(m)))
                for m in base_media & cur_media:
                    base_schema = base_content[m].get("schema")
                    cur_schema = cur_content[m].get("schema")
                    if base_schema != cur_schema:
                        add_finding("manual", method.upper(), path, f"response {code} media {m} schema changed", json.dumps(base_schema), json.dumps(cur_schema))
            # Other fields: summary, description, tags, deprecated
            for field in ["summary", "description", "tags", "deprecated"]:
                if base_op.get(field) != cur_op.get(field):
                    add_finding("nonbreaking", method.upper(), path, f"{field} changed", json.dumps(base_op.get(field)), json.dumps(cur_op.get(field)))

    return {
        "breaking": breaking,
        "nonbreaking": nonbreaking,
        "manual": manual,
    }

def count_endpoints(schema):
    paths = schema.get("paths", {})
    total = 0
    for path, ops in paths.items():
        for method in ops:
            if method.upper() in {"GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"}:
                total += 1
    return total

def write_diff_report(baseline, current, result):
    lines = []
    lines.append(f"# OpenAPI Diff Report\n")
    lines.append(f"**Generated at**: {datetime.now(timezone.utc).isoformat(timespec='seconds')}Z\n")
    lines.append(f"**Baseline**: {BASELINE_PATH}\n")
    lines.append(f"**Current**: {CURRENT_PATH}\n\n")
    base_count = count_endpoints(baseline)
    cur_count = count_endpoints(current)
    lines.append(f"**Baseline endpoint count**: {base_count}\n")
    lines.append(f"**Current endpoint count**: {cur_count}\n\n")
    lines.append("## Summary\n")
    lines.append("| Category | Count |\n")
    lines.append("|----------|-------|\n")
    lines.append(f"| Breaking | {len(result['breaking'])} |\n")
    lines.append(f"| Non-breaking | {len(result['nonbreaking'])} |\n")
    lines.append(f"| Manual review | {len(result['manual'])} |\n\n")
    def add_section(title, findings):
        if not findings:
            return
        lines.append(f"## {title}\n")
        for f in findings:
            lines.append(f"- **{f['method'] or '(n/a)'} {f['path']}**")
            lines.append(f"  - Component: {f['component']}")
            lines.append(f"  - Before: `{f['before']}`")
            lines.append(f"  - After: `{f['after']}`")
            lines.append("")
        lines.append("")
    add_section("Breaking Changes", result["breaking"])
    add_section("Non-Breaking Changes", result["nonbreaking"])
    add_section("Manual Review", result["manual"])
    DIFF_PATH.write_text("\n".join(lines), encoding="utf-8")

def main():
    import argparse
    parser = argparse.ArgumentParser(description="OpenAPI snapshot and diff for SoundHub.")
    parser.add_argument(
        "--update-baseline",
        action="store_true",
        help="Intentionally update the baseline with current snapshot (requires clean git working tree).",
    )
    args = parser.parse_args()

    app = import_app()
    current = get_openapi_dict(app)
    write_json_file(CURRENT_PATH, current)

    baseline = load_json_file(BASELINE_PATH)
    if baseline is None:
        # No baseline yet: initialize
        if args.update_baseline:
            # User explicitly requested update, but there is none; just init.
            pass
        else:
            # Normal init path
            write_json_file(BASELINE_PATH, current)
            lines = []
            lines.append(f"# OpenAPI Diff Report\n")
            lines.append(f"**Generated at**: {datetime.now(timezone.utc).isoformat(timespec='seconds')}Z\n")
            lines.append(f"**Baseline**: {BASELINE_PATH} (initialized from current snapshot)\n")
            lines.append(f"**Current**: {CURRENT_PATH}\n\n")
            lines.append("Baseline was initialized. No comparison performed.\n")
            DIFF_PATH.write_text("\n".join(lines), encoding="utf-8")
            print("Baseline initialized. No breaking changes check.")
            sys.exit(0)

    # If we reach here, baseline exists.
    if args.update_baseline:
        # Check git dirty state
        if git_is_dirty():
            print("Error: Working tree has uncommitted changes. Commit or stash them before updating baseline.", file=sys.stderr)
            sys.exit(1)
        # Overwrite baseline
        write_json_file(BASELINE_PATH, current)
        lines = []
        lines.append(f"# OpenAPI Diff Report\n")
        lines.append(f"**Generated at**: {datetime.now(timezone.utc).isoformat(timespec='seconds')}Z\n")
        lines.append(f"**Baseline**: {BASELINE_PATH} (updated intentionally)\n")
        lines.append(f"**Current**: {CURRENT_PATH}\n\n")
        lines.append("Baseline has been updated to match current snapshot.\n")
        lines.append("Review the changes in OPENAPI_DIFF.md from the previous run to confirm.\n")
        DIFF_PATH.write_text("\n".join(lines), encoding="utf-8")
        print("Baseline updated. See OPENAPI_DIFF.md for what changed since previous baseline.")
        sys.exit(0)

    # Normal comparison path
    result = compare_schemas(baseline, current)
    write_diff_report(baseline, current, result)
    if result["breaking"]:
        print(f"Found {len(result['breaking'])} breaking changes. See {DIFF_PATH}")
        sys.exit(1)
    else:
        print(f"No breaking changes found. See {DIFF_PATH}")
        sys.exit(0)

if __name__ == "__main__":
    main()