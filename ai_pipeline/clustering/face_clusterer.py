import numpy as np
from typing import List, Dict, Optional, Tuple
from sklearn.cluster import DBSCAN
from collections import defaultdict
from app.core.config import settings


class FaceClusterer:
    def __init__(self):
        self.method = settings.CLUSTERING_METHOD
        self.clusterer = None
    
    def cluster_faces(self, embeddings: np.ndarray, min_cluster_size: Optional[int] = None) -> np.ndarray:
        """
        Cluster face embeddings
        
        Args:
            embeddings: Array of face embeddings (n_faces, embedding_dim)
            min_cluster_size: Minimum cluster size (optional)
            
        Returns:
            Array of cluster labels (-1 for noise/outliers)
        """
        if len(embeddings) == 0:
            return np.array([])
        
        if self.method == 'hdbscan':
            return self._cluster_hdbscan(embeddings, min_cluster_size)
        else:
            return self._cluster_dbscan(embeddings)
    
    def _cluster_dbscan(self, embeddings: np.ndarray) -> np.ndarray:
        """Cluster using DBSCAN"""
        try:
            clusterer = DBSCAN(
                eps=settings.DBSCAN_EPS,
                min_samples=settings.DBSCAN_MIN_SAMPLES,
                metric='cosine',
                n_jobs=-1
            )
            
            labels = clusterer.fit_predict(embeddings)
            
            return labels
            
        except Exception as e:
            print(f"Error in DBSCAN clustering: {e}")
            return np.array([-1] * len(embeddings))
    
    def _cluster_hdbscan(self, embeddings: np.ndarray, min_cluster_size: Optional[int] = None) -> np.ndarray:
        """Cluster using HDBSCAN"""
        try:
            import hdbscan

            if min_cluster_size is None:
                min_cluster_size = settings.HDBSCAN_MIN_CLUSTER_SIZE
            
            clusterer = hdbscan.HDBSCAN(
                min_cluster_size=min_cluster_size,
                min_samples=settings.HDBSCAN_MIN_SAMPLES,
                metric='euclidean',
                cluster_selection_method='eom',
                core_dist_n_jobs=-1
            )
            
            labels = clusterer.fit_predict(embeddings)
            
            return labels
            
        except Exception as e:
            print(f"Error in HDBSCAN clustering: {e}")
            return np.array([-1] * len(embeddings))
    
    def incremental_cluster(
        self,
        new_embeddings: np.ndarray,
        existing_clusters: Dict[int, List[np.ndarray]],
        threshold: float = None
    ) -> List[int]:
        """
        Incrementally assign new faces to existing clusters
        
        Args:
            new_embeddings: New face embeddings to cluster
            existing_clusters: Dict mapping cluster_id to list of embeddings
            threshold: Similarity threshold for assignment
            
        Returns:
            List of cluster assignments for new embeddings
        """
        if threshold is None:
            threshold = settings.FACE_RECOGNITION_THRESHOLD
        
        assignments = []
        
        for embedding in new_embeddings:
            best_cluster = -1
            best_similarity = -1
            
            for cluster_id, cluster_embeddings in existing_clusters.items():
                if len(cluster_embeddings) == 0:
                    continue
                
                cluster_center = np.mean(cluster_embeddings, axis=0)
                
                similarity = self._cosine_similarity(embedding, cluster_center)
                
                if similarity > best_similarity and similarity >= threshold:
                    best_similarity = similarity
                    best_cluster = cluster_id
            
            assignments.append(best_cluster)
        
        return assignments
    
    def merge_clusters(
        self,
        cluster1_embeddings: List[np.ndarray],
        cluster2_embeddings: List[np.ndarray]
    ) -> bool:
        """
        Determine if two clusters should be merged
        
        Args:
            cluster1_embeddings: Embeddings from first cluster
            cluster2_embeddings: Embeddings from second cluster
            
        Returns:
            True if clusters should be merged
        """
        if not cluster1_embeddings or not cluster2_embeddings:
            return False
        
        center1 = np.mean(cluster1_embeddings, axis=0)
        center2 = np.mean(cluster2_embeddings, axis=0)
        
        similarity = self._cosine_similarity(center1, center2)
        
        return similarity >= settings.FACE_RECOGNITION_THRESHOLD
    
    def split_cluster(
        self,
        embeddings: np.ndarray,
        min_cluster_size: int = 2
    ) -> np.ndarray:
        """
        Split a cluster into sub-clusters
        
        Args:
            embeddings: Embeddings to split
            min_cluster_size: Minimum size for sub-clusters
            
        Returns:
            New cluster labels
        """
        return self.cluster_faces(embeddings, min_cluster_size)
    
    def get_cluster_statistics(
        self,
        embeddings: np.ndarray,
        labels: np.ndarray
    ) -> Dict[int, Dict]:
        """
        Get statistics for each cluster
        
        Args:
            embeddings: Face embeddings
            labels: Cluster labels
            
        Returns:
            Dict mapping cluster_id to statistics
        """
        stats = {}
        
        unique_labels = np.unique(labels)
        
        for label in unique_labels:
            if label == -1:
                continue
            
            mask = labels == label
            cluster_embeddings = embeddings[mask]
            
            center = np.mean(cluster_embeddings, axis=0)
            
            distances = [
                1 - self._cosine_similarity(emb, center)
                for emb in cluster_embeddings
            ]
            
            stats[int(label)] = {
                'size': int(np.sum(mask)),
                'center': center.tolist(),
                'mean_distance': float(np.mean(distances)),
                'std_distance': float(np.std(distances)),
                'max_distance': float(np.max(distances)),
                'min_distance': float(np.min(distances))
            }
        
        return stats
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Compute cosine similarity between two vectors"""
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        
        similarity = np.dot(vec1, vec2) / (
            np.linalg.norm(vec1) * np.linalg.norm(vec2)
        )
        
        return float(similarity)
    
    def find_outliers(
        self,
        embeddings: np.ndarray,
        labels: np.ndarray,
        threshold: float = 2.0
    ) -> List[int]:
        """
        Find outlier faces in clusters
        
        Args:
            embeddings: Face embeddings
            labels: Cluster labels
            threshold: Standard deviation threshold
            
        Returns:
            List of outlier indices
        """
        outliers = []
        
        unique_labels = np.unique(labels)
        
        for label in unique_labels:
            if label == -1:
                continue
            
            mask = labels == label
            cluster_embeddings = embeddings[mask]
            cluster_indices = np.where(mask)[0]
            
            if len(cluster_embeddings) < 3:
                continue
            
            center = np.mean(cluster_embeddings, axis=0)
            
            distances = np.array([
                1 - self._cosine_similarity(emb, center)
                for emb in cluster_embeddings
            ])
            
            mean_dist = np.mean(distances)
            std_dist = np.std(distances)
            
            outlier_mask = distances > (mean_dist + threshold * std_dist)
            
            outliers.extend(cluster_indices[outlier_mask].tolist())
        
        return outliers


_clusterer_instance = None


def get_face_clusterer() -> FaceClusterer:
    """Get singleton instance of FaceClusterer"""
    global _clusterer_instance
    if _clusterer_instance is None:
        _clusterer_instance = FaceClusterer()
    return _clusterer_instance
