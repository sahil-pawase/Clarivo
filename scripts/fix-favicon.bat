@echo off
echo Fixing Clarivo Favicon and Logo...
echo.

echo Copying logo files to proper locations...
cd frontend/public

echo Creating favicon.ico from logo.jpg...
copy logo.jpg favicon.ico >nul 2>&1

echo Creating apple-touch-icon.png from logo.jpg...
copy logo.jpg apple-touch-icon.png >nul 2>&1

echo Creating favicon-32x32.png from logo.jpg...
copy logo.jpg favicon-32x32.png >nul 2>&1

echo Creating favicon-16x16.png from logo.jpg...
copy logo.jpg favicon-16x16.png >nul 2>&1

echo.
echo Favicon files created successfully!
echo.
pause
