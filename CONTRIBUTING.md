# Contributing to OnDeviceFaceAI

## Development Setup

### Prerequisites
- Python 3.9+
- Node.js 16+
- Git

### Clone and Setup

```bash
git clone git@github.com:TSnamia/OnDeviceFaceAI.git
cd OnDeviceFaceAI
./scripts/setup.sh
```

## Development Workflow

### Backend Development

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Code Style

**Python:**
```bash
black app/
flake8 app/
```

**JavaScript:**
```bash
npm run lint
```

## Project Structure

- `frontend/` - React web application
- `backend/` - FastAPI server
- `ai-pipeline/` - AI processing modules
- `scripts/` - Setup and utility scripts

## Adding Features

### New API Endpoint

1. Create route in `backend/app/api/`
2. Add service logic in `backend/app/services/`
3. Update API router in `backend/app/api/__init__.py`
4. Add frontend API call in `frontend/src/services/api.js`

### New AI Model

1. Add model loader in `ai-pipeline/`
2. Create service wrapper
3. Integrate with processing pipeline
4. Update `scripts/download_models.py`

## Testing

```bash
cd backend
pytest tests/
```

## Documentation

Update relevant files:
- `README.md` - User-facing features
- `ARCHITECTURE.md` - Technical details
- `QUICKSTART.md` - Setup instructions

## Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit PR with description

## License

MIT License - See LICENSE file
