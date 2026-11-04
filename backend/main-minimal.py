from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from datetime import datetime
import uuid

app = FastAPI(title="Clarivo API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "null"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage for testing
datasets = []

@app.get("/")
async def root():
    return {"message": "Clarivo API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "clarivo-api"}

@app.get("/api/v1/datasets")
async def list_datasets():
    return datasets

@app.post("/api/v1/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    # Generate a unique ID
    dataset_id = str(uuid.uuid4())
    
    # Create dataset info
    dataset = {
        "id": dataset_id,
        "name": file.filename,
        "rows": 0,  # Placeholder
        "columns": 0,  # Placeholder
        "size": file.size if hasattr(file, 'size') else 0,
        "uploaded_at": datetime.now().isoformat(),
        "status": "uploaded"
    }
    
    # Add to datasets list
    datasets.append(dataset)
    
    return dataset

@app.get("/api/v1/datasets/{dataset_id}/preview")
async def get_preview(dataset_id: str, limit: int = 500):
    # Find the dataset
    dataset = next((d for d in datasets if d["id"] == dataset_id), None)
    if not dataset:
        return {"error": "Dataset not found"}
    
    # Return mock preview data
    return {
        "data": [
            {"column1": "sample1", "column2": "sample2"},
            {"column1": "sample3", "column2": "sample4"}
        ],
        "columns": ["column1", "column2"],
        "total_rows": 2,
        "showing_rows": 2
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting Clarivo Backend...")
    print("Backend will be available at: http://localhost:8000")
    print("Press Ctrl+C to stop the server")
    uvicorn.run(app, host="0.0.0.0", port=8000)
