# OnDeviceFaceAI

A production-grade, fully offline web-based intelligent photo archive system with AI-powered face recognition, object detection, and semantic search capabilities.

## Features

### 🎯 Core Capabilities
- **Face Recognition**: Detect, cluster, and identify faces using InsightFace
- **Automatic Face Clustering**: Intelligently groups similar faces into people
- **Manual Face Merging**: Merge multiple people into one with multi-select UI
- **Person Groups**: Organize people into groups (Family, Friends, etc.)
- **Semantic Search**: Search photos by text queries using CLIP embeddings
- **Search Autocomplete**: Smart dropdown suggestions while typing
- **Object Detection**: Automatically detect people, pets, vehicles, food, and more
- **Scene Recognition**: Classify scenes (beach, mountain, city, indoor, etc.)
- **OCR Text Recognition**: Extract and search text from photos
- **Event Detection**: Group photos by time, location, and visual similarity
- **Smart Albums**: Auto-generated albums for Family, Vacation, Friends, Pets, Events
- **Duplicate Detection**: Find duplicate photos using perceptual hashing

### � Photo Management
- **Dashboard**: Overview with statistics, charts, and recent photos
- **Bulk Operations**: Multi-select photos for batch delete/move
- **Favorites System**: Star important photos for quick access
- **Slideshow Mode**: Auto-playing slideshow with speed controls
- **Photo Editing**: Rotate, adjust brightness/contrast in-browser
- **Video Support**: Play and manage video files (MP4, MOV, AVI, MKV, WebM)
- **Map View**: View photos on map based on GPS location

### 👤 People Management
- **Person Profiles**: Detailed page for each person with all their photos
- **Person Notes**: Add notes and information about people
- **Face Count Statistics**: Track how many photos each person appears in
- **Timeline View**: See person's photos organized by date
- **Multi-Select**: Select multiple people for batch operations

### � Privacy & Security
- **Password Protection**: Secure app access with password authentication
- **Private Albums**: Create password-protected private albums
- **100% Offline**: No internet or cloud dependency
- **Local Processing**: All AI runs on your device
- **Your Data Stays Yours**: Complete privacy and control

### ⚡ Performance
- Handles 100,000+ photos efficiently
- Multi-threaded processing
- GPU acceleration support
- Fast FAISS-based similarity search
- Intelligent caching system
- Optimized clustering parameters for better face grouping

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
- `photos`: Photo metadata, paths, favorites, AI-generated content (OCR, tags, quality)
  - New fields: `is_favorite`, `is_video`, `video_duration`, `ocr_text`, `object_tags`, `scene_tags`, `quality_score`
- `faces`: Detected faces with embeddings
- `people`: Named face clusters with group assignments
  - New field: `group_id` for organizing people into groups
- `person_groups`: Groups of people (Family, Friends, etc.)
- `embeddings`: CLIP and face vectors
- `tags`: User-defined tags
- `events`: Auto-detected events
- `albums`: Smart and manual albums
  - New field: `is_private` for password-protected albums

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

### ✅ Completed
- [x] Face clustering and recognition
- [x] Person groups and merging
- [x] Dashboard with statistics
- [x] Bulk operations
- [x] Favorites system
- [x] Slideshow mode
- [x] Map view
- [x] Search autocomplete
- [x] Person profiles with notes
- [x] Password protection
- [x] Private albums
- [x] Video support
- [x] Photo editing (rotate, brightness, contrast)
- [x] OCR text recognition
- [x] Object detection
- [x] Scene classification

### 🚀 Planned Features
- [ ] Advanced photo editing (crop, filters, effects)
- [ ] Face blur/anonymization for privacy
- [ ] Batch EXIF editing
- [ ] Photo quality assessment and suggestions
- [ ] Automatic backup system (local network)
- [ ] Mobile app (React Native)
- [ ] Multi-user support with permissions
- [ ] Advanced face aging recognition
- [ ] Custom object detection training
- [ ] RAW photo format support
- [ ] Photo comparison view
- [ ] Advanced duplicate finder with similarity slider
- [ ] Timeline view with events
- [ ] Photo stories/memories generation
- [ ] Facial expression detection
- [ ] Photo collage creator
- [ ] Print layout designer

## Acknowledgments

- InsightFace team for face recognition models
- OpenAI for CLIP
- FastAPI and React communities

---

**Built with ❤️ for privacy-conscious photo enthusiasts**
