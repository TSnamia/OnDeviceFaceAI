#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models.database import SessionLocal, Photo, ProcessingJob
from app.services.photo_service import PhotoService
from app.services.face_service import FaceService
from sqlalchemy import and_
from tqdm import tqdm
import argparse


def process_pending_photos(limit: int = None):
    """Process photos that haven't been processed yet"""
    db = SessionLocal()
    
    try:
        query = db.query(Photo).filter(Photo.processed == False)
        
        if limit:
            query = query.limit(limit)
        
        photos = query.all()
        
        if not photos:
            print("No pending photos to process")
            return
        
        print(f"Processing {len(photos)} photos...")
        
        face_service = FaceService(db)
        
        for photo in tqdm(photos, desc="Processing photos"):
            try:
                faces = face_service.detect_faces_in_photo(photo.id)
                
                photo.processed = True
                db.commit()
                
            except Exception as e:
                print(f"\nError processing photo {photo.id}: {e}")
                photo.processing_error = str(e)
                db.commit()
        
        print("\n✓ Photo processing completed")
        
        print("\nClustering faces...")
        cluster_map = face_service.cluster_all_faces()
        print(f"✓ Clustered {len(cluster_map)} faces into {len(set(cluster_map.values()))} people")
        
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description='Process pending photos')
    parser.add_argument('--limit', type=int, help='Limit number of photos to process')
    parser.add_argument('--recluster', action='store_true', help='Re-cluster all faces')
    
    args = parser.parse_args()
    
    print("🔄 OnDeviceFaceAI Photo Processor")
    print("=" * 50)
    
    if args.recluster:
        db = SessionLocal()
        try:
            print("\nRe-clustering all faces...")
            face_service = FaceService(db)
            cluster_map = face_service.cluster_all_faces()
            print(f"✓ Clustered {len(cluster_map)} faces into {len(set(cluster_map.values()))} people")
        finally:
            db.close()
    else:
        process_pending_photos(args.limit)


if __name__ == "__main__":
    main()
