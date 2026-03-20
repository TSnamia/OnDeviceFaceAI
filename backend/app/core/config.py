from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "OnDeviceFaceAI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Paths
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    MODELS_DIR: Path = BASE_DIR.parent / "models"
    CACHE_DIR: Path = BASE_DIR / "cache"
    THUMBNAILS_DIR: Path = CACHE_DIR / "thumbnails"
    DATABASE_DIR: Path = BASE_DIR / "database"
    
    # Database
    DATABASE_URL: str = f"sqlite:///{DATABASE_DIR}/photos.db"
    
    # FAISS Indexes
    FACE_INDEX_PATH: Path = DATABASE_DIR / "face_embeddings.index"
    CLIP_INDEX_PATH: Path = DATABASE_DIR / "clip_embeddings.index"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
    
    # Processing
    BATCH_SIZE: int = 32
    MAX_WORKERS: int = 4
    USE_GPU: bool = True

    # Security
    # NOTE: Default is "private". For real deployments override via environment variables.
    PRIVATE_ALBUM_PASSWORD: str = "private"
    
    # Face Recognition
    FACE_MODEL_NAME: str = "buffalo_l"
    FACE_DETECTION_THRESHOLD: float = 0.5
    FACE_RECOGNITION_THRESHOLD: float = 0.4  # Lower = more lenient matching (0.4-0.5 recommended)
    MIN_FACE_SIZE: int = 20
    FACE_EMBEDDING_DIM: int = 512
    
    # Clustering
    CLUSTERING_METHOD: str = "dbscan"  # hdbscan or dbscan
    DBSCAN_EPS: float = 0.35  # Lower = stricter grouping (0.3-0.4 recommended for same person)
    DBSCAN_MIN_SAMPLES: int = 1  # Minimum faces to form a cluster
    HDBSCAN_MIN_CLUSTER_SIZE: int = 2
    HDBSCAN_MIN_SAMPLES: int = 1
    
    # CLIP
    CLIP_MODEL_NAME: str = "openai/clip-vit-base-patch32"
    CLIP_EMBEDDING_DIM: int = 512
    
    # Image Processing
    THUMBNAIL_SIZE: tuple = (300, 300)
    PREVIEW_SIZE: tuple = (1920, 1080)
    SUPPORTED_FORMATS: list = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".bmp", ".gif"]
    SUPPORTED_VIDEO_FORMATS: list = [".mp4", ".mov", ".avi", ".mkv", ".webm"]
    
    # Duplicate Detection
    PHASH_THRESHOLD: int = 5
    
    # Event Detection
    EVENT_TIME_THRESHOLD_HOURS: int = 4
    EVENT_MIN_PHOTOS: int = 3
    
    # Performance
    THUMBNAIL_CACHE_SIZE: int = 1000
    EMBEDDING_CACHE_SIZE: int = 10000
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Create necessary directories
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
settings.CACHE_DIR.mkdir(parents=True, exist_ok=True)
settings.THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
settings.DATABASE_DIR.mkdir(parents=True, exist_ok=True)
