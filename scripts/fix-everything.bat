@echo off
echo Fixing Clarivo - Network Error and Logo Issues...
echo.

echo Step 1: Fixing favicon and logo files...
call scripts\fix-favicon.bat

echo.
echo Step 2: Cleaning build directory...
call scripts\clean-build.bat

echo.
echo Step 3: Starting the full application...
echo.
echo IMPORTANT: This will start both backend and frontend.
echo The backend must be running for file uploads to work!
echo.
echo Starting in 3 seconds...
timeout /t 3 /nobreak > nul

call scripts\start-full-app.bat

echo.
echo Fix completed! Your app should now work properly.
echo.
pause
