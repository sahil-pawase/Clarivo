#!/usr/bin/env python3
"""
Clarivo Setup Script
====================

This script sets up the Clarivo AI-powered data analysis tool.
It installs all dependencies and prepares the application for first run.
"""

import os
import sys
import subprocess
import platform
import shutil
from pathlib import Path

class ClarivoSetup:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_dir = self.project_root / "backend"
        self.frontend_dir = self.project_root / "frontend"
        self.system = platform.system().lower()
        
    def print_banner(self):
        """Print the setup banner"""
        print("=" * 60)
        print("           CLARIVO SETUP")
        print("    AI-Powered Data Analysis Tool")
        print("=" * 60)
        print()
        
    def check_python_version(self):
        """Check if Python version is compatible"""
        if sys.version_info < (3, 8):
            print("❌ Error: Python 3.8 or higher is required")
            print(f"Current version: {sys.version}")
            sys.exit(1)
        print(f"✅ Python {sys.version.split()[0]} detected")
        
    def check_node_js(self):
        """Check if Node.js is installed"""
        try:
            result = subprocess.run(['node', '--version'], 
                                  capture_output=True, text=True, check=True)
            print(f"✅ Node.js {result.stdout.strip()} detected")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ Node.js not found. Please install Node.js 16 or higher")
            print("Download from: https://nodejs.org/")
            return False
            
    def check_npm(self):
        """Check if npm is installed"""
        try:
            result = subprocess.run(['npm', '--version'], 
                                  capture_output=True, text=True, check=True)
            print(f"✅ npm {result.stdout.strip()} detected")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ npm not found. Please install npm")
            return False
            
    def install_backend_dependencies(self):
        """Install Python backend dependencies"""
        print("\n📦 Installing backend dependencies...")
        
        # Create virtual environment if it doesn't exist
        venv_path = self.backend_dir / "venv"
        if not venv_path.exists():
            print("Creating virtual environment...")
            subprocess.run([sys.executable, "-m", "venv", str(venv_path)], check=True)
        
        # Determine pip path
        if self.system == "windows":
            pip_path = venv_path / "Scripts" / "pip.exe"
            python_path = venv_path / "Scripts" / "python.exe"
        else:
            pip_path = venv_path / "bin" / "pip"
            python_path = venv_path / "bin" / "python"
            
        # Upgrade pip
        subprocess.run([str(pip_path), "install", "--upgrade", "pip"], check=True)
        
        # Install requirements
        requirements_file = self.backend_dir / "requirements.txt"
        if requirements_file.exists():
            subprocess.run([str(pip_path), "install", "-r", str(requirements_file)], check=True)
            print("✅ Backend dependencies installed successfully")
        else:
            print("❌ requirements.txt not found in backend directory")
            
    def install_frontend_dependencies(self):
        """Install Node.js frontend dependencies"""
        print("\n📦 Installing frontend dependencies...")
        
        if not self.frontend_dir.exists():
            print("❌ Frontend directory not found")
            return False
            
        os.chdir(self.frontend_dir)
        
        # Install npm dependencies
        try:
            subprocess.run(['npm', 'install'], check=True)
            print("✅ Frontend dependencies installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install frontend dependencies: {e}")
            return False
            
    def create_startup_scripts(self):
        """Create startup scripts for different platforms"""
        print("\n🚀 Creating startup scripts...")
        
        # Windows batch file
        if self.system == "windows":
            self.create_windows_startup_script()
        else:
            self.create_unix_startup_script()
            
    def create_windows_startup_script(self):
        """Create Windows startup script"""
        script_content = f'''@echo off
echo Starting Clarivo...
echo.

REM Start backend
cd /d "{self.backend_dir}"
if not exist "venv\\Scripts\\activate.bat" (
    echo Backend not set up. Please run setup.py first.
    pause
    exit /b 1
)

start "Clarivo Backend" cmd /k "venv\\Scripts\\activate.bat && python main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
cd /d "{self.frontend_dir}"
start "Clarivo Frontend" cmd /k "npm start"

echo.
echo Clarivo is starting up!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
'''
        
        startup_script = self.project_root / "start-clarivo.bat"
        with open(startup_script, 'w') as f:
            f.write(script_content)
        print("✅ Created start-clarivo.bat")
        
    def create_unix_startup_script(self):
        """Create Unix/Linux startup script"""
        script_content = f'''#!/bin/bash
echo "Starting Clarivo..."
echo

# Start backend
cd "{self.backend_dir}"
if [ ! -f "venv/bin/activate" ]; then
    echo "Backend not set up. Please run setup.py first."
    exit 1
fi

# Start backend in background
source venv/bin/activate
python main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
cd "{self.frontend_dir}"
npm start &
FRONTEND_PID=$!

echo
echo "Clarivo is starting up!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo
echo "Press Ctrl+C to stop both services..."

# Wait for user to stop
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
'''
        
        startup_script = self.project_root / "start-clarivo.sh"
        with open(startup_script, 'w') as f:
            f.write(script_content)
        
        # Make executable
        os.chmod(startup_script, 0o755)
        print("✅ Created start-clarivo.sh")
        
    def create_desktop_shortcut(self):
        """Create desktop shortcut for easy access"""
        if self.system == "windows":
            self.create_windows_shortcut()
        else:
            self.create_unix_shortcut()
            
    def create_windows_shortcut(self):
        """Create Windows desktop shortcut"""
        try:
            import winshell
            from win32com.client import Dispatch
            
            desktop = winshell.desktop()
            shortcut_path = os.path.join(desktop, "Clarivo.lnk")
            
            shell = Dispatch('WScript.Shell')
            shortcut = shell.CreateShortCut(shortcut_path)
            shortcut.Targetpath = str(self.project_root / "start-clarivo.bat")
            shortcut.WorkingDirectory = str(self.project_root)
            shortcut.IconLocation = str(self.frontend_dir / "public" / "logo.jpg")
            shortcut.save()
            
            print("✅ Created desktop shortcut")
        except ImportError:
            print("ℹ️  Install pywin32 and winshell for desktop shortcut creation")
        except Exception as e:
            print(f"ℹ️  Could not create desktop shortcut: {e}")
            
    def create_unix_shortcut(self):
        """Create Unix desktop shortcut"""
        desktop_file = f"""[Desktop Entry]
Version=1.0
Type=Application
Name=Clarivo
Comment=AI-Powered Data Analysis Tool
Exec={self.project_root}/start-clarivo.sh
Icon={self.frontend_dir}/public/logo.jpg
Terminal=true
Categories=Development;Science;
"""
        
        desktop_dir = os.path.expanduser("~/Desktop")
        if os.path.exists(desktop_dir):
            shortcut_path = os.path.join(desktop_dir, "Clarivo.desktop")
            with open(shortcut_path, 'w') as f:
                f.write(desktop_file)
            os.chmod(shortcut_path, 0o755)
            print("✅ Created desktop shortcut")
            
    def run_setup(self):
        """Run the complete setup process"""
        self.print_banner()
        
        print("🔍 Checking system requirements...")
        self.check_python_version()
        
        if not self.check_node_js():
            return False
        if not self.check_npm():
            return False
            
        print("\n📋 Installing dependencies...")
        self.install_backend_dependencies()
        
        if not self.install_frontend_dependencies():
            return False
            
        print("\n🔧 Creating startup scripts...")
        self.create_startup_scripts()
        
        print("\n📱 Creating desktop shortcut...")
        self.create_desktop_shortcut()
        
        print("\n" + "=" * 60)
        print("✅ SETUP COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print()
        print("🚀 To start Clarivo:")
        if self.system == "windows":
            print("   • Double-click 'start-clarivo.bat'")
            print("   • Or use the desktop shortcut")
        else:
            print("   • Run './start-clarivo.sh'")
            print("   • Or use the desktop shortcut")
        print()
        print("🌐 The application will be available at:")
        print("   • Frontend: http://localhost:3000")
        print("   • Backend API: http://localhost:8000")
        print()
        print("📚 For more information, see README.md")
        
        return True

def main():
    """Main setup function"""
    setup = ClarivoSetup()
    success = setup.run_setup()
    
    if not success:
        print("\n❌ Setup failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
