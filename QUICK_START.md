# 🚀 Clarivo Quick Start Guide

## Automatic Setup & Run

### For Windows Users:
```bash
# Run the setup script
./setup-and-run.bat
```

### For Linux/Mac Users:
```bash
# Make scripts executable
chmod +x setup-and-run.sh fix-dependencies.sh run-clarivo.sh dev-clarivo.sh

# Run the setup script
./setup-and-run.sh
```

## Manual Setup (if automatic fails)

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

cd ..
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Build the application
npm run build

cd ..
```

### 3. Run the Application

#### Option A: Production Mode
```bash
# Windows:
run-clarivo.bat

# Linux/Mac:
./run-clarivo.sh
```

#### Option B: Development Mode
```bash
# Windows:
dev-clarivo.bat

# Linux/Mac:
./dev-clarivo.sh
```

#### Option C: Manual Start

**Backend:**
```bash
cd backend
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

python main.py
```

**Frontend (in new terminal):**
```bash
cd frontend
npm start
```

## Application URLs

- 🌐 **Frontend**: http://localhost:3000
- 📡 **Backend API**: http://localhost:8000
- 📚 **API Documentation**: http://localhost:8000/docs

## Features Available

✅ **Data Upload & Management** - Upload CSV, Excel, JSON files  
✅ **Data Cleaning & Preprocessing** - Clean and prepare your data  
✅ **Interactive Visualizations** - Create charts and graphs  
✅ **AI-Powered Data Analysis** - Get AI insights and recommendations  
✅ **Statistical Analysis** - Comprehensive statistical summaries  
✅ **Export & Sharing** - Export results in multiple formats  

## Troubleshooting

### Common Issues:

1. **Port already in use**:
   - Kill processes on ports 3000 and 8000
   - Or change ports in configuration files

2. **Dependencies not found**:
   ```bash
   # Run the dependency fix script
   ./fix-dependencies.sh
   ```

3. **Python virtual environment issues**:
   ```bash
   # Delete and recreate venv
   rm -rf backend/venv
   cd backend
   python -m venv venv
   ```

4. **Node modules issues**:
   ```bash
   # Clear and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

### System Requirements:
- **Node.js**: 16+ 
- **Python**: 3.8+
- **npm**: Latest version
- **pip**: Latest version

## Need Help?

If you encounter any issues:
1. Check the console output for error messages
2. Ensure all system requirements are met
3. Try running the fix-dependencies script
4. Restart your terminal and try again

## Success! 🎉

Once running, you should see:
- Backend server at http://localhost:8000
- Frontend application at http://localhost:3000
- No error messages in the console

**Enjoy using Clarivo for your data analysis needs!**