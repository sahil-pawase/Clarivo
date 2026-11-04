@echo off
title Clarivo - AI Data Analysis
color 0B

echo.
echo ========================================
echo           CLARIVO DESKTOP APP
echo    AI-Powered Data Analysis Tool
echo ========================================
echo.

echo Starting Clarivo desktop application...
echo.

REM Kill any existing processes
echo Stopping any existing processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1

REM Wait a moment
timeout /t 2 /nobreak >nul

echo Starting backend server...
start "Clarivo Backend" cmd /k "cd /d "%~dp0backend" && python main.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend...
start "Clarivo Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"

echo Waiting for frontend to start...
timeout /t 10 /nobreak >nul

echo Starting Electron desktop app...
cd frontend
start "Clarivo Desktop" npm run electron

echo.
echo ========================================
echo        CLARIVO IS STARTING!
echo ========================================
echo.
echo The application will open in a desktop window.
echo.
echo If the window doesn't appear, check:
echo - Backend: http://localhost:8000
echo - Frontend: http://localhost:3000
echo.
echo Press any key to close this launcher...
pause >nul
