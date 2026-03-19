from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.database import get_db
from app.services.export_service import ExportService

router = APIRouter(prefix="/export", tags=["export"])


class ExportRequest(BaseModel):
    photo_ids: List[int]
    destination: str
    organize_by: str = 'date'
    preserve_structure: bool = False


class ExportByPersonRequest(BaseModel):
    person_id: int
    destination: str


class ExportByEventRequest(BaseModel):
    event_id: int
    destination: str


class ExportByAlbumRequest(BaseModel):
    album_id: int
    destination: str


class ExportByDateRangeRequest(BaseModel):
    start_date: datetime
    end_date: datetime
    destination: str


@router.post("/photos")
async def export_photos(
    request: ExportRequest,
    db: Session = Depends(get_db)
):
    """Export selected photos"""
    try:
        service = ExportService(db)
        result = service.export_photos(
            request.photo_ids,
            request.destination,
            request.organize_by,
            request.preserve_structure
        )
        
        service.create_export_manifest(request.photo_ids, request.destination)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/by-person")
async def export_by_person(
    request: ExportByPersonRequest,
    db: Session = Depends(get_db)
):
    """Export all photos of a person"""
    try:
        service = ExportService(db)
        result = service.export_by_person(request.person_id, request.destination)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/by-event")
async def export_by_event(
    request: ExportByEventRequest,
    db: Session = Depends(get_db)
):
    """Export all photos from an event"""
    try:
        service = ExportService(db)
        result = service.export_by_event(request.event_id, request.destination)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/by-album")
async def export_by_album(
    request: ExportByAlbumRequest,
    db: Session = Depends(get_db)
):
    """Export all photos from an album"""
    try:
        service = ExportService(db)
        result = service.export_by_album(request.album_id, request.destination)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/by-date-range")
async def export_by_date_range(
    request: ExportByDateRangeRequest,
    db: Session = Depends(get_db)
):
    """Export photos within a date range"""
    try:
        service = ExportService(db)
        result = service.export_by_date_range(
            request.start_date,
            request.end_date,
            request.destination
        )
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
