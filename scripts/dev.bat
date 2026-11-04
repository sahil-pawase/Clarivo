@echo off
echo Starting Clarivo Development Environment...

echo.
echo Starting Backend (FastAPI)...
start "Clarivo Backend" cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8000"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend (React + Electron)...
start "Clarivo Frontend" cmd /k "cd frontend && npm install && npm run electron-dev"

echo.
echo Clarivo development environment is starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause