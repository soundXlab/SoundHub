"""DAW format detection and info extraction."""

import hashlib
import json
import os
import subprocess


def detect_format(path: str, data: bytes) -> str:
    """Detect the DAW format from file path and content."""
    lower = path.lower()
    if lower.endswith(".als"):
        return "ableton"
    elif lower.endswith(".alp"):
        return "ableton_pack"
    elif lower.endswith(".cpr"):
        return "cubase"
    elif lower.endswith(".rpp"):
        return "reaper"
    elif lower.endswith(".flp"):
        return "flstudio"
    return "unknown"


def get_daw_info(path: str, data: bytes) -> dict | None:
    """Extract structured info from a DAW project file."""
    fmt = detect_format(path, data)
    if fmt == "ableton":
        return _parse_ableton(data)
    elif fmt == "ableton_pack":
        return _parse_alp(data)
    elif fmt == "reaper":
        return _parse_reaper(data)
    elif fmt == "cubase":
        return _parse_cubase(data)
    elif fmt == "flstudio":
        return _parse_flstudio(data)
    return None


def _parse_ableton(data: bytes) -> dict:
    """Parse Ableton Live Set (.als) — gzip-compressed XML."""
    from .als_parser import parse_als

    try:
        info = parse_als(data)
        return {
            "format": "ableton",
            "bpm": info.bpm,
            "time_signature": info.time_signature,
            "track_count": info.extra.get("track_count", len(info.tracks)),
            "tracks": [t.name for t in info.tracks[:50]],
            "plugin_count": len(info.plugins),
            "plugins": info.plugins[:50],  # Limit to first 50 plugins
        }
    except Exception:
        return {"format": "ableton", "error": "parse_failed"}


def _run_alp_cpp_worker(data: bytes) -> dict | None:
    """Run ALP analysis using C++ worker subprocess.

    Returns dict with analysis results or None if failed.
    """
    CPP_WORKER_PATH = os.path.join(
        os.path.dirname(__file__),
        '..',
        '..',
        '..',
        '..',
        'cpp_worker',
        'alp_analyzer'
    )
    if not (os.path.isfile(CPP_WORKER_PATH) and os.access(CPP_WORKER_PATH, os.X_OK)):
        return None

    try:
        proc = subprocess.run(
            [CPP_WORKER_PATH],
            input=data,
            capture_output=True,
            timeout=30.0  # 30 second timeout for safety
        )

        if proc.returncode != 0:
            # C++ worker failed
            return None

        # Parse JSON output
        import json
        output = proc.stdout.decode().strip()
        result = json.loads(output)

        # Validate required fields
        required_fields = ["format", "format_key", "bpm", "time_signature", "tracks", "plugins", "samples", "extra"]
        if not all(field in result for field in required_fields):
            return None

        # Map to the expected format for registry
        extra = result.get("extra", {})
        archive_contents = extra.get("archive_contents", {})

        return {
            "format": "ableton_pack",
            "bpm": result.get("bpm"),
            "time_signature": result.get("time_signature") or None,  # Convert empty string to None
            "track_count": extra.get("track_count", 0),
            "tracks": [track.get("name", "") for track in result.get("tracks", [])][:50],
            "plugin_count": len(result.get("plugins", [])),
            "plugins": result.get("plugins", [])[:50],
            "sample_count": len(result.get("samples", [])),
            "preset_count": len(extra.get("presets", [])),
            "als_files": archive_contents.get("als_files", []),
            "primary_als": archive_contents.get("primary_als", ""),
            "archive_total_files": archive_contents.get("total_files", 0),
        }
    except subprocess.TimeoutExpired:
        return None
    except Exception:
        return None


def _parse_alp(data: bytes) -> dict:
    """Parse Ableton Live Pack (.alp) — ZIP archive containing .als + assets."""
    # Try C++ worker first
    result = _run_alp_cpp_worker(data)
    if result is not None:
        return result

    # Fallback to Python parser
    from .alp_parser import parse_alp

    try:
        info = parse_alp(data)
        archive_meta = info.extra.get("archive_contents", {})
        return {
            "format": "ableton_pack",
            "bpm": info.bpm,
            "time_signature": info.time_signature,
            "track_count": info.extra.get("track_count", len(info.tracks)),
            "tracks": [t.name for t in info.tracks[:50]],
            "plugin_count": len(info.plugins),
            "plugins": info.plugins[:50],
            "sample_count": len(info.samples),
            "preset_count": len(info.extra.get("presets", [])),
            "als_files": archive_meta.get("als_files", []),
            "primary_als": archive_meta.get("primary_als", ""),
            "archive_total_files": archive_meta.get("total_files", 0),
        }
    except Exception:
        return {"format": "ableton_pack", "error": "parse_failed"}


def _parse_reaper(data: bytes) -> dict:
    """Parse REAPER project (.rpp) — text-based format."""
    try:
        text = data.decode("utf-8", errors="replace")
        lines = text.split("\n")

        bpm = None
        tracks = []
        plugins = []

        for line in lines:
            if line.startswith("TEMPO "):
                parts = line.split()
                if len(parts) >= 2:
                    try:
                        bpm = float(parts[1])
                    except ValueError:
                        pass
            elif line.startswith("TRACK "):
                tracks.append(line)
            elif "VST" in line or "AU" in line or "JSFX" in line:
                plugins.append(line.strip()[:100])

        return {
            "format": "reaper",
            "bpm": bpm,
            "track_count": len(tracks),
            "tracks": [t.split('"')[1] if '"' in t else t for t in tracks[:50]],
            "plugin_count": len(plugins),
            "plugins": plugins[:30],
        }
    except Exception:
        return {"format": "reaper", "error": "parse_failed"}


def _parse_cubase(data: bytes) -> dict:
    """Parse Cubase project (.cpr) — binary/XML format."""
    return {"format": "cubase", "track_count": 0, "plugins": [], "note": "partial parser"}


def _parse_flstudio(data: bytes) -> dict:
    """Parse FL Studio project (.flp) — binary format."""
    return {"format": "flstudio", "track_count": 0, "plugins": [], "note": "partial parser"}
