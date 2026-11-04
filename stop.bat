@echo off
title Clarivo Stop
color 0C

echo.
echo ========================================
echo           CLARIVO STOP
echo ========================================
echo.

echo Stopping Clarivo services...
echo.

REM Stop processes on port 3000 (frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Stopping frontend process (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

REM Stop processes on port 8000 (backend)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    echo Stopping backend process (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill any remaining Clarivo processes
echo Stopping any remaining Clarivo processes...
taskkill /IM "node.exe" /F >nul 2>&1
taskkill /IM "python.exe" /F >nul 2>&1

echo.
echo ========================================
echo        CLARIVO STOPPED!
echo ========================================
echo.
echo All Clarivo services have been stopped.
echo.
pause
