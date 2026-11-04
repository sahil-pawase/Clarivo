@echo off
title Clarivo Uninstaller
color 0C

echo.
echo ========================================
echo           CLARIVO UNINSTALLER
echo ========================================
echo.

echo This will remove Clarivo from your system.
echo.
echo WARNING: This will delete:
echo - Virtual environment (backend/venv)
echo - Node modules (frontend/node_modules)
echo - Desktop shortcut
echo - Startup scripts
echo.
echo Your uploaded data will NOT be deleted.
echo.

set /p confirm="Are you sure you want to continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Uninstallation cancelled.
    pause
    exit /b 0
)

echo.
echo Removing Clarivo...

REM Remove virtual environment
if exist "backend\venv" (
    echo Removing virtual environment...
    rmdir /s /q "backend\venv"
)

REM Remove node modules
if exist "frontend\node_modules" (
    echo Removing node modules...
    rmdir /s /q "frontend\node_modules"
)

REM Remove startup scripts
if exist "start-clarivo.bat" (
    echo Removing startup script...
    del "start-clarivo.bat"
)

if exist "start-clarivo.sh" (
    echo Removing startup script...
    del "start-clarivo.sh"
)

REM Remove desktop shortcut
echo Removing desktop shortcut...
for %%i in ("%USERPROFILE%\Desktop\Clarivo.lnk") do (
    if exist "%%i" del "%%i"
)

echo.
echo ========================================
echo        UNINSTALLATION COMPLETED!
echo ========================================
echo.
echo Clarivo has been removed from your system.
echo.
echo Note: Your uploaded data in the 'data' folder
echo has been preserved. You can delete it manually
echo if you no longer need it.
echo.
pause
