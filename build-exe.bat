@echo off
title Clarivo EXE Builder
color 0B

echo.
echo ========================================
echo        CLARIVO EXE BUILDER
echo ========================================
echo.

echo This will create a standalone Clarivo.exe file.
echo.

REM Check if we're in the right directory
if not exist "frontend\package.json" (
    echo ERROR: Please run this script from the clarivo directory
    pause
    exit /b 1
)

echo Step 1: Building React app...
cd frontend
call npm run build

if errorlevel 1 (
    echo ERROR: Failed to build React app
    pause
    exit /b 1
)

echo.
echo Step 2: Building Electron executable...
echo This may take a few minutes...
call npm run electron-pack

if errorlevel 1 (
    echo ERROR: Failed to build Electron executable
    pause
    exit /b 1
)

echo.
echo ========================================
echo        EXE BUILD COMPLETED!
echo ========================================
echo.
echo Your Clarivo.exe file has been created!
echo.
echo The executable can be found in:
echo frontend\dist\win-unpacked\Clarivo.exe
echo.
echo You can now:
echo 1. Copy the entire 'win-unpacked' folder
echo 2. Run Clarivo.exe from anywhere
echo 3. Distribute it as a standalone application
echo.
pause
