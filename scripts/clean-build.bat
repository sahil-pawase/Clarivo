@echo off
echo Cleaning Clarivo Build Directory...
echo.

echo Stopping any running processes...
taskkill /f /im Clarivo.exe 2>nul
taskkill /f /im electron.exe 2>nul

echo.
echo Removing old build files...
cd frontend
if exist "dist" (
    rmdir /s /q "dist" 2>nul
    echo Old dist folder removed.
) else (
    echo No old dist folder found.
)

if exist "build" (
    rmdir /s /q "build" 2>nul
    echo Old build folder removed.
) else (
    echo No old build folder found.
)

echo.
echo Cleaning npm cache...
call npm cache clean --force

echo.
echo Installing dependencies with legacy peer deps...
call npm install --legacy-peer-deps

echo.
echo Build directory cleaned and ready!
echo.
pause
