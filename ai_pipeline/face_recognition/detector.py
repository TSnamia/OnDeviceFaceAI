import numpy as np
import cv2
from typing import List, Tuple, Optional, Dict
from pathlib import Path
import insightface
from insightface.app import FaceAnalysis
from app.core.config import settings


class FaceDetector:
    def __init__(self):
        self.app = None
        self.model_name = settings.FACE_MODEL_NAME
        self._initialize()
    
    def _initialize(self):
        """Initialize InsightFace model"""
        try:
            self.app = FaceAnalysis(
                name=self.model_name,
                root=str(settings.MODELS_DIR),
                providers=['CUDAExecutionProvider', 'CPUExecutionProvider'] if settings.USE_GPU else ['CPUExecutionProvider']
            )
            self.app.prepare(ctx_id=0 if settings.USE_GPU else -1, det_size=(640, 640))
            print(f"FaceDetector initialized with {self.model_name}")
        except Exception as e:
            # Avoid re-triggering encoding errors when exception text contains Unicode.
            print("Failed to initialize FaceDetector")
            raise
    
    def detect_faces(self, image_path: str) -> List[Dict]:
        """
        Detect faces in an image
        
        Args:
            image_path: Path to image file
            
        Returns:
            List of face dictionaries with bbox, landmarks, embedding, etc.
        """
        try:
            img = cv2.imread(str(image_path))
            if img is None:
                raise ValueError(f"Could not read image: {image_path}")
            
            faces = self.app.get(img)
            
            results = []
            for face in faces:
                if face.det_score < settings.FACE_DETECTION_THRESHOLD:
                    continue
                
                bbox = face.bbox.astype(int)
                
                face_data = {
                    'bbox': {
                        'x': float(bbox[0]),
                        'y': float(bbox[1]),
                        'width': float(bbox[2] - bbox[0]),
                        'height': float(bbox[3] - bbox[1])
                    },
                    'confidence': float(face.det_score),
                    'embedding': face.embedding.tolist(),
                    'landmarks': face.kps.tolist() if hasattr(face, 'kps') else None,
                    'age': int(face.age) if hasattr(face, 'age') else None,
                    'gender': 'M' if (hasattr(face, 'gender') and face.gender == 1) else 'F' if hasattr(face, 'gender') else None
                }
                
                results.append(face_data)
            
            return results
            
        except Exception as e:
            print(f"Error detecting faces in {image_path}: {e}")
            return []
    
    def get_face_embedding(self, image_path: str, bbox: Dict) -> Optional[np.ndarray]:
        """
        Extract face embedding from specific bbox
        
        Args:
            image_path: Path to image
            bbox: Bounding box dict with x, y, width, height
            
        Returns:
            Face embedding vector or None
        """
        try:
            img = cv2.imread(str(image_path))
            if img is None:
                return None
            
            x, y, w, h = int(bbox['x']), int(bbox['y']), int(bbox['width']), int(bbox['height'])
            
            x = max(0, x)
            y = max(0, y)
            w = min(img.shape[1] - x, w)
            h = min(img.shape[0] - y, h)
            
            face_img = img[y:y+h, x:x+w]
            
            if face_img.size == 0:
                return None
            
            faces = self.app.get(face_img)
            
            if len(faces) > 0:
                return faces[0].embedding
            
            return None
            
        except Exception as e:
            print(f"Error extracting face embedding: {e}")
            return None
    
    def compare_faces(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compare two face embeddings using cosine similarity
        
        Args:
            embedding1: First face embedding
            embedding2: Second face embedding
            
        Returns:
            Similarity score (0-1, higher is more similar)
        """
        embedding1 = np.array(embedding1)
        embedding2 = np.array(embedding2)
        
        similarity = np.dot(embedding1, embedding2) / (
            np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
        )
        
        return float(similarity)
    
    def align_face(self, image: np.ndarray, landmarks: np.ndarray) -> np.ndarray:
        """
        Align face using landmarks
        
        Args:
            image: Input image
            landmarks: Facial landmarks
            
        Returns:
            Aligned face image
        """
        try:
            from skimage import transform as trans
            
            src = np.array([
                [30.2946, 51.6963],
                [65.5318, 51.5014],
                [48.0252, 71.7366],
                [33.5493, 92.3655],
                [62.7299, 92.2041]
            ], dtype=np.float32)
            
            dst = landmarks.astype(np.float32)
            
            tform = trans.SimilarityTransform()
            tform.estimate(dst, src)
            
            aligned = cv2.warpAffine(
                image,
                tform.params[0:2, :],
                (112, 112),
                borderValue=0.0
            )
            
            return aligned
            
        except Exception as e:
            print(f"Error aligning face: {e}")
            return image


_detector_instance = None


def get_face_detector() -> FaceDetector:
    """Get singleton instance of FaceDetector"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = FaceDetector()
    return _detector_instance
