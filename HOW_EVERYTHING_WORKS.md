# HOW EVERYTHING WORKS - Clarivo System Architecture & Data Flow

## 🏗️ **System Architecture Overview**

Clarivo is built as a **client-server architecture** with a **React frontend** and **FastAPI backend**, designed for local-first data analysis with AI capabilities.

```
┌─────────────────┐    HTTP/API    ┌─────────────────┐    File I/O    ┌─────────────────┐
│   React Frontend │ ◄────────────► │  FastAPI Backend │ ◄────────────► │  Local File System │
│   (TypeScript)   │                │   (Python)      │                │   (CSV/JSON)     │
└─────────────────┘                └─────────────────┘                └─────────────────┘
         │                                   │                                   │
         │                                   │                                   │
         ▼                                   ▼                                   ▼
┌─────────────────┐                ┌─────────────────┐                ┌─────────────────┘
│  State Management│                │  AI Services    │                │  Data Storage   │
│  (Context API)  │                │  (Gemini API)   │                │  (Persistent)   │
└─────────────────┘                └─────────────────┘                └─────────────────┘
```

---

## 🔄 **Data Flow & Lifecycle**

### **1. Application Startup**
```
1. Frontend loads (React app)
2. DatasetsProvider initializes
3. Backend connection check
4. Load existing datasets from local storage
5. Initialize UI state
```

### **2. Dataset Upload Process**
```
User Upload → File Validation → Backend Processing → Data Analysis → Storage → UI Update
     │              │                │                │            │          │
     ▼              ▼                ▼                ▼            ▼          ▼
1. Drag & Drop   2. File Type     3. Pandas       4. AI        5. Save to   6. Refresh
   File           Check (.csv,     Processing      Analysis     Local       Frontend
                  .xlsx, .json)   (DataFrame)     (Gemini)     Storage     Display
```

### **3. Data Processing Pipeline**
```
Raw File → Pandas DataFrame → Data Cleaning → Statistical Analysis → AI Insights → Visualization
   │            │                │                │                │            │
   ▼            ▼                ▼                ▼                ▼            ▼
1. CSV/Excel  2. Structured     3. Handle NaN    4. Calculate    5. Generate   6. Create
   Upload      Data Table        Values           Stats           Insights      Charts
```

---

## 🎯 **Core Components & Their Roles**

### **Frontend Components**

#### **1. App.tsx (Main Container)**
- **Purpose**: Root component that manages navigation and layout
- **State**: Manages active tab selection
- **Children**: Wraps all screens in context providers

#### **2. DatasetsProvider (State Management)**
```typescript
// Core state managed:
- datasets: DatasetItem[]           // List of all datasets
- selectedId: string | null         // Currently selected dataset
- preview: PreviewResponse | null   // Data preview for selected dataset
- isLoading: boolean                // Loading state indicator
- refresh(): Promise<void>          // Refresh datasets from backend
- select(id: string | null): Promise<void>  // Select a dataset
- setFilter(column, value): void   // Apply data filters
```

#### **3. Screen Components**
- **Home**: Dataset upload and overview
- **ViewDataset**: Data table with sorting and filtering
- **Visualize**: Chart creation and management
- **Insights**: AI-powered data analysis chat
- **Cleaning**: Data preprocessing tools

#### **4. Rightbar (Context Panel)**
- **Purpose**: Real-time dataset statistics and quick tools
- **Features**: 
  - Column value counts
  - Numeric statistics (min, max, mean)
  - Missing value percentages
  - Quick filtering options

### **Backend Services**

#### **1. DatasetService (Core Data Processing)**
```python
class DatasetService:
    def __init__(self):
        self.datasets = {}          # In-memory cache
        self.upload_dir = Path("uploads")      # Temporary storage
        self.data_dir = Path("data")           # Persistent storage
        self.datasets_file = "datasets.json"   # Metadata storage
        self.charts_file = "charts.json"       # Chart definitions
```

**Key Methods:**
- `process_uploaded_file()`: Handles file upload and processing
- `get_preview()`: Returns paginated data preview
- `create_chart()`: Generates chart configurations
- `export_dataset()`: Exports data in various formats

#### **2. GeminiService (AI Integration)**
```python
class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
```

**AI Capabilities:**
- Dataset analysis and insights
- Natural language query processing
- Visualization recommendations
- Data quality assessment

#### **3. API Endpoints (REST Interface)**
```
POST   /api/v1/datasets/upload          # Upload new dataset
GET    /api/v1/datasets                 # List all datasets
GET    /api/v1/datasets/{id}/preview    # Get data preview
POST   /api/v1/datasets/{id}/chat       # AI chat with dataset
POST   /api/v1/datasets/{id}/charts     # Create new chart
GET    /api/v1/datasets/{id}/export     # Export dataset
```

---

## 🔧 **Technical Implementation Details**

### **1. State Management Architecture**
```
App.tsx (Root)
    ├── DatasetsProvider (Global State)
    │   ├── datasets[]           # Dataset list
    │   ├── selectedId           # Current selection
    │   ├── preview              # Data preview
    │   └── isLoading            # Loading state
    │
    ├── AppProvider (App State)
    │   ├── charts[]             # Chart configurations
    │   └── theme                # UI theme
    │
    └── Screen Components
        ├── Home                 # Uses useDatasets()
        ├── ViewDataset          # Uses useDatasets()
        ├── Visualize            # Uses useDatasets() + useApp()
        ├── Insights             # Uses useDatasets()
        └── Cleaning             # Uses useDatasets()
```

### **2. Data Persistence Strategy**
```
Local Storage Structure:
├── data/
│   ├── datasets.json           # Dataset metadata
│   ├── charts.json            # Chart configurations
│   └── metadata.json          # System metadata
├── uploads/                    # Temporary file storage
└── exports/                    # Exported files
```

### **3. Error Handling & Resilience**
- **Frontend**: Graceful fallbacks when backend is unavailable
- **Backend**: Comprehensive error handling with user-friendly messages
- **Data**: Safe JSON serialization for pandas/numpy types
- **Network**: Automatic retry and fallback mechanisms

### **4. Performance Optimizations**
- **Lazy Loading**: Data previews loaded on-demand
- **Caching**: In-memory dataset cache
- **Pagination**: Large datasets handled in chunks
- **Memoization**: React.useMemo for expensive calculations

---

## 🔄 **Real-time Data Flow Examples**

### **Example 1: User Uploads a CSV File**
```
1. User drags CSV file to upload zone
2. Frontend calls POST /api/v1/datasets/upload
3. Backend receives file and validates format/size
4. Pandas reads CSV into DataFrame
5. Data analysis performed (stats, column types)
6. AI generates initial insights
7. Data saved to local storage
8. Frontend receives success response
9. DatasetsProvider.refresh() called
10. UI updates with new dataset
```

### **Example 2: User Creates a Chart**
```
1. User selects chart type and columns
2. Frontend calls POST /api/v1/datasets/{id}/charts
3. Backend processes chart request
4. Plotly generates chart configuration
5. Chart saved to charts.json
6. Frontend receives chart data
7. ChartBoard component renders visualization
8. User can interact with chart
```

### **Example 3: AI Chat Interaction**
```
1. User types question in chat
2. Frontend calls POST /api/v1/datasets/{id}/chat
3. Backend prepares dataset context
4. Gemini API processes natural language query
5. AI generates response with data insights
6. Response formatted and returned
7. Frontend displays AI response
8. Chat history updated
```

---

## 🚀 **Advanced Features & Capabilities**

### **1. Data Filtering System**
```typescript
// Real-time filtering with React.useMemo
const previewFiltered = React.useMemo(() => {
    if (!preview) return null;
    const { column, value } = filter;
    if (!column || value == null || value === '') return preview;
    
    const filteredData = (preview.data || []).filter(
        (row) => String(row?.[column]) === String(value)
    );
    
    return { 
        ...preview, 
        data: filteredData, 
        showing_rows: filteredData.length 
    };
}, [preview, filter]);
```

### **2. Chart Generation Engine**
- **Automatic Type Detection**: Chart types suggested based on data
- **Dynamic Configuration**: Charts adapt to data structure
- **Interactive Features**: Zoom, pan, hover tooltips
- **Export Capabilities**: PNG, SVG, HTML formats

### **3. AI-Powered Analysis**
- **Natural Language Processing**: Understands user intent
- **Contextual Responses**: Provides relevant insights
- **Data Quality Assessment**: Identifies issues automatically
- **Visualization Recommendations**: Suggests appropriate charts

---

## 🔍 **Debugging & Troubleshooting**

### **Frontend Debugging**
```typescript
// Enable debug logging
console.log('Dataset state:', { datasets, selectedId, preview });

// Check API responses
console.log('API response:', response.data);

// Monitor state changes
useEffect(() => {
    console.log('State changed:', { datasets, selectedId });
}, [datasets, selectedId]);
```

### **Backend Debugging**
```python
# Enable detailed logging
logging.basicConfig(level=logging.DEBUG)

# Log API requests
logger.info(f"Processing request: {request.url}")

# Monitor data processing
logger.debug(f"DataFrame shape: {df.shape}")
```

### **Common Issues & Solutions**
1. **Data not loading**: Check backend connection and file permissions
2. **Charts not rendering**: Verify data types and column selection
3. **AI responses failing**: Check Gemini API key and rate limits
4. **Performance issues**: Monitor data size and pagination settings

---

## 📊 **Monitoring & Observability**

### **Health Checks**
- **Backend**: `/health` endpoint for service status
- **Frontend**: Connection status indicators
- **Data**: Dataset loading progress bars

### **Performance Metrics**
- **Upload Speed**: File processing time
- **Response Time**: API endpoint latency
- **Memory Usage**: Dataset cache size
- **User Interactions**: Chart creation frequency

This architecture provides a robust, scalable foundation for local-first data analysis with AI capabilities, ensuring data privacy while maintaining powerful analytical tools.
