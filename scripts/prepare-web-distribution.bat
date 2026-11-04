@echo off
echo Preparing Clarivo for Web Distribution...
echo.

echo Step 1: Creating web distribution package...
if not exist "web-dist" mkdir web-dist

echo.
echo Step 2: Building the application...
call scripts\create-standalone-app.bat

echo.
echo Step 3: Creating web distribution files...
copy "dist\Clarivo Setup.exe" "web-dist\"
copy "dist\README.txt" "web-dist\"

echo.
echo Step 4: Creating download page...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Clarivo - Download^</title^>
echo     ^<style^>
echo         body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
echo         .download-btn { background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
echo         .download-btn:hover { background: #0056b3; }
echo         .features { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<h1^>Clarivo - AI-Powered Data Analysis Tool^</h1^>
echo     ^<p^>Download the latest version of Clarivo for Windows.^</p^>
echo     ^<a href="Clarivo Setup.exe" class="download-btn"^>Download Clarivo Setup.exe^</a^>
echo     ^<div class="features"^>
echo         ^<h2^>Features:^</h2^>
echo         ^<ul^>
echo             ^<li^>AI-powered data analysis^</li^>
echo             ^<li^>Upload and analyze CSV, Excel files^</li^>
echo             ^<li^>Interactive data visualization^</li^>
echo             ^<li^>Professional desktop application^</li^>
echo             ^<li^>Easy-to-use interface^</li^>
echo         ^</ul^>
echo     ^</div^>
echo     ^<h2^>Installation Instructions:^</h2^>
echo     ^<ol^>
echo         ^<li^>Download the installer above^</li^>
echo         ^<li^>Run "Clarivo Setup.exe"^</li^>
echo         ^<li^>Follow the installation wizard^</li^>
echo         ^<li^>Launch Clarivo from your desktop or start menu^</li^>
echo     ^</ol^>
echo     ^<h2^>System Requirements:^</h2^>
echo     ^<ul^>
echo         ^<li^>Windows 10 or later^</li^>
echo         ^<li^>4GB RAM minimum^</li^>
echo         ^<li^>500MB free disk space^</li^>
echo     ^</ul^>
echo ^</body^>
echo ^</html^>
) > "web-dist\index.html"

echo.
echo Step 5: Creating version info...
(
echo Version: 1.0.0
echo Release Date: %date%
echo File: Clarivo Setup.exe
echo Size: 
) > "web-dist\version.txt"

echo.
echo ========================================
echo WEB DISTRIBUTION READY!
echo ========================================
echo.
echo Web distribution folder: web-dist\
echo Files created:
echo - index.html ^(Download page^)
echo - Clarivo Setup.exe ^(Installer^)
echo - README.txt ^(Instructions^)
echo - version.txt ^(Version info^)
echo.
echo To upload to a website:
echo 1. Upload all files from "web-dist\" folder
echo 2. Make sure "Clarivo Setup.exe" is in the same directory as index.html
echo 3. Users can visit your website and download the app
echo.
echo Popular hosting options:
echo - GitHub Pages ^(Free^)
echo - Netlify ^(Free^)
echo - Vercel ^(Free^)
echo - Your own web server
echo.
pause
