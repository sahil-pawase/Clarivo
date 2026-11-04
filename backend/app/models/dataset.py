"""
Dataset models for Clarivo
"""
from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from enum import Enum


class ChartType(str, Enum):
    BAR = "bar"
    LINE = "line"
    SCATTER = "scatter"
    PIE = "pie"
    HISTOGRAM = "histogram"
    STATISTIC = "statistic"
    HEATMAP = "heatmap"
    BOXPLOT = "boxplot"
    DONUT = "donut"


class ChartStatus(str, Enum):
    LOADING = "loading"
    READY = "ready"
    ERROR = "error"
    NO_DATA = "no_data"


class DashboardTheme(BaseModel):
    name: str = "Clarivo Dark"
    colors: Dict[str, str] = Field(default_factory=lambda: {
        "primary": "#7c3aed",
        "primaryHover": "#6d28d9",
        "background": "#1e1e2e",
        "surface": "#2a2a3a",
        "surfaceElevated": "#363647",
        "textPrimary": "#f8fafc",
        "textSecondary": "#cbd5e1",
        "border": "#4a4a5a",
        "error": "#ef4444",
        "success": "#10b981"
    })
    fontFamily: str = "Inter, -apple-system, sans-serif"
    borderRadius: str = "8px"


class ChartConfig(BaseModel):
    id: str
    title: str
    type: ChartType
    status: ChartStatus = ChartStatus.LOADING
    message: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    data: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class DashboardState(BaseModel):
    title: str = "My Dashboard"
    lastUpdated: datetime = Field(default_factory=datetime.now)
    charts: List[ChartConfig] = Field(default_factory=list)
    layout: Optional[Dict[str, Any]] = None


class VisualizationType(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    minRequiredColumns: int
    defaultConfig: Dict[str, Any] = Field(default_factory=dict)


class AITool(BaseModel):
    id: str
    name: str
    description: str
    enabled: bool = True


class ContextPanelSection(BaseModel):
    title: str
    content: Union[str, Dict[str, Any]]
    component: Optional[str] = None


class DashboardConfig(BaseModel):
    appUI: Dict[str, Any] = Field(default_factory=lambda: {
        "theme": DashboardTheme().dict(),
        "currentPage": "visualization_dashboard",
        "pageTitle": "Data Visualization Dashboard",
        "subtitle": "Create, customize, and export data visualizations"
    })
    currentDataset: Optional[Dict[str, Any]] = None
    dashboard: DashboardState = Field(default_factory=DashboardState)
    visualizationOptions: Dict[str, Any] = Field(default_factory=lambda: {
        "availableTypes": [],
        "suggestions": []
    })
    aiTools: Dict[str, Any] = Field(default_factory=lambda: {
        "enabled": True,
        "promptPlaceholder": "Ask Clarity AI to create a chart...",
        "actions": []
    })
    actions: Dict[str, Any] = Field(default_factory=dict)
    contextPanel: Dict[str, Any] = Field(default_factory=lambda: {
        "visible": True,
        "sections": []
    })


class DatasetCreate(BaseModel):
    name: str
    file_path: str
    size: int


class DatasetResponse(BaseModel):
    id: str
    name: str
    size: int
    uploaded_at: datetime
    status: str
    rows: Optional[int] = None
    columns: Optional[int] = None
    column_info: Optional[List[Dict[str, Any]]] = None


class DatasetAnalysis(BaseModel):
    dataset_id: str
    summary: Dict[str, Any]
    column_stats: Dict[str, Any]
    data_quality: Dict[str, Any]


class ChatMessage(BaseModel):
    query: str
    dataset_id: str
    api_key: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    timestamp: datetime
    charts: Optional[List[Dict[str, Any]]] = None


class ChartRequest(BaseModel):
    dataset_id: str
    chart_type: str
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    group_by: Optional[str] = None
    title: Optional[str] = None
    # Style options
    color_scheme: Optional[str] = None
    color_sequence: Optional[List[str]] = None
    template: Optional[str] = None  # e.g., 'plotly', 'plotly_dark', 'ggplot2'
    show_legend: Optional[bool] = True


class ChartInfo(BaseModel):
    id: str
    chart_type: str
    title: str
    chart_data: str
    insights: Optional[str] = None
    created_at: datetime
    style: Optional[Dict[str, Any]] = None


class ExportRequest(BaseModel):
    dataset_id: str
    export_type: str  # 'csv', 'excel', 'pdf'
    include_charts: bool = False


class GenerateChartRequest(BaseModel):
    dataset_id: str
    chart_type: ChartType
    config: Dict[str, Any]
    title: Optional[str] = None


class ExportChartRequest(BaseModel):
    chart_id: str
    format: str  # 'PNG', 'SVG', 'JSON', 'CSV'
    dataset_id: str


class AIGenerateRequest(BaseModel):
    dataset_id: str
    prompt: str
    action: str  # 'auto-generate', 'customize'


class ChartSuggestion(BaseModel):
    title: str
    type: ChartType
    configSuggestion: Dict[str, Any]
    confidence: float = 0.8