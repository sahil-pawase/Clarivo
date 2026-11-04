@echo off
setlocal enabledelayedexpansion

REM Clarivo Electron Desktop App Build Script for Windows
REM This script builds the complete Electron desktop application

echo 🚀 Building Clarivo Electron Desktop Application...

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
echo STEP 2: Backend Build
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

REM Install dependencies
echo [INFO] Installing Python dependencies...
pip install -r requirements.txt
pip install pyinstaller

REM Create PyInstaller spec file
echo [INFO] Creating PyInstaller specification...
(
    echo # -*- mode: python ; coding: utf-8 -*-
    echo.
    echo block_cipher = None
    echo.
    echo a = Analysis^(
    echo     ['main.py'],
    echo     pathex=[],
    echo     binaries=[],
    echo     datas=[
    echo         ^('app', 'app'^),
    echo         ^('.env', '.'^),
    echo     ],
    echo     hiddenimports=[
    echo         'uvicorn.lifespan.on',
    echo         'uvicorn.lifespan.off',
    echo         'uvicorn.protocols.websockets.auto',
    echo         'uvicorn.protocols.websockets.websockets_impl',
    echo         'uvicorn.protocols.http.auto',
    echo         'uvicorn.protocols.http.h11_impl',
    echo         'uvicorn.protocols.http.httptools_impl',
    echo         'uvicorn.loops.auto',
    echo         'uvicorn.loops.asyncio',
    echo         'uvicorn.loops.uvloop',
    echo         'fastapi',
    echo         'pydantic',
    echo         'sqlalchemy',
    echo         'pandas',
    echo         'numpy',
    echo         'openpyxl',
    echo         'xlrd',
    echo         'chardet',
    echo         'aiofiles',
    echo         'python_multipart',
    echo         'python_dotenv',
    echo     ],
    echo     hookspath=[],
    echo     hooksconfig={},
    echo     runtime_hooks=[],
    echo     excludes=[],
    echo     win_no_prefer_redirects=False,
    echo     win_private_assemblies=False,
    echo     cipher=block_cipher,
    echo     noarchive=False,
    echo ^)
    echo.
    echo pyz = PYZ^(a.pure, a.zipped_data, cipher=block_cipher^)
    echo.
    echo exe = EXE^(
    echo     pyz,
    echo     a.scripts,
    echo     a.binaries,
    echo     a.zipfiles,
    echo     a.datas,
    echo     [],
    echo     name='clarivo-backend',
    echo     debug=False,
    echo     bootloader_ignore_signals=False,
    echo     strip=False,
    echo     upx=True,
    echo     upx_exclude=[],
    echo     runtime_tmpdir=None,
    echo     console=False,
    echo     disable_windowed_traceback=False,
    echo     argv_emulation=False,
    echo     target_arch=None,
    echo     codesign_identity=None,
    echo     entitlements_file=None,
    echo ^)
) > clarivo-backend.spec

REM Build backend executable
echo [INFO] Building backend executable...
pyinstaller clarivo-backend.spec --clean --noconfirm

REM Move executable to dist folder
if not exist "..\dist" mkdir ..\dist
copy dist\clarivo-backend.exe ..\dist\

echo [INFO] ✅ Backend executable built successfully

cd ..

echo ================================
echo STEP 3: Frontend Setup and Build
echo ================================

cd frontend

REM Install dependencies
echo [INFO] Installing Node.js dependencies...
npm install

REM Install Electron dependencies
echo [INFO] Installing Electron build dependencies...
npm install --save-dev electron electron-builder concurrently wait-on

REM Build React application
echo [INFO] Building React application...
npm run build

echo [INFO] ✅ Frontend build completed

echo ================================
echo STEP 4: Electron App Build
echo ================================

REM Build Electron application
echo [INFO] Building Electron desktop application...
npm run electron-pack

echo [INFO] ✅ Electron application built successfully

cd ..

echo ================================
echo STEP 5: Creating Portable Version
echo ================================

REM Create portable version directory
if not exist "clarivo-portable" mkdir clarivo-portable

REM Copy built Electron app
if exist "c:\clarivo-build\win-unpacked" (
    xcopy /E /I /Y "c:\clarivo-build\win-unpacked\*" "clarivo-portable\"
) else if exist "frontend\dist\win-unpacked" (
    xcopy /E /I /Y "frontend\dist\win-unpacked\*" "clarivo-portable\"
)

REM Create Windows launcher
(
    echo @echo off
    echo echo Starting Clarivo...
    echo start "" "Clarivo.exe"
) > clarivo-portable\Clarivo.bat

echo [INFO] ✅ Portable version created

echo ================================
echo BUILD COMPLETE! 🎉
echo ================================

echo.
echo ✅ Clarivo Electron Desktop Application built successfully!
echo.
echo Build Outputs:
echo   📦 Installer: c:\clarivo-build\Clarivo Setup.exe
echo   📁 Portable: clarivo-portable\
echo   🚀 Run: Double-click Clarivo Setup.exe to install
echo   🚀 Or run: clarivo-portable\Clarivo.exe
echo.
echo Features Included:
echo   ✅ Complete Desktop Application
echo   ✅ Embedded Python Backend
echo   ✅ AI-Powered Data Analysis
echo   ✅ Statistical Analysis ^(Mean, Median, Mode, etc.^)
echo   ✅ Interactive Visualizations
echo   ✅ Data Import/Export
echo   ✅ No Internet Required
echo.
echo 🎯 Clarivo Desktop App is ready to distribute!
echo.

pause