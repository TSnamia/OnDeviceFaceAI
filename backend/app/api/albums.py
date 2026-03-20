from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.models.database import get_db, Album, Photo

router = APIRouter(prefix="/albums", tags=["albums"])


class AlbumCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    album_type: Optional[str] = None
    is_smart: bool = False


class AlbumUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    album_type: Optional[str] = None
    is_smart: Optional[bool] = None
    cover_photo_id: Optional[int] = None


class AlbumResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    album_type: Optional[str] = None
    is_smart: bool
    photo_count: int
    cover_photo_id: Optional[int] = None
    cover_thumbnail_path: Optional[str] = None

    class Config:
        from_attributes = True


class AddAlbumPhotosRequest(BaseModel):
    photo_ids: List[int]
    cover_photo_id: Optional[int] = None


@router.get("/", response_model=List[AlbumResponse])
async def list_albums(db: Session = Depends(get_db)):
    albums = db.query(Album).order_by(Album.id.desc()).all()
    from app.api.photos import PhotoResponse

    out: List[AlbumResponse] = []
    for a in albums:
        cover_thumb = None
        if a.cover_photo_id:
            cover_photo = db.query(Photo).filter(Photo.id == a.cover_photo_id).first()
            cover_thumb = cover_photo.thumbnail_path if cover_photo else None
        if not cover_thumb and a.photos:
            cover_thumb = a.photos[0].thumbnail_path

        out.append(
            AlbumResponse(
                id=a.id,
                name=a.name,
                description=a.description,
                album_type=a.album_type,
                is_smart=a.is_smart,
                photo_count=a.photo_count or 0,
                cover_photo_id=a.cover_photo_id,
                cover_thumbnail_path=cover_thumb,
            )
        )
    return out


@router.post("/", response_model=AlbumResponse)
async def create_album(request: AlbumCreateRequest, db: Session = Depends(get_db)):
    album = Album(
        name=request.name,
        description=request.description,
        album_type=request.album_type,
        is_smart=request.is_smart,
        smart_rules=None,
        photo_count=0,
        cover_photo_id=None,
    )
    db.add(album)
    db.commit()
    db.refresh(album)
    return AlbumResponse(
        id=album.id,
        name=album.name,
        description=album.description,
        album_type=album.album_type,
        is_smart=album.is_smart,
        photo_count=0,
        cover_photo_id=album.cover_photo_id,
        cover_thumbnail_path=None,
    )


@router.get("/{album_id}", response_model=AlbumResponse)
async def get_album(album_id: int, db: Session = Depends(get_db)):
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    cover_thumb = None
    if album.cover_photo_id:
        cover_photo = db.query(Photo).filter(Photo.id == album.cover_photo_id).first()
        cover_thumb = cover_photo.thumbnail_path if cover_photo else None

    if not cover_thumb and album.photos:
        cover_thumb = album.photos[0].thumbnail_path

    return AlbumResponse(
        id=album.id,
        name=album.name,
        description=album.description,
        album_type=album.album_type,
        is_smart=album.is_smart,
        photo_count=album.photo_count or 0,
        cover_photo_id=album.cover_photo_id,
        cover_thumbnail_path=cover_thumb,
    )


@router.put("/{album_id}", response_model=AlbumResponse)
async def update_album(album_id: int, request: AlbumUpdateRequest, db: Session = Depends(get_db)):
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    for field, value in request.model_dump().items():
        if value is not None:
            setattr(album, field, value)

    db.commit()
    db.refresh(album)
    # Reuse the same serialization logic as get_album
    return await get_album(album_id, db)


@router.get("/{album_id}/photos", response_model=dict)
async def list_album_photos(album_id: int, db: Session = Depends(get_db)):
    from app.api.photos import PhotoResponse

    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    photos = db.query(Photo).join(Photo.albums).filter(Album.id == album_id).all()
    return {
        "album_id": album_id,
        "photos": [PhotoResponse.from_orm(p) for p in photos],
        "total": len(photos),
    }


@router.post("/{album_id}/photos")
async def add_photos_to_album(album_id: int, request: AddAlbumPhotosRequest, db: Session = Depends(get_db)):
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    photos = db.query(Photo).filter(Photo.id.in_(request.photo_ids)).all()
    if not photos:
        return {"added": 0, "total": album.photo_count or 0}

    for p in photos:
        if p not in album.photos:
            album.photos.append(p)

    if request.cover_photo_id:
        album.cover_photo_id = request.cover_photo_id

    album.photo_count = len(album.photos)
    db.commit()
    db.refresh(album)
    return {"added": len(photos), "total": album.photo_count or 0}

