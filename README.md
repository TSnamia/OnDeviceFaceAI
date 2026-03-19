# OnDeviceFaceAI

A production-grade, fully offline web-based intelligent photo archive system with AI-powered face recognition, object detection, and semantic search capabilities.

## Features

### 🎯 Core Capabilities
- **Face Recognition**: Detect, cluster, and identify faces using InsightFace
- **Semantic Search**: Search photos by text queries using CLIP embeddings
- **Object Detection**: Automatically detect people, pets, vehicles, food, and more
- **Event Detection**: Group photos by time, location, and visual similarity
- **Smart Albums**: Auto-generated albums for Family, Vacation, Friends, Pets, Events
- **Duplicate Detection**: Find duplicate photos using perceptual hashing

### 🔒 Privacy First
- **100% Offline**: No internet or cloud dependency
- **Local Processing**: All AI runs on your device
- **Your Data Stays Yours**: Complete privacy and control

### ⚡ Performance
- Handles 100,000+ photos efficiently
- Multi-threaded processing
- GPU acceleration support
- Fast FAISS-based similarity search
- Intelligent caching system

## Tech Stack

### Frontend
- **React** - Modern UI framework
- **TailwindCSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **React Query** - Data fetching and caching

### Backend
- **FastAPI** - High-performance async API
- **SQLite** - Metadata storage
- **FAISS** - Vector similarity search

### AI Pipeline
- **InsightFace** - Face detection and recognition
- **CLIP** - Semantic image understanding
- **OpenCV** - Image processing
- **scikit-learn** - Clustering algorithms

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Web UI (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Import     │  │   Gallery    │  │  Face Panel  │      │
│  │  Dashboard   │  │    Viewer    │  │  & Filters   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Photo      │  │    Face      │  │    Search    │      │
│  │  Service     │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      AI Pipeline                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ InsightFace  │  │     CLIP     │  │   Cluster    │      │
│  │   Detector   │  │   Embedder   │  │   Engine     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Storage Layer                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    SQLite    │  │    FAISS     │  │    Cache     │      │
│  │   Metadata   │  │   Vectors    │  │  Thumbnails  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
OnDeviceFaceAI/
├── frontend/              # React web application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API client
│   │   └── utils/         # Utilities
│   └── package.json
├── backend/               # FastAPI server
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models
│   │   └── core/          # Configuration
│   └── requirements.txt
├── ai-pipeline/           # AI processing
│   ├── face_recognition/  # InsightFace pipeline
│   ├── semantic/          # CLIP embeddings
│   ├── clustering/        # Face clustering
│   └── detection/         # Object detection
├── workers/               # Background processing
├── database/              # Database schemas
├── models/                # Pre-trained AI models
├── scripts/               # Setup and utilities
└── README.md
```

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- 8GB+ RAM recommended
- GPU optional (for faster processing)

### Installation

1. **Clone the repository**
```bash
git clone git@github.com:TSnamia/OnDeviceFaceAI.git
cd OnDeviceFaceAI
```

2. **Set up backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python scripts/download_models.py  # Download AI models
```

3. **Set up frontend**
```bash
cd frontend
npm install
```

4. **Initialize database**
```bash
cd backend
python scripts/init_db.py
```

### Running the Application

1. **Start backend server**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

2. **Start frontend development server**
```bash
cd frontend
npm run dev
```

3. **Open browser**
Navigate to `http://localhost:5173`

## Usage

### Importing Photos
1. Click "Import Photos" in the left panel
2. Select folder or drag-and-drop photos
3. AI processing starts automatically in background

### Face Recognition
1. Faces are automatically detected and clustered
2. View face clusters in the right panel
3. Click a face to rename or merge clusters
4. Search by person name or combination

### Search
- **Text Search**: "beach sunset", "birthday party"
- **People Search**: "John", "John and Sarah"
- **Date Range**: Filter by date
- **Smart Filters**: Events, objects, locations

### Smart Albums
Auto-generated albums appear in the left sidebar:
- **People**: Albums for each recognized person
- **Events**: Grouped by time and visual similarity
- **Objects**: Pets, food, vehicles, etc.

### Export
1. Select photos or use filters
2. Click "Export Selected"
3. Choose destination folder
4. Photos organized by rules (people/events/dates)

## Performance Optimization

### For Large Libraries (100k+ photos)
- Enable GPU acceleration in settings
- Adjust batch size based on RAM
- Use incremental processing
- Enable thumbnail caching

### Recommended Hardware
- **Minimum**: 8GB RAM, 4-core CPU
- **Recommended**: 16GB RAM, 8-core CPU, NVIDIA GPU
- **Storage**: SSD recommended for database

## AI Models

The system downloads these models automatically:
- **InsightFace**: buffalo_l (face detection & recognition)
- **CLIP**: ViT-B/32 (semantic understanding)
- **Total size**: ~2GB

Models are stored in `models/` directory.

## Database Schema

### Core Tables
- `photos`: Photo metadata and paths
- `faces`: Detected faces with embeddings
- `people`: Named face clusters
- `embeddings`: CLIP and face vectors
- `tags`: User-defined tags
- `events`: Auto-detected events
- `albums`: Smart and manual albums

## API Documentation

Once running, visit:
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development

### Running Tests
```bash
cd backend
pytest tests/
```

### Code Style
```bash
# Backend
black app/
flake8 app/

# Frontend
npm run lint
```

## Troubleshooting

### Models not downloading
```bash
cd backend
python scripts/download_models.py --force
```

### Database issues
```bash
cd backend
python scripts/reset_db.py  # WARNING: Deletes all data
python scripts/init_db.py
```

### Performance issues
- Check GPU availability: `nvidia-smi`
- Reduce batch size in `backend/app/core/config.py`
- Clear thumbnail cache: `rm -rf backend/cache/thumbnails/*`

## Contributing

This is a personal project, but suggestions and bug reports are welcome!

## License

MIT License - See LICENSE file for details

## Privacy & Security

- All processing happens locally
- No telemetry or analytics
- No external API calls
- Your photos never leave your device

## Roadmap

- [ ] Video support
- [ ] Advanced editing tools
- [ ] Mobile app (React Native)
- [ ] Multi-user support
- [ ] Backup and sync (local network only)
- [ ] Advanced face aging recognition
- [ ] Custom object detection training

## Acknowledgments

- InsightFace team for face recognition models
- OpenAI for CLIP
- FastAPI and React communities

---

**Built with ❤️ for privacy-conscious photo enthusiasts**
