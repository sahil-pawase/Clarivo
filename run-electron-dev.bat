@echo off
setlocal enabledelayedexpansion

REM Clarivo Electron Development Mode Script for Windows
REM This script runs the Electron app in development mode

echo 🔧 Starting Clarivo Electron App in Development Mode...

REM Check if we're in the right directory
if not exist "README.md" (
    echo ❌ Please run this script from the clarivo root directory
    pause
    exit /b 1
)

echo ================================
echo Starting Development Environment
echo ================================

REM Start backend in development mode
echo [INFO] 📡 Starting backend server...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install dependencies if needed
if not exist ".deps_installed" (
    echo [INFO] Installing Python dependencies...
    pip install -r requirements.txt
    echo. > .deps_installed
)

REM Start backend
start "Clarivo Backend Dev" cmd /k "python main.py"

cd ..

REM Wait for backend to start
echo [INFO] ⏳ Waiting for backend to start...
timeout /t 3 /nobreak > nul

REM Start frontend and Electron
echo [INFO] 🌐 Starting Electron application...
cd frontend

REM Install dependencies if needed
if not exist ".deps_installed" (
    echo [INFO] Installing Node.js dependencies...
    npm install
    echo. > .deps_installed
)

REM Start Electron in development mode
start "Clarivo Electron Dev" cmd /k "npm run electron-dev"

cd ..

echo [INFO] ✅ Clarivo Electron app is running in development mode!
echo.
echo Development URLs:
echo   🌐 React Dev Server: http://localhost:3000
echo   📡 Backend API: http://localhost:8000
echo   📚 API Documentation: http://localhost:8000/docs
echo   🖥️  Electron App: Running in separate window
echo.
echo Press any key to exit...
pause > nul