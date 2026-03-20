import cv2
import numpy as np
from typing import List, Dict, Optional
try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    print("EasyOCR not available. Install with: pip install easyocr")


class TextDetector:
    def __init__(self, languages=['en', 'tr']):
        """
        Initialize text detector
        
        Args:
            languages: List of language codes to detect
        """
        self.languages = languages
        self.reader = None
        
        if EASYOCR_AVAILABLE:
            try:
                self.reader = easyocr.Reader(languages, gpu=False)
            except Exception as e:
                print(f"Error initializing EasyOCR: {e}")
    
    def detect_text(self, image_path: str) -> List[Dict]:
        """
        Detect text in an image
        
        Args:
            image_path: Path to image file
            
        Returns:
            List of detected text with bounding boxes and confidence
        """
        if not self.reader:
            return []
        
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                return []
            
            # Detect text
            results = self.reader.readtext(image)
            
            # Format results
            detections = []
            for bbox, text, confidence in results:
                detections.append({
                    'text': text,
                    'confidence': float(confidence),
                    'bbox': {
                        'x1': float(bbox[0][0]),
                        'y1': float(bbox[0][1]),
                        'x2': float(bbox[2][0]),
                        'y2': float(bbox[2][1])
                    }
                })
            
            return detections
            
        except Exception as e:
            print(f"Error detecting text: {e}")
            return []
    
    def extract_text_only(self, image_path: str) -> str:
        """
        Extract only the text content from an image
        
        Args:
            image_path: Path to image file
            
        Returns:
            Concatenated text string
        """
        detections = self.detect_text(image_path)
        return ' '.join([d['text'] for d in detections])


_detector_instance = None


def get_text_detector() -> TextDetector:
    """Get singleton instance of TextDetector"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = TextDetector()
    return _detector_instance
