"""
Dataset API endpoints
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from typing import List, Optional
import shutil
import tempfile
from pathlib import Path
from datetime import datetime
import logging
import pandas as pd
import numpy as np

from app.models.dataset import (
    DatasetResponse, ChatMessage, ChatResponse, ChartRequest, ExportRequest, ChartInfo,
    GenerateChartRequest, ExportChartRequest, AIGenerateRequest, ChartSuggestion,
    DashboardConfig, VisualizationType, ChartConfig, ChartType, ChartStatus
)

# Import the dataset service (was missing, causing NameError at runtime)
from app.services.dataset_service import dataset_service


def safe_json_serialize(obj):
    """Safely serialize an object for JSON, handling pandas/numpy types and containers"""
    # Containers first
    if isinstance(obj, dict):
        return {k: safe_json_serialize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [safe_json_serialize(v) for v in obj]
    if isinstance(obj, np.ndarray):
        return obj.tolist()

    # Scalar-like values
    try:
        # pd.isna returns a scalar bool for scalars; avoid arrays (handled above)
        if pd.isna(obj):
            return None
    except Exception:
        pass

    if isinstance(obj, (pd.Timestamp,)):
        return obj.isoformat()
    # Handle plain datetime
    from datetime import datetime as _dt
    if isinstance(obj, _dt):
        return obj.isoformat()
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    return obj

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(file: UploadFile = File(...)):
    """Upload and process a dataset file with enterprise validation & security checks"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    clean_name = file.filename.strip()
    name_lower = clean_name.lower()

    # Block dangerous executable files
    if any(name_lower.endswith(ext) for ext in ['.exe', '.bat', '.sh', '.py', '.js', '.php', '.cmd', '.dll', '.scr', '.html', '.svg', '.vbs', '.ps1']):
        raise HTTPException(status_code=400, detail="File type strictly prohibited for enterprise security.")

    # Whitelist extensions
    if not any(name_lower.endswith(ext) for ext in ['.csv', '.xlsx', '.xls', '.json', '.tsv', '.txt']):
        raise HTTPException(
            status_code=400, 
            detail="Unsupported format. Please upload CSV, Excel (.xlsx, .xls), JSON, or TSV datasets."
        )

    # Sanitize filename against path traversal
    import re
    safe_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', Path(clean_name).name)
    suffix = Path(safe_name).suffix.lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_path = tmp_file.name

    try:
        tmp_size = Path(tmp_path).stat().st_size
        if tmp_size > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 100MB.")
        if tmp_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

        result = await dataset_service.process_uploaded_file(tmp_path, clean_name)
        logger.info(f"Successfully processed dataset '{clean_name}' ({result.get('rows', 0)} rows)")

        # Log enterprise audit event
        try:
            from app.core.database import log_audit_event
            log_audit_event(
                event_type="UPLOAD",
                action=f"Uploaded dataset '{clean_name}' ({result.get('rows', 0)} rows)",
                resource_id=result.get("id"),
                details={"filename": clean_name, "size_bytes": tmp_size, "rows": result.get("rows", 0)}
            )
        except Exception:
            pass

        return DatasetResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing file {clean_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@router.get("", response_model=List[DatasetResponse], include_in_schema=False)
@router.get("/", response_model=List[DatasetResponse])
async def list_datasets():
    """Get list of all datasets"""
    try:
        datasets = []
        for dataset_id, info in dataset_service.datasets.items():
            try:
                uploaded_at = info.get('uploaded_at') or info.get('created_at') or datetime.now()
                if isinstance(uploaded_at, str):
                    try:
                        uploaded_at = datetime.fromisoformat(uploaded_at)
                    except Exception:
                        uploaded_at = datetime.now()
                
                rows_count = info.get('rows') or info.get('row_count') or 0
                cols_count = info.get('columns') or info.get('column_count') or 0
                if isinstance(cols_count, list):
                    cols_count = len(cols_count)
                
                size = info.get('size') or (rows_count * cols_count) or 0
                col_info = info.get('column_info') or info.get('columns') or []
                
                datasets.append(DatasetResponse(
                    id=dataset_id,
                    name=info.get('name', 'Untitled Dataset'),
                    size=int(size),
                    uploaded_at=uploaded_at,
                    status=info.get('status', 'ready'),
                    rows=int(rows_count),
                    columns=int(cols_count),
                    column_info=col_info if isinstance(col_info, list) else []
                ))
            except Exception as e:
                logger.warning(f"Error processing dataset {dataset_id}: {e}")
                continue
        
        logger.info(f"Returning {len(datasets)} datasets")
        return datasets
    
    except Exception as e:
        logger.error(f"Error listing datasets: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving datasets")


@router.get("/summary")
async def get_datasets_summary():
    """Get summary statistics of all datasets"""
    try:
        summary = dataset_service.get_datasets_summary()
        return summary
    except Exception as e:
        logger.error(f"Error getting datasets summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving datasets summary")


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get dataset details"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        info = dataset_service.datasets[dataset_id]
        
        # Check if dataset is corrupted
        if info.get('status') == 'error':
            return {
                'id': info['id'],
                'name': info['name'],
                'status': 'error',
                'error_message': info.get('error_message', 'Unknown error'),
                'uploaded_at': info['uploaded_at']
            }
        
        return {
            'id': info['id'],
            'name': info['name'],
            'rows': info['rows'],
            'columns': info['columns'],
            'status': info['status'],
            'uploaded_at': info['uploaded_at'],
            'column_info': info['column_info'],
            'summary': info['summary'],
            'data_quality': info['data_quality']
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving dataset")


@router.get("/{dataset_id}/preview")
async def get_dataset_preview(dataset_id: str, limit: int = Query(100, ge=1, le=1000)):
    """Get preview of dataset data"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        info = dataset_service.datasets[dataset_id]
        if info.get('status') == 'error':
            raise HTTPException(status_code=400, detail=f"Dataset has errors: {info.get('error_message', 'Unknown error')}")
        
        preview = await dataset_service.get_dataset_preview(dataset_id, limit)
        
        # Additional safety check for JSON serialization
        try:
            # Test JSON serialization to catch any remaining issues
            import json
            json.dumps(preview)
        except (TypeError, ValueError) as json_error:
            logger.error(f"JSON serialization error in preview for dataset {dataset_id}: {json_error}")
            # Return a sanitized version
            sanitized_preview = {
                'data': [],
                'columns': preview.get('columns', []),
                'total_rows': preview.get('total_rows', 0),
                'showing_rows': 0,
                'error': 'Data contains non-serializable values'
            }
            return sanitized_preview
        
        return preview
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting preview for dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting preview: {str(e)}")


@router.post("/{dataset_id}/chat", response_model=ChatResponse)
async def chat_with_dataset(dataset_id: str, message: ChatMessage):
    """Chat with dataset using natural language, or general AI conversation when no dataset is loaded"""
    try:
        if dataset_id in ["general", "none", "all", "default", "ai"] or (dataset_id not in dataset_service.datasets and len(dataset_service.datasets) == 0):
            from app.services.gemini_service import gemini_service
            response = await gemini_service.process_general_query(message.query, api_key=message.api_key)
            return ChatResponse(
                response=response,
                timestamp=datetime.now()
            )

        if dataset_id not in dataset_service.datasets:
            # Graceful fallback to general Gemini chat rather than hard failing
            from app.services.gemini_service import gemini_service
            response = await gemini_service.process_general_query(message.query, api_key=message.api_key)
            return ChatResponse(
                response=response,
                timestamp=datetime.now()
            )
        
        info = dataset_service.datasets[dataset_id]
        if info.get('status') == 'error':
            raise HTTPException(status_code=400, detail=f"Dataset has errors: {info.get('error_message', 'Unknown error')}")
        
        response = await dataset_service.process_chat_query(dataset_id, message.query, api_key=message.api_key)
        return ChatResponse(
            response=response,
            timestamp=datetime.now()
        )
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing chat query for dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@router.post("/{dataset_id}/chart")
async def create_chart(dataset_id: str, chart_request: ChartRequest):
    """Create a chart from dataset"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        info = dataset_service.datasets[dataset_id]
        if info.get('status') == 'error':
            raise HTTPException(status_code=400, detail=f"Dataset has errors: {info.get('error_message', 'Unknown error')}")
        
        chart = await dataset_service.create_chart(
            dataset_id=dataset_id,
            chart_type=chart_request.chart_type,
            x_column=chart_request.x_column,
            y_column=chart_request.y_column,
            group_by=chart_request.group_by,
            title=chart_request.title,
            color_scheme=chart_request.color_scheme,
            color_sequence=chart_request.color_sequence,
            template=chart_request.template,
            show_legend=chart_request.show_legend
        )
        return chart
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating chart for dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating chart: {str(e)}")

@router.get("/{dataset_id}/charts", response_model=List[ChartInfo])
async def list_charts(dataset_id: str):
    """List saved charts for a dataset"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")

        charts = dataset_service.charts.get(dataset_id, [])
        return charts
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing charts for dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing charts: {str(e)}")


@router.delete("/{dataset_id}/charts/{chart_id}")
async def delete_chart(dataset_id: str, chart_id: str):
    """Delete a saved chart for a dataset"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")

        charts = dataset_service.charts.get(dataset_id, [])
        new_list = [c for c in charts if c.get('id') != chart_id]
        if len(new_list) == len(charts):
            raise HTTPException(status_code=404, detail="Chart not found")
        dataset_service.charts[dataset_id] = new_list
        dataset_service._save_charts()
        return {"message": "Chart deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chart {chart_id} for dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting chart: {str(e)}")


@router.post("/{dataset_id}/export")
async def export_dataset(dataset_id: str, export_request: ExportRequest):
    """Export dataset in specified format"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        info = dataset_service.datasets[dataset_id]
        if info.get('status') == 'error':
            raise HTTPException(status_code=400, detail=f"Dataset has errors: {info.get('error_message', 'Unknown error')}")
        
        file_path = await dataset_service.export_dataset(dataset_id, export_request.export_type)
        return {
            'message': f'Dataset exported successfully',
            'file_path': file_path,
            'export_type': export_request.export_type
        }
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error exporting dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error exporting dataset: {str(e)}")


@router.get("/{dataset_id}/recommendations")
async def get_visualization_recommendations(dataset_id: str):
    """Get AI-powered visualization recommendations"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        info = dataset_service.datasets[dataset_id]
        if info.get('status') == 'error':
            raise HTTPException(status_code=400, detail=f"Dataset has errors: {info.get('error_message', 'Unknown error')}")
        
        recommendations = await dataset_service.get_visualization_recommendations(dataset_id)
        return {"recommendations": recommendations}
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting recommendations for dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")


@router.get("/test/connection")
async def test_connection():
    """Test API connection"""
    try:
        summary = dataset_service.get_datasets_summary()
        return {
            "status": "connected",
            "message": "Clarivo API is working",
            "datasets_count": summary['total_datasets'],
            "total_rows": summary['total_rows'],
            "total_columns": summary['total_columns']
        }
    except Exception as e:
        logger.error(f"Error in connection test: {str(e)}")
        return {
            "status": "connected",
            "message": "Clarivo API is working",
            "datasets_count": 0,
            "error": "Could not retrieve dataset summary"
        }


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete a dataset"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Get dataset info before deletion
        dataset_info = dataset_service.datasets[dataset_id]
        
        # Remove from memory
        del dataset_service.datasets[dataset_id]
        
        # Remove from persistent storage
        try:
            # Remove CSV file
            csv_file = Path("data") / f"{dataset_id}.csv"
            if csv_file.exists():
                csv_file.unlink()
            
            # Update metadata file
            dataset_service._save_datasets()
            
            logger.info(f"Successfully deleted dataset {dataset_id}")
            
        except Exception as e:
            logger.warning(f"Error cleaning up files for dataset {dataset_id}: {e}")
            # Dataset is still deleted from memory even if file cleanup fails
        
        return {"message": "Dataset deleted successfully", "deleted_dataset": dataset_info['name']}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting dataset")


@router.post("/{dataset_id}/generate_chart")
async def generate_chart(dataset_id: str, request: GenerateChartRequest):
    """Generate a chart with enhanced configuration"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        info = dataset_service.datasets[dataset_id]
        if info.get('status') == 'error':
            raise HTTPException(status_code=400, detail=f"Dataset has errors: {info.get('error_message', 'Unknown error')}")
        
        # Create chart configuration
        chart_config = ChartConfig(
            id=f"chart-{len(dataset_service.charts.get(dataset_id, [])) + 1:03d}",
            title=request.title or f"{request.chart_type.value.title()} Chart",
            type=request.chart_type,
            status=ChartStatus.LOADING,
            config=request.config
        )
        
        # Generate chart data
        chart_data = await dataset_service.generate_chart_data(
            dataset_id=dataset_id,
            chart_type=request.chart_type.value,
            config=request.config
        )
        
        if chart_data:
            chart_config.status = ChartStatus.READY
            chart_config.data = chart_data
        else:
            chart_config.status = ChartStatus.NO_DATA
            chart_config.message = "No data available. Check your column selections."
        
        chart_config.updated_at = datetime.now()
        
        # Save chart to dataset
        if dataset_id not in dataset_service.charts:
            dataset_service.charts[dataset_id] = []
        dataset_service.charts[dataset_id].append(chart_config.dict())
        dataset_service._save_charts()
        
        return chart_config
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating chart for dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating chart: {str(e)}")


@router.post("/{dataset_id}/ai_generate")
async def ai_generate_charts(dataset_id: str, request: AIGenerateRequest):
    """Generate charts using AI based on natural language prompt"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Use AI service to generate chart suggestions
        suggestions = await dataset_service.generate_ai_suggestions(
            dataset_id=dataset_id,
            prompt=request.prompt,
            action=request.action
        )
        
        return {
            "suggestions": suggestions,
            "generated_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating AI suggestions for dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating AI suggestions: {str(e)}")


@router.post("/{dataset_id}/export_chart_png")
async def export_chart_png(dataset_id: str, request: ExportChartRequest):
    """Export chart as PNG image"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Find the chart
        charts = dataset_service.charts.get(dataset_id, [])
        chart = next((c for c in charts if c.get('id') == request.chart_id), None)
        
        if not chart:
            raise HTTPException(status_code=404, detail="Chart not found")
        
        # Generate PNG export
        png_data = await dataset_service.export_chart_as_png(
            dataset_id=dataset_id,
            chart_config=chart
        )
        
        return {
            "chart_id": request.chart_id,
            "format": "PNG",
            "data": png_data,
            "exported_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting chart {request.chart_id} as PNG: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error exporting chart: {str(e)}")


@router.post("/{dataset_id}/export_chart_svg")
async def export_chart_svg(dataset_id: str, request: ExportChartRequest):
    """Export chart as SVG image"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Find the chart
        charts = dataset_service.charts.get(dataset_id, [])
        chart = next((c for c in charts if c.get('id') == request.chart_id), None)
        
        if not chart:
            raise HTTPException(status_code=404, detail="Chart not found")
        
        # Generate SVG export
        svg_data = await dataset_service.export_chart_as_svg(
            dataset_id=dataset_id,
            chart_config=chart
        )
        
        return {
            "chart_id": request.chart_id,
            "format": "SVG",
            "data": svg_data,
            "exported_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting chart {request.chart_id} as SVG: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error exporting chart: {str(e)}")


@router.post("/{dataset_id}/export_chart_data")
async def export_chart_data(dataset_id: str, request: ExportChartRequest):
    """Export chart data as JSON"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Find the chart
        charts = dataset_service.charts.get(dataset_id, [])
        chart = next((c for c in charts if c.get('id') == request.chart_id), None)
        
        if not chart:
            raise HTTPException(status_code=404, detail="Chart not found")
        
        return {
            "chart_id": request.chart_id,
            "format": "JSON",
            "data": chart.get('data', {}),
            "config": chart.get('config', {}),
            "exported_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting chart {request.chart_id} data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error exporting chart data: {str(e)}")


@router.post("/{dataset_id}/export_chart_data_csv")
async def export_chart_data_csv(dataset_id: str, request: ExportChartRequest):
    """Export chart data as CSV"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Find the chart
        charts = dataset_service.charts.get(dataset_id, [])
        chart = next((c for c in charts if c.get('id') == request.chart_id), None)
        
        if not chart:
            raise HTTPException(status_code=404, detail="Chart not found")
        
        # Generate CSV export
        csv_data = await dataset_service.export_chart_as_csv(
            dataset_id=dataset_id,
            chart_config=chart
        )
        
        return {
            "chart_id": request.chart_id,
            "format": "CSV",
            "data": csv_data,
            "exported_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting chart {request.chart_id} as CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error exporting chart as CSV: {str(e)}")


@router.get("/{dataset_id}/get_sample_charts")
async def get_sample_charts(dataset_id: str):
    """Get sample chart suggestions based on dataset analysis"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        suggestions = await dataset_service.generate_sample_charts(dataset_id)
        
        return {
            "dataset_id": dataset_id,
            "suggestions": suggestions,
            "generated_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating sample charts for dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating sample charts: {str(e)}")


@router.get("/{dataset_id}/dashboard_config")
async def get_dashboard_config(dataset_id: str):
    """Get dashboard configuration for a dataset"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        config = await dataset_service.get_dashboard_config(dataset_id)
        return config
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dashboard config for dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting dashboard config: {str(e)}")


@router.post("/{dataset_id}/dashboard_config")
async def update_dashboard_config(dataset_id: str, config: DashboardConfig):
    """Update dashboard configuration for a dataset"""
    try:
        if dataset_id not in dataset_service.datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        updated_config = await dataset_service.update_dashboard_config(dataset_id, config)
        return updated_config
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating dashboard config for dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating dashboard config: {str(e)}")


@router.get("/visualization_types")
async def get_visualization_types():
    """Get available visualization types"""
    types = [
        VisualizationType(
            id="bar",
            name="Bar Chart",
            description="Compare categories or track changes over time.",
            icon="📊",
            minRequiredColumns=1,
            defaultConfig={}
        ),
        VisualizationType(
            id="line",
            name="Line Chart",
            description="Visualize trends and progressions over a continuous scale.",
            icon="📈",
            minRequiredColumns=1,
            defaultConfig={}
        ),
        VisualizationType(
            id="scatter",
            name="Scatter Plot",
            description="Explore relationships and correlations between two variables.",
            icon="🔍",
            minRequiredColumns=2,
            defaultConfig={}
        ),
        VisualizationType(
            id="pie",
            name="Pie / Donut Chart",
            description="Show proportions and percentages of a whole.",
            icon="🥧",
            minRequiredColumns=1,
            defaultConfig={}
        ),
        VisualizationType(
            id="histogram",
            name="Histogram",
            description="Understand the distribution of a numerical variable.",
            icon="⊞",
            minRequiredColumns=1,
            defaultConfig={}
        ),
        VisualizationType(
            id="statistic",
            name="Summary Statistics",
            description="Display key metrics (mean, median, min, max, etc.) at a glance.",
            icon="123",
            minRequiredColumns=1,
            defaultConfig={}
        ),
        VisualizationType(
            id="heatmap",
            name="Heatmap",
            description="Visualize the magnitude of a phenomenon as color in two dimensions.",
            icon="🔥",
            minRequiredColumns=2,
            defaultConfig={}
        ),
        VisualizationType(
            id="boxplot",
            name="Box Plot",
            description="Display the distribution of data based on a five-number summary.",
            icon="📦",
            minRequiredColumns=1,
            defaultConfig={}
        )
    ]
    
    return {"types": types}


@router.get("/{dataset_id}/executive-report")
async def get_executive_report(dataset_id: str):
    """Generate a Fortune 500 Executive Decision Briefing for leadership"""
    if dataset_id not in dataset_service.datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    df = dataset_service.get_dataset_dataframe(dataset_id)
    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="Dataset has no data")
    
    name = dataset_service.datasets[dataset_id].get("name", "Enterprise Dataset")
    from app.services.gemini_service import gemini_service
    report = await gemini_service.generate_executive_report(df, name)
    
    try:
        from app.core.database import log_audit_event
        log_audit_event(
            event_type="AI_ANALYSIS",
            action=f"Generated C-Suite Executive Briefing for '{name}'",
            resource_id=dataset_id
        )
    except Exception:
        pass
        
    return report


@router.get("/{dataset_id}/compliance")
async def get_dataset_compliance(dataset_id: str):
    """Perform enterprise PII, governance, and data hygiene compliance audit"""
    if dataset_id not in dataset_service.datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    df = dataset_service.get_dataset_dataframe(dataset_id)
    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="Dataset has no data")
    
    from app.services.gemini_service import gemini_service
    result = gemini_service.scan_dataset_governance_and_pii(df)
    result["dataset_id"] = dataset_id
    result["dataset_name"] = dataset_service.datasets[dataset_id].get("name", "Dataset")

    try:
        from app.core.database import log_audit_event
        log_audit_event(
            event_type="COMPLIANCE",
            action=f"Executed Governance & PII audit on '{result['dataset_name']}' (Score: {result['hygiene_score']})",
            resource_id=dataset_id,
            details={"hygiene_score": result["hygiene_score"], "pii_columns": result["total_pii_columns"]}
        )
    except Exception:
        pass

    return result


@router.post("/seed-enterprise-demo")
async def seed_enterprise_demo_datasets():
    """Seed Fortune 500-grade enterprise benchmark datasets for high-level demonstrations and hackathon competitions"""
    import numpy as np

    created = []
    
    # 1. Global Enterprise B2B Sales & Margins
    b2b_name = "Global_Enterprise_B2B_Sales_2025.csv"
    existing_b2b = any(d.get("name") == b2b_name for d in dataset_service.datasets.values())
    if not existing_b2b:
        np.random.seed(42)
        n = 500
        regions = ["North America", "EMEA", "Asia Pacific", "Latin America"]
        tiers = ["Enterprise", "Mid-Market", "Strategic Accounts", "Government"]
        products = ["Cloud Infrastructure", "AI Copilot Suite", "Cybersecurity Mesh", "Data Mesh BI", "IoT Platform"]
        statuses = ["Closed-Won", "Renewal Pending", "Active Contract", "Expansion"]

        df_sales = pd.DataFrame({
            "Transaction_ID": [f"TXN-{10000+i}" for i in range(n)],
            "Region": np.random.choice(regions, n, p=[0.4, 0.3, 0.2, 0.1]),
            "Client_Tier": np.random.choice(tiers, n, p=[0.35, 0.35, 0.2, 0.1]),
            "Product_Line": np.random.choice(products, n),
            "Annual_Contract_Value": np.round(np.random.uniform(25000, 480000, n), 2),
            "Implementation_Cost": np.round(np.random.uniform(5000, 85000, n), 2),
            "Discount_Rate": np.round(np.random.uniform(0.02, 0.28, n), 3),
            "Net_Margin_Pct": np.round(np.random.uniform(42.0, 88.5, n), 1),
            "Customer_Satisfaction_CSAT": np.round(np.random.uniform(3.2, 5.0, n), 1),
            "Churn_Risk_Score": np.round(np.random.uniform(0.05, 0.75, n), 2),
            "Account_Status": np.random.choice(statuses, n, p=[0.45, 0.2, 0.25, 0.1])
        })
        ds_id = str(uuid.uuid4())
        analysis = dataset_service._analyze_dataframe(df_sales)
        dataset_service.datasets[ds_id] = {
            'id': ds_id,
            'name': b2b_name,
            'original_name': b2b_name,
            'file_type': 'csv',
            'dataframe': df_sales,
            'uploaded_at': datetime.utcnow(),
            'status': 'ready',
            'rows': len(df_sales),
            'columns': len(df_sales.columns),
            'column_info': analysis['column_info'],
            'summary': analysis['summary'],
            'data_quality': analysis['data_quality']
        }
        dataset_service._save_dataframe(ds_id, df_sales)
        created.append(b2b_name)

    # 2. FinTech Portfolio & Credit Risk Analysis
    fin_name = "FinTech_Credit_Risk_&_Portfolio.csv"
    existing_fin = any(d.get("name") == fin_name for d in dataset_service.datasets.values())
    if not existing_fin:
        np.random.seed(101)
        n = 450
        grades = ["AAA (Prime)", "AA", "A", "BBB (Standard)", "BB (Subprime)"]
        purposes = ["Working Capital", "Equipment Expansion", "Commercial Real Estate", "Tech Modernization"]
        
        df_fin = pd.DataFrame({
            "Loan_ID": [f"LN-88{i:04d}" for i in range(n)],
            "Borrower_Credit_Score": np.random.randint(580, 850, n),
            "Annual_Revenue": np.round(np.random.uniform(120000, 3500000, n), 2),
            "Loan_Amount": np.round(np.random.uniform(50000, 850000, n), 2),
            "Debt_To_Income_Ratio": np.round(np.random.uniform(0.12, 0.52, n), 3),
            "Interest_Rate_Pct": np.round(np.random.uniform(4.5, 14.8, n), 2),
            "Risk_Grade": np.random.choice(grades, n, p=[0.2, 0.25, 0.3, 0.15, 0.1]),
            "Loan_Purpose": np.random.choice(purposes, n),
            "Default_Probability": np.round(np.random.uniform(0.01, 0.32, n), 3),
            "Collateral_Coverage_Ratio": np.round(np.random.uniform(1.05, 2.45, n), 2)
        })
        ds_id = str(uuid.uuid4())
        analysis = dataset_service._analyze_dataframe(df_fin)
        dataset_service.datasets[ds_id] = {
            'id': ds_id,
            'name': fin_name,
            'original_name': fin_name,
            'file_type': 'csv',
            'dataframe': df_fin,
            'uploaded_at': datetime.utcnow(),
            'status': 'ready',
            'rows': len(df_fin),
            'columns': len(df_fin.columns),
            'column_info': analysis['column_info'],
            'summary': analysis['summary'],
            'data_quality': analysis['data_quality']
        }
        dataset_service._save_dataframe(ds_id, df_fin)
        created.append(fin_name)

    dataset_service._save_datasets()
    return {
        "success": True,
        "message": f"Enterprise benchmark datasets seeded successfully ({len(created)} created)",
        "created_datasets": created,
        "total_datasets": len(dataset_service.datasets)
    }
