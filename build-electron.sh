#!/bin/bash

# Clarivo Electron Builder for Unix/Linux systems

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print banner
clear
print_header "========================================"
print_header "        CLARIVO ELECTRON BUILDER"
print_header "========================================"
echo

print_status "This will build a standalone Clarivo desktop application."
echo

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the clarivo directory"
    exit 1
fi

print_status "Step 1: Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi

echo
print_status "Step 2: Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build frontend"
    exit 1
fi

echo
print_status "Step 3: Building Electron application..."
npm run electron-pack
if [ $? -ne 0 ]; then
    print_error "Failed to build Electron application"
    exit 1
fi

echo
print_header "========================================"
print_header "        BUILD COMPLETED!"
print_header "========================================"
echo
print_status "Your Clarivo desktop application has been built!"
echo
print_status "The executable can be found in:"
echo "  frontend/dist/"
echo
print_status "You can now distribute this as a standalone application."
echo

read -p "Press Enter to exit..."
