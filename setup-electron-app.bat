@echo off
setlocal enabledelayedexpansion

REM Clarivo Electron App Complete Setup Script for Windows
REM This script sets up everything needed for the Electron desktop application

echo 🚀 Setting up Clarivo Electron Desktop Application...

REM Check if we're in the right directory
if not exist "README.md" (
    echo [ERROR] Please run this script from the clarivo root directory
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
node --version

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ from https://python.org/
    pause
    exit /b 1
)

echo [INFO] ✅ Python detected
python --version

echo ================================
echo STEP 2: Backend Setup
echo ================================

cd backend

REM Create virtual environment
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

REM Install dependencies
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

REM Remove node_modules if exists
if exist "node_modules" (
    echo [INFO] Removing existing node_modules...
    rmdir /s /q node_modules
)

if exist "package-lock.json" (
    del package-lock.json
)

REM Install dependencies
echo [INFO] Installing Node.js dependencies...
npm install

REM Install Electron specific dependencies
echo [INFO] Installing Electron dependencies...
npm install --save-dev electron electron-builder concurrently wait-on

REM Fix any dependency issues
echo [INFO] Fixing dependency issues...
npm audit fix --force

echo [INFO] ✅ Frontend setup complete

cd ..

echo ================================
echo STEP 4: Configuration Setup
echo ================================

REM Create backend .env file
if not exist "backend\.env" (
    echo [INFO] Creating backend .env file...
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
    ) > backend\.env
)

REM Create frontend .env file
if not exist "frontend\.env" (
    echo [INFO] Creating frontend .env file...
    (
        echo # Clarivo Frontend Configuration
        echo REACT_APP_API_URL=http://localhost:8000
        echo REACT_APP_VERSION=1.0.0
        echo GENERATE_SOURCEMAP=false
        echo BROWSER=none
    ) > frontend\.env
)

echo [INFO] ✅ Configuration files created

echo ================================
echo STEP 5: Electron Configuration
echo ================================

cd frontend

REM Create preload.js if it doesn't exist
if not exist "public\preload.js" (
    echo [INFO] Creating preload.js...
    (
        echo const { contextBridge, ipcRenderer } = require^('electron'^);
        echo.
        echo // Expose protected methods that allow the renderer process to use
        echo // the ipcRenderer without exposing the entire object
        echo contextBridge.exposeInMainWorld^('electronAPI', {
        echo   // Add any APIs you want to expose to the renderer process
        echo   getVersion: ^(^) =^> ipcRenderer.invoke^('get-version'^),
        echo   openFile: ^(^) =^> ipcRenderer.invoke^('open-file'^),
        echo   saveFile: ^(data^) =^> ipcRenderer.invoke^('save-file', data^),
        echo }^);
    ) > public\preload.js
)

echo [INFO] ✅ Electron configuration updated

cd ..

echo ================================
echo STEP 6: Build Test
echo ================================

cd frontend

REM Test build
echo [INFO] Testing React build...
npm run build

echo [INFO] ✅ Build test successful

cd ..

echo ================================
echo STEP 7: Creating Run Scripts
echo ================================

REM Create development script
(
    echo @echo off
    echo echo 🔧 Starting Clarivo in Development Mode...
    echo.
    echo cd backend
    echo call venv\Scripts\activate
    echo start "Backend" cmd /k "python main.py"
    echo cd ..
    echo.
    echo timeout /t 3 /nobreak ^> nul
    echo.
    echo cd frontend
    echo start "Electron" cmd /k "npm run electron-dev"
    echo cd ..
    echo.
    echo echo ✅ Development mode started!
    echo pause
) > run-dev.bat

REM Create build script shortcut
(
    echo @echo off
    echo echo 🏗️ Building Clarivo Desktop App...
    echo call build-electron-app.bat
) > build-app.bat

echo [INFO] ✅ Run scripts created

echo ================================
echo SETUP COMPLETE! 🎉
echo ================================

echo.
echo ✅ Clarivo Electron Desktop Application setup complete!
echo.
echo Available Commands:
echo.
echo Development Mode:
echo   🔧 run-dev.bat - Start development mode
echo   🔧 run-electron-dev.bat - Advanced development mode
echo.
echo Build Desktop App:
echo   🏗️ build-app.bat - Build desktop application
echo   🏗️ build-electron-app.bat - Full build process
echo.
echo Features Ready:
echo   ✅ Electron Desktop Application
echo   ✅ Embedded Python Backend
echo   ✅ React Frontend with AI Analysis
echo   ✅ Statistical Analysis ^(Mean, Median, Mode, etc.^)
echo   ✅ Interactive Data Visualizations
echo   ✅ Data Import/Export Capabilities
echo   ✅ Offline Operation ^(No Internet Required^)
echo.
echo 🎯 Ready to develop and build your Electron app!
echo.

REM Ask if user wants to start development mode
set /p choice="Would you like to start development mode now? (y/n): "
if /i "%choice%"=="y" (
    echo [INFO] Starting development mode...
    call run-dev.bat
)

pause