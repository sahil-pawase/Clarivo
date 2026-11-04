@echo off
title Clarivo Electron Builder
color 0B

echo.
echo ========================================
echo        CLARIVO ELECTRON BUILDER
echo ========================================
echo.

echo This will build a standalone Clarivo desktop application.
echo.

REM Check if we're in the right directory
if not exist "frontend\package.json" (
    echo ERROR: Please run this script from the clarivo directory
    pause
    exit /b 1
)

echo Step 1: Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Building frontend...
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)

echo.
echo Step 3: Building Electron application...
call npm run electron-pack
if errorlevel 1 (
    echo ERROR: Failed to build Electron application
    pause
    exit /b 1
)

echo.
echo ========================================
echo        BUILD COMPLETED!
echo ========================================
echo.
echo Your Clarivo desktop application has been built!
echo.
echo The executable can be found in:
echo frontend\dist\
echo.
echo You can now distribute this as a standalone application.
echo.
pause
