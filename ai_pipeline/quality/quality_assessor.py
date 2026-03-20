import cv2
import numpy as np
from typing import Dict, Tuple
from pathlib import Path


class QualityAssessor:
    """Assess photo quality based on various metrics"""
    
    def __init__(self):
        pass
    
    def assess_photo(self, image_path: str) -> Dict[str, float]:
        """
        Assess overall photo quality
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with quality metrics
        """
        img = cv2.imread(image_path)
        if img is None:
            return {}
        
        metrics = {
            'sharpness': self._calculate_sharpness(img),
            'brightness': self._calculate_brightness(img),
            'contrast': self._calculate_contrast(img),
            'noise': self._calculate_noise(img),
            'overall_score': 0.0
        }
        
        # Calculate overall score (0-1)
        metrics['overall_score'] = self._calculate_overall_score(metrics)
        
        return metrics
    
    def _calculate_sharpness(self, img: np.ndarray) -> float:
        """
        Calculate image sharpness using Laplacian variance
        Higher values = sharper image
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = laplacian.var()
        
        # Normalize to 0-1 (empirical threshold: 100 = sharp, 10 = blurry)
        sharpness = min(variance / 100.0, 1.0)
        return float(sharpness)
    
    def _calculate_brightness(self, img: np.ndarray) -> float:
        """
        Calculate average brightness (0-1)
        0.5 is ideal, <0.3 is dark, >0.7 is bright
        """
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        brightness = np.mean(hsv[:, :, 2]) / 255.0
        return float(brightness)
    
    def _calculate_contrast(self, img: np.ndarray) -> float:
        """
        Calculate image contrast using standard deviation
        Higher values = more contrast
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        contrast = gray.std() / 128.0  # Normalize to 0-1
        return float(min(contrast, 1.0))
    
    def _calculate_noise(self, img: np.ndarray) -> float:
        """
        Estimate noise level (0-1, lower is better)
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Use high-pass filter to detect noise
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        noise = cv2.absdiff(gray, blur)
        noise_level = np.mean(noise) / 255.0
        
        return float(noise_level)
    
    def _calculate_overall_score(self, metrics: Dict[str, float]) -> float:
        """
        Calculate overall quality score (0-1)
        """
        # Weighted average
        weights = {
            'sharpness': 0.4,
            'brightness': 0.2,
            'contrast': 0.2,
            'noise': 0.2  # Inverted (lower noise = higher score)
        }
        
        score = (
            metrics['sharpness'] * weights['sharpness'] +
            self._brightness_score(metrics['brightness']) * weights['brightness'] +
            metrics['contrast'] * weights['contrast'] +
            (1.0 - metrics['noise']) * weights['noise']
        )
        
        return float(score)
    
    def _brightness_score(self, brightness: float) -> float:
        """
        Convert brightness to score (0.5 is ideal)
        """
        # Penalize too dark or too bright
        if brightness < 0.3:
            return brightness / 0.3
        elif brightness > 0.7:
            return (1.0 - brightness) / 0.3
        else:
            return 1.0
    
    def is_blurry(self, image_path: str, threshold: float = 0.3) -> bool:
        """
        Check if image is blurry
        
        Args:
            image_path: Path to image
            threshold: Sharpness threshold (lower = more strict)
            
        Returns:
            True if blurry
        """
        metrics = self.assess_photo(image_path)
        return metrics.get('sharpness', 1.0) < threshold
    
    def is_low_quality(self, image_path: str, threshold: float = 0.4) -> bool:
        """
        Check if image is low quality
        
        Args:
            image_path: Path to image
            threshold: Quality threshold
            
        Returns:
            True if low quality
        """
        metrics = self.assess_photo(image_path)
        return metrics.get('overall_score', 1.0) < threshold


_assessor_instance = None


def get_quality_assessor() -> QualityAssessor:
    """Get singleton instance of QualityAssessor"""
    global _assessor_instance
    if _assessor_instance is None:
        _assessor_instance = QualityAssessor()
    return _assessor_instance
