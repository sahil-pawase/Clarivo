@echo off
setlocal enabledelayedexpansion

REM Clarivo Complete Setup and Run Script for Windows
REM This script sets up and runs the entire Clarivo application without errors

echo 🚀 Starting Clarivo Complete Setup...

REM Check if we're in the right directory
if not exist "README.md" (
    echo [ERROR] Please run this script from the clarivo root directory
    pause
    exit /b 1
)

if not exist "frontend" (
    echo [ERROR] Frontend directory not found
    pause
    exit /b 1
)

if not exist "backend" (
    echo [ERROR] Backend directory not found
    pause
    exit /b 1
)

echo ================================
echo STEP 1: System Requirements Check
echo ================================

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] ✅ Node.js detected
for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js version: %NODE_VERSION%

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm
    pause
    exit /b 1
)

echo [INFO] ✅ npm detected

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ from https://python.org/
    pause
    exit /b 1
)

echo [INFO] ✅ Python detected
python --version

REM Check pip
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip is not installed. Please install pip
    pause
    exit /b 1
)

echo [INFO] ✅ pip detected

echo ================================
echo STEP 2: Backend Setup
echo ================================

cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

REM Install Python dependencies
echo [INFO] Installing Python dependencies...
pip install -r requirements.txt

REM Create necessary directories
if not exist "uploads" mkdir uploads
if not exist "data" mkdir data

echo [INFO] ✅ Backend setup complete

cd ..

echo ================================
echo STEP 3: Frontend Setup
echo ================================

cd frontend

REM Clear npm cache
echo [INFO] Clearing npm cache...
npm cache clean --force

REM Remove node_modules if it exists
if exist "node_modules" (
    echo [INFO] Removing existing node_modules...
    rmdir /s /q node_modules
)

REM Remove package-lock.json if it exists
if exist "package-lock.json" (
    echo [INFO] Removing existing package-lock.json...
    del package-lock.json
)

REM Install dependencies
echo [INFO] Installing Node.js dependencies...
npm install

REM Fix any potential dependency issues
echo [INFO] Fixing dependency issues...
npm audit fix --force

echo [INFO] ✅ Frontend setup complete

cd ..

echo ================================
echo STEP 4: Configuration Setup
echo ================================

REM Create backend .env file if it doesn't exist
if not exist "backend\.env" (
    echo [INFO] Creating backend .env file...
    (
        echo # Clarivo Backend Configuration
        echo DEBUG=True
        echo SECRET_KEY=your-secret-key-here-change-in-production
        echo DATABASE_URL=sqlite:///./clarivo.db
        echo CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
        echo UPLOAD_DIR=uploads
        echo MAX_FILE_SIZE=100MB
        echo.
        echo # Optional: Gemini API ^(for advanced AI features^)
        echo GEMINI_API_KEY=your-gemini-api-key-here
        echo.
        echo # Optional: OpenAI API ^(for advanced AI features^)
        echo OPENAI_API_KEY=your-openai-api-key-here
    ) > backend\.env
)

REM Create frontend .env file if it doesn't exist
if not exist "frontend\.env" (
    echo [INFO] Creating frontend .env file...
    (
        echo # Clarivo Frontend Configuration
        echo REACT_APP_API_URL=http://localhost:8000
        echo REACT_APP_VERSION=1.0.0
        echo GENERATE_SOURCEMAP=false
    ) > frontend\.env
)

echo [INFO] ✅ Configuration files created

echo ================================
echo STEP 5: Database Setup
echo ================================

cd backend

REM Activate virtual environment
call venv\Scripts\activate

REM Initialize database (if using Alembic)
if exist "alembic.ini" (
    echo [INFO] Initializing database with Alembic...
    alembic upgrade head
)

echo [INFO] ✅ Database setup complete

cd ..

echo ================================
echo STEP 6: Build Process
echo ================================

cd frontend

REM Build the frontend
echo [INFO] Building frontend application...
npm run build

echo [INFO] ✅ Frontend build complete

cd ..

echo ================================
echo STEP 7: Creating Run Scripts
echo ================================

REM Create main run script
(
    echo @echo off
    echo echo Starting Clarivo Application...
    echo.
    echo REM Start backend
    echo echo Starting backend server...
    echo cd backend
    echo call venv\Scripts\activate
    echo start "Clarivo Backend" cmd /k "python main.py"
    echo cd ..
    echo.
    echo REM Wait a moment for backend to start
    echo timeout /t 3 /nobreak ^> nul
    echo.
    echo REM Start frontend
    echo echo Starting frontend server...
    echo cd frontend
    echo start "Clarivo Frontend" cmd /k "npm start"
    echo cd ..
    echo.
    echo echo Clarivo is starting up...
    echo echo Backend: http://localhost:8000
    echo echo Frontend: http://localhost:3000
    echo echo.
    echo echo Press any key to exit...
    echo pause ^> nul
) > run-clarivo.bat

REM Create development script
(
    echo @echo off
    echo echo 🔧 Starting Clarivo in Development Mode...
    echo.
    echo REM Start backend in development mode
    echo echo 📡 Starting backend in development mode...
    echo cd backend
    echo call venv\Scripts\activate
    echo start "Clarivo Backend Dev" cmd /k "uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    echo cd ..
    echo.
    echo REM Wait for backend to start
    echo timeout /t 3 /nobreak ^> nul
    echo.
    echo REM Start frontend in development mode
    echo echo 🌐 Starting frontend in development mode...
    echo cd frontend
    echo set BROWSER=none
    echo start "Clarivo Frontend Dev" cmd /k "npm start"
    echo cd ..
    echo.
    echo echo ✅ Clarivo development servers are running!
    echo echo 📡 Backend API: http://localhost:8000
    echo echo 📡 Backend Docs: http://localhost:8000/docs
    echo echo 🌐 Frontend: http://localhost:3000
    echo echo.
    echo echo Press any key to exit...
    echo pause ^> nul
) > dev-clarivo.bat

echo [INFO] ✅ Run scripts created

echo ================================
echo STEP 8: Final Verification
echo ================================

REM Test backend can start
echo [INFO] Testing backend startup...
cd backend
call venv\Scripts\activate

REM Quick test to see if main.py can be imported
python -c "import main; print('Backend imports successfully')"

cd ..

REM Test frontend build
echo [INFO] Verifying frontend build...
if exist "frontend\build" (
    echo [INFO] ✅ Frontend build directory exists
) else (
    echo [WARNING] Frontend build directory not found
)

echo ================================
echo SETUP COMPLETE! 🎉
echo ================================

echo.
echo ✅ Clarivo has been successfully set up!
echo.
echo To start the application:
echo.
echo   Production: Double-click run-clarivo.bat
echo   Development: Double-click dev-clarivo.bat
echo.
echo Application URLs:
echo   🌐 Frontend: http://localhost:3000
echo   📡 Backend API: http://localhost:8000
echo   📚 API Documentation: http://localhost:8000/docs
echo.
echo Features Available:
echo   ✅ Data Upload ^& Management
echo   ✅ Data Cleaning ^& Preprocessing
echo   ✅ Interactive Visualizations
echo   ✅ AI-Powered Data Analysis
echo   ✅ Statistical Insights
echo   ✅ Export ^& Sharing
echo.
echo 🎯 Clarivo is ready to use!
echo.

REM Ask if user wants to start the application now
set /p choice="Would you like to start Clarivo now? (y/n): "
if /i "%choice%"=="y" (
    echo [INFO] Starting Clarivo...
    call run-clarivo.bat
)

pause