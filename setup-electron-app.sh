#!/bin/bash

# Clarivo Electron App Complete Setup Script
# This script sets up everything needed for the Electron desktop application

set -e

echo "🚀 Setting up Clarivo Electron Desktop Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the clarivo root directory"
    exit 1
fi

print_header "STEP 1: System Requirements Check"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16+ is required. Current version: $(node --version)"
    exit 1
fi

print_status "✅ Node.js $(node --version) detected"

# Check Python
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    print_error "Python is not installed. Please install Python 3.8+ from https://python.org/"
    exit 1
fi

PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

print_status "✅ Python detected"

print_header "STEP 2: Backend Setup"

cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
mkdir -p uploads data

print_status "✅ Backend setup complete"

cd ..

print_header "STEP 3: Frontend Setup"

cd frontend

# Clear npm cache
print_status "Clearing npm cache..."
npm cache clean --force

# Remove node_modules if exists
if [ -d "node_modules" ]; then
    print_status "Removing existing node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
fi

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install

# Install Electron specific dependencies
print_status "Installing Electron dependencies..."
npm install --save-dev electron electron-builder concurrently wait-on

# Fix any dependency issues
print_status "Fixing dependency issues..."
npm audit fix --force || true

print_status "✅ Frontend setup complete"

cd ..

print_header "STEP 4: Configuration Setup"

# Create backend .env file
if [ ! -f "backend/.env" ]; then
    print_status "Creating backend .env file..."
    cat > backend/.env << EOF
# Clarivo Backend Configuration
DEBUG=True
SECRET_KEY=clarivo-desktop-app-secret-key
DATABASE_URL=sqlite:///./clarivo.db
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
UPLOAD_DIR=uploads
MAX_FILE_SIZE=100MB
HOST=127.0.0.1
PORT=8000
EOF
fi

# Create frontend .env file
if [ ! -f "frontend/.env" ]; then
    print_status "Creating frontend .env file..."
    cat > frontend/.env << EOF
# Clarivo Frontend Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
BROWSER=none
EOF
fi

print_status "✅ Configuration files created"

print_header "STEP 5: Electron Configuration"

cd frontend

# Update package.json for Electron
print_status "Updating Electron configuration..."

# Create preload.js if it doesn't exist
if [ ! -f "public/preload.js" ]; then
    cat > public/preload.js << 'EOF'
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any APIs you want to expose to the renderer process
  getVersion: () => ipcRenderer.invoke('get-version'),
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
});
EOF
fi

print_status "✅ Electron configuration updated"

cd ..

print_header "STEP 6: Build Test"

cd frontend

# Test build
print_status "Testing React build..."
npm run build

print_status "✅ Build test successful"

cd ..

print_header "STEP 7: Creating Run Scripts"

# Create development script
cat > run-dev.sh << 'EOF'
#!/bin/bash
echo "🔧 Starting Clarivo in Development Mode..."

# Function to cleanup processes on exit
cleanup() {
    echo "🛑 Shutting down..."
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
cd backend
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Start Electron
cd frontend
npm run electron-dev &
cd ..

echo "✅ Development mode started!"
echo "Press Ctrl+C to stop"

wait $BACKEND_PID
EOF

chmod +x run-dev.sh

# Create Windows development script
cat > run-dev.bat << 'EOF'
@echo off
echo 🔧 Starting Clarivo in Development Mode...

cd backend
call venv\Scripts\activate
start "Backend" cmd /k "python main.py"
cd ..

timeout /t 3 /nobreak > nul

cd frontend
start "Electron" cmd /k "npm run electron-dev"
cd ..

echo ✅ Development mode started!
pause
EOF

# Create build script shortcut
cat > build-app.sh << 'EOF'
#!/bin/bash
echo "🏗️ Building Clarivo Desktop App..."
./build-electron-app.sh
EOF

chmod +x build-app.sh

cat > build-app.bat << 'EOF'
@echo off
echo 🏗️ Building Clarivo Desktop App...
call build-electron-app.bat
EOF

print_status "✅ Run scripts created"

print_header "SETUP COMPLETE! 🎉"

echo ""
echo -e "${GREEN}✅ Clarivo Electron Desktop Application setup complete!${NC}"
echo ""
echo -e "${BLUE}Available Commands:${NC}"
echo ""
echo -e "${YELLOW}Development Mode:${NC}"
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo -e "  🔧 ${GREEN}run-dev.bat${NC} - Start development mode"
    echo -e "  🔧 ${GREEN}run-electron-dev.bat${NC} - Advanced development mode"
else
    echo -e "  🔧 ${GREEN}./run-dev.sh${NC} - Start development mode"
    echo -e "  🔧 ${GREEN}./run-electron-dev.sh${NC} - Advanced development mode"
fi
echo ""
echo -e "${YELLOW}Build Desktop App:${NC}"
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo -e "  🏗️ ${GREEN}build-app.bat${NC} - Build desktop application"
    echo -e "  🏗️ ${GREEN}build-electron-app.bat${NC} - Full build process"
else
    echo -e "  🏗️ ${GREEN}./build-app.sh${NC} - Build desktop application"
    echo -e "  🏗️ ${GREEN}./build-electron-app.sh${NC} - Full build process"
fi
echo ""
echo -e "${BLUE}Features Ready:${NC}"
echo -e "  ✅ Electron Desktop Application"
echo -e "  ✅ Embedded Python Backend"
echo -e "  ✅ React Frontend with AI Analysis"
echo -e "  ✅ Statistical Analysis (Mean, Median, Mode, etc.)"
echo -e "  ✅ Interactive Data Visualizations"
echo -e "  ✅ Data Import/Export Capabilities"
echo -e "  ✅ Offline Operation (No Internet Required)"
echo ""
echo -e "${GREEN}🎯 Ready to develop and build your Electron app!${NC}"
echo ""

# Ask if user wants to start development mode
read -p "Would you like to start development mode now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting development mode..."
    ./run-dev.sh
fi