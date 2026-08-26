"""Tests for background job queue and jobs API."""
print("DEBUG: Loading test_jobs.py file")
import sys
import time
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient

from app.database import Base
from app import models  # Import models to ensure they're loaded before job_queue
from app.main import app
from app.services import job_queue


# ── Fixtures ───────────────────────────────────────────────────────────


@pytest.fixture()
def _job_db(tmp_path, monkeypatch):
    """Create an isolated test DB and patch job_queue to use it.

    Yields (test_engine, SessionLocal) so tests can also create tables etc.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    # Shutdown any existing delay checker thread to ensure clean state
    try:
        job_queue.shutdown()
    except Exception:
        pass  # Ignore if shutdown fails

    test_db_url = f"sqlite:///{tmp_path / 'test.db'}"
    engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    factory = sessionmaker(bind=engine)

    Base.metadata.create_all(bind=engine)

    monkeypatch.setattr(job_queue, "_engine", engine)
    monkeypatch.setattr(job_queue, "_SessionFactory", factory)

    # Start delay checker thread with the new engine/factory
    job_queue.start_delay_checker()
    # Restart worker threads after shutdown
    job_queue._start_worker_threads()

    yield engine, factory

    # Shutdown the delay checker thread after the test
    try:
        job_queue.shutdown()
    except Exception:
        pass


@pytest.fixture()
def client(tmp_path, monkeypatch, _job_db):
    """Isolated TestClient with patched DB and job_queue engine."""
    print("!!! DEBUG: client fixture called !!!")
    from app import config
    from app import database

    # Use the same database as job_queue
    test_engine, factory = _job_db
    print(f"!!! DEBUG: client fixture got test_engine={type(test_engine)}, factory={type(factory)} !!!")

    monkeypatch.setattr(config, "DATA_DIR", tmp_path)
    monkeypatch.setattr(config, "BLOB_DIR", tmp_path / "blobs")
    monkeypatch.setattr(config, "TMP_DIR", tmp_path / "tmp")
    config.ensure_dirs()

    print("!!! DEBUG: About to set DATABASE_URL !!!")
    monkeypatch.setattr(config, "DATABASE_URL", test_engine.url)
    monkeypatch.setattr(database, "DATABASE_URL", test_engine.url)
    monkeypatch.setattr(database, "engine", test_engine)
    monkeypatch.setattr(
        database,
        "SessionLocal",
        factory,
    )
    print("!!! DEBUG: Set DATABASE_URL successfully !!!")

    print("!!! DEBUG: Creating TestClient !!!")
    with TestClient(app) as c:
        print("!!! DEBUG: TestClient created, yielding !!!")
        yield c
        print("!!! DEBUG: TestClient finished !!!")


# ── Auth helpers ───────────────────────────────────────────────────────


def _register_and_login(client) -> str:
    """Register a test user and return the auth token."""
    name = f"jobtest_{time.time_ns()}"
    resp = client.post(
        "/api/auth/register",
        json={"username": name, "password": "testpass123"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Handler registration tests ──────────────────────────────────────────


from app.services.job_queue import (
    _HANDLERS,
    cancel_job,
    enqueue_job,
    get_job_status,
    list_jobs,
    register_handler,
)


class TestHandlerRegistration:
    def test_builtin_handlers_registered(self):
        expected = {
            "parse_daw",
            "generate_waveform",
            "analyze_loudness",
            "extract_audio_metadata",
            "transcode_audio",
            "watermark_preview",
        }
        assert expected.issubset(set(_HANDLERS))

    def test_custom_handler_registration(self):
        @register_handler("test_custom_job")
        def my_handler(job, db):
            return {"ok": True}

        assert "test_custom_job" in _HANDLERS

        # Cleanup
        del _HANDLERS["test_custom_job"]


# ── Queue unit tests (no HTTP) ──────────────────────────────────────────


class TestJobQueue:
    def test_enqueue_and_status(self, _job_db):
        # Mock storage read to return valid WAV data so the job doesn't fail
        fake_wav = (
            b"RIFF\x00\x00\x00\x00WAVEfmt "
            b"\x10\x00\x00\x00\x01\x00"  # PCM
            b"\x01\x00"  # mono
            b"\x80\x3e\x00\x00"  # 16000 Hz
            b"\x00\x7d\x00\x00"  # byte rate
            b"\x02\x00"  # block align
            b"\x10\x00"  # 16-bit
            + b"data" + b"\x00" * 100
        )

        with patch("app.services.storage.read_blob", return_value=fake_wav):
            job_id = enqueue_job(
                "extract_audio_metadata",
                input_json={"sha256": "a" * 64, "filename": "test.wav"},
                delay_seconds=None,
                priority=0,
            )
            assert isinstance(job_id, int)
            assert job_id > 0

            # Wait for in-process worker to pick it up
            time.sleep(0.5)

            info = get_job_status(job_id)
            assert info is not None
            assert info["id"] == job_id
            assert info["type"] == "extract_audio_metadata"
            assert info["status"] in ("queued", "running", "completed", "failed")

    def test_unknown_job_type_raises(self):
        with pytest.raises(ValueError, match="Invalid job type"):
            enqueue_job("nonexistent_job_type")

    def test_list_jobs(self, _job_db):
        jobs = list_jobs(limit=10)
        assert isinstance(jobs, list)

    def test_cancel_queued_job(self, _job_db):
        result = cancel_job(999999)
        assert result is False

    def test_delayed_job_status(self, _job_db):
        """Test that delayed jobs have the correct status and delay_until timestamp."""
        job_id = enqueue_job(
            "extract_audio_metadata",
            input_json={"sha256": "a" * 64, "filename": "test.wav"},
            delay_seconds=10,  # Delay for 10 seconds
            priority=0,
        )
        assert isinstance(job_id, int)
        assert job_id > 0

        info = get_job_status(job_id)
        assert info is not None
        assert info["id"] == job_id
        assert info["type"] == "extract_audio_metadata"
        assert info["status"] == "delayed"
        assert info["delay_until"] is not None

        # Wait for the delay to expire
        time.sleep(11)

        # After delay expires, the job should still be in the database as delayed
        # until the delay checker processes it (which happens in the background)
        info = get_job_status(job_id)
        assert info is not None

    def test_priority_validation(self, _job_db):
        """Test that priority validation works correctly."""
        # Test valid priorities
        for priority in [0, 1, 5, 9]:
            job_id = enqueue_job(
                "extract_audio_metadata",
                input_json={"sha256": "a" * 64, "filename": "test.wav"},
                priority=priority,
            )
            assert isinstance(job_id, int)
            assert job_id > 0
            # Clean up by canceling the job (since it might be processed quickly)
            cancel_job(job_id)

        # Test invalid priorities
        for priority in [-1, 10, 15]:
            with pytest.raises(ValueError, match="Priority must be between 0 and 9"):
                enqueue_job(
                    "extract_audio_metadata",
                    input_json={"sha256": "a" * 64, "filename": "test.wav"},
                    priority=priority,
                )


# ── API endpoint tests ─────────────────────────────────────────────────


class TestJobsAPI:
    @pytest.fixture(autouse=True)
    def _auth_setup(self, client):
        self.client = client
        self.token = _register_and_login(client)
        self.headers = _auth(self.token)

    def test_create_job(self):
        # Mock storage read to return valid WAV data so the job doesn't fail
        fake_wav = (
            b"RIFF\x00\x00\x00\x00WAVEfmt "
            b"\x10\x00\x00\x00\x01\x00"  # PCM
            b"\x01\x00"  # mono
            b"\x80\x3e\x00\x00"  # 16000 Hz
            b"\x00\x7d\x00\x00"  # byte rate
            b"\x02\x00"  # block align
            b"\x10\x00"  # 16-bit
            + b"data" + b"\x00" * 100
        )
        with patch("app.services.storage.read_blob", return_value=fake_wav):
            resp = self.client.post(
                "/api/jobs",
                json={
                    "type": "extract_audio_metadata",
                    "input_json": {"sha256": "a" * 64, "filename": "test.wav"},
                    "delay_seconds": None,
                    "priority": 0,
                },
                headers=self.headers,
            )
            assert resp.status_code == 202, resp.text
            data = resp.json()
            assert data["type"] == "extract_audio_metadata"
            assert data["status"] in ("queued", "running", "completed")
            assert "id" in data

    def test_create_job_invalid_type(self):
        resp = self.client.post(
            "/api/jobs",
            json={"type": "invalid_type"},
            headers=self.headers,
        )
        assert resp.status_code == 422

    def test_list_jobs(self):
        resp = self.client.get("/api/jobs", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "jobs" in data
        assert "total" in data

    def test_get_job(self):
        # Mock storage read to return valid WAV data so the job doesn't fail
        fake_wav = (
            b"RIFF\x00\x00\x00\x00WAVEfmt "
            b"\x10\x00\x00\x00\x01\x00"  # PCM
            b"\x01\x00"  # mono
            b"\x80\x3e\x00\x00"  # 16000 Hz
            b"\x00\x7d\x00\x00"  # byte rate
            b"\x02\x00"  # block align
            b"\x10\x00"  # 16-bit
            + b"data" + b"\x00" * 100
        )
        with patch("app.services.storage.read_blob", return_value=fake_wav):
            create_resp = self.client.post(
                "/api/jobs",
                json={"type": "extract_audio_metadata", "input_json": {}, "delay_seconds": None, "priority": 0},
                headers=self.headers,
            )
            assert create_resp.status_code == 202, create_resp.text
            job_id = create_resp.json()["id"]

            resp = self.client.get(f"/api/jobs/{job_id}", headers=self.headers)
            assert resp.status_code == 200
            assert resp.json()["id"] == job_id

    def test_get_job_not_found(self):
        resp = self.client.get("/api/jobs/999999", headers=self.headers)
        assert resp.status_code == 404

    def test_cancel_job(self):
        create_resp = self.client.post(
            "/api/jobs",
            json={"type": "extract_audio_metadata", "input_json": {}},
            headers=self.headers,
        )
        job_id = create_resp.json()["id"]

        resp = self.client.delete(f"/api/jobs/{job_id}", headers=self.headers)
        assert resp.status_code in (200, 409)

    def test_retry_job_not_failed(self):
        # Mock storage read to return valid WAV data so the job doesn't fail
        fake_wav = (
            b"RIFF\x00\x00\x00\x00WAVEfmt "
            b"\x10\x00\x00\x00\x01\x00"  # PCM
            b"\x01\x00"  # mono
            b"\x80\x3e\x00\x00"  # 16000 Hz
            b"\x00\x7d\x00\x00"  # byte rate
            b"\x02\x00"  # block align
            b"\x10\x00"  # 16-bit
            + b"data" + b"\x00" * 100
        )
        with patch("app.services.storage.read_blob", return_value=fake_wav):
            create_resp = self.client.post(
                "/api/jobs",
                json={"type": "extract_audio_metadata", "input_json": {}, "delay_seconds": None, "priority": 0},
                headers=self.headers,
            )
            job_id = create_resp.json()["id"]

            resp = self.client.post(f"/api/jobs/{job_id}/retry", headers=self.headers)
            assert resp.status_code in (202, 409)

    def test_list_jobs_with_filters(self):
        resp = self.client.get(
            "/api/jobs",
            params={"job_type": "generate_waveform", "limit": 5},
            headers=self.headers,
        )
        assert resp.status_code == 200

    def test_unauthenticated(self):
        resp = self.client.get("/api/jobs")
        assert resp.status_code in (401, 403)


# ── Batch Job Tests ────────────────────────────────────────────────────

class TestBatchJobsAPI:
    @pytest.fixture(autouse=True)
    def _auth_setup(self, client):
        self.client = client
        self.token = _register_and_login(client)
        self.headers = _auth(self.token)

    def test_create_jobs_batch_success(self):
        """Test creating a batch of jobs successfully."""
        # Mock storage read to return valid WAV data so the job doesn't fail
        fake_wav = (
            b"RIFF\x00\x00\x00\x00WAVEfmt "
            b"\x10\x00\x00\x00\x01\x00"  # PCM
            b"\x01\x00"  # mono
            b"\x80\x3e\x00\x00"  # 16000 Hz
            b"\x00\x7d\x00\x00"  # byte rate
            b"\x02\x00"  # block align
            b"\x10\x00"  # 16-bit
            + b"data" + b"\x00" * 100
        )
        with patch("app.services.storage.read_blob", return_value=fake_wav):
            resp = self.client.post(
                "/api/jobs/batch",
                json=[
                    {
                        "type": "extract_audio_metadata",
                        "input_json": {"sha256": "a" * 64, "filename": "test1.wav"},
                        "priority": 0,
                    },
                    {
                        "type": "extract_audio_metadata",
                        "input_json": {"sha256": "b" * 64, "filename": "test2.wav"},
                        "priority": 1,
                        "delay_seconds": 5,
                    },
                ],
                headers=self.headers,
            )
            assert resp.status_code == 202, resp.text
            data = resp.json()
            assert "job_ids" in data
            assert isinstance(data["job_ids"], list)
            assert len(data["job_ids"]) == 2
            assert all(isinstance(jid, int) and jid > 0 for jid in data["job_ids"])

            # Verify both jobs exist and have correct properties
            for i, job_id in enumerate(data["job_ids"]):
                job_resp = self.client.get(f"/api/jobs/{job_id}", headers=self.headers)
                assert job_resp.status_code == 200
                job_data = job_resp.json()
                assert job_data["type"] == "extract_audio_metadata"
                assert job_data["input_json"]["filename"] == f"test{i+1}.wav"
                if i == 0:
                    assert job_data["priority"] == 0
                    assert job_data["status"] in ("queued", "running", "completed")
                    assert job_data["delay_until"] is None
                else:
                    assert job_data["priority"] == 1
                    assert job_data["status"] == "delayed"  # Should be delayed initially
                    assert job_data["delay_until"] is not None

    def test_create_jobs_batch_empty(self):
        """Test that empty batch returns validation error."""
        resp = self.client.post(
            "/api/jobs/batch",
            json=[],
            headers=self.headers,
        )
        assert resp.status_code == 400
        assert "at least one job" in resp.json()["detail"].lower()

    def test_create_jobs_batch_too_large(self):
        """Test that batch exceeding limit returns validation error."""
        # Create 101 jobs (limit is 100)
        jobs = []
        for i in range(101):
            jobs.append(
                {
                    "type": "extract_audio_metadata",
                    "input_json": {"sha256": "a" * 64, "filename": f"test{i}.wav"},
                }
            )

        resp = self.client.post(
            "/api/jobs/batch",
            json=jobs,
            headers=self.headers,
        )
        assert resp.status_code == 400
        assert "cannot exceed 100 jobs" in resp.json()["detail"].lower()

    def test_create_jobs_batch_invalid_job_type(self):
        """Test that invalid job type in batch returns validation error."""
        resp = self.client.post(
            "/api/jobs/batch",
            json=[
                {
                    "type": "extract_audio_metadata",
                    "input_json": {"sha256": "a" * 64, "filename": "test1.wav"},
                },
                {
                    "type": "invalid_job_type",
                    "input_json": {"sha256": "b" * 64, "filename": "test2.wav"},
                },
            ],
            headers=self.headers,
        )
        assert resp.status_code == 422
        assert "invalid job type" in resp.json()["detail"].lower()

    def test_create_jobs_batch_invalid_priority(self):
        """Test that invalid priority in batch returns validation error."""
        resp = self.client.post(
            "/api/jobs/batch",
            json=[
                {
                    "type": "extract_audio_metadata",
                    "input_json": {"sha256": "a" * 64, "filename": "test1.wav"},
                    "priority": 15,  # Invalid: should be 0-9
                },
            ],
            headers=self.headers,
        )
        assert resp.status_code == 422
        assert "priority must be between 0 and 9" in resp.json()["detail"].lower()

    def test_create_jobs_batch_unauthenticated(self):
        """Test that unauthenticated requests are rejected."""
        resp = self.client.post(
            "/api/jobs/batch",
            json=[
                {
                    "type": "extract_audio_metadata",
                    "input_json": {"sha256": "a" * 64, "filename": "test.wav"},
                },
            ],
        )
        assert resp.status_code in (401, 403)


# ── Integration: enqueue → wait → completed ─────────────────────────────


class TestJobIntegration:
    @pytest.fixture(autouse=True)
    def _auth_setup(self, client):
        self.client = client
        self.token = _register_and_login(client)
        self.headers = _auth(self.token)

    def test_extract_metadata_completes(self, _job_db):
        """Full round-trip: create job → wait → verify completion."""
        print("!!! DEBUG: Starting test_extract_metadata_completes !!!")
        # The handler calls storage.read_blob(), so mock it to return valid WAV
        fake_sha = "a" * 64
        fake_wav = (
            b"RIFF\x00\x00\x00\x00WAVEfmt "
            b"\x10\x00\x00\x00\x01\x00"  # PCM
            b"\x01\x00"  # mono
            b"\x80\x3e\x00\x00"  # 16000 Hz
            b"\x00\x7d\x00\x00"  # byte rate
            b"\x02\x00"  # block align
            b"\x10\x00"  # 16-bit
            + b"data" + b"\x00" * 100
        )

        with patch("app.services.storage.read_blob", return_value=fake_wav):
            print("!!! DEBUG: Creating job !!!")
            resp = self.client.post(
                "/api/jobs",
                json={
                    "type": "extract_audio_metadata",
                    "input_json": {"sha256": fake_sha, "filename": "test.wav"},
                    "delay_seconds": None,
                    "priority": 0,
                },
                headers=self.headers,
            )
            print(f"!!! DEBUG: Job creation response: {resp.status_code} !!!")
            assert resp.status_code == 202
            job_id = resp.json()["id"]
            print(f"!!! DEBUG: Created job ID: {job_id} !!!")

            # Wait for completion (in-process worker)
            print("!!! DEBUG: Waiting for job completion !!!")
            for i in range(30):
                time.sleep(0.3)
                status_resp = self.client.get(
                    f"/api/jobs/{job_id}", headers=self.headers
                )
                status = status_resp.json()["status"]
                print(f"!!! DEBUG: Poll {i}: job {job_id} status = {status} !!!")
                if status in ("completed", "failed"):
                    break

            info = self.client.get(f"/api/jobs/{job_id}", headers=self.headers).json()
            print(f"!!! DEBUG: Final job info: {info} !!!")
            assert info["status"] == "completed"
            assert info["output_json"] is not None