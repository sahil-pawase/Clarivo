@echo off
echo Starting Clarivo Backend (FastAPI)...
echo.

cd backend

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo Creating virtual environment...
if not exist "venv" (
    echo Creating new virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements-minimal.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    echo Trying with --no-cache-dir...
    pip install --no-cache-dir -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Still failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting FastAPI server...
echo Backend will be available at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

python main-minimal.py

pause
