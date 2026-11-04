@echo off
title Clarivo Electron - Simple
color 0B

echo.
echo ========================================
echo        CLARIVO ELECTRON SIMPLE
echo    AI-Powered Data Analysis Tool
echo ========================================
echo.

echo Starting Clarivo Electron application...
echo.

REM Kill any existing processes
echo Stopping any existing processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1

REM Wait a moment
timeout /t 2 /nobreak >nul

echo Step 1: Installing frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    call npm install --no-optional
)

echo.
echo Step 2: Starting Electron application...
echo.

REM Start the Electron app in development mode
echo Starting Electron app...
call npm run electron-dev

echo.
echo ========================================
echo        ELECTRON APP STARTED!
echo ========================================
echo.
echo The Electron desktop window should now be open.
echo.
echo If the window doesn't appear:
echo 1. Check the terminal for any error messages
echo 2. Try running: start-clarivo-working.bat (web version)
echo.
echo Press any key to close this launcher...
pause >nul
