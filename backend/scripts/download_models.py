#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
import argparse


def download_insightface_models():
    """Download InsightFace models"""
    print("\n📥 Downloading InsightFace models...")
    
    try:
        import insightface
        from insightface.app import FaceAnalysis
        
        app = FaceAnalysis(
            name='buffalo_l',
            root=str(settings.MODELS_DIR),
            providers=['CPUExecutionProvider']
        )
        
        print("✓ InsightFace buffalo_l model downloaded")
        
    except Exception as e:
        print(f"✗ Failed to download InsightFace models: {e}")
        return False
    
    return True


def download_clip_models():
    """Download CLIP models"""
    print("\n📥 Downloading CLIP models...")
    
    try:
        from transformers import CLIPModel, CLIPProcessor
        
        model = CLIPModel.from_pretrained(
            settings.CLIP_MODEL_NAME,
            cache_dir=str(settings.MODELS_DIR / 'clip')
        )
        
        processor = CLIPProcessor.from_pretrained(
            settings.CLIP_MODEL_NAME,
            cache_dir=str(settings.MODELS_DIR / 'clip')
        )
        
        print(f"✓ CLIP model {settings.CLIP_MODEL_NAME} downloaded")
        
    except Exception as e:
        print(f"✗ Failed to download CLIP models: {e}")
        return False
    
    return True


def main():
    parser = argparse.ArgumentParser(description='Download AI models')
    parser.add_argument('--force', action='store_true', help='Force re-download')
    parser.add_argument('--insightface-only', action='store_true', help='Download only InsightFace')
    parser.add_argument('--clip-only', action='store_true', help='Download only CLIP')
    
    args = parser.parse_args()
    
    print("🤖 OnDeviceFaceAI Model Downloader")
    print("=" * 50)
    
    settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📁 Models directory: {settings.MODELS_DIR}")
    
    success = True
    
    if not args.clip_only:
        if not download_insightface_models():
            success = False
    
    if not args.insightface_only:
        if not download_clip_models():
            success = False
    
    print("\n" + "=" * 50)
    
    if success:
        print("✓ All models downloaded successfully!")
        
        total_size = sum(
            f.stat().st_size 
            for f in settings.MODELS_DIR.rglob('*') 
            if f.is_file()
        )
        print(f"📦 Total size: {total_size / (1024**3):.2f} GB")
    else:
        print("✗ Some models failed to download")
        sys.exit(1)


if __name__ == "__main__":
    main()
