# Clarivo Startup Guide

## Quick Start (Recommended)

### Option 1: Use Batch Files
1. **Setup (First time only):**
   ```
   Double-click: setup-clarivo.bat
   ```

2. **Start Backend:**
   ```
   Double-click: start-backend.bat
   ```

3. **Start Frontend (New window):**
   ```
   Double-click: start-frontend.bat
   ```

### Option 2: Manual Commands

#### Backend Setup:
```bash
cd clarivo/backend
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup (New Terminal):
```bash
cd clarivo/frontend
npm install
npm start
```

## What Should Happen:

1. **Backend starts on:** http://localhost:8000
   - API docs available at: http://localhost:8000/docs
   - Test endpoint: http://localhost:8000/api/v1/datasets/test/connection

2. **Frontend starts on:** http://localhost:3000
   - Should show "Connected to Clarivo API" notification
   - Upload area should be visible

## Troubleshooting:

### Backend Issues:
- **Missing pydantic-settings:** Run `pip install pydantic-settings google-generativeai`
- **Pandas compilation error:** Run `pip install --only-binary=all pandas`
- **Port 8000 in use:** Change port in uvicorn command to `--port 8001`

### Frontend Issues:
- **npm install fails:** Try `npm install --legacy-peer-deps`
- **Port 3000 in use:** React will automatically suggest port 3001

### Gemini API Issues:
- **Model not found:** The code now uses `gemini-1.5-flash` (updated)
- **API key issues:** Check that your key is correctly set in `backend/app/core/config.py`

## Features Now Working:

✅ **File Upload:** Drag & drop CSV/Excel files
✅ **Data Preview:** View uploaded data in table format  
✅ **AI Chat:** Ask questions about your data (powered by Gemini)
✅ **Dataset Management:** View all uploaded datasets
✅ **Professional UI:** No emojis, clean design
✅ **Error Handling:** Proper error messages and loading states

## Testing the Application:

1. **Upload a CSV file** - Should see success notification
2. **Go to Datasets tab** - Should see your uploaded file
3. **Click "View" button** - Should show data table
4. **Click "Analyze" button** - Should open chat interface
5. **Ask a question** - Should get AI-powered response

## API Endpoints Available:

- `GET /api/v1/datasets/test/connection` - Test API connection
- `POST /api/v1/datasets/upload` - Upload dataset
- `GET /api/v1/datasets/` - List all datasets
- `GET /api/v1/datasets/{id}/preview` - Preview dataset data
- `POST /api/v1/datasets/{id}/chat` - Chat with dataset
- `POST /api/v1/datasets/{id}/chart` - Create charts
- `POST /api/v1/datasets/{id}/export` - Export data

Your Gemini API key is configured and the application should now work properly! 🚀