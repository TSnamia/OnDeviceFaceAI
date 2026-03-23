from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pathlib import Path
import cv2
import numpy as np
from insightface.app import FaceAnalysis
import json
from datetime import datetime

# Database
Base = declarative_base()
engine = create_engine("sqlite:///database/photos.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Photo(Base):
    __tablename__ = 'photos'
    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    processed = Column(Boolean, default=False)
    imported_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# AI Model
face_app = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640, 640))

# FastAPI
app = FastAPI(title="Clean Photo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.post("/api/v1/photos/upload")
async def upload_photo(file: UploadFile = File(...), db: Session = Depends(get_db)):
    print(f"📤 Upload received: {file.filename}")
    
    # Save file
    upload_path = uploads_dir / file.filename
    with open(upload_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    print(f"✅ File saved: {upload_path}")
    
    # Create photo record
    photo = Photo(
        file_name=file.filename,
        file_path=f"uploads/{file.filename}",
        file_size=upload_path.stat().st_size,
        processed=False
    )
    
    db.add(photo)
    db.commit()
    db.refresh(photo)
    
    print(f"✅ Photo created in DB: ID {photo.id}")
    
    # AI Face Analysis
    print(f"🧠 Starting face analysis...")
    try:
        img = cv2.imread(str(upload_path))
        if img is not None:
            faces = face_app.get(img)
            print(f"🎯 Found {len(faces)} faces")
            
            if faces:
                photo.processed = True
                db.commit()
                print(f"✅ PROCESSED: {file.filename} - {len(faces)} faces")
                
                for i, face in enumerate(faces):
                    confidence = float(face.det_score)
                    print(f"  Face {i+1}: confidence={confidence:.3f}")
            else:
                print("❌ No faces found")
        else:
            print("❌ Cannot read image")
            
    except Exception as e:
        print(f"❌ Face analysis error: {e}")
    
    return {"id": photo.id, "file_name": photo.file_name, "processed": photo.processed}

@app.get("/api/v1/photos")
def get_photos(db: Session = Depends(get_db)):
    photos = db.query(Photo).all()
    # Convert to dict and remove SQLAlchemy state
    photo_list = []
    for photo in photos:
        photo_dict = {
            "id": photo.id,
            "file_name": photo.file_name,
            "file_path": photo.file_path,
            "file_size": photo.file_size,
            "processed": photo.processed,
            "imported_at": photo.imported_at.isoformat() if photo.imported_at else None
        }
        photo_list.append(photo_dict)
    
    print(f"📊 Returning {len(photo_list)} photos")
    return photo_list

@app.get("/api/v1/faces/people")
def get_people(db: Session = Depends(get_db)):
    return {"people": [], "total": 0}

@app.get("/")
async def root():
    return {"status": "clean photo api running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
