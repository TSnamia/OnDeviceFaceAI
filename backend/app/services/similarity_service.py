import numpy as np
from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.database import Photo, Embedding
import faiss


class SimilarityService:
    def __init__(self, db: Session):
        self.db = db
    
    def find_similar_photos(
        self, 
        photo_id: int, 
        limit: int = 20, 
        threshold: float = 0.8
    ) -> Optional[List[Dict]]:
        """
        Find photos similar to the given photo using CLIP embeddings
        
        Args:
            photo_id: Source photo ID
            limit: Maximum number of results
            threshold: Similarity threshold (0-1)
            
        Returns:
            List of similar photos with similarity scores
        """
        # Get source photo embedding
        source_photo = self.db.query(Photo).filter(Photo.id == photo_id).first()
        if not source_photo or not source_photo.clip_embedding_id:
            return None
        
        source_embedding = self.db.query(Embedding).filter(
            Embedding.id == source_photo.clip_embedding_id
        ).first()
        
        if not source_embedding or not source_embedding.embedding:
            return None
        
        # Get all other photo embeddings
        all_embeddings = self.db.query(Embedding, Photo).join(
            Photo, Photo.clip_embedding_id == Embedding.id
        ).filter(
            Photo.id != photo_id,
            Embedding.embedding_type == 'clip'
        ).all()
        
        if not all_embeddings:
            return []
        
        # Calculate similarities
        source_vec = np.frombuffer(source_embedding.embedding, dtype=np.float32)
        source_vec = source_vec / np.linalg.norm(source_vec)  # Normalize
        
        similarities = []
        for embedding, photo in all_embeddings:
            if not embedding.embedding:
                continue
            
            vec = np.frombuffer(embedding.embedding, dtype=np.float32)
            vec = vec / np.linalg.norm(vec)
            
            # Cosine similarity
            similarity = float(np.dot(source_vec, vec))
            
            if similarity >= threshold:
                similarities.append({
                    'photo_id': photo.id,
                    'file_name': photo.file_name,
                    'file_path': photo.file_path,
                    'thumbnail_path': photo.thumbnail_path,
                    'similarity': similarity,
                    'taken_at': photo.taken_at
                })
        
        # Sort by similarity
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        
        return similarities[:limit]
    
    def find_all_duplicates(self, threshold: float = 0.95) -> List[List[Dict]]:
        """
        Find all potential duplicate photos in the library
        
        Args:
            threshold: Similarity threshold (higher = more strict)
            
        Returns:
            List of duplicate groups
        """
        # Get all photos with embeddings
        photos_with_embeddings = self.db.query(Photo, Embedding).join(
            Embedding, Photo.clip_embedding_id == Embedding.id
        ).filter(
            Embedding.embedding_type == 'clip',
            Embedding.embedding.isnot(None)
        ).all()
        
        if len(photos_with_embeddings) < 2:
            return []
        
        # Build vectors
        vectors = []
        photo_data = []
        for photo, embedding in photos_with_embeddings:
            vec = np.frombuffer(embedding.embedding, dtype=np.float32)
            vec = vec / np.linalg.norm(vec)
            vectors.append(vec)
            photo_data.append({
                'id': photo.id,
                'file_name': photo.file_name,
                'file_path': photo.file_path,
                'file_size': photo.file_size,
                'taken_at': photo.taken_at
            })
        
        vectors = np.array(vectors, dtype=np.float32)
        
        # Find duplicates
        duplicate_groups = []
        processed = set()
        
        for i in range(len(vectors)):
            if i in processed:
                continue
            
            group = [photo_data[i]]
            processed.add(i)
            
            for j in range(i + 1, len(vectors)):
                if j in processed:
                    continue
                
                similarity = float(np.dot(vectors[i], vectors[j]))
                if similarity >= threshold:
                    group.append(photo_data[j])
                    processed.add(j)
            
            if len(group) > 1:
                duplicate_groups.append(group)
        
        return duplicate_groups
    
    def search_by_color(self, color: str, limit: int = 50) -> List[Dict]:
        """
        Search photos by dominant color (placeholder - needs color extraction)
        
        Args:
            color: Color name or hex code
            limit: Maximum results
            
        Returns:
            List of photos
        """
        # TODO: Implement color extraction and indexing
        # For now, return empty list
        return []
