@echo off
echo Fixing Clarivo Backend Issues...
echo.

echo Step 1: Stopping any existing backend processes...
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul

echo.
echo Step 2: Cleaning backend environment...
cd backend
if exist "venv" (
    echo Removing old virtual environment...
    rmdir /s /q venv
)

echo.
echo Step 3: Starting backend with minimal dependencies...
cd ..
call scripts\start-backend.bat

echo.
echo Backend should now be running at http://localhost:8000
echo.
pause
