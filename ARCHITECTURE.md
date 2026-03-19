# OnDeviceFaceAI Architecture

## System Overview

OnDeviceFaceAI is a fully offline, web-based intelligent photo archive system with AI-powered face recognition, semantic search, and event detection capabilities.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Import     │  │   Gallery    │  │  Face Panel  │          │
│  │  Dashboard   │  │    Viewer    │  │  & Filters   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            ↕ REST API
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Photo      │  │    Face      │  │    Search    │          │
│  │  Service     │  │   Service    │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │   Export     │  │  Background  │                            │
│  │  Service     │  │   Workers    │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                      AI Pipeline                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ InsightFace  │  │     CLIP     │  │   Cluster    │          │
│  │   Detector   │  │   Embedder   │  │   Engine     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│              Storage Layer                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    SQLite    │  │    FAISS     │  │    Cache     │          │
│  │   Metadata   │  │   Vectors    │  │  Thumbnails  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend (React + TailwindCSS)

**Technology Stack:**
- React 18 - UI framework
- TailwindCSS - Styling
- React Query - Data fetching and caching
- React Router - Navigation
- Axios - HTTP client
- Lucide React - Icons

**Key Components:**
- `Layout` - Three-column layout (sidebar, main, face panel)
- `Gallery` - Photo grid with virtualization
- `FacePanel` - People management interface
- `UploadModal` - Photo import interface
- `PhotoGrid` - Responsive photo display

**Features:**
- Drag-and-drop photo upload
- Real-time photo processing status
- Face cluster management (rename, merge, split)
- Dark mode support
- Keyboard navigation
- Responsive design

### Backend (FastAPI)

**Technology Stack:**
- FastAPI - Web framework
- SQLAlchemy - ORM
- SQLite - Database
- Pydantic - Data validation
- Uvicorn - ASGI server

**API Endpoints:**

**Photos:**
- `POST /api/v1/photos/upload` - Upload single photo
- `POST /api/v1/photos/upload-multiple` - Upload multiple photos
- `POST /api/v1/photos/import-folder` - Import from folder
- `GET /api/v1/photos/` - List photos with pagination
- `GET /api/v1/photos/{id}` - Get photo details
- `DELETE /api/v1/photos/{id}` - Delete photo
- `GET /api/v1/photos/duplicates/find` - Find duplicates

**Faces:**
- `POST /api/v1/faces/detect/{photo_id}` - Detect faces
- `POST /api/v1/faces/cluster-all` - Cluster all faces
- `GET /api/v1/faces/people` - List all people
- `GET /api/v1/faces/people/{id}` - Get person details
- `PUT /api/v1/faces/people/{id}/rename` - Rename person
- `POST /api/v1/faces/people/merge` - Merge people
- `POST /api/v1/faces/people/{id}/split` - Split person
- `GET /api/v1/faces/people/{id}/photos` - Get person's photos

**Export:**
- `POST /api/v1/export/photos` - Export selected photos
- `POST /api/v1/export/by-person` - Export by person
- `POST /api/v1/export/by-event` - Export by event
- `POST /api/v1/export/by-album` - Export by album
- `POST /api/v1/export/by-date-range` - Export by date range

### Services Layer

**PhotoService:**
- Photo import and management
- Metadata extraction (EXIF)
- Thumbnail generation
- Duplicate detection (perceptual hashing)
- File hash computation

**FaceService:**
- Face detection orchestration
- Face clustering management
- Person CRUD operations
- Cluster merging and splitting
- Face-to-person assignment

**SearchService:**
- FAISS index management
- Face similarity search
- CLIP-based semantic search
- Index persistence and loading

**ExportService:**
- Rule-based photo export
- Organization by date/person/event/album
- Export manifest generation
- Batch export operations

### AI Pipeline

**Face Recognition (InsightFace):**
- Model: buffalo_l
- Face detection with bounding boxes
- 512-dimensional face embeddings
- Age and gender estimation
- Facial landmark detection
- Face alignment

**Semantic Understanding (CLIP):**
- Model: ViT-B/32
- 512-dimensional image embeddings
- Text-to-image search
- Object and scene understanding
- Zero-shot classification

**Clustering (HDBSCAN/DBSCAN):**
- Density-based clustering
- Automatic cluster count determination
- Noise handling (outlier detection)
- Incremental clustering support
- Cluster quality metrics

### Database Schema

**Core Tables:**

```sql
photos
├── id (PK)
├── file_path (unique)
├── file_hash
├── phash (perceptual hash)
├── width, height, format
├── taken_at, imported_at
├── latitude, longitude
├── camera_make, camera_model
├── processed (boolean)
└── metadata_json

faces
├── id (PK)
├── photo_id (FK)
├── person_id (FK)
├── bbox_x, bbox_y, bbox_width, bbox_height
├── confidence
├── landmarks (JSON)
├── embedding_id (FK)
└── age, gender

people
├── id (PK)
├── name
├── cluster_id
├── face_count
├── primary_face_id (FK)
├── thumbnail_path
└── is_verified

embeddings
├── id (PK)
├── embedding_type (face/clip)
├── faiss_index
└── vector_dim

tags
├── id (PK)
├── name (unique)
├── category
├── auto_generated
└── photo_count

albums
├── id (PK)
├── name
├── album_type
├── is_smart
├── smart_rules (JSON)
└── cover_photo_id (FK)

events
├── id (PK)
├── name
├── start_time, end_time
├── location_name
├── latitude, longitude
└── cover_photo_id (FK)

processing_jobs
├── id (PK)
├── job_type
├── status
├── photo_id (FK)
├── progress
└── error_message
```

### Storage Layer

**SQLite Database:**
- Metadata storage
- Relational data
- ACID compliance
- Single-file portability

**FAISS Indexes:**
- Face embeddings index
- CLIP embeddings index
- GPU acceleration support
- Cosine similarity search
- Efficient k-NN queries

**File System:**
- Original photos
- Thumbnails (300x300)
- Previews (1920x1080)
- Cache directory
- AI models

### Background Workers

**PhotoProcessor:**
- Asynchronous job processing
- Face detection pipeline
- CLIP embedding generation
- Progress tracking
- Error handling and retry

**Processing Pipeline:**
1. Photo import → Database entry
2. Thumbnail generation
3. EXIF metadata extraction
4. Face detection (InsightFace)
5. Face embedding generation
6. CLIP embedding generation
7. Perceptual hash computation
8. Mark as processed

**Clustering Pipeline:**
1. Collect all face embeddings
2. Run HDBSCAN/DBSCAN
3. Create/update Person records
4. Assign faces to people
5. Update face counts
6. Select primary faces

## Data Flow

### Photo Import Flow

```
User Upload
    ↓
Frontend (UploadModal)
    ↓
POST /api/v1/photos/upload-multiple
    ↓
PhotoService.import_photo()
    ├── Copy to library
    ├── Extract metadata
    ├── Compute hashes
    ├── Generate thumbnails
    └── Create DB record
    ↓
Create ProcessingJob
    ↓
Background Worker
    ├── Detect faces
    ├── Generate embeddings
    └── Mark processed
```

### Face Recognition Flow

```
Photo Processed
    ↓
FaceDetector.detect_faces()
    ├── Load image
    ├── Run InsightFace
    ├── Extract bounding boxes
    ├── Generate embeddings
    └── Store in DB
    ↓
FaceClusterer.cluster_faces()
    ├── Collect all embeddings
    ├── Run HDBSCAN
    ├── Assign cluster IDs
    └── Create Person records
    ↓
Update UI (People panel)
```

### Search Flow

```
User Query
    ↓
Frontend Search
    ↓
GET /api/v1/search?q=...
    ↓
SearchService
    ├── Text → CLIP embedding
    ├── Query FAISS index
    ├── Get top-k results
    └── Fetch photo metadata
    ↓
Return ranked results
```

## Performance Optimizations

### Frontend
- React Query caching
- Virtual scrolling for large galleries
- Lazy image loading
- Thumbnail prefetching
- Debounced search

### Backend
- Async/await for I/O operations
- Connection pooling
- Batch processing
- Index caching
- Thumbnail caching

### AI Pipeline
- GPU acceleration (CUDA)
- Batch inference
- Model caching
- Lazy model loading
- Multi-threading

### Database
- Indexed columns
- Efficient queries
- Pagination
- Prepared statements
- Transaction batching

## Scalability Considerations

### For 100k+ Photos

**Database:**
- SQLite handles millions of rows efficiently
- Indexes on frequently queried columns
- Periodic VACUUM for optimization

**FAISS:**
- IndexFlatIP for exact search
- Can upgrade to IndexIVFFlat for larger datasets
- GPU acceleration for faster search

**Storage:**
- Thumbnails reduce bandwidth
- Lazy loading prevents memory issues
- SSD recommended for performance

**Processing:**
- Background workers prevent UI blocking
- Batch processing for efficiency
- Progress tracking for user feedback

## Security & Privacy

**100% Offline:**
- No external API calls
- No telemetry or analytics
- All data stays local

**Data Protection:**
- Local file system only
- No cloud storage
- User controls all data

**Access Control:**
- Single-user system
- File system permissions
- No authentication needed (local only)

## Deployment

**Development:**
```bash
# Backend
uvicorn app.main:app --reload --port 8000

# Frontend
npm run dev

# Worker
python workers/photo_processor.py
```

**Production:**
```bash
# Backend
uvicorn app.main:app --workers 4 --port 8000

# Frontend
npm run build
# Serve with nginx or similar

# Worker (systemd service)
systemctl start ondevicefaceai-worker
```

## Future Enhancements

- Video support
- Advanced editing tools
- Mobile app (React Native)
- Multi-user support
- Local network sync
- Advanced face aging recognition
- Custom object detection training
- Timeline view
- Map view for geotagged photos
- Slideshow mode
- Batch editing
- Advanced filters
