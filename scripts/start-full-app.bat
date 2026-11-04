@echo off
echo Starting Clarivo Full Application (Backend + Frontend)...
echo.

echo Starting Backend (FastAPI)...
start "Clarivo Backend" cmd /k "scripts\start-backend.bat"

echo.
echo Waiting for backend to start...
timeout /t 8 /nobreak > nul

echo.
echo Starting Frontend (React + Electron)...
start "Clarivo Frontend" cmd /k "cd frontend && npm install --legacy-peer-deps && npm run electron-dev"

echo.
echo Clarivo full application is starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Please wait for both services to fully start before using the app.
echo.
pause
