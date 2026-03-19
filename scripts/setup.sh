#!/bin/bash

set -e

echo "🚀 OnDeviceFaceAI Setup Script"
echo "=============================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "📁 Project directory: $PROJECT_DIR"
echo ""

echo "1️⃣  Setting up Python backend..."
cd "$PROJECT_DIR/backend"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "2️⃣  Initializing database..."
python scripts/init_db.py

echo ""
echo "3️⃣  Downloading AI models..."
echo "⚠️  This will download ~2GB of models. Continue? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    python scripts/download_models.py
else
    echo "⏭  Skipping model download. Run 'python backend/scripts/download_models.py' later."
fi

echo ""
echo "4️⃣  Setting up Node.js frontend..."
cd "$PROJECT_DIR/frontend"

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

echo "Installing Node.js dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd $PROJECT_DIR/backend"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload --port 8000"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd $PROJECT_DIR/frontend"
echo "  npm run dev"
echo ""
echo "Terminal 3 (Background Worker - Optional):"
echo "  cd $PROJECT_DIR/backend"
echo "  source venv/bin/activate"
echo "  python workers/photo_processor.py"
echo ""
echo "Then open http://localhost:5173 in your browser"
echo ""
