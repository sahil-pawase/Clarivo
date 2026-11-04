@echo off
echo Building Clarivo Desktop Application...
echo.

echo Installing frontend dependencies...
cd frontend
call npm install --legacy-peer-deps

echo.
echo Building the React app...
call npm run build

echo.
echo Building the Electron desktop app...
call npm run electron-pack

echo.
echo Build completed! Check the 'frontend/dist' folder for your desktop app.
echo.
pause
