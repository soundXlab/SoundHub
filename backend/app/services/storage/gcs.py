"""Google Cloud Storage object storage backend.

Uses the Google Cloud Storage client library.
Supports both signed URLs and resumable uploads (for Cloud Run).
"""
from __future__ import annotations

import hashlib
import os
import urllib.parse
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

    def _resolve_gcs_name(self, key: str) -> str:
        """Resolve a storage key to a GCS object name."""
        if len(key) == 64 and all(c in "0123456789abcdef" for c in key):
            return self._key_from_sha(key)
        return key

    def create_upload_url(self, key: str, content_type: str, expires_in: int = 900) -> str:
        """Generate a signed PUT URL so the client can upload directly to GCS.

        Falls back to IAM-based signing on Cloud Run where default credentials
        don't support direct signing.
        """
        try:
            bucket = self._get_bucket()
            gcs_name = self._resolve_gcs_name(key)
            blob = bucket.blob(gcs_name)

            # Try standard signed URL first
            url = blob.generate_signed_url(
                version="v4",
                expiration=expires_in,
                method="PUT",
                content_type=content_type,
            )
            return url
        except Exception:
            # Fallback: try IAM-based signing (Cloud Run)
            try:
                return self._generate_signed_url_via_iam(key, content_type, expires_in)
            except Exception as exc:
                raise RuntimeError(
                    f"Failed to generate signed upload URL: {exc}. "
                    "Ensure the service account has roles/iam.serviceAccountTokenCreator "
                    "or set GOOGLE_APPLICATION_CREDENTIALS to a service account key file."
                ) from exc

    def _generate_signed_url_via_iam(self, key: str, content_type: str, expires_in: int) -> str:
        """Generate signed URL using IAM signBlob API (works on Cloud Run)."""
        import time
        from google.auth.transport.requests import Request
        from google.oauth2 import credentials as ga_credentials

        # Get an access token from the metadata server
        auth_req = Request()
        token_creds = ga_credentials.Credentials(
            token=None,
            refresh_token=None,
            token_uri="http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
        )
        # For Compute Engine / Cloud Run, use metadata-based credentials
        from google.auth import compute_engine
        creds = compute_engine.IDTokenCredentials(
            request=auth_req,
            target_audience="https://storage.googleapis.com/",
        )
        creds.refresh(auth_req)

        # Build the canonical request for signing
        bucket = self._get_bucket()
        gcs_name = self._resolve_gcs_name(key)
        expiry_epoch = int(time.time()) + expires_in

        # Use the IAM signBlob API
        import google.auth.transport.requests
        from google.oauth2 import credentials as oauth2_creds

        # Get access token from metadata server
        import urllib.request
        metadata_url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"
        req = urllib.request.Request(metadata_url, headers={"Metadata-Flavor": "Google"})
        with urllib.request.urlopen(req) as resp:
            token_data = __import__("json").loads(resp.read())
            access_token = token_data["access_token"]

        # Sign via IAM signBlob
        service_account = self._client._credentials.service_account_email
        if not service_account:
            # Get default service account email from metadata
            sa_url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email"
            sa_req = urllib.request.Request(sa_url, headers={"Metadata-Flavor": "Google"})
            with urllib.request.urlopen(sa_req) as resp:
                service_account = resp.read().decode()

        sign_url = f"https://iam.googleapis.com/v1/projects/-/serviceAccounts/{service_account}:signBlob"
        sign_payload = __import__("json").dumps({
            "payload": hashlib.sha256(
                f"PUT\n\n{content_type}\n{expiry_epoch}\n/{self.bucket_name}/{gcs_name}".encode()
            ).hexdigest()
        }).encode()

        sign_req = urllib.request.Request(
            sign_url,
            data=sign_payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(sign_req) as resp:
            sign_data = __import__("json").loads(resp.read())
            signature = sign_data["signedBlob"]

        # Construct the signed URL
        from urllib.parse import quote
        encoded_name = quote(gcs_name, safe="")
        signed_url = (
            f"https://storage.googleapis.com/{self.bucket_name}/{encoded_name}"
            f"?X-Goog-Algorithm=GOOG4-RSA-SHA256"
            f"&X-Goog-Credential={service_account}%2F{time.strftime('%Y%m%d')}%2Fauto%2Fstorage%2Fgoog4_request"
            f"&X-Goog-Date={time.strftime('%Y%m%dT%H%M%SZ')}"
            f"&X-Goog-Expires={expires_in}"
            f"&X-Goog-Signature={signature}"
        )
        return signed_url

    def create_resumable_upload_url(
        self, key: str, content_type: str, content_length: int, expires_in: int = 86400
    ) -> dict:
        """Create a resumable upload session directly with GCS.

        Returns dict with upload_url and object_name for the client to use.
        This is the preferred method for large files on Cloud Run.
        """
        import urllib.request
        import json as _json

        gcs_name = self._resolve_gcs_name(key)

        # Get access token from metadata server
        metadata_url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"
        req = urllib.request.Request(metadata_url, headers={"Metadata-Flavor": "Google"})
        with urllib.request.urlopen(req) as resp:
            token_data = _json.loads(resp.read())
            access_token = token_data["access_token"]

        # Initiate resumable upload via GCS REST API
        upload_url = (
            f"https://storage.googleapis.com/upload/storage/v1/b/{self.bucket_name}/o"
            f"?uploadType=resumable&name={urllib.parse.quote(gcs_name, safe='')}")
        metadata = {"contentType": content_type}
        payload = _json.dumps(metadata).encode()

        upload_req = urllib.request.Request(
            upload_url,
            data=payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Upload-Content-Type": content_type,
                "X-Upload-Content-Length": str(content_length),
            },
            method="POST",
        )
        with urllib.request.urlopen(upload_req) as resp:
            resumable_uri = resp.headers.get("Location", "")

        return {
            "upload_url": resumable_uri,
            "object_name": gcs_name,
            "bucket": self.bucket_name,
            "chunk_size": 8 * 1024 * 1024,
        }

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
        except Exception:
            # Fallback: try IAM-based signing (Cloud Run)
            try:
                return self._generate_download_url_via_iam(key, expires_in)
            except Exception as exc:
                raise RuntimeError(f"Failed to generate signed download URL: {exc}") from exc

    def _generate_download_url_via_iam(self, key: str, expires_in: int) -> str:
        """Generate download signed URL using IAM signBlob API."""
        import time
        import hashlib
        from urllib.parse import quote

        gcs_name = self._key_from_sha(key)
        bucket = self._get_bucket()
        expiry_epoch = int(time.time()) + expires_in

        import urllib.request
        # Get access token
        metadata_url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"
        req = urllib.request.Request(metadata_url, headers={"Metadata-Flavor": "Google"})
        with urllib.request.urlopen(req) as resp:
            token_data = __import__("json").loads(resp.read())
            access_token = token_data["access_token"]

        # Get service account email
        sa_url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email"
        sa_req = urllib.request.Request(sa_url, headers={"Metadata-Flavor": "Google"})
        with urllib.request.urlopen(sa_req) as resp:
            service_account = resp.read().decode()

        # Sign via IAM
        sign_url = f"https://iam.googleapis.com/v1/projects/-/serviceAccounts/{service_account}:signBlob"
        canonical = f"GET\n\n\n{expiry_epoch}\n/{self.bucket_name}/{gcs_name}"
        sign_payload = __import__("json").dumps({
            "payload": hashlib.sha256(canonical.encode()).hexdigest()
        }).encode()

        sign_req = urllib.request.Request(
            sign_url, data=sign_payload,
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(sign_req) as resp:
            sign_data = __import__("json").loads(resp.read())
            signature = sign_data["signedBlob"]

        encoded_name = quote(gcs_name, safe="")
        return (
            f"https://storage.googleapis.com/{self.bucket_name}/{encoded_name}"
            f"?X-Goog-Algorithm=GOOG4-RSA-SHA256"
            f"&X-Goog-Credential={service_account}%2F{time.strftime('%Y%m%d')}%2Fauto%2Fstorage%2Fgoog4_request"
            f"&X-Goog-Date={time.strftime('%Y%m%dT%H%M%SZ')}"
            f"&X-Goog-Expires={expires_in}"
            f"&X-Goog-Signature={signature}"
        )

    # Storage class mapping for tiers
    _STORAGE_CLASS_MAP = {}

    def get_tier(self, key: str) -> int:
        return 0  # StorageTier.HOT

    def set_tier(self, key: str, tier: int) -> None:
        pass  # Not implemented

    def get_object_metadata(self, key: str) -> dict:
        try:
            bucket = self._get_bucket()
            gcs_name = self._key_from_sha(key)
            blob = bucket.blob(gcs_name)

            if not blob.exists():
                return {}

            blob.reload()
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
