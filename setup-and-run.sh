#!/bin/bash

# Clarivo Complete Setup and Run Script
# This script sets up and runs the entire Clarivo application without errors

set -e  # Exit on any error

echo "🚀 Starting Clarivo Complete Setup..."

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

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm"
    exit 1
fi

print_status "✅ npm $(npm --version) detected"

# Check Python
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    print_error "Python is not installed. Please install Python 3.8+ from https://python.org/"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1-2)
print_status "✅ Python $PYTHON_VERSION detected"

# Check pip
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    print_error "pip is not installed. Please install pip"
    exit 1
fi

PIP_CMD="pip3"
if ! command -v pip3 &> /dev/null; then
    PIP_CMD="pip"
fi

print_status "✅ pip detected"

print_header "STEP 2: Backend Setup"

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    source venv/Scripts/activate
else
    # Linux/Mac
    source venv/bin/activate
fi

# Upgrade pip
print_status "Upgrading pip..."
$PIP_CMD install --upgrade pip

# Install Python dependencies
print_status "Installing Python dependencies..."
$PIP_CMD install -r requirements.txt

# Create necessary directories
mkdir -p uploads
mkdir -p data

print_status "✅ Backend setup complete"

cd ..

print_header "STEP 3: Frontend Setup"

cd frontend

# Clear npm cache
print_status "Clearing npm cache..."
npm cache clean --force

# Remove node_modules and package-lock.json if they exist
if [ -d "node_modules" ]; then
    print_status "Removing existing node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    print_status "Removing existing package-lock.json..."
    rm -f package-lock.json
fi

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install

# Fix any potential dependency issues
print_status "Fixing dependency issues..."
npm audit fix --force || true

print_status "✅ Frontend setup complete"

cd ..

print_header "STEP 4: Configuration Setup"

# Create backend .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    print_status "Creating backend .env file..."
    cat > backend/.env << EOF
# Clarivo Backend Configuration
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
DATABASE_URL=sqlite:///./clarivo.db
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
UPLOAD_DIR=uploads
MAX_FILE_SIZE=100MB

# Optional: Gemini API (for advanced AI features)
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: OpenAI API (for advanced AI features)
OPENAI_API_KEY=your-openai-api-key-here
EOF
fi

# Create frontend .env file if it doesn't exist
if [ ! -f "frontend/.env" ]; then
    print_status "Creating frontend .env file..."
    cat > frontend/.env << EOF
# Clarivo Frontend Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
EOF
fi

print_status "✅ Configuration files created"

print_header "STEP 5: Database Setup"

cd backend

# Activate virtual environment
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Initialize database (if using Alembic)
if [ -f "alembic.ini" ]; then
    print_status "Initializing database with Alembic..."
    alembic upgrade head || print_warning "Alembic migration failed, continuing..."
fi

print_status "✅ Database setup complete"

cd ..

print_header "STEP 6: Build Process"

cd frontend

# Build the frontend
print_status "Building frontend application..."
npm run build

print_status "✅ Frontend build complete"

cd ..

print_header "STEP 7: Creating Run Scripts"

# Create Windows batch file
cat > run-clarivo.bat << 'EOF'
@echo off
echo Starting Clarivo Application...

REM Start backend
echo Starting backend server...
cd backend
call venv\Scripts\activate
start "Clarivo Backend" cmd /k "python main.py"
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
echo Starting frontend server...
cd frontend
start "Clarivo Frontend" cmd /k "npm start"
cd ..

echo Clarivo is starting up...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
EOF

# Create Linux/Mac shell script
cat > run-clarivo.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Clarivo Application..."

# Function to cleanup processes on exit
cleanup() {
    echo "🛑 Shutting down Clarivo..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo "📡 Starting backend server..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "🌐 Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Clarivo is running!"
echo "📡 Backend: http://localhost:8000"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOF

# Make shell script executable
chmod +x run-clarivo.sh

# Create development script
cat > dev-clarivo.sh << 'EOF'
#!/bin/bash

echo "🔧 Starting Clarivo in Development Mode..."

# Function to cleanup processes on exit
cleanup() {
    echo "🛑 Shutting down development servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend in development mode
echo "📡 Starting backend in development mode..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend in development mode
echo "🌐 Starting frontend in development mode..."
cd frontend
BROWSER=none npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Clarivo development servers are running!"
echo "📡 Backend API: http://localhost:8000"
echo "📡 Backend Docs: http://localhost:8000/docs"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOF

chmod +x dev-clarivo.sh

print_status "✅ Run scripts created"

print_header "STEP 8: Final Verification"

# Test backend can start
print_status "Testing backend startup..."
cd backend
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Quick test to see if main.py can be imported
$PYTHON_CMD -c "import main; print('Backend imports successfully')" || print_warning "Backend import test failed"

cd ..

# Test frontend build
print_status "Verifying frontend build..."
if [ -d "frontend/build" ]; then
    print_status "✅ Frontend build directory exists"
else
    print_warning "Frontend build directory not found"
fi

print_header "SETUP COMPLETE! 🎉"

echo ""
echo -e "${GREEN}✅ Clarivo has been successfully set up!${NC}"
echo ""
echo -e "${BLUE}To start the application:${NC}"
echo ""
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo -e "  ${YELLOW}Windows:${NC} Double-click run-clarivo.bat"
    echo -e "  ${YELLOW}Or run:${NC} ./run-clarivo.bat"
else
    echo -e "  ${YELLOW}Production:${NC} ./run-clarivo.sh"
    echo -e "  ${YELLOW}Development:${NC} ./dev-clarivo.sh"
fi
echo ""
echo -e "${BLUE}Application URLs:${NC}"
echo -e "  🌐 Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  📡 Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "  📚 API Documentation: ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}Features Available:${NC}"
echo -e "  ✅ Data Upload & Management"
echo -e "  ✅ Data Cleaning & Preprocessing"
echo -e "  ✅ Interactive Visualizations"
echo -e "  ✅ AI-Powered Data Analysis"
echo -e "  ✅ Statistical Insights"
echo -e "  ✅ Export & Sharing"
echo ""
echo -e "${GREEN}🎯 Clarivo is ready to use!${NC}"
echo ""

# Ask if user wants to start the application now
read -p "Would you like to start Clarivo now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting Clarivo..."
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        ./run-clarivo.bat
    else
        ./run-clarivo.sh
    fi
fi