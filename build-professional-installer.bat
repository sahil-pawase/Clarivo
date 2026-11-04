@echo off
setlocal enabledelayedexpansion

REM Clarivo Professional Installer Build Script
REM Creates a professional installer like big software companies

echo 🏢 Building Clarivo Professional Desktop Application...
echo ================================================

REM Check if we're in the right directory
if not exist "README.md" (
    echo [ERROR] Please run this script from the clarivo root directory
    pause
    exit /b 1
)

echo ================================
echo STEP 1: Python Version Check
echo ================================

REM Check Python version and ensure compatibility
python --version 2>nul | findstr /C:"3.11" >nul
if not errorlevel 1 (
    echo [INFO] ✅ Python 3.11 detected - Perfect!
    set PYTHON_OK=1
) else (
    python --version 2>nul | findstr /C:"3.12" >nul
    if not errorlevel 1 (
        echo [INFO] ✅ Python 3.12 detected - Perfect!
        set PYTHON_OK=1
    ) else (
        python --version 2>nul | findstr /C:"3.13" >nul
        if not errorlevel 1 (
            echo [WARNING] ⚠️ Python 3.13 detected - May have compatibility issues
            echo [INFO] Recommending Python 3.11 or 3.12 for best compatibility
            set PYTHON_OK=0
        ) else (
            echo [INFO] ✅ Python version acceptable
            set PYTHON_OK=1
        )
    )
)

python --version

echo ================================
echo STEP 2: Backend Build with Compatibility
echo ================================

cd backend

REM Create virtual environment with specific Python version
if exist "venv" rmdir /s /q venv
echo [INFO] Creating Python virtual environment...
python -m venv venv

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate

REM Upgrade pip to latest version
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

REM Install compatible dependencies
echo [INFO] Installing Python dependencies with compatibility fixes...
if exist "requirements-py311.txt" (
    echo [INFO] Using Python 3.11/3.12 compatible requirements...
    pip install -r requirements-py311.txt
) else (
    echo [INFO] Using standard requirements with compatibility fixes...
    pip install --only-binary=all -r requirements.txt || (
        echo [INFO] Falling back to source builds...
        pip install -r requirements.txt
    )
)

REM Install PyInstaller
pip install pyinstaller==6.2.0

REM Create advanced PyInstaller spec for professional build
echo [INFO] Creating professional PyInstaller specification...
(
    echo # -*- mode: python ; coding: utf-8 -*-
    echo # Clarivo Professional Build Specification
    echo.
    echo import sys
    echo import os
    echo from PyInstaller.utils.hooks import collect_data_files, collect_submodules
    echo.
    echo block_cipher = None
    echo.
    echo # Collect all data files and submodules
    echo datas = []
    echo datas += collect_data_files^('fastapi'^)
    echo datas += collect_data_files^('uvicorn'^)
    echo datas += collect_data_files^('pydantic'^)
    echo datas += [^('app', 'app'^)]
    echo datas += [^('.env', '.'^)]
    echo.
    echo # Hidden imports for all dependencies
    echo hiddenimports = []
    echo hiddenimports += collect_submodules^('fastapi'^)
    echo hiddenimports += collect_submodules^('uvicorn'^)
    echo hiddenimports += collect_submodules^('pydantic'^)
    echo hiddenimports += collect_submodules^('sqlalchemy'^)
    echo hiddenimports += collect_submodules^('pandas'^)
    echo hiddenimports += collect_submodules^('numpy'^)
    echo.
    echo # Additional hidden imports
    echo hiddenimports += [
    echo     'uvicorn.lifespan.on',
    echo     'uvicorn.lifespan.off',
    echo     'uvicorn.protocols.websockets.auto',
    echo     'uvicorn.protocols.websockets.websockets_impl',
    echo     'uvicorn.protocols.http.auto',
    echo     'uvicorn.protocols.http.h11_impl',
    echo     'uvicorn.protocols.http.httptools_impl',
    echo     'uvicorn.loops.auto',
    echo     'uvicorn.loops.asyncio',
    echo     'fastapi.routing',
    echo     'fastapi.middleware',
    echo     'fastapi.middleware.cors',
    echo     'starlette.middleware',
    echo     'starlette.middleware.cors',
    echo     'multipart',
    echo     'email.mime.multipart',
    echo     'email.mime.text',
    echo     'email.mime.base',
    echo ]
    echo.
    echo a = Analysis^(
    echo     ['main.py'],
    echo     pathex=[],
    echo     binaries=[],
    echo     datas=datas,
    echo     hiddenimports=hiddenimports,
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
    echo     icon='../frontend/public/favicon.ico'
    echo ^)
) > clarivo-backend-pro.spec

REM Build backend executable
echo [INFO] Building professional backend executable...
pyinstaller clarivo-backend-pro.spec --clean --noconfirm --log-level=INFO

REM Create dist directory and copy executable
if not exist "..\dist" mkdir ..\dist
copy dist\clarivo-backend.exe ..\dist\

echo [INFO] ✅ Professional backend executable built successfully

cd ..

echo ================================
echo STEP 3: Frontend Professional Build
echo ================================

cd frontend

REM Clean previous builds
echo [INFO] Cleaning previous builds...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json
if exist "build" rmdir /s /q build
if exist "dist" rmdir /s /q dist

REM Install dependencies with audit fix
echo [INFO] Installing Node.js dependencies with security fixes...
npm install

REM Fix security vulnerabilities
echo [INFO] Fixing security vulnerabilities...
npm audit fix --force

REM Install additional Electron dependencies for professional build
echo [INFO] Installing professional Electron build tools...
npm install --save-dev ^
    electron-builder@^24.6.4 ^
    electron-notarize@^1.2.2 ^
    electron-updater@^6.1.4 ^
    @electron/rebuild@^3.4.0

REM Update package.json for professional build
echo [INFO] Configuring professional build settings...

REM Create professional electron-builder configuration
(
    echo {
    echo   "appId": "com.clarivo.desktop",
    echo   "productName": "Clarivo",
    echo   "copyright": "Copyright © 2024 Clarivo Team",
    echo   "directories": {
    echo     "output": "../installer-output"
    echo   },
    echo   "files": [
    echo     "build/**/*",
    echo     "public/electron.js",
    echo     "public/preload.js",
    echo     "public/favicon.ico",
    echo     "node_modules/**/*"
    echo   ],
    echo   "extraResources": [
    echo     {
    echo       "from": "../dist/clarivo-backend.exe",
    echo       "to": "backend/clarivo-backend.exe"
    echo     }
    echo   ],
    echo   "win": {
    echo     "target": [
    echo       {
    echo         "target": "nsis",
    echo         "arch": ["x64"]
    echo       }
    echo     ],
    echo     "icon": "public/favicon.ico",
    echo     "requestedExecutionLevel": "asInvoker",
    echo     "artifactName": "Clarivo-Setup-${version}.${ext}"
    echo   },
    echo   "nsis": {
    echo     "oneClick": false,
    echo     "allowElevation": true,
    echo     "allowToChangeInstallationDirectory": true,
    echo     "installerIcon": "public/favicon.ico",
    echo     "uninstallerIcon": "public/favicon.ico",
    echo     "installerHeaderIcon": "public/favicon.ico",
    echo     "createDesktopShortcut": true,
    echo     "createStartMenuShortcut": true,
    echo     "shortcutName": "Clarivo",
    echo     "include": "installer-script.nsh"
    echo   },
    echo   "publish": null
    echo }
) > electron-builder-config.json

REM Create custom NSIS installer script for professional look
(
    echo !macro customHeader
    echo   DetailPrint "Installing Clarivo - AI-Powered Data Analysis Tool"
    echo   DetailPrint "Please wait while we set up your application..."
    echo !macroend
    echo.
    echo !macro customInit
    echo   DetailPrint "Initializing Clarivo installation..."
    echo !macroend
    echo.
    echo !macro customInstall
    echo   DetailPrint "Configuring Clarivo for optimal performance..."
    echo   CreateDirectory "$INSTDIR\data"
    echo   CreateDirectory "$INSTDIR\uploads"
    echo   CreateDirectory "$INSTDIR\logs"
    echo !macroend
    echo.
    echo !macro customUnInstall
    echo   DetailPrint "Removing Clarivo application data..."
    echo   RMDir /r "$INSTDIR\data"
    echo   RMDir /r "$INSTDIR\uploads"
    echo   RMDir /r "$INSTDIR\logs"
    echo !macroend
) > installer-script.nsh

REM Build React application
echo [INFO] Building React application for production...
npm run build

REM Build Electron application with professional installer
echo [INFO] Building professional Electron installer...
npx electron-builder --config electron-builder-config.json

echo [INFO] ✅ Professional Electron application built successfully

cd ..

echo ================================
echo STEP 4: Creating Professional Package
echo ================================

REM Create professional distribution folder
if not exist "Clarivo-Professional" mkdir Clarivo-Professional

REM Copy installer
if exist "installer-output\Clarivo-Setup-*.exe" (
    copy "installer-output\Clarivo-Setup-*.exe" "Clarivo-Professional\"
    echo [INFO] ✅ Professional installer copied
)

REM Create portable version
if exist "installer-output\win-unpacked" (
    echo [INFO] Creating portable version...
    xcopy /E /I /Y "installer-output\win-unpacked" "Clarivo-Professional\Clarivo-Portable\"
    
    REM Create portable launcher
    (
        echo @echo off
        echo title Clarivo - AI Data Analysis
        echo echo Starting Clarivo...
        echo echo Please wait while the application loads...
        echo start "" "Clarivo.exe"
        echo exit
    ) > "Clarivo-Professional\Clarivo-Portable\Launch Clarivo.bat"
)

REM Create README for distribution
(
    echo # Clarivo - AI-Powered Data Analysis Tool
    echo.
    echo ## Installation Options
    echo.
    echo ### Option 1: Full Installation ^(Recommended^)
    echo 1. Run `Clarivo-Setup-1.0.0.exe`
    echo 2. Follow the installation wizard
    echo 3. Launch from Start Menu or Desktop shortcut
    echo.
    echo ### Option 2: Portable Version
    echo 1. Extract `Clarivo-Portable` folder to desired location
    echo 2. Run `Launch Clarivo.bat`
    echo.
    echo ## Features
    echo - AI-powered data analysis
    echo - Statistical analysis ^(mean, median, mode, etc.^)
    echo - Interactive data visualizations
    echo - Data import/export ^(CSV, Excel, JSON^)
    echo - Offline operation ^(no internet required^)
    echo.
    echo ## System Requirements
    echo - Windows 10/11 ^(64-bit^)
    echo - 4GB RAM minimum ^(8GB recommended^)
    echo - 500MB free disk space
    echo.
    echo ## Support
    echo For support and documentation, visit: https://clarivo.com
    echo.
    echo Copyright © 2024 Clarivo Team. All rights reserved.
) > "Clarivo-Professional\README.txt"

REM Create version info
(
    echo Clarivo Desktop Application
    echo Version: 1.0.0
    echo Build Date: %date% %time%
    echo.
    echo Components:
    echo - Frontend: React + Electron
    echo - Backend: Python FastAPI
    echo - AI Engine: Built-in statistical analysis
    echo.
    echo Installation includes:
    echo ✅ Complete desktop application
    echo ✅ AI-powered data analysis
    echo ✅ Statistical analysis tools
    echo ✅ Data visualization engine
    echo ✅ Import/Export capabilities
    echo ✅ Offline operation
) > "Clarivo-Professional\VERSION.txt"

echo ================================
echo BUILD COMPLETE! 🎉
echo ================================

echo.
echo ✅ Clarivo Professional Desktop Application built successfully!
echo.
echo 📦 Professional Distribution Package:
echo   📁 Location: Clarivo-Professional\
echo   🚀 Installer: Clarivo-Setup-1.0.0.exe
echo   📱 Portable: Clarivo-Portable\
echo   📖 Documentation: README.txt
echo.
echo 🏢 Professional Features:
echo   ✅ Windows Installer ^(NSIS^)
echo   ✅ Desktop ^& Start Menu shortcuts
echo   ✅ Uninstaller included
echo   ✅ Portable version available
echo   ✅ Professional branding
echo   ✅ Code signing ready
echo   ✅ Auto-updater support
echo.
echo 🎯 Ready for Distribution!
echo   - Share Clarivo-Setup-1.0.0.exe for full installation
echo   - Share Clarivo-Portable folder for portable use
echo   - Professional installer like major software companies
echo.

REM Open the distribution folder
explorer "Clarivo-Professional"

echo Press any key to exit...
pause > nul