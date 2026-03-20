import cv2
import numpy as np
from typing import List, Dict, Optional
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("DeepFace not available. Install with: pip install deepface")


class ExpressionDetector:
    """Detect facial expressions in photos"""
    
    def __init__(self):
        self.available = DEEPFACE_AVAILABLE
        self.expressions = ['happy', 'sad', 'angry', 'surprise', 'fear', 'disgust', 'neutral']
    
    def detect_expressions(self, image_path: str) -> List[Dict]:
        """
        Detect facial expressions in an image
        
        Args:
            image_path: Path to image file
            
        Returns:
            List of detected expressions with confidence scores
        """
        if not self.available:
            return []
        
        try:
            # Analyze emotions
            result = DeepFace.analyze(
                img_path=image_path,
                actions=['emotion'],
                enforce_detection=False,
                silent=True
            )
            
            # Handle single face or multiple faces
            if not isinstance(result, list):
                result = [result]
            
            expressions = []
            for face in result:
                if 'emotion' in face:
                    emotions = face['emotion']
                    # Get dominant emotion
                    dominant = max(emotions.items(), key=lambda x: x[1])
                    
                    expressions.append({
                        'expression': dominant[0],
                        'confidence': dominant[1] / 100.0,
                        'all_emotions': {k: v / 100.0 for k, v in emotions.items()},
                        'region': face.get('region', {})
                    })
            
            return expressions
            
        except Exception as e:
            print(f"Error detecting expressions: {e}")
            return []
    
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
