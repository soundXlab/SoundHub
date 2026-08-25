"""Google Cloud Storage object storage backend.

Uses the Google Cloud Storage client library.
"""
from __future__ import annotations

import hashlib
import os
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from google.cloud.storage import Bucket, Client


class GCSObjectStorage:
    """Google Cloud Storage backend."""

    def __init__(
        self,
        bucket_name: str | None = None,
        project_id: str | None = None,
        credentials_path: str | None = None,
    ) -> None:
        self.bucket_name = bucket_name or os.environ.get(
            "SOUNDHUB_GCS_BUCKET", "soundhub-assets"
        )
        self.project_id = project_id or os.environ.get("SOUNDHUB_GCP_PROJECT_ID")
        self.credentials_path = credentials_path or os.environ.get(
            "GOOGLE_APPLICATION_CREDENTIALS"
        )
        self._client: Client | None = None
        self._bucket: Bucket | None = None

    def _get_client(self) -> "Client":
        if self._client is None:
            from google.cloud import storage

            if self.credentials_path and os.path.exists(self.credentials_path):
                self._client = storage.Client.from_service_account_json(
                    self.credentials_path, project=self.project_id
                )
            else:
                # Uses default credentials (useful for Cloud Run with associated service account)
                self._client = storage.Client(project=self.project_id)
        return self._client

    def _get_bucket(self) -> "Bucket":
        if self._bucket is None:
            client = self._get_client()
            self._bucket = client.bucket(self.bucket_name)
            # Create bucket if it doesn't exist (useful for local testing)
            if not self._bucket.exists():
                self._bucket.create()
        return self._bucket

    # ── helpers ──────────────────────────────────────────────────────────

    @staticmethod
    def _content_key(data: bytes) -> str:
        """Build a content-addressed GCS object name from raw bytes."""
        sha = hashlib.sha256(data).hexdigest()
        return f"blobs/{sha[:2]}/{sha[2:4]}/{sha}"

    @staticmethod
    def _key_from_sha(sha: str) -> str:
        """Convert a SHA-256 hash to a GCS object name."""
        return f"blobs/{sha[:2]}/{sha[2:4]}/{sha}"

    # ── protocol ─────────────────────────────────────────────────────────

    def put_bytes(self, key: str, data: bytes, content_type: str | None = None) -> str:
        """Store bytes under *key*. Returns the content-address (SHA-256 hex)."""
        sha = hashlib.sha256(data).hexdigest()
        gcs_name = self._key_from_sha(sha)

        bucket = self._get_bucket()
        blob = bucket.blob(gcs_name)

        # Set content-type if provided
        if content_type:
            blob.content_type = content_type

        # Don't fail if already exists (idempotent)
        if not blob.exists():
            blob.upload_from_string(data, content_type=content_type)

        return sha

    def get_bytes(self, key: str) -> bytes:
        """Read blob by storage key."""
        try:
            bucket = self._get_bucket()
            gcs_name = self._key_from_sha(key)
            blob = bucket.blob(gcs_name)

            if not blob.exists():
                raise FileNotFoundError(f"Blob {key} not found")

            return blob.download_as_bytes()
        except Exception as exc:
            raise FileNotFoundError(f"Blob {key} not found") from exc

    def delete(self, key: str) -> None:
        """Delete a blob. Idempotent — no error if missing."""
        try:
            bucket = self._get_bucket()
            gcs_name = self._key_from_sha(key)
            blob = bucket.blob(gcs_name)
            if blob.exists():
                blob.delete()
        except Exception:
            pass  # idempotent

    def exists(self, key: str) -> bool:
        """Return True if the blob exists in this backend."""
        try:
            bucket = self._get_bucket()
            gcs_name = self._key_from_sha(key)
            blob = bucket.blob(gcs_name)
            return blob.exists()
        except Exception:
            return False

    def size(self, key: str) -> int:
        """Return blob size in bytes, or 0 if not found."""
        try:
            bucket = self._get_bucket()
            gcs_name = self._key_from_sha(key)
            blob = bucket.blob(gcs_name)
            if not blob.exists():
                return 0
            blob.reload()  # Fetch latest metadata
            return blob.size or 0
        except Exception:
            return 0

    def create_upload_url(self, key: str, content_type: str, expires_in: int = 900) -> str:
        """
        Generate a signed PUT URL so the client can upload directly to GCS.
        Note: GCS signed URLs for upload require specifying the content-type and using PUT method.
        """
        try:
            bucket = self._get_bucket()
            # Check if key is already a SHA-256 hash (content-addressed)
            if len(key) == 64 and all(c in "0123456789abcdef" for c in key):
                gcs_name = self._key_from_sha(key)
            else:
                gcs_name = key

            blob = bucket.blob(gcs_name)

            # Generate a signed URL for PUT (upload) with content-type specified
            url = blob.generate_signed_url(
                version="v4",
                expiration=expires_in,
                method="PUT",
                content_type=content_type,
            )

            return url
        except Exception as exc:
            raise RuntimeError(f"Failed to generate signed upload URL: {exc}") from exc

    def create_download_url(self, key: str, expires_in: int = 900) -> str:
        """Generate a signed GET URL for the client to download a file."""
        try:
            bucket = self._get_bucket()
            gcs_name = self._key_from_sha(key)
            blob = bucket.blob(gcs_name)

            url = blob.generate_signed_url(
                version="v4",
                expiration=expires_in,
                method="GET",
            )

            return url
        except Exception as exc:
            raise RuntimeError(f"Failed to generate signed download URL: {exc}") from exc

    # Storage class mapping for tiers (GCS uses storage classes)
    _STORAGE_CLASS_MAP = {
        # Note: GCS storage classes are different from S3
        # We'll map our tiers to nearest GCS equivalents
        # For now, we'll use STANDARD for all tiers since implementing
        # automatic tier transitions in GCS requires Object Lifecycle Management
        # which is bucket-level, not object-level.
        # TODO: Implement proper tiering using GCS Object Lifecycle Management
        # or by rewriting objects with different storage classes.
        # For now, we'll just return HOT and not implement set_tier.
    }

    def get_tier(self, key: str) -> int:
        """Return the current storage tier for a blob.
        For GCS, we don't implement automatic tiering in this version,
        so we always return HOT (0).
        TODO: Implement proper tier detection using GCS Object Lifecycle
        Management or by checking object's storage class.
        """
        # For now, return HOT as we don't have tiering implemented
        # To properly implement, we would need to:
        # 1. Check the object's storage class via blob.reload()
        # 2. Map GCS storage classes to our StorageTier enum
        return 0  # StorageTier.HOT

    def set_tier(self, key: str, tier: int) -> None:
        """Move a blob to the specified storage tier.
        For GCS, changing storage class requires rewriting the object.
        TODO: Implement this by copying the object with a different storage class.
        """
        # Not implemented in this version
        # To implement:
        # 1. Get the current blob
        # 2. Copy it to a temporary location with the desired storage class
        # 3. Delete the original
        # 4. Rename the temporary to the original name
        pass

    def get_object_metadata(self, key: str) -> dict:
        """Get metadata about an object including its creation time and storage class."""
        try:
            bucket = self._get_bucket()
            gcs_name = self._key_from_sha(key)
            blob = bucket.blob(gcs_name)

            if not blob.exists():
                return {}

            blob.reload()  # Fetch latest metadata

            return {
                "sha256": key,
                "size": blob.size,
                "content_type": blob.content_type,
                "created": blob.time_created.isoformat() if blob.time_created else None,
                "updated": blob.updated.isoformat() if blob.updated else None,
                "storage_class": blob.storage_class,
                "md5_hash": blob.md5_hash,
                "etag": blob.etag,
            }
        except Exception:
            return {}