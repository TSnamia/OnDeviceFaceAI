import hashlib
import imagehash
from PIL import Image
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict
import shutil
import cv2
from sqlalchemy.orm import Session
from app.models.database import Photo, ProcessingJob
from app.core.config import settings
import json


class PhotoService:
    def __init__(self, db: Session):
        self.db = db
    
    def import_photo(self, file_path: str, copy_to_library: bool = True) -> Optional[Photo]:
        """
        Import a photo into the library
        
        Args:
            file_path: Path to the photo file
            copy_to_library: Whether to copy file to library or reference in place
            
        Returns:
            Photo object or None
        """
        try:
            path = Path(file_path)
            
            if not path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            if path.suffix.lower() not in settings.SUPPORTED_FORMATS:
                raise ValueError(f"Unsupported format: {path.suffix}")
            
            existing = self.db.query(Photo).filter(Photo.file_path == str(path)).first()
            if existing:
                return existing
            
            file_hash = self._compute_file_hash(path)
            existing_hash = self.db.query(Photo).filter(Photo.file_hash == file_hash).first()
            if existing_hash:
                return existing_hash
            
            if copy_to_library:
                dest_dir = settings.DATA_DIR / "photos" / datetime.now().strftime("%Y/%m")
                dest_dir.mkdir(parents=True, exist_ok=True)
                dest_path = dest_dir / path.name
                
                counter = 1
                while dest_path.exists():
                    dest_path = dest_dir / f"{path.stem}_{counter}{path.suffix}"
                    counter += 1
                
                shutil.copy2(path, dest_path)
                final_path = dest_path
            else:
                final_path = path
            
            metadata = self._extract_metadata(final_path)
            phash = self._compute_phash(final_path)
            
            # Convert datetime to string for JSON serialization
            metadata_json = metadata.copy()
            if 'taken_at' in metadata_json and metadata_json['taken_at']:
                metadata_json['taken_at'] = metadata_json['taken_at'].isoformat()
            
            photo = Photo(
                file_path=str(final_path),
                file_name=final_path.name,
                file_size=final_path.stat().st_size,
                file_hash=file_hash,
                phash=phash,
                width=metadata.get('width'),
                height=metadata.get('height'),
                format=metadata.get('format'),
                taken_at=metadata.get('taken_at'),
                modified_at=datetime.fromtimestamp(final_path.stat().st_mtime),
                latitude=metadata.get('latitude'),
                longitude=metadata.get('longitude'),
                camera_make=metadata.get('camera_make'),
                camera_model=metadata.get('camera_model'),
                metadata_json=metadata_json
            )
            
            self.db.add(photo)
            self.db.commit()
            self.db.refresh(photo)
            
            self._create_thumbnails(photo)
            
            job = ProcessingJob(
                job_type='process_photo',
                photo_id=photo.id,
                status='pending'
            )
            self.db.add(job)
            self.db.commit()
            
            return photo
            
        except Exception as e:
            print(f"Error importing photo {file_path}: {e}")
            self.db.rollback()
            return None
    
    def import_folder(self, folder_path: str, recursive: bool = True) -> List[Photo]:
        """
        Import all photos from a folder
        
        Args:
            folder_path: Path to folder
            recursive: Whether to scan subfolders
            
        Returns:
            List of imported Photo objects
        """
        photos = []
        path = Path(folder_path)
        
        if not path.exists() or not path.is_dir():
            return photos
        
        pattern = "**/*" if recursive else "*"
        
        for file_path in path.glob(pattern):
            if file_path.is_file() and file_path.suffix.lower() in settings.SUPPORTED_FORMATS:
                photo = self.import_photo(str(file_path))
                if photo:
                    photos.append(photo)
        
        return photos
    
    def get_photo(self, photo_id: int) -> Optional[Photo]:
        """Get photo by ID"""
        return self.db.query(Photo).filter(Photo.id == photo_id).first()
    
    def get_photos(
        self,
        skip: int = 0,
        limit: int = 100,
        order_by: str = 'taken_at',
        ascending: bool = False
    ) -> List[Photo]:
        """Get photos with pagination"""
        query = self.db.query(Photo)
        
        order_column = getattr(Photo, order_by, Photo.taken_at)
        if ascending:
            query = query.order_by(order_column.asc())
        else:
            query = query.order_by(order_column.desc())
        
        return query.offset(skip).limit(limit).all()
    
    def delete_photo(self, photo_id: int, delete_file: bool = False) -> bool:
        """Delete a photo"""
        try:
            photo = self.get_photo(photo_id)
            if not photo:
                return False
            
            if delete_file and Path(photo.file_path).exists():
                Path(photo.file_path).unlink()
            
            if photo.thumbnail_path and Path(photo.thumbnail_path).exists():
                Path(photo.thumbnail_path).unlink()
            
            if photo.preview_path and Path(photo.preview_path).exists():
                Path(photo.preview_path).unlink()
            
            self.db.delete(photo)
            self.db.commit()
            
            return True
            
        except Exception as e:
            print(f"Error deleting photo {photo_id}: {e}")
            self.db.rollback()
            return False
    
    def find_duplicates(self, threshold: int = None) -> List[List[Photo]]:
        """
        Find duplicate photos using perceptual hashing
        
        Args:
            threshold: Hamming distance threshold
            
        Returns:
            List of duplicate groups
        """
        if threshold is None:
            threshold = settings.PHASH_THRESHOLD
        
        photos = self.db.query(Photo).filter(Photo.phash.isnot(None)).all()
        
        duplicates = []
        processed = set()
        
        for i, photo1 in enumerate(photos):
            if photo1.id in processed:
                continue
            
            group = [photo1]
            hash1 = imagehash.hex_to_hash(photo1.phash)
            
            for photo2 in photos[i+1:]:
                if photo2.id in processed:
                    continue
                
                hash2 = imagehash.hex_to_hash(photo2.phash)
                distance = hash1 - hash2
                
                if distance <= threshold:
                    group.append(photo2)
                    processed.add(photo2.id)
            
            if len(group) > 1:
                duplicates.append(group)
                processed.add(photo1.id)
        
        return duplicates
    
    def _compute_file_hash(self, file_path: Path) -> str:
        """Compute SHA256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def _compute_phash(self, file_path: Path) -> str:
        """Compute perceptual hash"""
        try:
            img = Image.open(file_path)
            phash = imagehash.phash(img)
            return str(phash)
        except Exception as e:
            print(f"Error computing phash for {file_path}: {e}")
            return None
    
    def _extract_metadata(self, file_path: Path) -> Dict:
        """Extract EXIF and other metadata from image"""
        metadata = {}
        
        try:
            from PIL.ExifTags import TAGS, GPSTAGS
            
            img = Image.open(file_path)
            
            metadata['width'] = img.width
            metadata['height'] = img.height
            metadata['format'] = img.format
            
            exif = img.getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag = TAGS.get(tag_id, tag_id)
                    
                    if tag == 'DateTime':
                        try:
                            metadata['taken_at'] = datetime.strptime(str(value), '%Y:%m:%d %H:%M:%S')
                        except:
                            pass
                    elif tag == 'Make':
                        metadata['camera_make'] = str(value)
                    elif tag == 'Model':
                        metadata['camera_model'] = str(value)
                    elif tag == 'GPSInfo':
                        gps_data = {}
                        for gps_tag_id in value:
                            gps_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                            gps_data[gps_tag] = value[gps_tag_id]
                        
                        lat, lon = self._parse_gps(gps_data)
                        if lat and lon:
                            metadata['latitude'] = lat
                            metadata['longitude'] = lon
            
        except Exception as e:
            print(f"Error extracting metadata from {file_path}: {e}")
        
        return metadata
    
    def _parse_gps(self, gps_data: Dict) -> tuple:
        """Parse GPS coordinates from EXIF"""
        try:
            lat = gps_data.get('GPSLatitude')
            lat_ref = gps_data.get('GPSLatitudeRef')
            lon = gps_data.get('GPSLongitude')
            lon_ref = gps_data.get('GPSLongitudeRef')
            
            if lat and lon:
                lat_decimal = lat[0] + lat[1] / 60 + lat[2] / 3600
                lon_decimal = lon[0] + lon[1] / 60 + lon[2] / 3600
                
                if lat_ref == 'S':
                    lat_decimal = -lat_decimal
                if lon_ref == 'W':
                    lon_decimal = -lon_decimal
                
                return lat_decimal, lon_decimal
        except:
            pass
        
        return None, None
    
    def _create_thumbnails(self, photo: Photo):
        """Create thumbnail and preview images"""
        try:
            img = Image.open(photo.file_path)
            
            thumb_dir = settings.THUMBNAILS_DIR / str(photo.id)
            thumb_dir.mkdir(parents=True, exist_ok=True)
            
            thumb = img.copy()
            thumb.thumbnail(settings.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
            thumb_path = thumb_dir / "thumbnail.jpg"
            thumb.save(thumb_path, "JPEG", quality=85)
            
            preview = img.copy()
            preview.thumbnail(settings.PREVIEW_SIZE, Image.Resampling.LANCZOS)
            preview_path = thumb_dir / "preview.jpg"
            preview.save(preview_path, "JPEG", quality=90)
            
            photo.thumbnail_path = str(thumb_path)
            photo.preview_path = str(preview_path)
            self.db.commit()
            
        except Exception as e:
            print(f"Error creating thumbnails for photo {photo.id}: {e}")
