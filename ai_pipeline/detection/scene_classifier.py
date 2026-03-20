import torch
from PIL import Image
from typing import List, Dict
from transformers import AutoImageProcessor, AutoModelForImageClassification


class SceneClassifier:
    def __init__(self, model_name="microsoft/resnet-50"):
        """
        Initialize scene classifier
        
        Args:
            model_name: HuggingFace model name
        """
        self.model_name = model_name
        self.processor = None
        self.model = None
        self.initialized = False
        
        # Scene categories mapping
        self.scene_categories = {
            'beach': ['beach', 'coast', 'ocean', 'sea', 'sand'],
            'mountain': ['mountain', 'hill', 'peak', 'alpine'],
            'city': ['city', 'urban', 'building', 'street', 'downtown'],
            'forest': ['forest', 'woods', 'trees', 'jungle'],
            'indoor': ['indoor', 'room', 'interior', 'inside'],
            'outdoor': ['outdoor', 'outside', 'exterior'],
            'nature': ['nature', 'landscape', 'scenery'],
            'food': ['food', 'meal', 'dish', 'cuisine'],
            'people': ['person', 'people', 'crowd', 'group'],
            'animal': ['animal', 'pet', 'dog', 'cat', 'bird'],
            'vehicle': ['car', 'vehicle', 'automobile', 'truck'],
            'sports': ['sport', 'game', 'athletic', 'playing']
        }
    
    def _initialize(self):
        """Lazy initialization of model"""
        if self.initialized:
            return
        
        try:
            self.processor = AutoImageProcessor.from_pretrained(self.model_name)
            self.model = AutoModelForImageClassification.from_pretrained(self.model_name)
            self.model.eval()
            self.initialized = True
        except Exception as e:
            print(f"Error initializing scene classifier: {e}")
    
    def classify_scene(self, image_path: str, top_k: int = 5) -> List[Dict]:
        """
        Classify scene in an image
        
        Args:
            image_path: Path to image file
            top_k: Number of top predictions to return
            
        Returns:
            List of scene classifications with confidence scores
        """
        self._initialize()
        
        if not self.initialized:
            return []
        
        try:
            # Load image
            image = Image.open(image_path).convert('RGB')
            
            # Process image
            inputs = self.processor(images=image, return_tensors="pt")
            
            # Classify
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
            
            # Get top predictions
            probs = torch.nn.functional.softmax(logits, dim=-1)
            top_probs, top_indices = torch.topk(probs, top_k)
            
            # Format results
            classifications = []
            for prob, idx in zip(top_probs[0], top_indices[0]):
                label = self.model.config.id2label[idx.item()]
                classifications.append({
                    'label': label,
                    'confidence': float(prob)
                })
            
            return classifications
            
        except Exception as e:
            print(f"Error classifying scene: {e}")
            return []
    
    def get_scene_tags(self, image_path: str) -> List[str]:
        """
        Get scene category tags from an image
        
        Args:
            image_path: Path to image file
            
        Returns:
            List of scene category tags
        """
        classifications = self.classify_scene(image_path)
        
        tags = set()
        for classification in classifications:
            label = classification['label'].lower()
            
            # Map to scene categories
            for category, keywords in self.scene_categories.items():
                if any(keyword in label for keyword in keywords):
                    tags.add(category)
        
        return list(tags)


_classifier_instance = None


def get_scene_classifier() -> SceneClassifier:
    """Get singleton instance of SceneClassifier"""
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = SceneClassifier()
    return _classifier_instance
