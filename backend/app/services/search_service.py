import numpy as np
import faiss
from typing import List, Optional, Tuple
from pathlib import Path
from sqlalchemy.orm import Session
from app.models.database import Photo, Embedding
from app.core.config import settings
import pickle


class SearchService:
    def __init__(self, db: Session):
        self.db = db
        self.face_index = None
        self.clip_index = None
        self.face_id_map = []
        self.clip_id_map = []
    
    def initialize_face_index(self, dimension: int = 512):
        """Initialize FAISS index for face embeddings"""
        self.face_index = faiss.IndexFlatIP(dimension)
        if settings.USE_GPU and faiss.get_num_gpus() > 0:
            res = faiss.StandardGpuResources()
            self.face_index = faiss.index_cpu_to_gpu(res, 0, self.face_index)
    
    def initialize_clip_index(self, dimension: int = 512):
        """Initialize FAISS index for CLIP embeddings"""
        self.clip_index = faiss.IndexFlatIP(dimension)
        if settings.USE_GPU and faiss.get_num_gpus() > 0:
            res = faiss.StandardGpuResources()
            self.clip_index = faiss.index_cpu_to_gpu(res, 0, self.clip_index)
    
    def add_face_embedding(self, face_id: int, embedding: np.ndarray):
        """Add a face embedding to the index"""
        if self.face_index is None:
            self.initialize_face_index(len(embedding))
        
        embedding = np.array(embedding, dtype=np.float32).reshape(1, -1)
        
        embedding = embedding / np.linalg.norm(embedding)
        
        self.face_index.add(embedding)
        self.face_id_map.append(face_id)
    
    def add_clip_embedding(self, photo_id: int, embedding: np.ndarray):
        """Add a CLIP embedding to the index"""
        if self.clip_index is None:
            self.initialize_clip_index(len(embedding))
        
        embedding = np.array(embedding, dtype=np.float32).reshape(1, -1)
        
        embedding = embedding / np.linalg.norm(embedding)
        
        self.clip_index.add(embedding)
        self.clip_id_map.append(photo_id)
    
    def search_similar_faces(
        self,
        query_embedding: np.ndarray,
        k: int = 10,
        threshold: float = 0.6
    ) -> List[Tuple[int, float]]:
        """
        Search for similar faces
        
        Args:
            query_embedding: Query face embedding
            k: Number of results
            threshold: Similarity threshold
            
        Returns:
            List of (face_id, similarity) tuples
        """
        if self.face_index is None or self.face_index.ntotal == 0:
            return []
        
        query = np.array(query_embedding, dtype=np.float32).reshape(1, -1)
        query = query / np.linalg.norm(query)
        
        distances, indices = self.face_index.search(query, k)
        
        results = []
        for idx, dist in zip(indices[0], distances[0]):
            if idx < len(self.face_id_map) and dist >= threshold:
                results.append((self.face_id_map[idx], float(dist)))
        
        return results
    
    def search_similar_photos(
        self,
        query_embedding: np.ndarray,
        k: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Search for similar photos using CLIP embeddings
        
        Args:
            query_embedding: Query CLIP embedding
            k: Number of results
            
        Returns:
            List of (photo_id, similarity) tuples
        """
        if self.clip_index is None or self.clip_index.ntotal == 0:
            return []
        
        query = np.array(query_embedding, dtype=np.float32).reshape(1, -1)
        query = query / np.linalg.norm(query)
        
        distances, indices = self.clip_index.search(query, k)
        
        results = []
        for idx, dist in zip(indices[0], distances[0]):
            if idx < len(self.clip_id_map):
                results.append((self.clip_id_map[idx], float(dist)))
        
        return results
    
    def save_indexes(self):
        """Save FAISS indexes to disk"""
        if self.face_index is not None:
            if settings.USE_GPU and faiss.get_num_gpus() > 0:
                cpu_index = faiss.index_gpu_to_cpu(self.face_index)
                faiss.write_index(cpu_index, str(settings.FACE_INDEX_PATH))
            else:
                faiss.write_index(self.face_index, str(settings.FACE_INDEX_PATH))
            
            with open(str(settings.FACE_INDEX_PATH) + '.map', 'wb') as f:
                pickle.dump(self.face_id_map, f)
        
        if self.clip_index is not None:
            if settings.USE_GPU and faiss.get_num_gpus() > 0:
                cpu_index = faiss.index_gpu_to_cpu(self.clip_index)
                faiss.write_index(cpu_index, str(settings.CLIP_INDEX_PATH))
            else:
                faiss.write_index(self.clip_index, str(settings.CLIP_INDEX_PATH))
            
            with open(str(settings.CLIP_INDEX_PATH) + '.map', 'wb') as f:
                pickle.dump(self.clip_id_map, f)
    
    def load_indexes(self):
        """Load FAISS indexes from disk"""
        if settings.FACE_INDEX_PATH.exists():
            self.face_index = faiss.read_index(str(settings.FACE_INDEX_PATH))
            
            if settings.USE_GPU and faiss.get_num_gpus() > 0:
                res = faiss.StandardGpuResources()
                self.face_index = faiss.index_cpu_to_gpu(res, 0, self.face_index)
            
            map_path = Path(str(settings.FACE_INDEX_PATH) + '.map')
            if map_path.exists():
                with open(map_path, 'rb') as f:
                    self.face_id_map = pickle.load(f)
        
        if settings.CLIP_INDEX_PATH.exists():
            self.clip_index = faiss.read_index(str(settings.CLIP_INDEX_PATH))
            
            if settings.USE_GPU and faiss.get_num_gpus() > 0:
                res = faiss.StandardGpuResources()
                self.clip_index = faiss.index_cpu_to_gpu(res, 0, self.clip_index)
            
            map_path = Path(str(settings.CLIP_INDEX_PATH) + '.map')
            if map_path.exists():
                with open(map_path, 'rb') as f:
                    self.clip_id_map = pickle.load(f)
    
    def rebuild_face_index(self):
        """Rebuild face index from database"""
        from app.models.database import Face
        
        faces = self.db.query(Face).join(Embedding).all()
        
        if not faces:
            return
        
        self.face_index = None
        self.face_id_map = []
        
        for face in faces:
            if face.embedding:
                pass
    
    def rebuild_clip_index(self):
        """Rebuild CLIP index from database"""
        photos = self.db.query(Photo).filter(
            Photo.clip_embedding_id.isnot(None)
        ).all()
        
        if not photos:
            return
        
        self.clip_index = None
        self.clip_id_map = []
        
        for photo in photos:
            if photo.clip_embedding:
                pass


_search_service_instance = None


def get_search_service(db: Session) -> SearchService:
    """Get or create search service instance"""
    global _search_service_instance
    if _search_service_instance is None:
        _search_service_instance = SearchService(db)
        _search_service_instance.load_indexes()
    return _search_service_instance
