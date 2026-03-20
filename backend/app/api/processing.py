from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.exc import OperationalError
import multiprocessing
import threading
import time
import os
from datetime import datetime

from app.models.database import get_db, ProcessingJob
from workers.photo_processor import PhotoProcessor

router = APIRouter(prefix="/processing", tags=["processing"])

def _process_pending_child(max_jobs: int):
    """Child process entrypoint (must be top-level for multiprocessing spawn)."""
    processor = PhotoProcessor()
    processor.process_pending_jobs(max_jobs=max_jobs)


class ProcessingJobResponse(BaseModel):
    id: int
    job_type: str
    status: str
    photo_id: Optional[int]
    progress: float
    error_message: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]
    created_at: Optional[str]

    class Config:
        from_attributes = True


class ProcessNowResponse(BaseModel):
    started: bool
    message: str


class RunnerConfigResponse(BaseModel):
    max_jobs_per_run: int
    poll_interval_sec: float


class RunnerConfigUpdateRequest(BaseModel):
    max_jobs_per_run: Optional[int] = None
    poll_interval_sec: Optional[float] = None


class GenericActionResponse(BaseModel):
    success: bool
    message: str


class ProcessingHealthResponse(BaseModel):
    pending: int
    processing: int
    completed: int
    failed: int
    skipped: int
    auto_runner_active: bool
    runner_pid: Optional[int]
    max_jobs_per_run: int
    poll_interval_sec: float
    server_time: str
    load_avg_1m: Optional[float]


class ProcessingJobDetailResponse(ProcessingJobResponse):
    elapsed_seconds: Optional[float]


_runner_state = {
    "lock": threading.Lock(),
    "active": False,
    "thread": None,
    "runner_pid": None,
}
_runner_config = {
    "max_jobs_per_run": 1,
    "poll_interval_sec": 2.0,
}


def _run_one_batch(max_jobs: int):
    child = multiprocessing.Process(target=_process_pending_child, args=(max_jobs,), daemon=True)
    child.start()
    child.join()
    return child.exitcode


def _auto_runner_loop():
    _runner_state["runner_pid"] = os.getpid()
    try:
        while _runner_state["active"]:
            exit_code = _run_one_batch(int(_runner_config["max_jobs_per_run"]))
            # A small sleep always prevents tight loops.
            time.sleep(float(_runner_config["poll_interval_sec"]))
            # If child repeatedly crashes, stop auto-runner to avoid thrashing.
            if exit_code not in (0, None):
                _runner_state["active"] = False
                break
    finally:
        _runner_state["active"] = False
        _runner_state["runner_pid"] = None
        _runner_state["thread"] = None


def _serialize_job(j: ProcessingJob) -> ProcessingJobResponse:
    return ProcessingJobResponse(
        id=j.id,
        job_type=j.job_type,
        status=j.status,
        photo_id=j.photo_id,
        progress=j.progress or 0.0,
        error_message=j.error_message,
        started_at=j.started_at.isoformat() if j.started_at else None,
        completed_at=j.completed_at.isoformat() if j.completed_at else None,
        created_at=j.created_at.isoformat() if j.created_at else None,
    )


@router.get("/jobs", response_model=List[ProcessingJobResponse])
async def list_processing_jobs(status: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(ProcessingJob)
        if status:
            query = query.filter(ProcessingJob.status == status)
        jobs = query.order_by(ProcessingJob.created_at.desc()).limit(200).all()
        return [_serialize_job(j) for j in jobs]
    except OperationalError:
        # SQLite locked: return an empty list instead of hanging the UI.
        return []


@router.post("/process-now", response_model=ProcessNowResponse)
async def process_now():
    """
    Start processing pending jobs in a separate process.

    Important: This endpoint should NEVER block the FastAPI server. The underlying
    processing is CPU/GPU heavy and can hold the GIL; therefore we spawn a child
    process instead of using FastAPI BackgroundTasks.
    """
    # Prevent spawning multiple concurrent child workers from the API process.
    # (This is best-effort; child processes may still overlap if triggered externally.)
    if not hasattr(process_now, "_lock"):
        process_now._lock = threading.Lock()

    with process_now._lock:  # type: ignore[attr-defined]
        max_jobs = int(_runner_config["max_jobs_per_run"])
        child = multiprocessing.Process(target=_process_pending_child, args=(max_jobs,), daemon=True)
        child.start()

    return {"started": True, "message": "Processing started in a separate process"}


@router.get("/jobs/{job_id}", response_model=ProcessingJobDetailResponse)
async def get_job_detail(job_id: int, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    elapsed = None
    if job.started_at:
        end_time = job.completed_at or datetime.utcnow()
        elapsed = max(0.0, (end_time - job.started_at).total_seconds())

    base = _serialize_job(job)
    return ProcessingJobDetailResponse(**base.model_dump(), elapsed_seconds=elapsed)


@router.post("/retry-failed", response_model=GenericActionResponse)
async def retry_failed_jobs(db: Session = Depends(get_db)):
    updated = (
        db.query(ProcessingJob)
        .filter(ProcessingJob.status == "failed")
        .update(
            {
                ProcessingJob.status: "pending",
                ProcessingJob.progress: 0.0,
                ProcessingJob.error_message: None,
                ProcessingJob.started_at: None,
                ProcessingJob.completed_at: None,
            },
            synchronize_session=False,
        )
    )
    db.commit()
    return {"success": True, "message": f"Moved {updated} failed jobs to pending"}


@router.post("/skip-broken", response_model=GenericActionResponse)
async def skip_broken_jobs(db: Session = Depends(get_db)):
    updated = (
        db.query(ProcessingJob)
        .filter(ProcessingJob.status == "failed")
        .update(
            {
                ProcessingJob.status: "skipped",
                ProcessingJob.completed_at: datetime.utcnow(),
            },
            synchronize_session=False,
        )
    )
    db.commit()
    return {"success": True, "message": f"Skipped {updated} failed jobs"}


@router.post("/auto-runner/start", response_model=GenericActionResponse)
async def start_auto_runner():
    with _runner_state["lock"]:
        if _runner_state["active"]:
            return {"success": True, "message": "Auto-runner already active"}
        _runner_state["active"] = True
        t = threading.Thread(target=_auto_runner_loop, daemon=True, name="processing-auto-runner")
        _runner_state["thread"] = t
        t.start()
    return {"success": True, "message": "Auto-runner started"}


@router.post("/auto-runner/stop", response_model=GenericActionResponse)
async def stop_auto_runner():
    with _runner_state["lock"]:
        _runner_state["active"] = False
    return {"success": True, "message": "Auto-runner stop requested"}


@router.get("/runner-config", response_model=RunnerConfigResponse)
async def get_runner_config():
    return RunnerConfigResponse(
        max_jobs_per_run=int(_runner_config["max_jobs_per_run"]),
        poll_interval_sec=float(_runner_config["poll_interval_sec"]),
    )


@router.put("/runner-config", response_model=RunnerConfigResponse)
async def update_runner_config(request: RunnerConfigUpdateRequest):
    if request.max_jobs_per_run is not None:
        _runner_config["max_jobs_per_run"] = max(1, min(8, int(request.max_jobs_per_run)))
    if request.poll_interval_sec is not None:
        _runner_config["poll_interval_sec"] = max(0.5, min(30.0, float(request.poll_interval_sec)))

    return RunnerConfigResponse(
        max_jobs_per_run=int(_runner_config["max_jobs_per_run"]),
        poll_interval_sec=float(_runner_config["poll_interval_sec"]),
    )


@router.get("/health", response_model=ProcessingHealthResponse)
async def processing_health(db: Session = Depends(get_db)):
    statuses = ["pending", "processing", "completed", "failed", "skipped"]
    counts = {}
    for s in statuses:
        counts[s] = db.query(ProcessingJob).filter(ProcessingJob.status == s).count()

    load_avg = None
    try:
        load_avg = os.getloadavg()[0]
    except Exception:
        load_avg = None

    return ProcessingHealthResponse(
        pending=counts["pending"],
        processing=counts["processing"],
        completed=counts["completed"],
        failed=counts["failed"],
        skipped=counts["skipped"],
        auto_runner_active=bool(_runner_state["active"]),
        runner_pid=_runner_state["runner_pid"],
        max_jobs_per_run=int(_runner_config["max_jobs_per_run"]),
        poll_interval_sec=float(_runner_config["poll_interval_sec"]),
        server_time=datetime.utcnow().isoformat(),
        load_avg_1m=load_avg,
    )

