@echo off
echo Starting Clarivo Desktop App in Development Mode...
echo.

echo Installing frontend dependencies (if needed)...
cd frontend
call npm install

echo.
echo Starting the desktop app...
call npm run electron-dev

echo.
pause
