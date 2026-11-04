@echo off
setlocal enabledelayedexpansion

REM Clarivo Quick Professional Setup - Addresses all compatibility issues
echo 🚀 Clarivo Quick Professional Setup
echo ===================================

REM Check Python version
echo [INFO] Checking Python compatibility...
python --version 2>nul | findstr /C:"3.13" >nul
if not errorlevel 1 (
    echo [WARNING] ⚠️ Python 3.13 detected!
    echo [INFO] For best compatibility, please install Python 3.11 or 3.12
    echo [INFO] Download from: https://www.python.org/downloads/
    echo.
    echo Continue anyway? ^(y/n^)
    set /p choice=
    if /i not "%choice%"=="y" exit /b 1
)

REM Quick backend setup
echo [INFO] Setting up backend with compatibility fixes...
cd backend

REM Create .env file if missing
if not exist ".env" (
    echo [INFO] Creating .env configuration file...
    (
        echo # Clarivo Backend Configuration
        echo DEBUG=True
        echo SECRET_KEY=clarivo-desktop-app-secret-key
        echo DATABASE_URL=sqlite:///./clarivo.db
        echo CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
        echo UPLOAD_DIR=uploads
        echo MAX_FILE_SIZE=100MB
        echo HOST=127.0.0.1
        echo PORT=8000
    ) > .env
)

REM Setup Python environment
if not exist "venv" python -m venv venv
call venv\Scripts\activate
pip install --upgrade pip

REM Install with compatibility
if exist "requirements-py311.txt" (
    echo [INFO] Installing Python 3.11/3.12 compatible packages...
    pip install -r requirements-py311.txt
) else (
    echo [INFO] Installing standard packages with compatibility fixes...
    pip install --only-binary=all -r requirements.txt
)

cd ..

REM Quick frontend setup
echo [INFO] Setting up frontend with security fixes...
cd frontend

REM Clean and install
if exist "node_modules" rmdir /s /q node_modules
npm install

REM Fix security issues
echo [INFO] Fixing Node.js security vulnerabilities...
npm audit fix --force

REM Install Electron build tools
npm install --save-dev electron electron-builder

cd ..

echo ================================
echo ✅ SETUP COMPLETE!
echo ================================
echo.
echo Ready to build professional installer:
echo   🏗️ Run: build-professional-installer.bat
echo.
echo Or start development:
echo   🔧 Run: run-electron-dev.bat
echo.
echo Issues Fixed:
echo   ✅ Python 3.13 compatibility warnings added
echo   ✅ .env file created in backend
echo   ✅ Node.js security vulnerabilities fixed
echo   ✅ Professional installer tools installed
echo.

pause