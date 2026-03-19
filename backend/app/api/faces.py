from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.models.database import get_db, Face, Person
from app.services.face_service import FaceService

router = APIRouter(prefix="/faces", tags=["faces"])


class FaceResponse(BaseModel):
    id: int
    photo_id: int
    person_id: Optional[int]
    bbox_x: float
    bbox_y: float
    bbox_width: float
    bbox_height: float
    confidence: float
    age: Optional[int]
    gender: Optional[str]
    
    class Config:
        from_attributes = True


class PersonResponse(BaseModel):
    id: int
    name: str
    cluster_id: int
    face_count: int
    thumbnail_path: Optional[str]
    is_verified: bool
    
    class Config:
        from_attributes = True


class RenamePersonRequest(BaseModel):
    name: str


class MergePeopleRequest(BaseModel):
    person_id1: int
    person_id2: int
    keep_name: Optional[str] = None


@router.post("/detect/{photo_id}", response_model=List[FaceResponse])
async def detect_faces(
    photo_id: int,
    db: Session = Depends(get_db)
):
    """Detect faces in a photo"""
    service = FaceService(db)
    faces = service.detect_faces_in_photo(photo_id)
    return faces


@router.post("/cluster-all")
async def cluster_all_faces(db: Session = Depends(get_db)):
    """Cluster all faces in the database"""
    service = FaceService(db)
    cluster_map = service.cluster_all_faces()
    
    return {
        "message": "Clustering completed",
        "faces_clustered": len(cluster_map),
        "clusters_created": len(set(cluster_map.values()))
    }


@router.get("/people", response_model=List[PersonResponse])
async def get_all_people(db: Session = Depends(get_db)):
    """Get all people"""
    service = FaceService(db)
    people = service.get_all_people()
    return people


@router.get("/people/{person_id}", response_model=PersonResponse)
async def get_person(
    person_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific person"""
    service = FaceService(db)
    person = service.get_person(person_id)
    
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    return person


@router.put("/people/{person_id}/rename", response_model=PersonResponse)
async def rename_person(
    person_id: int,
    request: RenamePersonRequest,
    db: Session = Depends(get_db)
):
    """Rename a person"""
    service = FaceService(db)
    person = service.rename_person(person_id, request.name)
    
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    return person


@router.post("/people/merge", response_model=PersonResponse)
async def merge_people(
    request: MergePeopleRequest,
    db: Session = Depends(get_db)
):
    """Merge two people"""
    service = FaceService(db)
    person = service.merge_people(
        request.person_id1,
        request.person_id2,
        request.keep_name
    )
    
    if not person:
        raise HTTPException(status_code=404, detail="One or both people not found")
    
    return person


@router.post("/people/{person_id}/split", response_model=List[PersonResponse])
async def split_person(
    person_id: int,
    db: Session = Depends(get_db)
):
    """Split a person cluster"""
    service = FaceService(db)
    people = service.split_person(person_id)
    
    if not people:
        raise HTTPException(status_code=404, detail="Person not found")
    
    return people


@router.get("/people/{person_id}/photos")
async def get_person_photos(
    person_id: int,
    db: Session = Depends(get_db)
):
    """Get all photos containing a person"""
    service = FaceService(db)
    photos = service.search_faces_by_person(person_id)
    
    return {"person_id": person_id, "photos": photos, "count": len(photos)}
