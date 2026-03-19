from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.database import get_db, Photo
from app.services.photo_service import PhotoService
import shutil
from pathlib import Path
from app.core.config import settings

router = APIRouter(prefix="/photos", tags=["photos"])


class PhotoResponse(BaseModel):
    id: int
    file_name: str
    file_path: str
    width: Optional[int]
    height: Optional[int]
    taken_at: Optional[datetime]
    imported_at: datetime
    thumbnail_path: Optional[str]
    preview_path: Optional[str]
    processed: bool
    
    class Config:
        from_attributes = True


class PhotoListResponse(BaseModel):
    photos: List[PhotoResponse]
    total: int
    skip: int
    limit: int


class ImportFolderRequest(BaseModel):
    folder_path: str
    recursive: bool = True


@router.post("/upload", response_model=PhotoResponse)
async def upload_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a single photo"""
    try:
        upload_dir = settings.DATA_DIR / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = upload_dir / file.filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        service = PhotoService(db)
        photo = service.import_photo(str(file_path), copy_to_library=True)
        
        file_path.unlink()
        
        if not photo:
            raise HTTPException(status_code=400, detail="Failed to import photo")
        
        return photo
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-multiple", response_model=List[PhotoResponse])
async def upload_multiple_photos(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Upload multiple photos"""
    photos = []
    
    for file in files:
        try:
            upload_dir = settings.DATA_DIR / "uploads"
            upload_dir.mkdir(parents=True, exist_ok=True)
            
            file_path = upload_dir / file.filename
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            service = PhotoService(db)
            photo = service.import_photo(str(file_path), copy_to_library=True)
            
            file_path.unlink()
            
            if photo:
                photos.append(photo)
                
        except Exception as e:
            print(f"Error uploading {file.filename}: {e}")
    
    return photos


@router.post("/import-folder", response_model=List[PhotoResponse])
async def import_folder(
    request: ImportFolderRequest,
    db: Session = Depends(get_db)
):
    """Import photos from a folder"""
    try:
        service = PhotoService(db)
        photos = service.import_folder(request.folder_path, request.recursive)
        return photos
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=PhotoListResponse)
async def get_photos(
    skip: int = 0,
    limit: int = 100,
    order_by: str = "taken_at",
    ascending: bool = False,
    db: Session = Depends(get_db)
):
    """Get photos with pagination"""
    service = PhotoService(db)
    photos = service.get_photos(skip, limit, order_by, ascending)
    total = db.query(Photo).count()
    
    return PhotoListResponse(
        photos=photos,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{photo_id}", response_model=PhotoResponse)
async def get_photo(
    photo_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific photo"""
    service = PhotoService(db)
    photo = service.get_photo(photo_id)
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return photo


@router.delete("/{photo_id}")
async def delete_photo(
    photo_id: int,
    delete_file: bool = False,
    db: Session = Depends(get_db)
):
    """Delete a photo"""
    service = PhotoService(db)
    success = service.delete_photo(photo_id, delete_file)
    
    if not success:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return {"message": "Photo deleted successfully"}


@router.get("/duplicates/find")
async def find_duplicates(
    threshold: int = 5,
    db: Session = Depends(get_db)
):
    """Find duplicate photos"""
    service = PhotoService(db)
    duplicates = service.find_duplicates(threshold)
    
    result = []
    for group in duplicates:
        result.append([PhotoResponse.from_orm(photo) for photo in group])
    
    return {"duplicate_groups": result, "total_groups": len(result)}
