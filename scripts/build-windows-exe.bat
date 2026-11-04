@echo off
echo Building Clarivo Windows EXE Application...
echo.

echo Step 1: Cleaning previous builds...
cd frontend
if exist "dist" (
    rmdir /s /q "dist"
    echo Old dist folder removed.
)

if exist "build" (
    rmdir /s /q "build"
    echo Old build folder removed.
)

echo.
echo Step 2: Installing dependencies...
call npm install --legacy-peer-deps

echo.
echo Step 3: Building React app...
call npm run build

echo.
echo Step 4: Building Windows EXE...
call npm run electron-pack

echo.
echo Step 5: Creating installer...
echo.

echo Build completed successfully!
echo.
echo Your Windows application is ready:
echo - EXE File: frontend\dist\win-unpacked\Clarivo.exe
echo - Installer: frontend\dist\Clarivo Setup.exe
echo.
echo You can now distribute the "Clarivo Setup.exe" file!
echo.
pause
