@echo off
title Clarivo Installer
color 0A

echo.
echo ========================================
echo           CLARIVO INSTALLER
echo    AI-Powered Data Analysis Tool
echo ========================================
echo.

echo This installer will set up Clarivo on your system.
echo.
echo Requirements:
echo - Python 3.8 or higher
echo - Node.js 16 or higher
echo - npm (comes with Node.js)
echo.

echo Press any key to continue with the installation...
pause > nul

echo.
echo Checking Python installation...
set PYTHON_CMD=
py --version > nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=py
) else (
    python --version > nul 2>&1
    if %errorlevel% equ 0 (
        set PYTHON_CMD=python
    )
)

if "%PYTHON_CMD%"=="" (
    echo ERROR: Python is not installed or not found
    echo Please install Python 3.8 or higher from https://python.org
    echo.
    pause
    exit /b 1
)

echo [OK] Using Python (%PYTHON_CMD%)

echo Checking Node.js installation...
node --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16 or higher from https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo Checking npm installation...
npm --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install npm (comes with Node.js)
    echo.
    pause
    exit /b 1
)

echo.
echo All requirements are met! Starting installation...
echo.

%PYTHON_CMD% setup.py

if errorlevel 1 (
    echo.
    echo Installation failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo        INSTALLATION COMPLETED!
echo ========================================
echo.
echo Clarivo has been successfully installed!
echo.
echo To start the application:
echo 1. Double-click the "Clarivo" shortcut on your desktop
echo 2. Or run "start-clarivo-working.bat" from this folder
echo.
echo The application will open in your web browser at:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo.
echo Press any key to exit...
pause > nul
