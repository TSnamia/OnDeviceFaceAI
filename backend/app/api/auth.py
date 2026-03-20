from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class UnlockPrivateAlbumsRequest(BaseModel):
    password: str


class UnlockPrivateAlbumsResponse(BaseModel):
    unlocked: bool


@router.post("/private-albums/unlock", response_model=UnlockPrivateAlbumsResponse)
async def unlock_private_albums(request: UnlockPrivateAlbumsRequest):
    if request.password != settings.PRIVATE_ALBUM_PASSWORD:
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"unlocked": True}

