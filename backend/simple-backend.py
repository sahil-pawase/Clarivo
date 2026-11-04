from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import uuid
from datetime import datetime

app = FastAPI(title="Clarivo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

datasets = []

@app.get("/")
async def root():
    return {"message": "Clarivo API is running!"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/v1/datasets")
async def list_datasets():
    return datasets

@app.post("/api/v1/datasets/upload")
async def upload_file(file: UploadFile = File(...)):
    dataset_id = str(uuid.uuid4())
    dataset = {
        "id": dataset_id,
        "name": file.filename,
        "rows": 100,
        "columns": 5,
        "size": file.size if hasattr(file, 'size') else 1024,
        "uploaded_at": datetime.now().isoformat(),
        "status": "uploaded"
    }
    datasets.append(dataset)
    return dataset

@app.get("/api/v1/datasets/{dataset_id}/preview")
async def preview(dataset_id: str):
    return {
        "data": [{"col1": "data1", "col2": "data2"}],
        "columns": ["col1", "col2"],
        "total_rows": 1,
        "showing_rows": 1
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
