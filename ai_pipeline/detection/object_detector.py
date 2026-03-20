import torch
import numpy as np
from PIL import Image
from typing import List, Dict
from transformers import AutoImageProcessor, AutoModelForObjectDetection


class ObjectDetector:
    def __init__(self, model_name="facebook/detr-resnet-50"):
        """
        Initialize object detector using DETR model
        
        Args:
            model_name: HuggingFace model name
        """
        self.model_name = model_name
        self.processor = None
        self.model = None
        self.initialized = False
    
    def _initialize(self):
        """Lazy initialization of model"""
        if self.initialized:
            return
        
        try:
            self.processor = AutoImageProcessor.from_pretrained(self.model_name)
            self.model = AutoModelForObjectDetection.from_pretrained(self.model_name)
            self.model.eval()
            self.initialized = True
        except Exception as e:
            print(f"Error initializing object detector: {e}")
    
    def detect_objects(self, image_path: str, confidence_threshold: float = 0.7) -> List[Dict]:
        """
        Detect objects in an image
        
        Args:
            image_path: Path to image file
            confidence_threshold: Minimum confidence score
            
        Returns:
            List of detected objects with labels and confidence
        """
        self._initialize()
        
        if not self.initialized:
            return []
        
        try:
            # Load image
            image = Image.open(image_path).convert('RGB')
            
            # Process image
            inputs = self.processor(images=image, return_tensors="pt")
            
            # Detect objects
            with torch.no_grad():
                outputs = self.model(**inputs)
            
            # Post-process
            target_sizes = torch.tensor([image.size[::-1]])
            results = self.processor.post_process_object_detection(
                outputs, 
                target_sizes=target_sizes, 
                threshold=confidence_threshold
            )[0]
            
            # Format results
            detections = []
            for score, label, box in zip(results["scores"], results["labels"], results["boxes"]):
                detections.append({
                    'label': self.model.config.id2label[label.item()],
                    'confidence': float(score),
                    'bbox': {
                        'x1': float(box[0]),
                        'y1': float(box[1]),
                        'x2': float(box[2]),
                        'y2': float(box[3])
                    }
                })
            
            return detections
            
        except Exception as e:
            print(f"Error detecting objects: {e}")
            return []
    
    def get_object_tags(self, image_path: str, confidence_threshold: float = 0.7) -> List[str]:
        """
        Get unique object tags from an image
        
        Args:
            image_path: Path to image file
            confidence_threshold: Minimum confidence score
            
        Returns:
            List of unique object labels
        """
        detections = self.detect_objects(image_path, confidence_threshold)
        return list(set([d['label'] for d in detections]))


_detector_instance = None


def get_object_detector() -> ObjectDetector:
    """Get singleton instance of ObjectDetector"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = ObjectDetector()
    return _detector_instance
