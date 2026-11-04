#!/bin/bash

# Clarivo Stop Script for Unix/Linux systems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print banner
clear
print_header "========================================"
print_header "           CLARIVO STOP"
print_header "========================================"
echo

print_status "Stopping Clarivo services..."
echo

# Function to check if port is in use and kill process
stop_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        print_status "Stopping $service_name process (PID: $pid)..."
        kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
        sleep 2
    else
        print_status "$service_name is not running on port $port"
    fi
}

# Stop frontend (port 3000)
stop_port 3000 "Frontend"

# Stop backend (port 8000)
stop_port 8000 "Backend"

# Kill any remaining Clarivo processes
print_status "Stopping any remaining Clarivo processes..."

# Kill Node.js processes related to Clarivo
pkill -f "npm start" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# Kill Python processes related to Clarivo
pkill -f "python main.py" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true

# Clean up PID files
rm -f /tmp/clarivo_backend.pid 2>/dev/null || true
rm -f /tmp/clarivo_frontend.pid 2>/dev/null || true

echo
print_header "========================================"
print_header "        CLARIVO STOPPED!"
print_header "========================================"
echo
print_status "All Clarivo services have been stopped."
echo

read -p "Press Enter to exit..."
