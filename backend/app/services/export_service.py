import shutil
from pathlib import Path
from typing import List, Optional, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.database import Photo, Person, Album, Event
from app.core.config import settings


class ExportService:
    def __init__(self, db: Session):
        self.db = db
    
    def export_photos(
        self,
        photo_ids: List[int],
        destination: str,
        organize_by: str = 'date',
        preserve_structure: bool = False
    ) -> Dict:
        """
        Export photos to a destination folder
        
        Args:
            photo_ids: List of photo IDs to export
            destination: Destination folder path
            organize_by: Organization method ('date', 'person', 'event', 'album', 'flat')
            preserve_structure: Keep original folder structure
            
        Returns:
            Export statistics
        """
        dest_path = Path(destination)
        dest_path.mkdir(parents=True, exist_ok=True)
        
        photos = self.db.query(Photo).filter(Photo.id.in_(photo_ids)).all()
        
        exported_count = 0
        failed_count = 0
        total_size = 0
        
        for photo in photos:
            try:
                source = Path(photo.file_path)
                
                if not source.exists():
                    failed_count += 1
                    continue
                
                if organize_by == 'date':
                    dest_file = self._organize_by_date(photo, dest_path)
                elif organize_by == 'person':
                    dest_file = self._organize_by_person(photo, dest_path)
                elif organize_by == 'event':
                    dest_file = self._organize_by_event(photo, dest_path)
                elif organize_by == 'album':
                    dest_file = self._organize_by_album(photo, dest_path)
                else:
                    dest_file = dest_path / source.name
                
                dest_file.parent.mkdir(parents=True, exist_ok=True)
                
                if dest_file.exists():
                    base = dest_file.stem
                    ext = dest_file.suffix
                    counter = 1
                    while dest_file.exists():
                        dest_file = dest_file.parent / f"{base}_{counter}{ext}"
                        counter += 1
                
                shutil.copy2(source, dest_file)
                
                exported_count += 1
                total_size += source.stat().st_size
                
            except Exception as e:
                print(f"Error exporting photo {photo.id}: {e}")
                failed_count += 1
        
        return {
            'exported': exported_count,
            'failed': failed_count,
            'total_size_mb': total_size / (1024 * 1024),
            'destination': str(dest_path)
        }
    
    def export_by_person(
        self,
        person_id: int,
        destination: str
    ) -> Dict:
        """Export all photos of a specific person"""
        person = self.db.query(Person).filter(Person.id == person_id).first()
        
        if not person:
            raise ValueError(f"Person {person_id} not found")
        
        photos = self.db.query(Photo).join(Photo.people).filter(
            Person.id == person_id
        ).all()
        
        photo_ids = [p.id for p in photos]
        
        dest_path = Path(destination) / person.name
        
        return self.export_photos(photo_ids, str(dest_path), organize_by='date')
    
    def export_by_event(
        self,
        event_id: int,
        destination: str
    ) -> Dict:
        """Export all photos from a specific event"""
        event = self.db.query(Event).filter(Event.id == event_id).first()
        
        if not event:
            raise ValueError(f"Event {event_id} not found")
        
        photos = self.db.query(Photo).join(Photo.events).filter(
            Event.id == event_id
        ).all()
        
        photo_ids = [p.id for p in photos]
        
        event_name = event.name or f"Event_{event.start_time.strftime('%Y%m%d')}"
        dest_path = Path(destination) / event_name
        
        return self.export_photos(photo_ids, str(dest_path), organize_by='flat')
    
    def export_by_album(
        self,
        album_id: int,
        destination: str
    ) -> Dict:
        """Export all photos from a specific album"""
        album = self.db.query(Album).filter(Album.id == album_id).first()
        
        if not album:
            raise ValueError(f"Album {album_id} not found")
        
        photos = self.db.query(Photo).join(Photo.albums).filter(
            Album.id == album_id
        ).all()
        
        photo_ids = [p.id for p in photos]
        
        dest_path = Path(destination) / album.name
        
        return self.export_photos(photo_ids, str(dest_path), organize_by='flat')
    
    def export_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime,
        destination: str
    ) -> Dict:
        """Export photos within a date range"""
        photos = self.db.query(Photo).filter(
            Photo.taken_at >= start_date,
            Photo.taken_at <= end_date
        ).all()
        
        photo_ids = [p.id for p in photos]
        
        return self.export_photos(photo_ids, destination, organize_by='date')
    
    def _organize_by_date(self, photo: Photo, base_path: Path) -> Path:
        """Organize photo by date"""
        if photo.taken_at:
            date_folder = photo.taken_at.strftime('%Y/%m')
        else:
            date_folder = 'Unknown'
        
        return base_path / date_folder / Path(photo.file_path).name
    
    def _organize_by_person(self, photo: Photo, base_path: Path) -> Path:
        """Organize photo by person"""
        if photo.people:
            person_name = photo.people[0].name
        else:
            person_name = 'Unknown'
        
        return base_path / person_name / Path(photo.file_path).name
    
    def _organize_by_event(self, photo: Photo, base_path: Path) -> Path:
        """Organize photo by event"""
        if photo.events:
            event = photo.events[0]
            event_name = event.name or f"Event_{event.start_time.strftime('%Y%m%d')}"
        else:
            event_name = 'No Event'
        
        return base_path / event_name / Path(photo.file_path).name
    
    def _organize_by_album(self, photo: Photo, base_path: Path) -> Path:
        """Organize photo by album"""
        if photo.albums:
            album_name = photo.albums[0].name
        else:
            album_name = 'No Album'
        
        return base_path / album_name / Path(photo.file_path).name
    
    def create_export_manifest(
        self,
        photo_ids: List[int],
        destination: str
    ):
        """Create a JSON manifest of exported photos"""
        import json
        
        photos = self.db.query(Photo).filter(Photo.id.in_(photo_ids)).all()
        
        manifest = {
            'export_date': datetime.utcnow().isoformat(),
            'total_photos': len(photos),
            'photos': []
        }
        
        for photo in photos:
            manifest['photos'].append({
                'id': photo.id,
                'file_name': photo.file_name,
                'taken_at': photo.taken_at.isoformat() if photo.taken_at else None,
                'width': photo.width,
                'height': photo.height,
                'people': [p.name for p in photo.people],
                'tags': [t.name for t in photo.tags],
                'location': {
                    'latitude': photo.latitude,
                    'longitude': photo.longitude,
                    'name': photo.location_name
                } if photo.latitude and photo.longitude else None
            })
        
        manifest_path = Path(destination) / 'export_manifest.json'
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        return manifest_path
