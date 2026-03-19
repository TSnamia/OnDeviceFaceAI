# Quick Start Guide

## Prerequisites

- **Python 3.9+** with pip
- **Node.js 16+** with npm
- **8GB+ RAM** (16GB recommended)
- **GPU** (optional, for faster processing)

## Installation

### Automated Setup (Recommended)

```bash
cd OnDeviceFaceAI
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will:
1. Create Python virtual environment
2. Install all dependencies
3. Initialize database
4. Download AI models (~2GB)
5. Set up frontend

### Manual Setup

#### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python scripts/init_db.py
python scripts/download_models.py
```

#### Frontend

```bash
cd frontend
npm install
```

## Running the Application

### Option 1: Automated Start

```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Background Worker (Optional):**
```bash
cd backend
source venv/bin/activate
python workers/photo_processor.py
```

### Access the Application

- **Web UI:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs
- **Backend:** http://localhost:8000

## First Steps

1. **Import Photos**
   - Click "Import" button in the top right
   - Choose "Upload Files" or "Import Folder"
   - Select your photos or enter folder path

2. **Wait for Processing**
   - Photos are processed in the background
   - Face detection runs automatically
   - CLIP embeddings are generated

3. **View Results**
   - Check "People" tab to see detected faces
   - Rename people by clicking on them
   - Merge or split face clusters as needed

4. **Search**
   - Use the search bar for text queries
   - Filter by people, dates, or events
   - Browse smart albums

## Processing Existing Photos

If you have photos already imported but not processed:

```bash
cd backend
source venv/bin/activate
python scripts/process_photos.py
```

## Troubleshooting

### Models Not Downloading

```bash
cd backend
source venv/bin/activate
python scripts/download_models.py --force
```

### Database Issues

```bash
cd backend
source venv/bin/activate
python scripts/init_db.py
```

### GPU Not Detected

Edit `backend/.env`:
```
USE_GPU=False
```

### Port Already in Use

Change ports in:
- Backend: `uvicorn app.main:app --port 8001`
- Frontend: Edit `frontend/vite.config.js`

## Performance Tips

### For Large Libraries (100k+ photos)

1. **Enable GPU** (if available)
2. **Increase batch size** in `backend/.env`:
   ```
   BATCH_SIZE=64
   ```
3. **Use SSD** for database storage
4. **Run background worker** for async processing

### For Limited RAM

1. **Reduce batch size**:
   ```
   BATCH_SIZE=16
   ```
2. **Disable GPU**:
   ```
   USE_GPU=False
   ```

## Configuration

Edit `backend/.env` to customize:

- Processing batch sizes
- Face detection thresholds
- Clustering parameters
- Cache sizes
- GPU usage

## Next Steps

- Explore the API documentation at http://localhost:8000/docs
- Check out smart albums and event detection
- Try semantic search with text queries
- Export photos by people or events

## Getting Help

- Check the main README.md for detailed documentation
- Review API docs for integration options
- Check logs in the terminal for errors
