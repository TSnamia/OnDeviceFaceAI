import torch
import numpy as np
from PIL import Image
from typing import List, Union, Optional
from pathlib import Path
from transformers import CLIPProcessor, CLIPModel
from app.core.config import settings


class CLIPEmbedder:
    def __init__(self):
        self.model = None
        self.processor = None
        self.device = None
        self._initialize()
    
    def _initialize(self):
        """Initialize CLIP model"""
        try:
            self.device = torch.device('cuda' if torch.cuda.is_available() and settings.USE_GPU else 'cpu')
            
            print(f"Loading CLIP model: {settings.CLIP_MODEL_NAME}")
            self.model = CLIPModel.from_pretrained(
                settings.CLIP_MODEL_NAME,
                cache_dir=str(settings.MODELS_DIR / 'clip')
            )
            self.processor = CLIPProcessor.from_pretrained(
                settings.CLIP_MODEL_NAME,
                cache_dir=str(settings.MODELS_DIR / 'clip')
            )
            
            self.model.to(self.device)
            self.model.eval()
            
            print(f"✓ CLIPEmbedder initialized on {self.device}")
            
        except Exception as e:
            print(f"✗ Failed to initialize CLIPEmbedder: {e}")
            raise
    
    def get_image_embedding(self, image_path: Union[str, Path]) -> Optional[np.ndarray]:
        """
        Get CLIP embedding for an image
        
        Args:
            image_path: Path to image file
            
        Returns:
            Image embedding vector or None
        """
        try:
            image = Image.open(image_path).convert('RGB')
            
            inputs = self.processor(images=image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                image_features = self.model.get_image_features(**inputs)
                
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
            embedding = image_features.cpu().numpy().flatten()
            
            return embedding
            
        except Exception as e:
            print(f"Error getting image embedding for {image_path}: {e}")
            return None
    
    def get_text_embedding(self, text: str) -> Optional[np.ndarray]:
        """
        Get CLIP embedding for text
        
        Args:
            text: Text query
            
        Returns:
            Text embedding vector or None
        """
        try:
            inputs = self.processor(text=[text], return_tensors="pt", padding=True)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                text_features = self.model.get_text_features(**inputs)
                
                text_features = text_features / text_features.norm(dim=-1, keepdim=True)
            
            embedding = text_features.cpu().numpy().flatten()
            
            return embedding
            
        except Exception as e:
            print(f"Error getting text embedding: {e}")
            return None
    
    def get_batch_image_embeddings(self, image_paths: List[Union[str, Path]]) -> List[Optional[np.ndarray]]:
        """
        Get CLIP embeddings for multiple images
        
        Args:
            image_paths: List of image paths
            
        Returns:
            List of embedding vectors
        """
        embeddings = []
        
        try:
            images = []
            valid_indices = []
            
            for idx, path in enumerate(image_paths):
                try:
                    img = Image.open(path).convert('RGB')
                    images.append(img)
                    valid_indices.append(idx)
                except Exception as e:
                    print(f"Error loading image {path}: {e}")
                    embeddings.append(None)
            
            if not images:
                return embeddings
            
            inputs = self.processor(images=images, return_tensors="pt", padding=True)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                image_features = self.model.get_image_features(**inputs)
                
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
            batch_embeddings = image_features.cpu().numpy()
            
            result = [None] * len(image_paths)
            for idx, embedding in zip(valid_indices, batch_embeddings):
                result[idx] = embedding
            
            return result
            
        except Exception as e:
            print(f"Error getting batch embeddings: {e}")
            return [None] * len(image_paths)
    
    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compute cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding
            embedding2: Second embedding
            
        Returns:
            Similarity score (0-1)
        """
        embedding1 = np.array(embedding1)
        embedding2 = np.array(embedding2)
        
        similarity = np.dot(embedding1, embedding2) / (
            np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
        )
        
        return float(similarity)
    
    def search_by_text(self, text: str, image_embeddings: np.ndarray, top_k: int = 10) -> List[tuple]:
        """
        Search images by text query
        
        Args:
            text: Search query
            image_embeddings: Array of image embeddings
            top_k: Number of results to return
            
        Returns:
            List of (index, similarity_score) tuples
        """
        try:
            text_embedding = self.get_text_embedding(text)
            if text_embedding is None:
                return []
            
            similarities = np.dot(image_embeddings, text_embedding)
            
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            results = [(int(idx), float(similarities[idx])) for idx in top_indices]
            
            return results
            
        except Exception as e:
            print(f"Error searching by text: {e}")
            return []


_embedder_instance = None


def get_clip_embedder() -> CLIPEmbedder:
    """Get singleton instance of CLIPEmbedder"""
    global _embedder_instance
    if _embedder_instance is None:
        _embedder_instance = CLIPEmbedder()
    return _embedder_instance
