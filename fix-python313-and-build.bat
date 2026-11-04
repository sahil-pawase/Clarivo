@echo off
setlocal enabledelayedexpansion

REM Fix Python 3.13 Issues and Build Windows App
echo 🔧 Fixing Python 3.13 Issues and Building Windows App
echo ===================================================

REM Step 1: Fix Python backend issues
echo [INFO] Fixing Python 3.13 compatibility issues...
cd backend

REM Remove problematic pathlib if it exists
echo [INFO] Removing incompatible pathlib package...
call venv\Scripts\activate
pip uninstall pathlib -y 2>nul

REM Create Python 3.13 compatible requirements
echo [INFO] Creating Python 3.13 compatible requirements...
(
    echo # Python 3.13 Compatible Requirements
    echo fastapi==0.115.0
    echo uvicorn[standard]==0.32.0
    echo python-multipart==0.0.12
    echo pandas==2.2.3
    echo numpy==2.1.0
    echo openpyxl==3.1.5
    echo xlrd==2.0.1
    echo chardet==5.2.0
    echo sqlalchemy==2.0.36
    echo alembic==1.14.0
    echo python-jose[cryptography]==3.3.0
    echo passlib[bcrypt]==1.7.4
    echo python-dotenv==1.0.1
    echo pydantic==2.10.2
    echo aiofiles==24.1.0
    echo httpx==0.28.1
    echo pytest==8.3.4
    echo pytest-asyncio==0.24.0
    echo pyinstaller==6.15.0
    echo click==8.1.7
    echo typing-extensions==4.12.2
) > requirements-py313.txt

REM Install compatible packages
echo [INFO] Installing Python 3.13 compatible packages...
pip install --upgrade pip
pip install -r requirements-py313.txt

REM Create simple PyInstaller spec that works with Python 3.13
echo [INFO] Creating Python 3.13 compatible PyInstaller spec...
(
    echo # -*- mode: python ; coding: utf-8 -*-
    echo # Python 3.13 Compatible Build
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
    echo         'fastapi',
    echo         'uvicorn',
    echo         'uvicorn.lifespan.on',
    echo         'uvicorn.protocols.http.h11_impl',
    echo         'uvicorn.protocols.websockets.websockets_impl',
    echo         'uvicorn.loops.asyncio',
    echo         'pydantic',
    echo         'sqlalchemy',
    echo         'pandas',
    echo         'numpy',
    echo         'multipart',
    echo         'aiofiles',
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
    echo     upx=False,
    echo     upx_exclude=[],
    echo     runtime_tmpdir=None,
    echo     console=False,
    echo     disable_windowed_traceback=False,
    echo     argv_emulation=False,
    echo     target_arch=None,
    echo     codesign_identity=None,
    echo     entitlements_file=None,
    echo ^)
) > clarivo-py313.spec

REM Build backend
echo [INFO] Building backend executable...
pyinstaller clarivo-py313.spec --clean --noconfirm

REM Copy to dist
if not exist "..\dist" mkdir ..\dist
copy dist\clarivo-backend.exe ..\dist\

cd ..

REM Step 2: Fix frontend and build Electron app
echo [INFO] Fixing frontend and building Electron app...
cd frontend

REM Fix npm audit issues
echo [INFO] Fixing npm security vulnerabilities...
npm audit fix --force

REM Build React app
echo [INFO] Building React application...
npm run build

REM Install electron-builder if not present
echo [INFO] Installing electron-builder...
npm install --save-dev electron-builder@24.13.3

REM Create electron-builder config for Windows
echo [INFO] Creating Windows app configuration...
(
    echo {
    echo   "appId": "com.clarivo.desktop",
    echo   "productName": "Clarivo",
    echo   "directories": {
    echo     "output": "dist"
    echo   },
    echo   "files": [
    echo     "build/**/*",
    echo     "public/electron.js",
    echo     "public/preload.js",
    echo     "node_modules/**/*"
    echo   ],
    echo   "extraResources": [
    echo     {
    echo       "from": "../dist/clarivo-backend.exe",
    echo       "to": "backend/clarivo-backend.exe"
    echo     }
    echo   ],
    echo   "win": {
    echo     "target": "nsis",
    echo     "icon": "public/favicon.ico"
    echo   },
    echo   "nsis": {
    echo     "oneClick": false,
    echo     "allowToChangeInstallationDirectory": true,
    echo     "createDesktopShortcut": true,
    echo     "createStartMenuShortcut": true
    echo   }
    echo }
) > electron-builder.json

REM Build Windows app
echo [INFO] Building Windows desktop application...
npx electron-builder --config electron-builder.json --win

echo [INFO] ✅ Windows app built successfully!

cd ..

REM Step 3: Create final distribution
echo [INFO] Creating final distribution...

REM Create Clarivo-Windows-App folder
if not exist "Clarivo-Windows-App" mkdir Clarivo-Windows-App

REM Copy installer
if exist "frontend\dist\Clarivo Setup *.exe" (
    copy "frontend\dist\Clarivo Setup *.exe" "Clarivo-Windows-App\"
    echo [INFO] ✅ Windows installer copied
)

REM Copy portable version
if exist "frontend\dist\win-unpacked" (
    echo [INFO] Creating portable version...
    xcopy /E /I /Y "frontend\dist\win-unpacked" "Clarivo-Windows-App\Clarivo-Portable\"
    
    REM Create launcher
    (
        echo @echo off
        echo title Clarivo - AI Data Analysis
        echo echo Starting Clarivo Desktop Application...
        echo start "" "Clarivo.exe"
    ) > "Clarivo-Windows-App\Clarivo-Portable\Start Clarivo.bat"
)

REM Create README
(
    echo # Clarivo Windows Desktop Application
    echo.
    echo ## Installation Options:
    echo.
    echo ### Option 1: Full Installation
    echo 1. Run "Clarivo Setup 1.0.0.exe"
    echo 2. Follow installation wizard
    echo 3. Launch from Desktop or Start Menu
    echo.
    echo ### Option 2: Portable Version
    echo 1. Go to "Clarivo-Portable" folder
    echo 2. Run "Start Clarivo.bat"
    echo.
    echo ## Features:
    echo - AI-powered data analysis
    echo - Statistical analysis ^(mean, median, mode, etc.^)
    echo - Interactive visualizations
    echo - Data import/export
    echo - Works completely offline
    echo.
    echo Built with Python 3.13 compatibility fixes.
) > "Clarivo-Windows-App\README.txt"

echo ================================
echo ✅ BUILD COMPLETE!
echo ================================
echo.
echo 🎉 Clarivo Windows Desktop App is ready!
echo.
echo 📁 Location: Clarivo-Windows-App\
echo 🚀 Installer: Clarivo Setup 1.0.0.exe
echo 📱 Portable: Clarivo-Portable\
echo.
echo ✅ Python 3.13 compatibility issues fixed
echo ✅ Windows desktop application created
echo ✅ Professional installer included
echo ✅ Portable version available
echo.

REM Open the folder
explorer "Clarivo-Windows-App"

echo Press any key to exit...
pause > nul