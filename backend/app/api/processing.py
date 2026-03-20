from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.exc import OperationalError
import multiprocessing
import threading

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


@router.get("/jobs", response_model=List[ProcessingJobResponse])
async def list_processing_jobs(db: Session = Depends(get_db)):
    try:
        jobs = (
            db.query(ProcessingJob)
            .order_by(ProcessingJob.created_at.desc())
            .limit(200)
            .all()
        )

        # Convert datetime -> string for frontend stability.
        return [
            ProcessingJobResponse(
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
            for j in jobs
        ]
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
        # Keep it small: one click should not lock the DB/CPU for too long.
        child = multiprocessing.Process(target=_process_pending_child, args=(1,), daemon=True)
        child.start()

    return {"started": True, "message": "Processing started in a separate process"}

