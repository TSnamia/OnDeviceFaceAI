import numpy as np
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import Photo, Face, Person, Embedding
from app.core.config import settings
import sys
from pathlib import Path
sys.path.insert(0, str(Path(settings.BASE_DIR).parent))
from ai_pipeline.face_recognition import get_face_detector
from ai_pipeline.clustering import get_face_clusterer


class FaceService:
    def __init__(self, db: Session):
        self.db = db
        self.detector = None
        self.clusterer = None
    
    def _ensure_detector(self):
        """Lazy load face detector"""
        if self.detector is None:
            self.detector = get_face_detector()
    
    def _ensure_clusterer(self):
        """Lazy load face clusterer"""
        if self.clusterer is None:
            self.clusterer = get_face_clusterer()
    
    def detect_faces_in_photo(self, photo_id: int) -> List[Face]:
        """
        Detect faces in a photo
        
        Args:
            photo_id: Photo ID
            
        Returns:
            List of detected Face objects
        """
        self._ensure_detector()
        
        photo = self.db.query(Photo).filter(Photo.id == photo_id).first()
        if not photo:
            return []
        
        try:
            face_data_list = self.detector.detect_faces(photo.file_path)
            
            faces = []
            for face_data in face_data_list:
                embedding_obj = Embedding(
                    embedding_type='face',
                    vector_dim=len(face_data['embedding'])
                )
                self.db.add(embedding_obj)
                self.db.flush()
                
                face = Face(
                    photo_id=photo.id,
                    bbox_x=face_data['bbox']['x'],
                    bbox_y=face_data['bbox']['y'],
                    bbox_width=face_data['bbox']['width'],
                    bbox_height=face_data['bbox']['height'],
                    confidence=face_data['confidence'],
                    landmarks=face_data['landmarks'],
                    embedding_id=embedding_obj.id,
                    age=face_data.get('age'),
                    gender=face_data.get('gender')
                )
                
                self.db.add(face)
                faces.append(face)
            
            self.db.commit()
            
            for face in faces:
                self.db.refresh(face)
            
            return faces
            
        except Exception as e:
            print(f"Error detecting faces in photo {photo_id}: {e}")
            self.db.rollback()
            return []
    
    def cluster_all_faces(self) -> Dict[int, int]:
        """
        Cluster all faces in the database
        
        Returns:
            Dict mapping face_id to cluster_id
        """
        self._ensure_clusterer()
        
        faces = self.db.query(Face).join(Embedding).all()
        
        if not faces:
            return {}
        
        embeddings = []
        face_ids = []
        
        for face in faces:
            if face.embedding:
                embedding_data = self._get_embedding_vector(face.embedding_id)
                if embedding_data is not None:
                    embeddings.append(embedding_data)
                    face_ids.append(face.id)
        
        if not embeddings:
            return {}
        
        embeddings_array = np.array(embeddings)
        
        labels = self.clusterer.cluster_faces(embeddings_array)
        
        cluster_map = {}
        for face_id, label in zip(face_ids, labels):
            cluster_map[face_id] = int(label)
        
        self._update_face_clusters(cluster_map)
        
        return cluster_map
    
    def _update_face_clusters(self, cluster_map: Dict[int, int]):
        """Update face cluster assignments in database"""
        try:
            existing_people = {p.cluster_id: p for p in self.db.query(Person).all()}
            
            cluster_to_person = {}
            
            for face_id, cluster_id in cluster_map.items():
                if cluster_id == -1:
                    continue
                
                if cluster_id not in cluster_to_person:
                    if cluster_id in existing_people:
                        person = existing_people[cluster_id]
                    else:
                        person = Person(
                            cluster_id=cluster_id,
                            name=f"Person {cluster_id}"
                        )
                        self.db.add(person)
                        self.db.flush()
                    
                    cluster_to_person[cluster_id] = person
                
                face = self.db.query(Face).filter(Face.id == face_id).first()
                if face:
                    face.person_id = cluster_to_person[cluster_id].id
            
            for person in cluster_to_person.values():
                face_count = self.db.query(func.count(Face.id)).filter(
                    Face.person_id == person.id
                ).scalar()
                person.face_count = face_count
                
                if not person.primary_face_id:
                    primary_face = self.db.query(Face).filter(
                        Face.person_id == person.id
                    ).order_by(Face.confidence.desc()).first()
                    
                    if primary_face:
                        person.primary_face_id = primary_face.id
            
            self.db.commit()
            
        except Exception as e:
            print(f"Error updating face clusters: {e}")
            self.db.rollback()
    
    def get_person(self, person_id: int) -> Optional[Person]:
        """Get person by ID"""
        return self.db.query(Person).filter(Person.id == person_id).first()
    
    def get_all_people(self) -> List[Person]:
        """Get all people"""
        return self.db.query(Person).order_by(Person.face_count.desc()).all()
    
    def rename_person(self, person_id: int, name: str) -> Optional[Person]:
        """Rename a person"""
        person = self.get_person(person_id)
        if person:
            person.name = name
            person.is_verified = True
            self.db.commit()
            self.db.refresh(person)
        return person
    
    def merge_people(self, person_id1: int, person_id2: int, keep_name: str = None) -> Optional[Person]:
        """
        Merge two people into one
        
        Args:
            person_id1: First person ID
            person_id2: Second person ID
            keep_name: Name to use (defaults to person1's name)
            
        Returns:
            Merged Person object
        """
        person1 = self.get_person(person_id1)
        person2 = self.get_person(person_id2)
        
        if not person1 or not person2:
            return None
        
        try:
            self.db.query(Face).filter(Face.person_id == person2.id).update(
                {Face.person_id: person1.id}
            )
            
            person1.face_count = self.db.query(func.count(Face.id)).filter(
                Face.person_id == person1.id
            ).scalar()
            
            if keep_name:
                person1.name = keep_name
            
            self.db.delete(person2)
            self.db.commit()
            self.db.refresh(person1)
            
            return person1
            
        except Exception as e:
            print(f"Error merging people: {e}")
            self.db.rollback()
            return None
    
    def split_person(self, person_id: int) -> List[Person]:
        """
        Split a person cluster into multiple people
        
        Args:
            person_id: Person ID to split
            
        Returns:
            List of new Person objects
        """
        self._ensure_clusterer()
        
        person = self.get_person(person_id)
        if not person:
            return []
        
        faces = self.db.query(Face).filter(Face.person_id == person_id).all()
        
        if len(faces) < 2:
            return [person]
        
        embeddings = []
        face_ids = []
        
        for face in faces:
            embedding_data = self._get_embedding_vector(face.embedding_id)
            if embedding_data is not None:
                embeddings.append(embedding_data)
                face_ids.append(face.id)
        
        if not embeddings:
            return [person]
        
        embeddings_array = np.array(embeddings)
        
        labels = self.clusterer.split_cluster(embeddings_array)
        
        cluster_map = {}
        for face_id, label in zip(face_ids, labels):
            cluster_map[face_id] = int(label)
        
        new_people = []
        cluster_to_person = {}
        
        for face_id, cluster_id in cluster_map.items():
            if cluster_id == -1:
                continue
            
            if cluster_id not in cluster_to_person:
                new_person = Person(
                    cluster_id=self._get_next_cluster_id(),
                    name=f"{person.name} (Split {cluster_id})"
                )
                self.db.add(new_person)
                self.db.flush()
                cluster_to_person[cluster_id] = new_person
                new_people.append(new_person)
            
            face = self.db.query(Face).filter(Face.id == face_id).first()
            if face:
                face.person_id = cluster_to_person[cluster_id].id
        
        for new_person in new_people:
            face_count = self.db.query(func.count(Face.id)).filter(
                Face.person_id == new_person.id
            ).scalar()
            new_person.face_count = face_count
        
        self.db.delete(person)
        self.db.commit()
        
        return new_people
    
    def search_faces_by_person(self, person_id: int) -> List[Photo]:
        """Get all photos containing a specific person"""
        return self.db.query(Photo).join(Face).filter(
            Face.person_id == person_id
        ).distinct().all()
    
    def _get_embedding_vector(self, embedding_id: int) -> Optional[np.ndarray]:
        """Get embedding vector from storage"""
        return None
    
    def _get_next_cluster_id(self) -> int:
        """Get next available cluster ID"""
        max_cluster = self.db.query(func.max(Person.cluster_id)).scalar()
        return (max_cluster or 0) + 1
