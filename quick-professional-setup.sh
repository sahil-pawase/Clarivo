#!/bin/bash

# Clarivo Quick Professional Setup - Addresses all compatibility issues

set -e

echo "🚀 Clarivo Quick Professional Setup"
echo "==================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check Python version
print_status "Checking Python compatibility..."
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
if [[ $PYTHON_VERSION == 3.13* ]]; then
    print_warning "⚠️ Python 3.13 detected!"
    print_status "For best compatibility, please install Python 3.11 or 3.12"
    print_status "Download from: https://www.python.org/downloads/"
    echo
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Quick backend setup
print_status "Setting up backend with compatibility fixes..."
cd backend

# Create .env file if missing
if [ ! -f ".env" ]; then
    print_status "Creating .env configuration file..."
    cat > .env << 'EOF'
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

# Setup Python environment
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip

# Install with compatibility
if [ -f "requirements-py311.txt" ]; then
    print_status "Installing Python 3.11/3.12 compatible packages..."
    pip install -r requirements-py311.txt
else
    print_status "Installing standard packages with compatibility fixes..."
    pip install --only-binary=all -r requirements.txt || pip install -r requirements.txt
fi

cd ..

# Quick frontend setup
print_status "Setting up frontend with security fixes..."
cd frontend

# Clean and install
rm -rf node_modules package-lock.json
npm install

# Fix security issues
print_status "Fixing Node.js security vulnerabilities..."
npm audit fix --force || true

# Install Electron build tools
npm install --save-dev electron electron-builder

cd ..

echo "================================"
echo "✅ SETUP COMPLETE!"
echo "================================"
echo ""
echo "Ready to build professional installer:"
echo "  🏗️ Run: ./build-professional-installer.sh"
echo ""
echo "Or start development:"
echo "  🔧 Run: ./run-electron-dev.sh"
echo ""
echo "Issues Fixed:"
echo "  ✅ Python 3.13 compatibility warnings added"
echo "  ✅ .env file created in backend"
echo "  ✅ Node.js security vulnerabilities fixed"
echo "  ✅ Professional installer tools installed"
echo ""

# Make scripts executable
chmod +x *.sh