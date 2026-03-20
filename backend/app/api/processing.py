from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.exc import OperationalError

from app.models.database import get_db, ProcessingJob
from workers.photo_processor import PhotoProcessor

router = APIRouter(prefix="/processing", tags=["processing"])


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
async def process_now(background_tasks: BackgroundTasks):
    """
    Start processing pending jobs in background.
    This is useful in dev / single-user setups where you don't run the worker separately.
    """

    def _run():
        try:
            processor = PhotoProcessor()
            processor.process_pending_jobs()
        except Exception:
            # Swallow errors: job-level errors are already stored in DB by PhotoProcessor.
            pass

    background_tasks.add_task(_run)
    return {"started": True, "message": "Processing started in background"}

