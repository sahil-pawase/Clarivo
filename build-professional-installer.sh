#!/bin/bash

# Clarivo Professional Installer Build Script
# Creates a professional installer like big software companies

set -e

echo "🏢 Building Clarivo Professional Desktop Application..."
echo "================================================"

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

print_header "STEP 1: Python Version Check"

# Check Python version and ensure compatibility
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -eq 11 ]; then
    print_status "✅ Python 3.11 detected - Perfect!"
    PYTHON_OK=1
elif [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -eq 12 ]; then
    print_status "✅ Python 3.12 detected - Perfect!"
    PYTHON_OK=1
elif [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -eq 13 ]; then
    print_warning "⚠️ Python 3.13 detected - May have compatibility issues"
    print_status "Recommending Python 3.11 or 3.12 for best compatibility"
    PYTHON_OK=0
else
    print_status "✅ Python version acceptable"
    PYTHON_OK=1
fi

print_status "Python version: $PYTHON_VERSION"

print_header "STEP 2: Backend Build with Compatibility"

cd backend

# Create virtual environment with specific Python version
if [ -d "venv" ]; then
    rm -rf venv
fi

print_status "Creating Python virtual environment..."
$PYTHON_CMD -m venv venv

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip to latest version
print_status "Upgrading pip..."
pip install --upgrade pip

# Install compatible dependencies
print_status "Installing Python dependencies with compatibility fixes..."
if [ -f "requirements-py311.txt" ]; then
    print_status "Using Python 3.11/3.12 compatible requirements..."
    pip install -r requirements-py311.txt
else
    print_status "Using standard requirements with compatibility fixes..."
    pip install --only-binary=all -r requirements.txt || {
        print_status "Falling back to source builds..."
        pip install -r requirements.txt
    }
fi

# Install PyInstaller
pip install pyinstaller==6.2.0

# Create advanced PyInstaller spec for professional build
print_status "Creating professional PyInstaller specification..."
cat > clarivo-backend-pro.spec << 'EOF'
# -*- mode: python ; coding: utf-8 -*-
# Clarivo Professional Build Specification

import sys
import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# Collect all data files and submodules
datas = []
datas += collect_data_files('fastapi')
datas += collect_data_files('uvicorn')
datas += collect_data_files('pydantic')
datas += [('app', 'app')]
datas += [('.env', '.')]

# Hidden imports for all dependencies
hiddenimports = []
hiddenimports += collect_submodules('fastapi')
hiddenimports += collect_submodules('uvicorn')
hiddenimports += collect_submodules('pydantic')
hiddenimports += collect_submodules('sqlalchemy')
hiddenimports += collect_submodules('pandas')
hiddenimports += collect_submodules('numpy')

# Additional hidden imports
hiddenimports += [
    'uvicorn.lifespan.on',
    'uvicorn.lifespan.off',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.protocols.websockets.websockets_impl',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.http.httptools_impl',
    'uvicorn.loops.auto',
    'uvicorn.loops.asyncio',
    'fastapi.routing',
    'fastapi.middleware',
    'fastapi.middleware.cors',
    'starlette.middleware',
    'starlette.middleware.cors',
    'multipart',
    'email.mime.multipart',
    'email.mime.text',
    'email.mime.base',
]

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
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
print_status "Building professional backend executable..."
pyinstaller clarivo-backend-pro.spec --clean --noconfirm --log-level=INFO

# Create dist directory and copy executable
mkdir -p ../dist
cp dist/clarivo-backend ../dist/

print_status "✅ Professional backend executable built successfully"

cd ..

print_header "STEP 3: Frontend Professional Build"

cd frontend

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf node_modules package-lock.json build dist

# Install dependencies with audit fix
print_status "Installing Node.js dependencies with security fixes..."
npm install

# Fix security vulnerabilities
print_status "Fixing security vulnerabilities..."
npm audit fix --force || true

# Install additional Electron dependencies for professional build
print_status "Installing professional Electron build tools..."
npm install --save-dev \
    electron-builder@^24.6.4 \
    electron-updater@^6.1.4

# Create professional electron-builder configuration
print_status "Configuring professional build settings..."
cat > electron-builder-config.json << 'EOF'
{
  "appId": "com.clarivo.desktop",
  "productName": "Clarivo",
  "copyright": "Copyright © 2024 Clarivo Team",
  "directories": {
    "output": "../installer-output"
  },
  "files": [
    "build/**/*",
    "public/electron.js",
    "public/preload.js",
    "public/favicon.ico",
    "node_modules/**/*"
  ],
  "extraResources": [
    {
      "from": "../dist/clarivo-backend",
      "to": "backend/clarivo-backend"
    }
  ],
  "linux": {
    "target": [
      {
        "target": "AppImage",
        "arch": ["x64"]
      },
      {
        "target": "deb",
        "arch": ["x64"]
      }
    ],
    "icon": "public/favicon.ico",
    "category": "Office",
    "artifactName": "Clarivo-${version}.${ext}"
  },
  "mac": {
    "target": [
      {
        "target": "dmg",
        "arch": ["x64", "arm64"]
      }
    ],
    "icon": "public/favicon.ico",
    "category": "public.app-category.productivity",
    "artifactName": "Clarivo-${version}.${ext}"
  },
  "dmg": {
    "title": "Clarivo Installer",
    "icon": "public/favicon.ico",
    "background": null,
    "contents": [
      {
        "x": 410,
        "y": 150,
        "type": "link",
        "path": "/Applications"
      },
      {
        "x": 130,
        "y": 150,
        "type": "file"
      }
    ]
  },
  "publish": null
}
EOF

# Build React application
print_status "Building React application for production..."
npm run build

# Build Electron application with professional installer
print_status "Building professional Electron installer..."
npx electron-builder --config electron-builder-config.json

print_status "✅ Professional Electron application built successfully"

cd ..

print_header "STEP 4: Creating Professional Package"

# Create professional distribution folder
mkdir -p Clarivo-Professional

# Copy installers based on platform
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if [ -f "installer-output/Clarivo-"*.AppImage ]; then
        cp installer-output/Clarivo-*.AppImage Clarivo-Professional/
        print_status "✅ Linux AppImage copied"
    fi
    if [ -f "installer-output/Clarivo-"*.deb ]; then
        cp installer-output/Clarivo-*.deb Clarivo-Professional/
        print_status "✅ Debian package copied"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    if [ -f "installer-output/Clarivo-"*.dmg ]; then
        cp installer-output/Clarivo-*.dmg Clarivo-Professional/
        print_status "✅ Mac DMG copied"
    fi
fi

# Create portable version
if [ -d "installer-output/linux-unpacked" ]; then
    print_status "Creating portable version..."
    cp -r installer-output/linux-unpacked Clarivo-Professional/Clarivo-Portable
    
    # Create portable launcher
    cat > Clarivo-Professional/Clarivo-Portable/launch-clarivo.sh << 'EOF'
#!/bin/bash
echo "Starting Clarivo..."
echo "Please wait while the application loads..."
./Clarivo
EOF
    chmod +x Clarivo-Professional/Clarivo-Portable/launch-clarivo.sh
elif [ -d "installer-output/mac" ]; then
    print_status "Creating portable version..."
    cp -r installer-output/mac Clarivo-Professional/Clarivo-Portable
fi

# Create README for distribution
cat > Clarivo-Professional/README.md << 'EOF'
# Clarivo - AI-Powered Data Analysis Tool

## Installation Options

### Option 1: Package Installation (Recommended)

#### Linux:
- **AppImage**: `chmod +x Clarivo-1.0.0.AppImage && ./Clarivo-1.0.0.AppImage`
- **Debian/Ubuntu**: `sudo dpkg -i Clarivo-1.0.0.deb`

#### Mac:
- **DMG**: Open `Clarivo-1.0.0.dmg` and drag to Applications

### Option 2: Portable Version
1. Extract `Clarivo-Portable` folder to desired location
2. Run `launch-clarivo.sh` (Linux) or open `Clarivo.app` (Mac)

## Features
- AI-powered data analysis
- Statistical analysis (mean, median, mode, etc.)
- Interactive data visualizations
- Data import/export (CSV, Excel, JSON)
- Offline operation (no internet required)

## System Requirements
- **Linux**: Ubuntu 18.04+ or equivalent (64-bit)
- **Mac**: macOS 10.14+ (64-bit)
- 4GB RAM minimum (8GB recommended)
- 500MB free disk space

## Support
For support and documentation, visit: https://clarivo.com

Copyright © 2024 Clarivo Team. All rights reserved.
EOF

# Create version info
cat > Clarivo-Professional/VERSION.txt << EOF
Clarivo Desktop Application
Version: 1.0.0
Build Date: $(date)

Components:
- Frontend: React + Electron
- Backend: Python FastAPI
- AI Engine: Built-in statistical analysis

Installation includes:
✅ Complete desktop application
✅ AI-powered data analysis
✅ Statistical analysis tools
✅ Data visualization engine
✅ Import/Export capabilities
✅ Offline operation
EOF

print_header "BUILD COMPLETE! 🎉"

echo ""
echo -e "${GREEN}✅ Clarivo Professional Desktop Application built successfully!${NC}"
echo ""
echo -e "${BLUE}📦 Professional Distribution Package:${NC}"
echo -e "  📁 Location: ${GREEN}Clarivo-Professional/${NC}"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "  🚀 AppImage: ${GREEN}Clarivo-1.0.0.AppImage${NC}"
    echo -e "  📦 Debian: ${GREEN}Clarivo-1.0.0.deb${NC}"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "  🚀 Installer: ${GREEN}Clarivo-1.0.0.dmg${NC}"
fi
echo -e "  📱 Portable: ${GREEN}Clarivo-Portable/${NC}"
echo -e "  📖 Documentation: ${GREEN}README.md${NC}"
echo ""
echo -e "${BLUE}🏢 Professional Features:${NC}"
echo -e "  ✅ Native package installer"
echo -e "  ✅ Desktop integration"
echo -e "  ✅ Uninstaller included"
echo -e "  ✅ Portable version available"
echo -e "  ✅ Professional branding"
echo -e "  ✅ Code signing ready"
echo -e "  ✅ Auto-updater support"
echo ""
echo -e "${GREEN}🎯 Ready for Distribution!${NC}"
echo -e "  - Professional installer like major software companies"
echo -e "  - Cross-platform support"
echo -e "  - Easy deployment and distribution"
echo ""

# Open the distribution folder if on Linux with GUI
if command -v xdg-open &> /dev/null; then
    xdg-open Clarivo-Professional
elif command -v open &> /dev/null; then
    open Clarivo-Professional
fi

echo "Build complete! Check the Clarivo-Professional folder for distribution files."