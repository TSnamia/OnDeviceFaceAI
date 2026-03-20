from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import threading

from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
_auth_lock = threading.Lock()
_private_album_password = settings.PRIVATE_ALBUM_PASSWORD


class UnlockPrivateAlbumsRequest(BaseModel):
    password: str


class UnlockPrivateAlbumsResponse(BaseModel):
    unlocked: bool


@router.post("/private-albums/unlock", response_model=UnlockPrivateAlbumsResponse)
async def unlock_private_albums(request: UnlockPrivateAlbumsRequest):
    if request.password != _private_album_password:
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"unlocked": True}


class UpdatePrivateAlbumsPasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.put("/private-albums/password")
async def update_private_albums_password(request: UpdatePrivateAlbumsPasswordRequest):
    global _private_album_password

    if not request.new_password or len(request.new_password) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters")

    with _auth_lock:
        if request.current_password != _private_album_password:
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        _private_album_password = request.new_password

    return {"updated": True}

