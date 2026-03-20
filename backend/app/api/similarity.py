from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.models.database import get_db, Photo, Embedding
from app.services.similarity_service import SimilarityService
import numpy as np

router = APIRouter()


@router.get("/photos/{photo_id}/similar")
async def find_similar_photos(
    photo_id: int,
    limit: int = Query(default=20, le=100),
    threshold: float = Query(default=0.8, ge=0.0, le=1.0),
    db: Session = Depends(get_db)
):
    """
    Find similar photos based on visual similarity
    
    Args:
        photo_id: Source photo ID
        limit: Maximum number of similar photos to return
        threshold: Similarity threshold (0-1, higher = more similar)
    """
    service = SimilarityService(db)
    similar_photos = service.find_similar_photos(photo_id, limit, threshold)
    
    if similar_photos is None:
        raise HTTPException(status_code=404, detail="Photo not found or no embeddings available")
    
    return {
        "source_photo_id": photo_id,
        "similar_photos": similar_photos,
        "count": len(similar_photos)
    }


@router.post("/photos/find-duplicates")
async def find_duplicate_photos(
    threshold: float = Query(default=0.95, ge=0.0, le=1.0),
    db: Session = Depends(get_db)
):
    """
    Find potential duplicate photos across the entire library
    
    Args:
        threshold: Similarity threshold (higher = more strict)
    """
    service = SimilarityService(db)
    duplicates = service.find_all_duplicates(threshold)
    
    return {
        "duplicate_groups": duplicates,
        "total_groups": len(duplicates)
    }


@router.get("/photos/by-color")
async def search_by_color(
    color: str = Query(..., description="Color name or hex code (e.g., 'blue' or '#0000FF')"),
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db)
):
    """
    Search photos by dominant color
    
    Args:
        color: Color to search for (name or hex)
        limit: Maximum results
    """
    service = SimilarityService(db)
    photos = service.search_by_color(color, limit)
    
    return {
        "color": color,
        "photos": photos,
        "count": len(photos)
    }
