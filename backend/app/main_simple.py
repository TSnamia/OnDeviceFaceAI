from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pathlib import Path
import shutil
import tempfile
from datetime import datetime

# Simple database setup
Base = declarative_base()

class Photo(Base):
    __tablename__ = 'photos'
    
    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    processed = Column(Boolean, default=False)
    imported_at = Column(DateTime, default=datetime.utcnow)

# Database
engine = create_engine("sqlite:///./database/photos.db")
Base.metadata.drop_all(bind=engine)  # Clean start
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# FastAPI app
app = FastAPI(title="Simple Photo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory and mount static files
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.post("/api/v1/photos/upload")
async def upload_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    print(f"📤 Upload received: {file.filename}")
    
    try:
        # Save file to uploads directory
        upload_path = uploads_dir / file.filename
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create photo record
        photo = Photo(
            file_name=file.filename,
            file_path=f"uploads/{file.filename}",  # Relative path for frontend
            file_size=upload_path.stat().st_size,
            processed=False
        )
        
        db.add(photo)
        db.commit()
        db.refresh(photo)
        
        return {
            "id": photo.id,
            "file_name": photo.file_name,
            "processed": photo.processed
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/photos")
async def get_photos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    photos = db.query(Photo).offset(skip).limit(limit).all()
    total = db.query(Photo).count()
    
    return {
        "photos": photos,
        "total": total
    }

@app.get("/")
async def root():
    return {"status": "simple photo api running"}

@app.get("/api/v1/faces/people")
async def get_people(
    db: Session = Depends(get_db)
):
    """Get people - SIMPLIFIED"""
    # For now, return empty list - no face detection yet
    return {
        "people": [],
        "total": 0
    }
