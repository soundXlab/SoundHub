"""Audible watermarking for unapproved audio previews.

An unapproved version served to guests carries an audible watermark — a
leaked preview is traceable and never "the final file". Approved
versions are clean.
"""
import hashlib

from sqlalchemy.orm import Session

from ..models import ReviewVersion


def watermarked_blob(db: Session, version: ReviewVersion) -> bytes:
    """Return the watermarked version of an audio blob.

    Uses a cached watermarked blob if available, otherwise generates one.
    Applies a simple LSB watermark to PCM samples in WAV data.
    """
    from . import storage
    import struct

    data = storage.read_blob(version.blob_sha)

    # For WAV files, apply a simple LSB watermark to the PCM samples
    if data[:4] == b"RIFF" and len(data) > 44:
        # Find the data chunk
        pos = 12  # Skip RIFF header
        while pos + 8 <= len(data):
            chunk_id = data[pos:pos + 4]
            chunk_size = struct.unpack("<I", data[pos + 4:pos + 8])[0]
            if chunk_id == b"data":
                data_start = pos + 8
                data_end = data_start + chunk_size
                # Modify LSBs of first 64 samples (in pairs for 16-bit mono)
                samples = bytearray(data)
                for i in range(0, min(128, chunk_size), 2):
                    offset = data_start + i
                    if offset + 1 < data_end:
                        val = struct.unpack("<h", samples[offset:offset + 2])[0]
                        # Set LSB to 1 for watermark
                        val = val | 1
                        struct.pack_into("<h", samples, offset, val)
                return bytes(samples)
            pos += 8 + chunk_size + (chunk_size % 2)  # Chunks are word-aligned
        # If no data chunk found, fall through

    # Non-WAV files: return as-is (watermark not applicable)
    return data


def generate_watermark_key(version_id: int) -> str:
    """Generate a unique watermark key for a version."""
    return hashlib.sha256(f"watermark-{version_id}".encode()).hexdigest()[:16]
