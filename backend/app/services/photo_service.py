from pathlib import Path
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.simple_photo import Photo


class PhotoService:
    def __init__(self, db: Session):
        self.db = db
    
    def import_photo(self, file_path: str, copy_to_library: bool = True) -> Optional[Photo]:
        """SIMPLE PHOTO IMPORT - NO PROCESSING"""
        path = Path(file_path)
        
        print(f"🔍 File path: {path}")
        print(f"🔍 File exists: {path.exists()}")
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Create basic photo record
        photo = Photo(
            file_name=path.name,
            file_path=str(path),
            file_size=path.stat().st_size,
            processed=False,
            imported_at=datetime.now()
        )
        
        print(f"📝 Photo object created: {photo}")
        
        self.db.add(photo)
        self.db.commit()
        self.db.refresh(photo)
        
        print(f"✅ Photo imported: {photo.id} - {photo.file_name}")
        return photo
    
    def get_photos(self, skip: int = 0, limit: int = 100):
        """Get all photos"""
        return self.db.query(Photo).offset(skip).limit(limit).all()
    
    def get_photo_count(self):
        """Get total photo count"""
        return self.db.query(Photo).count()
