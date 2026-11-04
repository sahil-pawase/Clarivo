#!/bin/bash

# Clarivo Installer for Unix/Linux systems
# AI-Powered Data Analysis Tool

set -e

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
    echo -e "${BLUE}$1${NC}"
}

# Print banner
clear
print_header "========================================"
print_header "           CLARIVO INSTALLER"
print_header "    AI-Powered Data Analysis Tool"
print_header "========================================"
echo

print_status "This installer will set up Clarivo on your system."
echo
print_status "Requirements:"
echo "  - Python 3.8 or higher"
echo "  - Node.js 16 or higher"
echo "  - npm (comes with Node.js)"
echo

read -p "Press Enter to continue with the installation..."

# Check Python
print_status "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        print_error "Python is not installed or not in PATH"
        print_error "Please install Python 3.8 or higher"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
print_status "Found Python $PYTHON_VERSION"

# Check Node.js
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    print_error "Please install Node.js 16 or higher from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
print_status "Found Node.js $NODE_VERSION"

# Check npm
print_status "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    print_error "Please install npm (comes with Node.js)"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_status "Found npm $NPM_VERSION"

echo
print_status "All requirements are met! Starting installation..."
echo

# Run the Python setup script
$PYTHON_CMD setup.py

if [ $? -ne 0 ]; then
    print_error "Installation failed! Please check the errors above."
    exit 1
fi

echo
print_header "========================================"
print_header "        INSTALLATION COMPLETED!"
print_header "========================================"
echo
print_status "Clarivo has been successfully installed!"
echo
print_status "To start the application:"
echo "  1. Run './start-clarivo.sh' from this folder"
echo "  2. Or use the desktop shortcut (if created)"
echo
print_status "The application will open in your web browser at:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo

read -p "Press Enter to exit..."
