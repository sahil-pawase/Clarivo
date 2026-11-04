# 🚀 How to Use Clarivo Desktop App

## ⚡ Quick Start (3 Simple Steps)

### Step 1: Install Requirements
Make sure you have:
- **Python 3.8+** - Download from [python.org](https://python.org)
- **Node.js 16+** - Download from [nodejs.org](https://nodejs.org)

### Step 2: First Time Setup
```bash
# Run the installer
install.bat
```

### Step 3: Launch the App
```bash
# Simple one-click launcher
start-clarivo-simple.bat
```

## 🎯 That's It!

The application will automatically:
- ✅ Start the Python backend server
- ✅ Start the React frontend
- ✅ Open the Electron desktop window
- ✅ Connect everything together

## 📁 Available Scripts

### For End Users:
- **`start-clarivo-simple.bat`** - One-click launcher (recommended)
- **`install.bat`** - First-time setup
- **`stop.bat`** - Stop all services
- **`uninstall.bat`** - Remove the application

### For Developers:
- **`run-electron-dev.bat`** - Development mode with hot reload
- **`build-electron.bat`** - Build standalone executable
- **`test-electron.bat`** - Test Electron app directly

## 🌐 Access Points

When running, you can access:
- **Desktop App**: Opens automatically in Electron window
- **Web Browser**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Troubleshooting

### Common Issues:

1. **"Port already in use"**
   ```bash
   # Run this first:
   stop.bat
   ```

2. **"ModuleNotFoundError: No module named 'fastapi'"**
   ```bash
   # Run the installer:
   install.bat
   ```

3. **"Node.js not found"**
   - Download and install Node.js from [nodejs.org](https://nodejs.org)

4. **"Python not found"**
   - Download and install Python from [python.org](https://python.org)

### If Nothing Works:
1. Run `stop.bat` to kill all processes
2. Run `install.bat` to reinstall dependencies
3. Run `start-clarivo-simple.bat` to start fresh

## 📊 Using the Application

### Features Available:
- **Data Upload**: Drag and drop CSV files
- **AI Analysis**: Get insights using Gemini AI
- **Visualization**: Create charts and graphs
- **Data Cleaning**: Clean and prepare your data

### Getting Started:
1. Upload a CSV file using the upload zone
2. View your dataset in the home screen
3. Use AI analysis to get insights
4. Create visualizations in the visualize section
5. Clean your data in the cleaning section

## 🎉 Success!

Your Clarivo desktop application is now running like a professional software package!

---

**Need Help?** Check the full documentation in `README.md` and `ELECTRON_GUIDE.md`
