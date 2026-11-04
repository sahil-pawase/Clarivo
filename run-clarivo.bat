@echo off
title Clarivo - AI-Powered Data Analysis Tool
color 0A

echo.
echo ========================================
echo        CLARIVO APPLICATION
echo ========================================
echo.

echo Starting backend and frontend services...
echo.

REM Start backend
netstat -an | find "8000" > nul
if %errorlevel% neq 0 (
    echo [INFO] Starting Backend API on http://localhost:8000 ...
    if exist "%~dp0backend\venv\Scripts\python.exe" (
        start "Clarivo Backend" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\python.exe main.py"
    ) else (
        start "Clarivo Backend" cmd /k "cd /d "%~dp0backend" && py main.py"
    )
    timeout /t 2 /nobreak > nul
)

REM Start frontend
echo [INFO] Starting Frontend on http://localhost:3000 ...
cd /d "%~dp0frontend"
npm start
