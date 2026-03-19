from fastapi import APIRouter
from .photos import router as photos_router
from .faces import router as faces_router
from .export import router as export_router
from .groups import router as groups_router

api_router = APIRouter()

api_router.include_router(photos_router)
api_router.include_router(faces_router)
api_router.include_router(export_router)
api_router.include_router(groups_router)

__all__ = ['api_router']
