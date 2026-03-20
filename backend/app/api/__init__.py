from fastapi import APIRouter
from .photos import router as photos_router
from .faces import router as faces_router
from .export import router as export_router
from .groups import router as groups_router
from .similarity import router as similarity_router
from .expressions import router as expressions_router
from .processing import router as processing_router
from .auth import router as auth_router
from .albums import router as albums_router

api_router = APIRouter()

api_router.include_router(photos_router, tags=["photos"])
api_router.include_router(faces_router, tags=["faces"])
api_router.include_router(export_router)
api_router.include_router(groups_router)
api_router.include_router(similarity_router, tags=["similarity"])
api_router.include_router(expressions_router, tags=["expressions"])
api_router.include_router(processing_router, tags=["processing"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(albums_router, tags=["albums"])

__all__ = ['api_router']
