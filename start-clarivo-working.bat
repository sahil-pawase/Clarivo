@echo off
title Clarivo - AI-Powered Data Analysis Tool
color 0A

echo.
echo ========================================
echo           CLARIVO APPLICATION
echo    AI-Powered Data Analysis Tool
echo ========================================
echo.

echo Starting Clarivo application...
echo.

REM Kill any stale processes
echo Stopping any conflicting processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1

timeout /t 1 /nobreak >nul

REM Step 1: Start backend
echo Step 1: Starting Backend API (FastAPI)...
if exist "%~dp0backend\venv\Scripts\python.exe" (
    start "Clarivo Backend" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\python.exe main.py"
) else (
    start "Clarivo Backend" cmd /k "cd /d "%~dp0backend" && py main.py"
)

timeout /t 2 /nobreak >nul

REM Step 2: Start frontend
echo Step 2: Starting Frontend (React)...
cd /d "%~dp0frontend"
start "Clarivo Frontend" cmd /k "npm start"

timeout /t 6 /nobreak >nul

REM Step 3: Open in browser
echo Step 3: Opening Clarivo in your default browser...
start http://localhost:3000

echo.
echo ========================================
echo        CLARIVO IS RUNNING!
echo ========================================
echo.
echo The application is available at:
echo - Web Browser: http://localhost:3000
echo - Backend API: http://localhost:8000
echo.
echo To stop the application:
echo 1. Close the browser tab
echo 2. Close the backend and frontend terminal windows
echo.
echo Press any key to close this launcher...
pause >nul
