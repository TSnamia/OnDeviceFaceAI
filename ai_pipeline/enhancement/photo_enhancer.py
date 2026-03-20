import cv2
import numpy as np
from typing import Optional, Tuple
from pathlib import Path


class PhotoEnhancer:
    """Automatic photo enhancement"""
    
    def __init__(self):
        pass
    
    def auto_enhance(self, image_path: str, output_path: Optional[str] = None) -> str:
        """
        Automatically enhance photo
        
        Args:
            image_path: Input image path
            output_path: Output path (optional, defaults to input_enhanced.jpg)
            
        Returns:
            Path to enhanced image
        """
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")
        
        # Apply enhancements
        enhanced = self._enhance_brightness_contrast(img)
        enhanced = self._enhance_sharpness(enhanced)
        enhanced = self._reduce_noise(enhanced)
        enhanced = self._enhance_colors(enhanced)
        
        # Save
        if output_path is None:
            path = Path(image_path)
            output_path = str(path.parent / f"{path.stem}_enhanced{path.suffix}")
        
        cv2.imwrite(output_path, enhanced)
        return output_path
    
    def _enhance_brightness_contrast(self, img: np.ndarray) -> np.ndarray:
        """Auto-adjust brightness and contrast"""
        # Convert to LAB color space
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        # Merge and convert back
        enhanced_lab = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
        
        return enhanced
    
    def _enhance_sharpness(self, img: np.ndarray) -> np.ndarray:
        """Enhance image sharpness"""
        # Unsharp mask
        gaussian = cv2.GaussianBlur(img, (0, 0), 2.0)
        sharpened = cv2.addWeighted(img, 1.5, gaussian, -0.5, 0)
        
        return sharpened
    
    def _reduce_noise(self, img: np.ndarray) -> np.ndarray:
        """Reduce image noise"""
        # Non-local means denoising
        denoised = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)
        return denoised
    
    def _enhance_colors(self, img: np.ndarray) -> np.ndarray:
        """Enhance color saturation"""
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
        
        # Increase saturation by 20%
        hsv[:, :, 1] = hsv[:, :, 1] * 1.2
        hsv[:, :, 1] = np.clip(hsv[:, :, 1], 0, 255)
        
        enhanced = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        return enhanced
    
    def adjust_brightness(self, img: np.ndarray, factor: float) -> np.ndarray:
        """
        Adjust brightness
        
        Args:
            img: Input image
            factor: Brightness factor (1.0 = no change, <1 = darker, >1 = brighter)
        """
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 2] = hsv[:, :, 2] * factor
        hsv[:, :, 2] = np.clip(hsv[:, :, 2], 0, 255)
        return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    
    def adjust_contrast(self, img: np.ndarray, factor: float) -> np.ndarray:
        """
        Adjust contrast
        
        Args:
            img: Input image
            factor: Contrast factor (1.0 = no change)
        """
        return cv2.convertScaleAbs(img, alpha=factor, beta=0)


_enhancer_instance = None


def get_photo_enhancer() -> PhotoEnhancer:
    """Get singleton instance of PhotoEnhancer"""
    global _enhancer_instance
    if _enhancer_instance is None:
        _enhancer_instance = PhotoEnhancer()
    return _enhancer_instance
