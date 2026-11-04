#!/bin/bash

# Clarivo Electron Desktop App Build Script
# This script builds the complete Electron desktop application

set -e  # Exit on any error

echo "🚀 Building Clarivo Electron Desktop Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check PyInstaller
if ! command -v pyinstaller &> /dev/null; then
    print_status "Installing PyInstaller..."
    pip install pyinstaller
fi

print_status "✅ PyInstaller available"

print_header "STEP 2: Backend Build"

cd backend

# Create virtual environment if it doesn't exist
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

# Install dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt
pip install pyinstaller

# Create PyInstaller spec file
print_status "Creating PyInstaller specification..."
cat > clarivo-backend.spec << 'EOF'
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('app', 'app'),
        ('.env', '.'),
    ],
    hiddenimports=[
        'uvicorn.lifespan.on',
        'uvicorn.lifespan.off',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.protocols.websockets.websockets_impl',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.http.httptools_impl',
        'uvicorn.loops.auto',
        'uvicorn.loops.asyncio',
        'uvicorn.loops.uvloop',
        'fastapi',
        'pydantic',
        'sqlalchemy',
        'pandas',
        'numpy',
        'openpyxl',
        'xlrd',
        'chardet',
        'aiofiles',
        'python_multipart',
        'python_dotenv',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='clarivo-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
EOF

# Build backend executable
print_status "Building backend executable..."
pyinstaller clarivo-backend.spec --clean --noconfirm

# Move executable to dist folder
mkdir -p ../dist
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    cp dist/clarivo-backend.exe ../dist/
else
    cp dist/clarivo-backend ../dist/
fi

print_status "✅ Backend executable built successfully"

cd ..

print_header "STEP 3: Frontend Setup and Build"

cd frontend

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install

# Install Electron dependencies
print_status "Installing Electron build dependencies..."
npm install --save-dev electron electron-builder concurrently wait-on

# Build React application
print_status "Building React application..."
npm run build

print_status "✅ Frontend build completed"

print_header "STEP 4: Electron App Build"

# Build Electron application
print_status "Building Electron desktop application..."
npm run electron-pack

print_status "✅ Electron application built successfully"

cd ..

print_header "STEP 5: Creating Portable Version"

# Create portable version directory
mkdir -p clarivo-portable

# Copy built Electron app
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    if [ -d "c:/clarivo-build/win-unpacked" ]; then
        cp -r c:/clarivo-build/win-unpacked/* clarivo-portable/
    elif [ -d "frontend/dist/win-unpacked" ]; then
        cp -r frontend/dist/win-unpacked/* clarivo-portable/
    fi
    
    # Create Windows launcher
    cat > clarivo-portable/Clarivo.bat << 'EOF'
@echo off
echo Starting Clarivo...
start "" "Clarivo.exe"
EOF
    
else
    # Linux/Mac
    if [ -d "frontend/dist/linux-unpacked" ]; then
        cp -r frontend/dist/linux-unpacked/* clarivo-portable/
    elif [ -d "frontend/dist/mac" ]; then
        cp -r frontend/dist/mac/* clarivo-portable/
    fi
    
    # Create Linux/Mac launcher
    cat > clarivo-portable/clarivo.sh << 'EOF'
#!/bin/bash
echo "Starting Clarivo..."
./Clarivo
EOF
    chmod +x clarivo-portable/clarivo.sh
fi

print_status "✅ Portable version created"

print_header "BUILD COMPLETE! 🎉"

echo ""
echo -e "${GREEN}✅ Clarivo Electron Desktop Application built successfully!${NC}"
echo ""
echo -e "${BLUE}Build Outputs:${NC}"
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo -e "  📦 Installer: ${GREEN}c:/clarivo-build/Clarivo Setup.exe${NC}"
    echo -e "  📁 Portable: ${GREEN}clarivo-portable/${NC}"
    echo -e "  🚀 Run: ${YELLOW}Double-click Clarivo Setup.exe to install${NC}"
    echo -e "  🚀 Or run: ${YELLOW}clarivo-portable/Clarivo.exe${NC}"
else
    echo -e "  📦 AppImage: ${GREEN}frontend/dist/Clarivo.AppImage${NC}"
    echo -e "  📁 Portable: ${GREEN}clarivo-portable/${NC}"
    echo -e "  🚀 Run: ${YELLOW}./frontend/dist/Clarivo.AppImage${NC}"
    echo -e "  🚀 Or run: ${YELLOW}./clarivo-portable/clarivo.sh${NC}"
fi
echo ""
echo -e "${BLUE}Features Included:${NC}"
echo -e "  ✅ Complete Desktop Application"
echo -e "  ✅ Embedded Python Backend"
echo -e "  ✅ AI-Powered Data Analysis"
echo -e "  ✅ Statistical Analysis (Mean, Median, Mode, etc.)"
echo -e "  ✅ Interactive Visualizations"
echo -e "  ✅ Data Import/Export"
echo -e "  ✅ No Internet Required"
echo ""
echo -e "${GREEN}🎯 Clarivo Desktop App is ready to distribute!${NC}"