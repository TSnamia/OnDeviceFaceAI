import sys
from pathlib import Path
import time
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models.database import SessionLocal, Photo, ProcessingJob
from app.services.face_service import FaceService
from app.core.config import settings
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from ai_pipeline.semantic import get_clip_embedder


class PhotoProcessor:
    def __init__(self):
        self.running = False
        self.face_service = None
        self.clip_embedder = None
    
    def start(self):
        """Start the background processor"""
        self.running = True
        print("✓ Photo processor started")
        
        while self.running:
            try:
                self.process_pending_jobs()
                time.sleep(5)
            except KeyboardInterrupt:
                print("\n⏹ Stopping photo processor...")
                self.running = False
            except Exception as e:
                print(f"Error in processor loop: {e}")
                time.sleep(10)
    
    def process_pending_jobs(self):
        """Process pending jobs from the queue"""
        db = SessionLocal()
        
        try:
            jobs = db.query(ProcessingJob).filter(
                ProcessingJob.status == 'pending'
            ).limit(settings.BATCH_SIZE).all()
            
            if not jobs:
                return
            
            if self.face_service is None:
                self.face_service = FaceService(db)
            
            if self.clip_embedder is None:
                self.clip_embedder = get_clip_embedder()
            
            for job in jobs:
                try:
                    job.status = 'processing'
                    job.started_at = datetime.utcnow()
                    db.commit()
                    
                    if job.job_type == 'process_photo':
                        self.process_photo(job, db)
                    
                    job.status = 'completed'
                    job.completed_at = datetime.utcnow()
                    job.progress = 100.0
                    db.commit()
                    
                except Exception as e:
                    print(f"Error processing job {job.id}: {e}")
                    job.status = 'failed'
                    job.error_message = str(e)
                    job.completed_at = datetime.utcnow()
                    db.commit()
        
        finally:
            db.close()
    
    def process_photo(self, job: ProcessingJob, db):
        """Process a single photo"""
        photo = db.query(Photo).filter(Photo.id == job.photo_id).first()
        
        if not photo:
            raise ValueError(f"Photo {job.photo_id} not found")
        
        job.progress = 10.0
        db.commit()
        
        faces = self.face_service.detect_faces_in_photo(photo.id)
        print(f"  Detected {len(faces)} faces in photo {photo.id}")
        
        job.progress = 50.0
        db.commit()
        
        embedding = self.clip_embedder.get_image_embedding(photo.file_path)
        if embedding is not None:
            print(f"  Generated CLIP embedding for photo {photo.id}")
        
        job.progress = 90.0
        db.commit()
        
        photo.processed = True
        db.commit()


def main():
    print("🤖 OnDeviceFaceAI Background Processor")
    print("=" * 50)
    print("Press Ctrl+C to stop\n")
    
    processor = PhotoProcessor()
    processor.start()


if __name__ == "__main__":
    main()
