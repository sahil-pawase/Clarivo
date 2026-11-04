#!/bin/bash

# Clarivo Launcher for Unix/Linux systems

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Print banner
clear
print_header "========================================"
print_header "           CLARIVO LAUNCHER"
print_header "========================================"
echo

print_status "Starting Clarivo..."
echo

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check if backend is already running
if check_port 8000; then
    print_status "Backend is already running on port 8000"
else
    print_status "Starting backend..."
    cd "$SCRIPT_DIR/backend"
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        python main.py &
        BACKEND_PID=$!
        echo $BACKEND_PID > /tmp/clarivo_backend.pid
        sleep 5
    else
        print_warning "Backend virtual environment not found. Please run setup first."
        exit 1
    fi
fi

# Check if frontend is already running
if check_port 3000; then
    print_status "Frontend is already running on port 3000"
else
    print_status "Starting frontend..."
    cd "$SCRIPT_DIR/frontend"
    if [ -d "node_modules" ]; then
        npm start &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > /tmp/clarivo_frontend.pid
        sleep 10
    else
        print_warning "Frontend dependencies not found. Please run setup first."
        exit 1
    fi
fi

echo
print_status "Opening Clarivo in your default browser..."
echo

# Open the application in default browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
else
    print_warning "Could not automatically open browser. Please visit: http://localhost:3000"
fi

echo
print_header "========================================"
print_header "        CLARIVO IS READY!"
print_header "========================================"
echo
print_status "The application is now running at:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo
print_status "You can close this window now."
print_status "The application will continue running in the background."
echo
print_warning "To stop the application, run: ./stop.sh"
echo

read -p "Press Enter to exit..."
