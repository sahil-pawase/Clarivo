@echo off
echo Testing Clarivo Backend...
echo.

echo Checking if backend is running on http://localhost:8000...
curl -s http://localhost:8000 >nul 2>&1
if errorlevel 1 (
    echo ERROR: Backend is not running!
    echo.
    echo Please start the backend first:
    echo scripts\start-backend.bat
    echo.
    pause
    exit /b 1
) else (
    echo SUCCESS: Backend is running!
    echo.
    echo Testing API endpoints...
    curl -s http://localhost:8000/health
    echo.
    echo.
    echo Backend is working correctly!
)

echo.
pause
