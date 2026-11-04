#!/bin/bash

# Clarivo Uninstaller for Unix/Linux systems

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
print_header "           CLARIVO UNINSTALLER"
print_header "========================================"
echo

print_warning "This will remove Clarivo from your system."
echo
print_warning "WARNING: This will delete:"
echo "  - Virtual environment (backend/venv)"
echo "  - Node modules (frontend/node_modules)"
echo "  - Desktop shortcut"
echo "  - Startup scripts"
echo
print_status "Your uploaded data will NOT be deleted."
echo

read -p "Are you sure you want to continue? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    print_status "Uninstallation cancelled."
    exit 0
fi

echo
print_status "Removing Clarivo..."

# Remove virtual environment
if [ -d "backend/venv" ]; then
    print_status "Removing virtual environment..."
    rm -rf backend/venv
fi

# Remove node modules
if [ -d "frontend/node_modules" ]; then
    print_status "Removing node modules..."
    rm -rf frontend/node_modules
fi

# Remove startup scripts
if [ -f "start-clarivo.sh" ]; then
    print_status "Removing startup script..."
    rm -f start-clarivo.sh
fi

if [ -f "start-clarivo.bat" ]; then
    print_status "Removing startup script..."
    rm -f start-clarivo.bat
fi

# Remove desktop shortcut
print_status "Removing desktop shortcut..."
if [ -f "$HOME/Desktop/Clarivo.desktop" ]; then
    rm -f "$HOME/Desktop/Clarivo.desktop"
fi

echo
print_header "========================================"
print_header "        UNINSTALLATION COMPLETED!"
print_header "========================================"
echo
print_status "Clarivo has been removed from your system."
echo
print_status "Note: Your uploaded data in the 'data' folder"
print_status "has been preserved. You can delete it manually"
print_status "if you no longer need it."
echo

read -p "Press Enter to exit..."
