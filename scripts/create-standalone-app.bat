@echo off
echo Creating Standalone Clarivo Application...
echo.

echo Step 1: Building the frontend...
call scripts\build-windows-exe.bat

echo.
echo Step 2: Creating backend package...
cd backend

echo Creating backend executable...
if not exist "venv" (
    echo Creating virtual environment for backend...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install pyinstaller
pip install -r requirements-minimal.txt

echo Creating backend EXE...
pyinstaller --onefile --name clarivo-backend main-minimal.py

echo.
echo Step 3: Creating distribution package...
cd ..
if not exist "dist" mkdir dist

echo Copying files to distribution folder...
copy "frontend\dist\Clarivo Setup.exe" "dist\"
copy "frontend\dist\win-unpacked\Clarivo.exe" "dist\"
copy "backend\dist\clarivo-backend.exe" "dist\"

echo.
echo Step 4: Creating README and instructions...
echo Creating README.txt...
(
echo Clarivo - AI-Powered Data Analysis Tool
echo ======================================
echo.
echo Installation Instructions:
echo 1. Run "Clarivo Setup.exe" to install the application
echo 2. The application will be installed to your Program Files
echo 3. Desktop and Start Menu shortcuts will be created
echo.
echo For Developers:
echo - Frontend: Clarivo.exe
echo - Backend: clarivo-backend.exe
echo.
echo System Requirements:
echo - Windows 10 or later
echo - 4GB RAM minimum
echo - 500MB free disk space
echo.
echo Support: Contact your system administrator
) > "dist\README.txt"

echo.
echo Step 5: Creating batch file to run both services...
(
echo @echo off
echo echo Starting Clarivo Application...
echo echo.
echo echo Starting Backend...
echo start "Clarivo Backend" "clarivo-backend.exe"
echo.
echo echo Waiting for backend to start...
echo timeout /t 5 /nobreak ^> nul
echo.
echo echo Starting Frontend...
echo start "Clarivo Frontend" "Clarivo.exe"
echo.
echo echo Clarivo is starting...
echo echo Backend: http://localhost:8000
echo echo Frontend: Will open automatically
echo.
echo pause
) > "dist\start-clarivo.bat"

echo.
echo ========================================
echo STANDALONE APPLICATION CREATED!
echo ========================================
echo.
echo Distribution folder: dist\
echo Files created:
echo - Clarivo Setup.exe ^(Installer^)
echo - Clarivo.exe ^(Frontend^)
echo - clarivo-backend.exe ^(Backend^)
echo - start-clarivo.bat ^(Launcher^)
echo - README.txt ^(Instructions^)
echo.
echo You can now distribute the entire "dist" folder!
echo.
pause
