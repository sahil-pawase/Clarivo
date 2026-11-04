@echo off
title Clarivo Simple Setup
color 0A

echo.
echo ========================================
echo        CLARIVO SIMPLE SETUP
echo    AI-Powered Data Analysis Tool
echo ========================================
echo.

echo This will set up Clarivo for basic usage.
echo.

REM Check if we're in the right directory
if not exist "frontend\package.json" (
    echo ERROR: Please run this script from the clarivo directory
    pause
    exit /b 1
)

echo Step 1: Installing frontend dependencies...
cd frontend
call npm install --no-optional

if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Setup completed successfully!
echo.

echo ========================================
echo        SETUP COMPLETED!
echo ========================================
echo.
echo Clarivo is now ready to use!
echo.
echo To start the application:
echo 1. Web version: run start-clarivo-working.bat
echo 2. Desktop version: run start-electron-simple.bat
echo.
echo Press any key to exit...
pause >nul
