@echo off
title Clarivo Launcher
color 0B

echo.
echo ========================================
echo           CLARIVO LAUNCHER
echo ========================================
echo.

echo Starting Clarivo...
echo.

REM Check if backend is already running
netstat -an | find "8000" > nul
if %errorlevel% equ 0 (
    echo Backend is already running on port 8000
) else (
    echo Starting backend...
    if exist "%~dp0backend\venv\Scripts\python.exe" (
        start "Clarivo Backend" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\python.exe main.py"
    ) else (
        start "Clarivo Backend" cmd /k "cd /d "%~dp0backend" && py main.py"
    )
    timeout /t 3 /nobreak > nul
)

REM Check if frontend is already running
netstat -an | find "3000" > nul
if %errorlevel% equ 0 (
    echo Frontend is already running on port 3000
) else (
    echo Starting frontend...
    start "Clarivo Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"
    timeout /t 5 /nobreak > nul
)

echo.
echo Opening Clarivo in your default browser...
echo.

REM Open the application in default browser
start http://localhost:3000

echo.
echo ========================================
echo        CLARIVO IS READY!
echo ========================================
echo.
echo The application is now running at:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo.
echo You can close this window now.
echo The application will continue running in the background.
echo.
pause
