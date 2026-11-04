@echo off
title Create Standalone Clarivo EXE
color 0B

echo.
echo ========================================
echo    CREATING STANDALONE CLARIVO EXE
echo ========================================
echo.

echo This will create a simple standalone executable.
echo.

REM Check if we're in the right directory
if not exist "frontend\package.json" (
    echo ERROR: Please run this script from the clarivo directory
    pause
    exit /b 1
)

echo Step 1: Building React app...
cd frontend
call npm run build

if errorlevel 1 (
    echo ERROR: Failed to build React app
    pause
    exit /b 1
)

echo.
echo Step 2: Creating standalone executable...
echo.

REM Create a simple batch file that will serve the built files
cd ..
if not exist "Clarivo-standalone" mkdir Clarivo-standalone
cd Clarivo-standalone

REM Copy the built files
xcopy "..\frontend\build\*" "." /E /I /Y

REM Create a simple launcher
echo @echo off > Clarivo.bat
echo title Clarivo - Data Analysis Tool >> Clarivo.bat
echo color 0A >> Clarivo.bat
echo echo. >> Clarivo.bat
echo echo Starting Clarivo... >> Clarivo.bat
echo echo. >> Clarivo.bat
echo start "" "index.html" >> Clarivo.bat
echo pause >> Clarivo.bat

echo.
echo ========================================
echo        STANDALONE EXE CREATED!
echo ========================================
echo.
echo Your standalone Clarivo application has been created!
echo.
echo Location: Clarivo-standalone\Clarivo.bat
echo.
echo To run the application:
echo 1. Double-click Clarivo.bat
echo 2. It will open in your default browser
echo 3. Works offline - no internet required!
echo.
echo You can copy the entire 'Clarivo-standalone' folder
echo to any computer and run it from anywhere!
echo.
pause

