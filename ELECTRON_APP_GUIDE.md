# 🖥️ Clarivo Electron Desktop Application Guide

## 🚀 Quick Start

### **Automatic Setup & Build**

#### For Windows:
```bash
# Complete setup
./setup-electron-app.bat

# Build desktop app
./build-electron-app.bat
```

#### For Linux/Mac:
```bash
# Make scripts executable
chmod +x *.sh

# Complete setup
./setup-electron-app.sh

# Build desktop app
./build-electron-app.sh
```

## 📋 What You Get

### **🖥️ Desktop Application Features:**
- **Native Desktop App** - Runs as a standalone .exe/.app/.AppImage
- **No Browser Required** - Self-contained Electron application
- **Embedded Backend** - Python FastAPI server bundled inside
- **Offline Operation** - No internet connection needed
- **Cross-Platform** - Windows, Mac, and Linux support

### **📊 AI Analysis Features:**
- **Statistical Analysis** - Mean, median, mode, standard deviation, etc.
- **Data Visualization** - Interactive charts and graphs
- **AI Insights** - Automated data analysis and recommendations
- **Data Import/Export** - CSV, Excel, JSON support
- **Data Cleaning** - Automated data preprocessing

## 🛠️ Development Workflow

### **1. Setup (One Time)**
```bash
# Windows
./setup-electron-app.bat

# Linux/Mac
./setup-electron-app.sh
```

### **2. Development Mode**
```bash
# Windows
./run-electron-dev.bat

# Linux/Mac
./run-electron-dev.sh
```

### **3. Build Desktop App**
```bash
# Windows
./build-electron-app.bat

# Linux/Mac
./build-electron-app.sh
```

## 📁 Project Structure

```
clarivo/
├── frontend/                 # React + Electron frontend
│   ├── public/
│   │   ├── electron.js      # Electron main process
│   │   └── preload.js       # Electron preload script
│   ├── src/                 # React application
│   └── package.json         # Electron + React dependencies
├── backend/                 # Python FastAPI backend
│   ├── main.py             # FastAPI server
│   ├── requirements.txt    # Python dependencies
│   └── venv/               # Python virtual environment
└── dist/                   # Built executables
    └── clarivo-backend.exe # Bundled Python backend
```

## 🏗️ Build Process

### **What Happens During Build:**

1. **Backend Build**:
   - Creates Python virtual environment
   - Installs all Python dependencies
   - Uses PyInstaller to create `clarivo-backend.exe`
   - Bundles FastAPI server into single executable

2. **Frontend Build**:
   - Installs Node.js dependencies
   - Builds React application with `npm run build`
   - Configures Electron for desktop packaging

3. **Electron Packaging**:
   - Uses electron-builder to create desktop app
   - Embeds the Python backend executable
   - Creates installer and portable versions
   - Generates platform-specific packages

### **Build Outputs:**

#### Windows:
- `c:/clarivo-build/Clarivo Setup.exe` - Installer
- `clarivo-portable/Clarivo.exe` - Portable version

#### Linux:
- `frontend/dist/Clarivo.AppImage` - AppImage
- `clarivo-portable/Clarivo` - Portable version

#### Mac:
- `frontend/dist/Clarivo.app` - Mac application
- `clarivo-portable/Clarivo.app` - Portable version

## 🔧 Configuration

### **Backend Configuration** (`backend/.env`):
```env
DEBUG=True
SECRET_KEY=clarivo-desktop-app-secret-key
DATABASE_URL=sqlite:///./clarivo.db
CORS_ORIGINS=["http://localhost:3000"]
UPLOAD_DIR=uploads
MAX_FILE_SIZE=100MB
HOST=127.0.0.1
PORT=8000
```

### **Frontend Configuration** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
BROWSER=none
```

### **Electron Configuration** (`frontend/package.json`):
```json
{
  "main": "public/electron.js",
  "homepage": "./",
  "build": {
    "appId": "com.clarivo.app",
    "productName": "Clarivo",
    "directories": {
      "output": "c:/clarivo-build"
    }
  }
}
```

## 🚀 Running the App

### **Development Mode:**
- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:3000`
- Electron window opens automatically
- Hot reload enabled for both frontend and backend

### **Production Mode:**
- Single executable file
- Backend embedded inside the app
- No external dependencies required
- Runs completely offline

## 🐛 Troubleshooting

### **Common Issues:**

1. **Python not found**:
   ```bash
   # Install Python 3.8+
   # Windows: Download from python.org
   # Linux: sudo apt install python3 python3-pip
   # Mac: brew install python3
   ```

2. **Node.js not found**:
   ```bash
   # Install Node.js 16+
   # Download from nodejs.org
   ```

3. **Build fails**:
   ```bash
   # Clear caches and rebuild
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   
   cd ../backend
   rm -rf venv
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

4. **Electron app won't start**:
   - Check if backend executable exists in `dist/`
   - Verify port 8000 is not in use
   - Check console for error messages

### **Debug Mode:**
```bash
# Run with debug output
cd frontend
npm run electron-dev
```

## 📦 Distribution

### **For End Users:**
1. **Windows**: Double-click `Clarivo Setup.exe` to install
2. **Linux**: Make executable and run `./Clarivo.AppImage`
3. **Mac**: Drag `Clarivo.app` to Applications folder

### **Portable Version:**
- No installation required
- Run directly from `clarivo-portable/` folder
- All data stored in app directory

## 🎯 Success Indicators

When everything is working correctly:

✅ **Setup Complete**: No error messages during setup  
✅ **Development Mode**: Electron window opens with React app  
✅ **Backend Running**: API accessible at `http://localhost:8000/docs`  
✅ **Build Success**: Executable files created in output directories  
✅ **App Functionality**: Can upload data, run AI analysis, view results  
✅ **Statistical Analysis**: Mean, median, mode calculations working  
✅ **Visualizations**: Charts and graphs display correctly  
✅ **Export Features**: Can export to PDF, Excel, CSV  

## 🎉 Final Result

You'll have a complete desktop application that:

- **Runs Offline** - No internet required
- **Self-Contained** - All dependencies bundled
- **Professional** - Native desktop app experience  
- **Powerful** - Full AI data analysis capabilities
- **Cross-Platform** - Works on Windows, Mac, Linux
- **Easy Distribution** - Single file installation

**Perfect for distributing to end users who want a powerful data analysis tool without technical setup!** 🎯