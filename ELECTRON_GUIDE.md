# 🖥️ Clarivo Desktop Application Guide

## 🚀 Quick Start - Desktop App

### For End Users (Non-Technical)

#### Windows Users:
1. **Download** the Clarivo installer from the releases
2. **Double-click** the installer (.exe file)
3. **Follow** the installation wizard
4. **Launch** Clarivo from your desktop or start menu

#### macOS Users:
1. **Download** the Clarivo .dmg file
2. **Drag** Clarivo to your Applications folder
3. **Launch** from Applications or Spotlight

#### Linux Users:
1. **Download** the Clarivo AppImage
2. **Make executable**: `chmod +x Clarivo-*.AppImage`
3. **Run**: `./Clarivo-*.AppImage`

---

## 🛠️ For Developers

### Building the Desktop Application

#### Prerequisites:
- **Node.js 16+** and **npm**
- **Python 3.8+** (for backend)
- **Git** (for cloning)

#### Step 1: Clone and Setup
```bash
git clone <repository-url>
cd clarivo
```

#### Step 2: Build the Application

##### Windows:
```bash
# Double-click or run:
build-electron.bat
```

##### macOS/Linux:
```bash
chmod +x build-electron.sh
./build-electron.sh
```

#### Step 3: Find Your App
The built application will be in:
```
frontend/dist/
```

---

## 🔧 Development Mode

### Running in Development

#### Windows:
```bash
# Double-click or run:
run-electron-dev.bat
```

#### macOS/Linux:
```bash
chmod +x run-electron-dev.sh
./run-electron-dev.sh
```

### What Happens in Development Mode:
1. **Backend**: Automatically starts Python FastAPI server
2. **Frontend**: Starts React development server
3. **Electron**: Opens desktop window pointing to localhost:3000
4. **Hot Reload**: Changes reflect immediately

---

## 📦 Application Structure

### Built Application Contains:
```
Clarivo.exe (or .app/.AppImage)
├── Backend (Python FastAPI)
│   ├── Virtual Environment
│   ├── All Dependencies
│   └── Data Storage
├── Frontend (React App)
│   ├── Built React App
│   └── Static Assets
└── Electron Runtime
```

### Development Structure:
```
clarivo/
├── frontend/           # React + Electron
│   ├── public/
│   │   └── electron.js # Main Electron process
│   ├── src/            # React components
│   └── package.json    # Dependencies & scripts
├── backend/            # Python FastAPI
│   ├── app/            # API endpoints
│   ├── main.py         # Server entry point
│   └── requirements.txt # Python dependencies
└── Build Scripts
```

---

## ⚙️ Configuration

### Environment Variables
Create `.env` file in the backend directory:
```env
# API Configuration
API_HOST=localhost
API_PORT=8000

# AI Configuration
GEMINI_API_KEY=your_api_key_here

# Database
DATABASE_URL=sqlite:///./clarivo.db
```

### Application Settings
Edit `config.json` for:
- Port numbers
- Feature toggles
- File size limits
- AI model settings

---

## 🔍 Troubleshooting

### Common Issues:

#### 1. "ModuleNotFoundError: No module named 'fastapi'"
**Solution**: Backend dependencies not installed
```bash
cd backend
python -m venv venv
venv/Scripts/activate  # Windows
source venv/bin/activate  # Unix
pip install -r requirements.txt
```

#### 2. "Port already in use"
**Solution**: Kill existing processes
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Unix
lsof -ti:8000 | xargs kill -9
```

#### 3. "Electron app won't start"
**Solution**: Check Node.js version
```bash
node --version  # Should be 16+
npm --version   # Should be 8+
```

#### 4. "Build fails"
**Solution**: Clear cache and rebuild
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 🚀 Distribution

### Creating Installers

#### Windows:
- **NSIS Installer**: `npm run electron-pack`
- **Portable**: Built automatically
- **Auto-updater**: Configured in package.json

#### macOS:
- **DMG**: `npm run electron-pack`
- **Code Signing**: Add certificates to build config

#### Linux:
- **AppImage**: `npm run electron-pack`
- **Deb/RPM**: Configure in electron-builder

### Distribution Checklist:
- [ ] Test on target platform
- [ ] Verify all dependencies included
- [ ] Check file permissions
- [ ] Test installation/uninstallation
- [ ] Verify data persistence
- [ ] Test offline functionality

---

## 🔧 Advanced Configuration

### Customizing the Build

#### Electron Builder Config (package.json):
```json
{
  "build": {
    "appId": "com.clarivo.app",
    "productName": "Clarivo",
    "directories": {
      "output": "dist"
    },
    "files": [
      "build/**/*",
      "public/**/*"
    ],
    "extraResources": [
      {
        "from": "../backend",
        "to": "backend"
      }
    ]
  }
}
```

#### Backend Integration:
The Electron app automatically:
- Creates Python virtual environment
- Installs backend dependencies
- Starts FastAPI server
- Manages process lifecycle

---

## 📊 Performance Optimization

### For Production Builds:
1. **Minimize bundle size**: Use production React build
2. **Optimize images**: Compress logos and icons
3. **Tree shaking**: Remove unused dependencies
4. **Code splitting**: Lazy load components
5. **Caching**: Implement proper cache strategies

### Memory Management:
- Backend runs in separate process
- Automatic cleanup on app close
- Resource monitoring built-in

---

## 🔒 Security Considerations

### Built-in Security:
- **Context Isolation**: Enabled by default
- **Node Integration**: Disabled for security
- **Web Security**: Enabled
- **Sandboxing**: Electron security features active

### Best Practices:
- Keep dependencies updated
- Use HTTPS in production
- Validate all user inputs
- Implement proper error handling

---

## 📞 Support

### Getting Help:
1. **Check logs**: Application logs in console
2. **Verify setup**: Run diagnostic scripts
3. **Check issues**: GitHub issues page
4. **Documentation**: Full README.md

### Debug Mode:
```bash
# Windows
set DEBUG=electron-builder && npm run electron-pack

# Unix
DEBUG=electron-builder npm run electron-pack
```

---

**🎉 Your Clarivo desktop application is ready to use!**
