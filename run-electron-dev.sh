#!/bin/bash

# Clarivo Electron Development Mode Script
# This script runs the Electron app in development mode

set -e

echo "🔧 Starting Clarivo Electron App in Development Mode..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Please run this script from the clarivo root directory"
    exit 1
fi

print_header "Starting Development Environment"

# Function to cleanup processes on exit
cleanup() {
    echo "🛑 Shutting down development servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend in development mode
print_status "📡 Starting backend server..."
cd backend

# Activate virtual environment
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install dependencies if needed
if [ ! -f "venv/pyvenv.cfg" ] || [ ! -f ".deps_installed" ]; then
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    touch .deps_installed
fi

# Start backend
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
print_status "⏳ Waiting for backend to start..."
sleep 3

# Start frontend and Electron
print_status "🌐 Starting Electron application..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f ".deps_installed" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
    touch .deps_installed
fi

# Start Electron in development mode
npm run electron-dev &
FRONTEND_PID=$!

cd ..

print_status "✅ Clarivo Electron app is running in development mode!"
echo ""
echo -e "${BLUE}Development URLs:${NC}"
echo -e "  🌐 React Dev Server: ${GREEN}http://localhost:3000${NC}"
echo -e "  📡 Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "  📚 API Documentation: ${GREEN}http://localhost:8000/docs${NC}"
echo -e "  🖥️  Electron App: ${GREEN}Running in separate window${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID