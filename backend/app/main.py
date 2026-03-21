from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.models.simple_photo import init_db, get_db, SimplePhoto as Photo
from app.services.photo_service import PhotoService
from pathlib import Path
import shutil
import tempfile
from sqlalchemy.orm import Session

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Offline web-based intelligent photo archive with AI-powered face recognition"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DIRECT ENDPOINTS - NO ROUTER
@app.post("/api/v1/photos/upload")
async def upload_photo_direct(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """DIRECT UPLOAD - WORKING VERSION"""
    print(f"📤 Upload request received: {file.filename}")
    
    try:
        # Save file temporarily
        print("💾 Saving temporary file...")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        print(f"📁 File saved to: {tmp_path}")
        
        # Import photo
        print("🔄 Importing photo to database...")
        service = PhotoService(db)
        photo = service.import_photo(tmp_path)
        
        print(f"📊 Import result: {photo}")
        
        if photo:
            result = {
                "id": photo.id,
                "file_name": photo.file_name,
                "file_path": photo.file_path,
                "processed": photo.processed,
                "imported_at": photo.imported_at.isoformat()
            }
            print(f"✅ SUCCESS: {result}")
            return result
        else:
            print("❌ Failed to import photo")
            raise HTTPException(status_code=400, detail="Failed to import photo")
            
    except Exception as e:
        print(f"💥 Upload error: {e}")
        print(f"📍 Error type: {type(e)}")
        print("🔥 FULL ERROR TRACEBACK:")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/photos")
async def get_photos_direct(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """DIRECT GET PHOTOS - WORKING VERSION"""
    service = PhotoService(db)
    photos = service.get_photos(skip, limit)
    total = service.get_photo_count()
    
    return {
        "photos": photos,
        "total": total,
        "skip": skip,
        "limit": limit
    }

if settings.THUMBNAILS_DIR.exists():
    app.mount("/thumbnails", StaticFiles(directory=str(settings.THUMBNAILS_DIR)), name="thumbnails")


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()
    print(f"{settings.APP_NAME} v{settings.APP_VERSION} started")
    print(f"Database initialized at {settings.DATABASE_URL}")


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/stats")
async def get_stats():
    return {
        "totalPhotos": 10,
        "totalPeople": 2,
        "thisMonth": 5,
        "processing": 80
    }


@app.get("/api/v1/photos")
async def get_photos_simple():
    return [{"id": 1, "url": "test.jpg", "file_name": "test.jpg"}]
