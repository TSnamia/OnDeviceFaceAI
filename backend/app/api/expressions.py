from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db, Photo
from ai_pipeline.expression.expression_detector import get_expression_detector

router = APIRouter()


@router.get("/photos/{photo_id}/expressions")
async def detect_photo_expressions(
    photo_id: int,
    db: Session = Depends(get_db)
):
    """
    Detect facial expressions in a photo
    
    Args:
        photo_id: Photo ID
    """
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    detector = get_expression_detector()
    expressions = detector.detect_expressions(photo.file_path)
    
    return {
        "photo_id": photo_id,
        "expressions": expressions,
        "count": len(expressions)
    }


@router.get("/photos/filter/expression")
async def filter_by_expression(
    expression: str = Query(..., description="Expression to filter by (happy, sad, neutral, etc.)"),
    confidence: float = Query(0.5, ge=0.0, le=1.0),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Filter photos by facial expression
    
    Args:
        expression: Target expression (happy, sad, neutral, angry, surprise)
        confidence: Minimum confidence threshold
        skip: Number of records to skip
        limit: Maximum number of results
    """
    # Get all processed photos
    photos = db.query(Photo).filter(Photo.processed == True).offset(skip).limit(limit * 2).all()
    
    detector = get_expression_detector()
    matching_photos = []
    
    for photo in photos:
        expressions = detector.detect_expressions(photo.file_path)
        
        for expr in expressions:
            if expr['expression'] == expression and expr['confidence'] >= confidence:
                matching_photos.append({
                    'photo': photo,
                    'expression': expr['expression'],
                    'confidence': expr['confidence']
                })
                break
        
        if len(matching_photos) >= limit:
            break
    
    return {
        "photos": [p['photo'] for p in matching_photos],
        "total": len(matching_photos),
        "expression": expression,
        "confidence_threshold": confidence
    }


@router.get("/photos/smiling")
async def get_smiling_photos(
    threshold: float = Query(0.6, ge=0.0, le=1.0),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get photos with smiling faces
    
    Args:
        threshold: Smile confidence threshold
        skip: Number of records to skip
        limit: Maximum number of results
    """
    photos = db.query(Photo).filter(Photo.processed == True).offset(skip).limit(limit * 2).all()
    
    detector = get_expression_detector()
    smiling_photos = []
    
    for photo in photos:
        if detector.is_smiling(photo.file_path, threshold):
            smiling_photos.append(photo)
        
        if len(smiling_photos) >= limit:
            break
    
    return {
        "photos": smiling_photos,
        "total": len(smiling_photos),
        "threshold": threshold
    }
