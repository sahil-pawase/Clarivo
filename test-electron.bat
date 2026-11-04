@echo off
title Clarivo Electron Test
color 0A

echo.
echo ========================================
echo        CLARIVO ELECTRON TEST
echo ========================================
echo.

echo Testing Electron app directly...
echo.

REM Check if we're in the right directory
if not exist "frontend\package.json" (
    echo ERROR: Please run this script from the clarivo directory
    pause
    exit /b 1
)

echo Starting Electron app...
cd frontend
call npm run electron

pause
