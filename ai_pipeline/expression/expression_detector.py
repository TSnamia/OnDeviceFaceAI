import cv2
import numpy as np
from typing import List, Dict, Optional
from pathlib import Path
import sys

# Add InsightFace path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
try:
    # Repo'da face detector dosyası `detector.py` olduğu için yanlış import
    # yüzünden INSIGHTFACE_AVAILABLE sürekli False olabiliyordu.
    from ai_pipeline.face_recognition.detector import get_face_detector
    INSIGHTFACE_AVAILABLE = True
except ImportError:
    INSIGHTFACE_AVAILABLE = False
    print("InsightFace not available")


class ExpressionDetector:
    """Detect facial expressions in photos using InsightFace"""
    
    def __init__(self):
        self.available = INSIGHTFACE_AVAILABLE
        self.expressions = ['happy', 'neutral', 'sad', 'angry', 'surprise']
        self.detector = None
        if self.available:
            try:
                self.detector = get_face_detector()
            except Exception as e:
                print(f"Could not initialize face detector: {e}")
                self.available = False
    
    def detect_expressions(self, image_path: str) -> List[Dict]:
        """
        Detect facial expressions in an image using face landmarks
        
        Args:
            image_path: Path to image file
            
        Returns:
            List of detected expressions with confidence scores
        """
        if not self.available or not self.detector:
            return []
        
        try:
            # FaceDetector şu an bize (bbox + landmarks + embedding vb.) dict listesi döndürüyor.
            # ExpressionDetector ise bu landmarks üzerinden heuristik expression çıkaracak.
            faces = self.detector.detect_faces(image_path)
            expressions = []

            for face in faces:
                landmarks = face.get("landmarks")
                if not landmarks:
                    continue

                landmarks_np = np.asarray(landmarks, dtype=np.float32)

                # Calculate expression features
                is_smiling = self._detect_smile(landmarks_np)
                eye_openness = self._calculate_eye_openness(landmarks_np)
                mouth_openness = self._calculate_mouth_openness(landmarks_np)

                # Determine expression based on features
                expression = "neutral"
                confidence = 0.5

                if is_smiling >= 0.5:
                    expression = "happy"
                    confidence = is_smiling
                elif mouth_openness > 0.7 and eye_openness > 0.7:
                    expression = "surprise"
                    confidence = float(min(mouth_openness, eye_openness))
                elif eye_openness < 0.3:
                    expression = "sad"
                    confidence = float(1.0 - eye_openness)

                expressions.append(
                    {
                        "expression": expression,
                        "confidence": float(confidence),
                        "features": {
                            "smile": float(is_smiling),
                            "eye_openness": float(eye_openness),
                            "mouth_openness": float(mouth_openness),
                        },
                        "bbox": face.get("bbox") or [],
                    }
                )

            return expressions

        except Exception as e:
            print(f"Error detecting expressions: {e}")
            return []
    
    def _analyze_face_expression(self, face) -> Optional[Dict]:
        """
        Analyze facial expression from face landmarks
        
        Uses geometric analysis of facial features:
        - Mouth curvature for smile detection
        - Eye openness for surprise
        - Eyebrow position for anger/sadness
        """
        try:
            # Get landmarks (106 points from InsightFace)
            landmarks = None
            if hasattr(face, 'landmark_2d_106'):
                landmarks = face.landmark_2d_106
            elif hasattr(face, 'kps'):
                # InsightFace bazı sürümlerde 2D landmarkları `kps` altında verir.
                landmarks = face.kps
            else:
                return None
            
            # Calculate expression features
            is_smiling = self._detect_smile(landmarks)
            eye_openness = self._calculate_eye_openness(landmarks)
            mouth_openness = self._calculate_mouth_openness(landmarks)
            
            # Determine expression based on features
            expression = 'neutral'
            confidence = 0.5
            
            if is_smiling >= 0.5:
                expression = 'happy'
                confidence = is_smiling
            elif mouth_openness > 0.7 and eye_openness > 0.7:
                expression = 'surprise'
                confidence = min(mouth_openness, eye_openness)
            elif eye_openness < 0.3:
                expression = 'sad'
                confidence = 1.0 - eye_openness
            
            return {
                'expression': expression,
                'confidence': float(confidence),
                'features': {
                    'smile': float(is_smiling),
                    'eye_openness': float(eye_openness),
                    'mouth_openness': float(mouth_openness)
                },
                'bbox': face.bbox.tolist() if hasattr(face, 'bbox') else []
            }
            
        except Exception as e:
            print(f"Error analyzing expression: {e}")
            return None
    
    def _detect_smile(self, landmarks: np.ndarray) -> float:
        """
        Detect smile based on mouth corner positions
        Returns confidence 0-1
        """
        try:
            # Mouth corners (approximate indices for 106-point landmarks)
            left_mouth = landmarks[52]  # Left mouth corner
            right_mouth = landmarks[58]  # Right mouth corner
            top_lip = landmarks[55]     # Top lip center
            bottom_lip = landmarks[85]  # Bottom lip center
            
            # Calculate mouth width and height
            mouth_width = np.linalg.norm(right_mouth - left_mouth)
            mouth_height = np.linalg.norm(bottom_lip - top_lip)
            
            # Calculate mouth corners angle (upward = smile)
            mouth_center_y = (top_lip[1] + bottom_lip[1]) / 2
            corner_lift = mouth_center_y - (left_mouth[1] + right_mouth[1]) / 2
            
            # Normalize
            smile_score = corner_lift / mouth_width if mouth_width > 0 else 0
            
            # Clamp to 0-1
            return float(np.clip(smile_score * 5 + 0.5, 0, 1))
            
        except Exception:
            return 0.5
    
    def _calculate_eye_openness(self, landmarks: np.ndarray) -> float:
        """
        Calculate eye openness (0 = closed, 1 = wide open)
        """
        try:
            # Left eye (approximate indices)
            left_eye_top = landmarks[33]
            left_eye_bottom = landmarks[41]
            left_eye_left = landmarks[35]
            left_eye_right = landmarks[39]
            
            # Right eye
            right_eye_top = landmarks[87]
            right_eye_bottom = landmarks[95]
            right_eye_left = landmarks[89]
            right_eye_right = landmarks[93]
            
            # Calculate eye aspect ratios
            left_height = np.linalg.norm(left_eye_top - left_eye_bottom)
            left_width = np.linalg.norm(left_eye_right - left_eye_left)
            
            right_height = np.linalg.norm(right_eye_top - right_eye_bottom)
            right_width = np.linalg.norm(right_eye_right - right_eye_left)
            
            # Average aspect ratio
            left_ratio = left_height / left_width if left_width > 0 else 0
            right_ratio = right_height / right_width if right_width > 0 else 0
            
            avg_ratio = (left_ratio + right_ratio) / 2
            
            # Normalize (typical open eye ratio is around 0.2-0.3)
            openness = np.clip(avg_ratio * 3, 0, 1)
            
            return float(openness)
            
        except Exception:
            return 0.5
    
    def _calculate_mouth_openness(self, landmarks: np.ndarray) -> float:
        """
        Calculate mouth openness (0 = closed, 1 = wide open)
        """
        try:
            top_lip = landmarks[55]
            bottom_lip = landmarks[85]
            left_mouth = landmarks[52]
            right_mouth = landmarks[58]
            
            mouth_height = np.linalg.norm(bottom_lip - top_lip)
            mouth_width = np.linalg.norm(right_mouth - left_mouth)
            
            # Aspect ratio
            ratio = mouth_height / mouth_width if mouth_width > 0 else 0
            
            # Normalize (typical open mouth ratio is around 0.5+)
            openness = np.clip(ratio * 2, 0, 1)
            
            return float(openness)
            
        except Exception:
            return 0.0
    
    def is_smiling(self, image_path: str, threshold: float = 0.5) -> bool:
        """
        Check if anyone in the photo is smiling
        
        Args:
            image_path: Path to image
            threshold: Confidence threshold
            
        Returns:
            True if smiling detected
        """
        expressions = self.detect_expressions(image_path)
        
        for expr in expressions:
            if expr['expression'] == 'happy' and expr['confidence'] >= threshold:
                return True
        
        return False
    
    def filter_by_expression(
        self, 
        image_paths: List[str], 
        expression: str,
        threshold: float = 0.5
    ) -> List[str]:
        """
        Filter images by expression
        
        Args:
            image_paths: List of image paths
            expression: Target expression (happy, sad, etc.)
            threshold: Confidence threshold
            
        Returns:
            List of matching image paths
        """
        matching = []
        
        for path in image_paths:
            expressions = self.detect_expressions(path)
            for expr in expressions:
                if expr['expression'] == expression and expr['confidence'] >= threshold:
                    matching.append(path)
                    break
        
        return matching
    
    def get_dominant_expression(self, image_path: str) -> Optional[str]:
        """
        Get the dominant expression in the photo
        
        Args:
            image_path: Path to image
            
        Returns:
            Dominant expression name or None
        """
        expressions = self.detect_expressions(image_path)
        
        if not expressions:
            return None
        
        # Get expression with highest confidence
        dominant = max(expressions, key=lambda x: x['confidence'])
        return dominant['expression']


_detector_instance = None


def get_expression_detector() -> ExpressionDetector:
    """Get singleton instance of ExpressionDetector"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = ExpressionDetector()
    return _detector_instance
