"""
Dataset processing and analysis service
"""
import pandas as pd
# pyrefly: ignore [missing-import]
import numpy as np
import json
import uuid
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path
# pyrefly: ignore [missing-import]
import plotly.express as px
# pyrefly: ignore [missing-import]
import plotly.graph_objects as go
# pyrefly: ignore [missing-import]
from plotly.utils import PlotlyJSONEncoder
from app.services.gemini_service import gemini_service


def clean_value_for_json(value):
    """Clean a value to be JSON serializable"""
    if pd.isna(value):
        return None
    elif isinstance(value, (np.integer, np.floating)):
        if np.isnan(value) or np.isinf(value):
            return None
        else:
            return float(value) if isinstance(value, np.floating) else int(value)
    elif isinstance(value, (pd.Timestamp, pd.DatetimeTZDtype)):
        return value.isoformat() if pd.notna(value) else None
    else:
        return value


def safe_numeric_stat(series, stat_func):
    """Safely calculate numeric statistics, handling NaN values"""
    if series.empty:
        return None
    
    try:
        result = stat_func(series)
        if pd.isna(result) or np.isinf(result):
            return None
        return float(result)
    except Exception:
        return None


class PandasJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle pandas and numpy types"""
    def default(self, obj):
        # Containers
        if isinstance(obj, dict):
            return {k: self.default(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [self.default(v) for v in obj]
        if isinstance(obj, np.ndarray):
            return obj.tolist()

        # Scalars
        try:
            if pd.isna(obj):
                return None
        except Exception:
            pass
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            if np.isnan(obj) or np.isinf(obj):
                return None
            return float(obj)
        if isinstance(obj, (pd.Timestamp,)):
            return obj.isoformat()
        from datetime import datetime as _dt
        if isinstance(obj, _dt):
            return obj.isoformat()
        if isinstance(obj, pd.DataFrame):
            return obj.to_dict('records')
        if isinstance(obj, pd.Series):
            return obj.to_dict()
        return super().default(obj)


class DatasetService:
    def __init__(self):
        self.datasets = {}  # In-memory cache
        # Determine canonical data & uploads directories relative to backend root
        base_dir = Path(__file__).resolve().parent.parent.parent
        self.data_dir = base_dir / "data"
        self.upload_dir = base_dir / "uploads"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.datasets_file = self.data_dir / "datasets.json"
        self.metadata_file = self.data_dir / "metadata.json"
        self.charts_file = self.data_dir / "charts.json"
        
        # Load existing datasets from persistent storage
        self._load_datasets()
        self._load_charts()
    
    def _load_datasets(self):
        """Load datasets from persistent storage and PostgreSQL"""
        # 1. Load from local datasets.json if exists
        try:
            if self.datasets_file.exists():
                with open(self.datasets_file, 'r', encoding='utf-8') as f:
                    datasets_data = json.load(f)
                    if isinstance(datasets_data, dict):
                        self.datasets.update(datasets_data)
        except Exception as e:
            print(f"Local datasets load note: {e}")

        # 2. Load from PostgreSQL
        try:
            from app.core.database import init_db, load_datasets_from_db
            init_db()
            db_datasets = load_datasets_from_db()
            if db_datasets:
                for ds_id, ds_info in db_datasets.items():
                    if ds_id not in self.datasets:
                        self.datasets[ds_id] = ds_info
                    else:
                        # Update with DB info if DB has valid rows
                        if ds_info.get('rows', 0) > 0:
                            self.datasets[ds_id].update(ds_info)
                print(f"Loaded {len(db_datasets)} datasets from PostgreSQL")
        except Exception as e:
            print(f"PostgreSQL load note: {e}")

        # 3. Reconcile/repair any dataset missing rows or column info from local CSV
        for dataset_id, info in list(self.datasets.items()):
            csv_file = self.data_dir / f"{dataset_id}.csv"
            if csv_file.exists() and (not info.get('rows') or not info.get('column_info') or not info.get('columns')):
                try:
                    df = pd.read_csv(csv_file)
                    info['dataframe'] = df
                    info['rows'] = len(df)
                    info['row_count'] = len(df)
                    info['columns'] = len(df.columns)
                    info['column_count'] = len(df.columns)
                    info['size'] = len(df) * len(df.columns)
                    analysis = self._analyze_dataframe(df)
                    info['column_info'] = analysis['column_info']
                    info['summary'] = analysis['summary']
                    info['data_quality'] = analysis['data_quality']
                except Exception as ex:
                    print(f"Error repairing dataset {dataset_id} metadata: {ex}")

        print(f"Total {len(self.datasets)} datasets ready in Clarivo")
    
    def _save_datasets(self):
        """Save datasets metadata to local JSON cache file"""
        try:
            metadata = {}
            for dataset_id, info in self.datasets.items():
                metadata[dataset_id] = {k: v for k, v in info.items() if k != 'dataframe'}
            
            with open(self.datasets_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, cls=PandasJSONEncoder)
                
            print(f"Saved {len(self.datasets)} datasets metadata to cache")
        except Exception as e:
            print(f"Error saving datasets: {e}")

    def _load_charts(self):
        """Load saved charts from persistent storage"""
        try:
            self.charts: Dict[str, List[Dict[str, Any]]] = {}
            if self.charts_file.exists():
                with open(self.charts_file, 'r', encoding='utf-8') as f:
                    self.charts = json.load(f)
        except Exception as e:
            print(f"Error loading charts: {e}")
            self.charts = {}

    def _save_charts(self):
        """Persist charts to disk"""
        try:
            with open(self.charts_file, 'w', encoding='utf-8') as f:
                json.dump(self.charts, f, indent=2, cls=PandasJSONEncoder)
        except Exception as e:
            print(f"Error saving charts: {e}")
    
    def _save_dataframe(self, dataset_id: str, df: pd.DataFrame):
        """Save dataframe to CSV file and PostgreSQL"""
        try:
            csv_file = self.data_dir / f"{dataset_id}.csv"
            df.to_csv(csv_file, index=False)
            print(f"Saved dataframe to CSV for dataset {dataset_id}")
            
            info = self.datasets.get(dataset_id, {})
            try:
                from app.core.database import save_dataset_to_db
                save_dataset_to_db(dataset_id, info, df)
                print(f"Saved dataframe to PostgreSQL for dataset {dataset_id}")
            except Exception as dbe:
                print(f"PostgreSQL dataframe save note: {dbe}")
        except Exception as e:
            print(f"Error saving dataframe for dataset {dataset_id}: {e}")

    def get_dataset_dataframe(self, dataset_id: str) -> Optional[pd.DataFrame]:
        """Get dataframe for dataset, loading from PostgreSQL or CSV if not cached in memory"""
        if dataset_id not in self.datasets:
            return None
        info = self.datasets[dataset_id]
        if info.get('dataframe') is not None:
            return info['dataframe']
        
        # 1. Try loading from PostgreSQL
        try:
            from app.core.database import load_dataset_dataframe_from_db
            df = load_dataset_dataframe_from_db(dataset_id)
            if df is not None:
                info['dataframe'] = df
                return df
        except Exception:
            pass
        
        # 2. Try loading from local CSV
        csv_file = self.data_dir / f"{dataset_id}.csv"
        if csv_file.exists():
            try:
                df = pd.read_csv(csv_file)
                info['dataframe'] = df
                return df
            except Exception:
                pass
        
        return None
    
    def _read_file_to_df(self, file_path: str, filename: str) -> pd.DataFrame:
        """Robust multi-encoding, multi-delimiter file parser for CSV, Excel, and JSON"""
        name_lower = (filename or file_path).lower()

        if any(name_lower.endswith(ext) for ext in ['.xlsx', '.xls']):
            return pd.read_excel(file_path)

        if name_lower.endswith('.json'):
            try:
                return pd.read_json(file_path)
            except Exception:
                return pd.read_json(file_path, lines=True)

        # CSV / TSV / TXT parsing with multi-encoding and delimiter detection
        encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252', 'iso-8859-1']
        delimiters = [',', ';', '\t', '|']

        for enc in encodings:
            for sep in delimiters:
                try:
                    df = pd.read_csv(file_path, encoding=enc, sep=sep, on_bad_lines='skip')
                    if len(df.columns) > 1 and len(df) > 0:
                        return df
                except Exception:
                    continue

        # Fallback using python engine with auto-detection
        for enc in encodings:
            try:
                df = pd.read_csv(file_path, encoding=enc, sep=None, engine='python', on_bad_lines='skip')
                if not df.empty:
                    return df
            except Exception:
                continue

        # Final raw fallback
        return pd.read_csv(file_path, on_bad_lines='skip')

    async def process_uploaded_file(self, file_path: str, original_name: str) -> Dict[str, Any]:
        """Process uploaded file and extract metadata with ultra-fast local profiling"""
        try:
            df = self._read_file_to_df(file_path, original_name)
            if df is None or df.empty:
                raise ValueError("The uploaded file contains no data or could not be parsed.")

            # Sanitize column names: strip whitespace, replace empty names
            clean_cols = []
            for i, c in enumerate(df.columns):
                c_str = str(c).strip()
                clean_cols.append(c_str if c_str else f"column_{i+1}")
            df.columns = clean_cols

            dataset_id = str(uuid.uuid4())
            analysis = self._analyze_dataframe(df)

            # Fast local AI summary so upload responds in < 300ms without blocking on external Gemini
            analysis['ai_insights'] = {
                'analysis': f"Dataset '{original_name}' loaded successfully with {len(df):,} records across {len(df.columns)} attributes.",
                'recommendations': []
            }

            dataset_info = {
                'id': dataset_id,
                'name': original_name,
                'file_path': file_path,
                'dataframe': df,
                'uploaded_at': datetime.now(),
                'status': 'ready',
                'rows': len(df),
                'row_count': len(df),
                'columns': len(df.columns),
                'column_count': len(df.columns),
                'size': len(df) * len(df.columns),
                'column_info': analysis['column_info'],
                'summary': analysis['summary'],
                'data_quality': analysis['data_quality'],
                'ai_insights': analysis['ai_insights']
            }
            
            # Save to memory and persistent storage
            self.datasets[dataset_id] = dataset_info
            self._save_dataframe(dataset_id, df)
            self._save_datasets()
            
            return {
                'id': dataset_id,
                'name': original_name,
                'size': len(df) * len(df.columns),
                'rows': len(df),
                'columns': len(df.columns),
                'status': 'ready',
                'uploaded_at': datetime.now(),
                'column_info': analysis['column_info']
            }
            
        except Exception as e:
            raise Exception(f"Error processing file: {str(e)}")
    
    def _analyze_dataframe(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze dataframe and extract insights"""
        column_info = []
        
        for col in df.columns:
            col_data = df[col]
            col_info = {
                'name': col,
                'dtype': str(col_data.dtype),
                'non_null_count': int(col_data.count()),
                'null_count': int(col_data.isnull().sum()),
                'unique_count': int(col_data.nunique()),
                'is_numeric': pd.api.types.is_numeric_dtype(col_data),
                'is_categorical': pd.api.types.is_categorical_dtype(col_data) or col_data.dtype == 'object'
            }
            
            if col_info['is_numeric']:
                # Handle NaN values in statistical calculations using safe functions
                col_info.update({
                    'mean': safe_numeric_stat(col_data, lambda x: x.mean()),
                    'median': safe_numeric_stat(col_data, lambda x: x.median()),
                    'std': safe_numeric_stat(col_data, lambda x: x.std()),
                    'min': safe_numeric_stat(col_data, lambda x: x.min()),
                    'max': safe_numeric_stat(col_data, lambda x: x.max())
                })
            
            column_info.append(col_info)
        
        # Data quality assessment
        total_cells = len(df) * len(df.columns)
        missing_cells = df.isnull().sum().sum()
        
        # Safe calculation of completeness percentage
        try:
            completeness = float((total_cells - missing_cells) / total_cells * 100)
            if pd.isna(completeness) or np.isinf(completeness):
                completeness = 0.0
        except (ZeroDivisionError, ValueError):
            completeness = 0.0
        
        data_quality = {
            'completeness': completeness,
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'missing_values': int(missing_cells),
            'duplicate_rows': int(df.duplicated().sum())
        }
        
        # Basic summary
        try:
            memory_usage = df.memory_usage(deep=True).sum()
            if pd.isna(memory_usage) or np.isinf(memory_usage):
                memory_usage = 0
        except Exception:
            memory_usage = 0
        
        summary = {
            'shape': df.shape,
            'memory_usage': memory_usage,
            'numeric_columns': len([col for col in column_info if col['is_numeric']]),
            'categorical_columns': len([col for col in column_info if col['is_categorical']])
        }
        
        return {
            'column_info': column_info,
            'data_quality': data_quality,
            'summary': summary
        }
    
    async def get_dataset_preview(self, dataset_id: str, limit: int = 100) -> Dict[str, Any]:
        """Get preview of dataset data"""
        if dataset_id not in self.datasets:
            raise ValueError("Dataset not found")
        
        df = self.get_dataset_dataframe(dataset_id)
        if df is None:
            raise ValueError(f"Dataframe could not be loaded for dataset {dataset_id}")
        
        # Get sample data and handle NaN values for JSON serialization
        preview_df = df.head(limit)
        preview_data = []
        
        for _, row in preview_df.iterrows():
            row_dict = {}
            for col in preview_df.columns:
                row_dict[col] = clean_value_for_json(row[col])
            preview_data.append(row_dict)
        
        return {
            'data': preview_data,
            'columns': list(df.columns),
            'total_rows': len(df),
            'showing_rows': min(limit, len(df))
        }
    
    async def create_chart(self, dataset_id: str, chart_type: str, x_column: str = None, 
                          y_column: str = None, group_by: str = None,
                          title: Optional[str] = None,
                          color_scheme: Optional[str] = None,
                          color_sequence: Optional[List[str]] = None,
                          template: Optional[str] = None,
                          show_legend: Optional[bool] = True) -> Dict[str, Any]:
        """Create chart from dataset with AI-powered insights"""
        if dataset_id not in self.datasets:
            raise ValueError("Dataset not found")
        
        df = self.get_dataset_dataframe(dataset_id)
        if df is None:
            raise ValueError(f"Dataframe could not be loaded for dataset {dataset_id}")
        
        try:
            if chart_type == 'histogram' and x_column:
                fig = px.histogram(df, x=x_column, title=title or f'Distribution of {x_column}')
            elif chart_type == 'scatter' and x_column and y_column:
                fig = px.scatter(df, x=x_column, y=y_column, 
                               color=group_by if group_by else None,
                               title=title or f'{y_column} vs {x_column}')
            elif chart_type == 'bar' and x_column and y_column:
                fig = px.bar(df, x=x_column, y=y_column,
                           color=group_by if group_by else None,
                           title=title or f'{y_column} by {x_column}')
            elif chart_type == 'line' and x_column and y_column:
                fig = px.line(df, x=x_column, y=y_column,
                            color=group_by if group_by else None,
                            title=title or f'{y_column} over {x_column}')
            elif chart_type == 'correlation':
                # Create correlation heatmap for numeric columns
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                if len(numeric_cols) > 1:
                    corr_matrix = df[numeric_cols].corr()
                    fig = px.imshow(corr_matrix, 
                                  title=title or 'Correlation Matrix',
                                  color_continuous_scale='RdBu_r')
                else:
                    raise ValueError("Not enough numeric columns for correlation")
            else:
                raise ValueError(f"Unsupported chart type or missing parameters")

            # Apply style options
            if template:
                fig.update_layout(template=template)
            if color_sequence:
                fig.update_traces(marker=dict(colorscale=color_sequence))
            if color_scheme:
                # Basic mapping for Plotly built-in color sequences
                # Users can pass a sequence via color_sequence for finer control
                try:
                    # pyrefly: ignore [missing-import]
                    import plotly.express as px_local
                    seq = getattr(px_local.colors.qualitative, color_scheme, None)
                    if seq:
                        fig.update_traces(marker=dict(color=seq[0]))
                except Exception:
                    pass
            if show_legend is not None:
                fig.update_layout(showlegend=show_legend)
            
            # Convert to JSON
            chart_json = json.dumps(fig, cls=PlotlyJSONEncoder)
            
            # Get AI-powered insights about this chart
            try:
                ai_insights = await gemini_service.generate_chart_insights(
                    df, chart_type, x_column, y_column, group_by
                )
            except Exception as e:
                ai_insights = f"Chart created successfully. Insights: {str(e)}"
            
            chart_payload = {
                'chart_data': chart_json,
                'chart_type': chart_type,
                'title': fig.layout.title.text if fig.layout.title else 'Chart',
                'insights': ai_insights
            }

            # Persist chart in memory and disk
            chart_record = {
                'id': str(uuid.uuid4()),
                'chart_type': chart_type,
                'title': chart_payload['title'],
                'chart_data': chart_json,
                'insights': ai_insights,
                'created_at': datetime.now().isoformat(),
                'style': {
                    'template': template,
                    'color_scheme': color_scheme,
                    'color_sequence': color_sequence,
                    'show_legend': show_legend,
                    'group_by': group_by,
                    'x_column': x_column,
                    'y_column': y_column
                }
            }
            self.charts.setdefault(dataset_id, []).append(chart_record)
            self._save_charts()

            return chart_payload
            
        except Exception as e:
            raise Exception(f"Error creating chart: {str(e)}")
    
    async def generate_chart_data(self, dataset_id: str, chart_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate chart data for enhanced dashboard"""
        if dataset_id not in self.datasets:
            raise ValueError("Dataset not found")
        
        df = self.get_dataset_dataframe(dataset_id)
        if df is None:
            return None
        
        try:
            x_column = config.get('xAxis')
            y_column = config.get('yAxis')
            
            print(f"🔍 Chart generation request:")
            print(f"   Dataset ID: {dataset_id}")
            print(f"   Chart type: {chart_type}")
            print(f"   X column: {x_column}")
            print(f"   Y column: {y_column}")
            print(f"   Available columns: {list(df.columns)}")
            print(f"   DataFrame shape: {df.shape}")
            
            # Validate columns exist (except for virtual columns)
            if x_column and x_column not in ['index', 'count'] and x_column not in df.columns:
                print(f"❌ X column '{x_column}' not found in dataset")
                return None
            
            if y_column and y_column not in ['index', 'count'] and y_column not in df.columns:
                print(f"❌ Y column '{y_column}' not found in dataset")
                return None
            
            # Set default columns if not provided
            if not x_column:
                x_column = df.columns[0] if len(df.columns) > 0 else 'index'
                print(f"🔧 Using default X column: {x_column}")
            
            if not y_column:
                y_column = 'count'
                print(f"🔧 Using default Y column: {y_column}")
            
            if chart_type == 'bar':
                return self._generate_bar_data(df, x_column, y_column)
            elif chart_type == 'line':
                return self._generate_line_data(df, x_column, y_column)
            elif chart_type == 'pie' or chart_type == 'donut':
                return self._generate_pie_data(df, x_column, y_column)
            elif chart_type == 'scatter':
                return self._generate_scatter_data(df, x_column, y_column)
            elif chart_type == 'histogram':
                return self._generate_histogram_data(df, x_column)
            elif chart_type == 'boxplot':
                return self._generate_boxplot_data(df, x_column, y_column)
            elif chart_type == 'heatmap':
                return self._generate_heatmap_data(df)
            else:
                # Default to bar chart
                return self._generate_bar_data(df, x_column, y_column)
                
        except Exception as e:
            print(f"❌ Error generating chart data: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _generate_bar_data(self, df: pd.DataFrame, x_column: str, y_column: str) -> Dict[str, Any]:
        """Generate data for bar chart"""
        try:
            print(f"📊 Generating bar chart data: x={x_column}, y={y_column}")
            print(f"   DataFrame columns: {list(df.columns)}")
            print(f"   DataFrame shape: {df.shape}")
            print(f"   First few rows of relevant columns:")
            if x_column != 'index' and x_column in df.columns:
                print(f"     {x_column}: {df[x_column].head(3).tolist()}")
            if y_column != 'count' and y_column in df.columns:
                print(f"     {y_column}: {df[y_column].head(3).tolist()}")
            
            if y_column == 'count':
                # Count frequency by category
                if x_column == 'index':
                    # Count rows
                    data = [{'category': 'Total Rows', 'value': len(df)}]
                else:
                    counts = df[x_column].value_counts().head(15)
                    data = [{'category': str(idx), 'value': int(val)} for idx, val in counts.items()]
            else:
                # Aggregate numeric values by category
                if x_column == 'index':
                    # Use row index as x-axis and y_column values
                    sample_data = df[y_column].dropna().head(20)
                    data = [{'category': f'Row {i+1}', 'value': float(val)} for i, val in enumerate(sample_data)]
                else:
                    # Check if both columns exist and handle appropriately
                    if x_column in df.columns and y_column in df.columns:
                        # Group by x_column and aggregate y_column
                        grouped = df.groupby(x_column)[y_column].sum().head(15)
                        data = [{'category': str(idx), 'value': float(val)} for idx, val in grouped.items()]
                    else:
                        print(f"⚠️ Warning: Column not found - x_column='{x_column}' in columns: {x_column in df.columns}, y_column='{y_column}' in columns: {y_column in df.columns}")
                        data = []
            
            print(f"✅ Generated {len(data)} data points for bar chart")
            if len(data) > 0:
                print(f"   Sample data: {data[:3]}")
            return {'data': data, 'type': 'bar'}
        except Exception as e:
            print(f"❌ Error in _generate_bar_data: {e}")
            # Return empty but valid data
            return {'data': [], 'type': 'bar'}
    
    def _generate_line_data(self, df: pd.DataFrame, x_column: str, y_column: str) -> Dict[str, Any]:
        """Generate data for line chart"""
        try:
            print(f"📈 Generating line chart data: x={x_column}, y={y_column}")
            
            if x_column == 'index':
                # Use row index as x-axis
                if y_column == 'count':
                    # Show cumulative count
                    data = [{'category': f'Row {i+1}', 'value': i+1} for i in range(min(20, len(df)))]
                else:
                    sample_data = df[y_column].dropna().head(20)
                    data = [{'category': f'Row {i+1}', 'value': float(val)} for i, val in enumerate(sample_data)]
            else:
                # Use specified columns
                if y_column == 'count':
                    # Count by x_column categories
                    counts = df[x_column].value_counts().head(15)
                    data = [{'category': str(idx), 'value': int(val)} for idx, val in counts.items()]
                else:
                    sorted_df = df[[x_column, y_column]].dropna().sort_values(x_column).head(20)
                    data = [{'category': str(x), 'value': float(y)} for x, y in zip(sorted_df[x_column], sorted_df[y_column])]
            
            print(f"✅ Generated {len(data)} data points for line chart")
            return {'data': data, 'type': 'line'}
        except Exception as e:
            print(f"❌ Error in _generate_line_data: {e}")
            return {'data': [], 'type': 'line'}
    
    def _generate_pie_data(self, df: pd.DataFrame, x_column: str, y_column: str) -> Dict[str, Any]:
        """Generate data for pie/donut chart"""
        try:
            print(f"🥧 Generating pie chart data: x={x_column}, y={y_column}")
            
            if y_column == 'count':
                # Count frequency by category
                if x_column == 'index':
                    # Create simple pie showing data presence
                    data = [{'category': 'Data Points', 'value': len(df)}]
                else:
                    counts = df[x_column].value_counts().head(8)
                    data = [{'category': str(idx), 'value': int(val)} for idx, val in counts.items()]
            else:
                # Sum numeric values by category
                if x_column == 'index':
                    # Use first few values
                    sample_data = df[y_column].dropna().head(8)
                    data = [{'category': f'Item {i+1}', 'value': float(val)} for i, val in enumerate(sample_data)]
                else:
                    grouped = df.groupby(x_column)[y_column].sum().head(8)
                    data = [{'category': str(idx), 'value': float(val)} for idx, val in grouped.items()]
            
            print(f"✅ Generated {len(data)} data points for pie chart")
            return {'data': data, 'type': 'pie'}
        except Exception as e:
            print(f"❌ Error in _generate_pie_data: {e}")
            return {'data': [], 'type': 'pie'}
    
    def _generate_scatter_data(self, df: pd.DataFrame, x_column: str, y_column: str) -> Dict[str, Any]:
        """Generate data for scatter plot"""
        sample_df = df[[x_column, y_column]].dropna().head(100)
        data = [{'category': float(x), 'value': float(y)} for x, y in zip(sample_df[x_column], sample_df[y_column])]
        
        return {'data': data, 'type': 'scatter'}
    
    def _generate_histogram_data(self, df: pd.DataFrame, x_column: str) -> Dict[str, Any]:
        """Generate data for histogram"""
        hist, bins = np.histogram(df[x_column].dropna(), bins=15)
        data = [{'category': f'{bins[i]:.2f}-{bins[i+1]:.2f}', 'value': int(hist[i])} for i in range(len(hist))]
        
        return {'data': data, 'type': 'histogram'}
    
    def _generate_boxplot_data(self, df: pd.DataFrame, x_column: str, y_column: str) -> Dict[str, Any]:
        """Generate data for box plot (simplified as bar chart)"""
        if y_column == 'count':
            return self._generate_bar_data(df, x_column, y_column)
        else:
            # Group by category and show mean values
            grouped = df.groupby(x_column)[y_column].mean().head(10)
            data = [{'category': str(idx), 'value': float(val)} for idx, val in grouped.items()]
            return {'data': data, 'type': 'bar'}
    
    def _generate_heatmap_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate data for heatmap (simplified as bar chart)"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns[:5]
        if len(numeric_cols) > 1:
            corr_matrix = df[numeric_cols].corr()
            data = []
            for i, col1 in enumerate(numeric_cols):
                for j, col2 in enumerate(numeric_cols):
                    if i != j:
                        data.append({
                            'category': f'{col1}-{col2}',
                            'value': float(corr_matrix.iloc[i, j])
                        })
            return {'data': data[:15], 'type': 'bar'}
        else:
            # Fallback to simple bar chart
            return self._generate_bar_data(df, numeric_cols[0] if len(numeric_cols) > 0 else df.columns[0], 'count')
    
    async def export_dataset(self, dataset_id: str, export_type: str) -> str:
        """Export dataset in specified format"""
        if dataset_id not in self.datasets:
            raise ValueError("Dataset not found")
        
        dataset_info = self.datasets[dataset_id]
        df = self.get_dataset_dataframe(dataset_id)
        if df is None:
            raise ValueError(f"Dataframe could not be loaded for dataset {dataset_id}")
        
        # Create exports directory
        exports_dir = Path("exports")
        exports_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"{dataset_info['name'].split('.')[0]}_{timestamp}"
        
        if export_type == 'csv':
            file_path = exports_dir / f"{base_name}.csv"
            df.to_csv(file_path, index=False)
        elif export_type == 'excel':
            file_path = exports_dir / f"{base_name}.xlsx"
            df.to_excel(file_path, index=False)
        else:
            raise ValueError(f"Unsupported export type: {export_type}")
        
        return str(file_path)
    
    async def process_chat_query(self, dataset_id: str, query: str, api_key: Optional[str] = None) -> str:
        """Process natural language query about dataset using Gemini AI"""
        if dataset_id not in self.datasets:
            raise ValueError("Dataset not found")
        
        dataset_info = self.datasets[dataset_id]
        df = self.get_dataset_dataframe(dataset_id)
        if df is None:
            raise ValueError(f"Dataframe could not be loaded for dataset {dataset_id}")
        
        try:
            # Use Gemini AI for intelligent query processing
            response = await gemini_service.process_natural_language_query(
                df, query, dataset_info['name'], api_key=api_key
            )
            return response
        except Exception as e:
            # Fallback to basic query processing
            return self._process_basic_query(df, query, dataset_info)
    
    def _process_basic_query(self, df: pd.DataFrame, query: str, dataset_info: dict) -> str:
        """Fallback basic query processing providing structured and insightful answers"""
        query_lower = query.lower()
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        if 'correlation' in query_lower or 'relationship' in query_lower:
            if len(numeric_cols) > 1:
                corr_matrix = df[numeric_cols].corr()
                strongest_corr = corr_matrix.abs().unstack().sort_values(ascending=False)
                strongest_corr = strongest_corr[strongest_corr < 1.0]
                if not strongest_corr.empty:
                    col1, col2 = strongest_corr.index[0]
                    corr_value = corr_matrix.loc[col1, col2]
                    direction = "positive" if corr_value > 0 else "negative"
                    return f"📊 **Correlation Analysis**:\n\nThe strongest linear relationship is between **{col1}** and **{col2}** with a {direction} correlation of **{corr_value:.3f}**.\n\n*Suggestion*: You can create a Scatter plot of `{col1}` vs `{col2}` in the **Visualize** tab to inspect this pattern visually."
            return "ℹ️ There are not enough numerical columns in this dataset to compute pairwise correlations."
        
        elif 'missing' in query_lower or 'null' in query_lower or 'clean' in query_lower:
            missing_info = []
            for col_info in dataset_info.get('column_info', []):
                if col_info.get('null_count', 0) > 0:
                    missing_info.append(f"• **{col_info['name']}**: {col_info['null_count']} missing values ({col_info['null_count']/len(df)*100:.1f}%)")
            
            if missing_info:
                return "🔍 **Missing Values Report**:\n\n" + "\n".join(missing_info[:8]) + "\n\n*Tip*: Go to the **Clean Data** tab to impute missing values using mean/median or drop invalid rows."
            return "✅ **Great news**: No missing or null values were detected across all columns in this dataset!"
        
        elif any(k in query_lower for k in ['what is this', 'about', 'explain', 'summary', 'overview', 'describe', 'tell me']):
            cols_summary = ", ".join([f"`{c}`" for c in df.columns[:8]]) + ("..." if len(df.columns) > 8 else "")
            num_summary = f"{len(numeric_cols)} numeric ({', '.join(numeric_cols[:4])})" if numeric_cols else "No numeric columns"
            cat_summary = f"{len(categorical_cols)} categorical ({', '.join(categorical_cols[:4])})" if categorical_cols else "No categorical columns"
            
            return (
                f"📈 **Dataset Overview**: `{dataset_info['name']}`\n\n"
                f"• **Dimensions**: **{len(df):,} rows** across **{len(df.columns)} columns**\n"
                f"• **Key Columns**: {cols_summary}\n"
                f"• **Data Types**: {num_summary} and {cat_summary}\n\n"
                f"💡 **Suggested Questions**:\n"
                f"1. *What are the missing values?*\n"
                f"2. *Show correlations between variables.*\n"
                f"3. *Which columns should I visualize?*"
            )
        
        else:
            return (
                f"📋 **Analysis for `{dataset_info['name']}`** ({len(df):,} rows × {len(df.columns)} columns):\n\n"
                f"You can ask me questions such as:\n"
                f"• *\"What is this dataset about?\"*\n"
                f"• *\"Are there any missing or null values?\"*\n"
                f"• *\"What is the correlation between numeric columns?\"*\n"
                f"• *\"Which charts work best for this data?\"*"
            )
    
    async def get_visualization_recommendations(self, dataset_id: str) -> List[Dict[str, Any]]:
        """Get AI-powered visualization recommendations"""
        if dataset_id not in self.datasets:
            raise ValueError("Dataset not found")
        
        dataset_info = self.datasets[dataset_id]
        df = self.get_dataset_dataframe(dataset_id)
        if df is None:
            return []
        
        try:
            recommendations = await gemini_service.recommend_visualizations(df, dataset_info['name'])
            return recommendations
        except Exception as e:
            # Fallback recommendations
            return self._generate_basic_recommendations(df)
    
    def _generate_basic_recommendations(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Generate basic visualization recommendations as fallback"""
        recommendations = []
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        if len(numeric_cols) >= 1:
            recommendations.append({
                "chart_type": "histogram",
                "x_column": numeric_cols[0],
                "title": f"Distribution of {numeric_cols[0]}",
                "reasoning": "Understand the distribution of your numeric data",
                "insights": "Identify patterns, outliers, and data quality issues"
            })
        
        if len(numeric_cols) >= 2:
            recommendations.append({
                "chart_type": "scatter",
                "x_column": numeric_cols[0],
                "y_column": numeric_cols[1],
                "title": f"{numeric_cols[1]} vs {numeric_cols[0]}",
                "reasoning": "Explore relationships between numeric variables",
                "insights": "Identify correlations and patterns"
            })
        
        if len(categorical_cols) >= 1 and len(numeric_cols) >= 1:
            recommendations.append({
                "chart_type": "bar",
                "x_column": categorical_cols[0],
                "y_column": numeric_cols[0],
                "title": f"{numeric_cols[0]} by {categorical_cols[0]}",
                "reasoning": "Compare values across different categories",
                "insights": "Identify top performers and category trends"
            })
        
        return recommendations
    
    def get_datasets_count(self) -> int:
        """Get total number of datasets"""
        return len(self.datasets)
    
    def get_datasets_summary(self) -> Dict[str, Any]:
        """Get summary statistics of all datasets"""
        if not self.datasets:
            return {
                'total_datasets': 0,
                'total_rows': 0,
                'total_columns': 0,
                'status_counts': {},
                'file_types': {}
            }
        
        total_rows = sum(info.get('rows', 0) for info in self.datasets.values())
        total_columns = sum(info.get('columns', 0) for info in self.datasets.values())
        
        status_counts = {}
        file_types = {}
        
        for info in self.datasets.values():
            status = info.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
            
            file_ext = Path(info.get('name', '')).suffix.lower()
            file_types[file_ext] = file_types.get(file_ext, 0) + 1
        
        return {
            'total_datasets': len(self.datasets),
            'total_rows': total_rows,
            'total_columns': total_columns,
            'status_counts': status_counts,
            'file_types': file_types
        }
    
    async def generate_sample_charts(self, dataset_id: str) -> List[Dict[str, Any]]:
        """Generate sample chart suggestions"""
        if dataset_id not in self.datasets:
            raise ValueError("Dataset not found")
        
        df = self.get_dataset_dataframe(dataset_id)
        if df is None:
            return []
        suggestions = []
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        # Bar chart suggestions
        if len(categorical_cols) > 0:
            suggestions.append({
                'title': f'{categorical_cols[0]} Distribution',
                'chart_type': 'bar',
                'x_column': categorical_cols[0],
                'y_column': 'count',
                'confidence': 0.9,
                'reason': 'Show frequency distribution of categories'
            })
        
        # Line chart suggestions
        if len(numeric_cols) > 0:
            suggestions.append({
                'title': f'{numeric_cols[0]} Trend',
                'chart_type': 'line',
                'x_column': 'index',
                'y_column': numeric_cols[0],
                'confidence': 0.8,
                'reason': 'Visualize trend over time/sequence'
            })
        
        # Pie chart suggestions
        if len(categorical_cols) > 0:
            suggestions.append({
                'title': f'{categorical_cols[0]} Breakdown',
                'chart_type': 'pie',
                'x_column': categorical_cols[0],
                'y_column': 'count',
                'confidence': 0.85,
                'reason': 'Show proportional breakdown of categories'
            })
        
        return suggestions[:5]  # Limit to 5 suggestions
    
    async def get_dashboard_config(self, dataset_id: str) -> Dict[str, Any]:
        """Get dashboard configuration for dataset"""
        if dataset_id not in self.datasets:
            raise ValueError("Dataset not found")
        
        dataset_info = self.datasets[dataset_id]
        df = self.get_dataset_dataframe(dataset_id)
        rows_cnt = len(df) if df is not None else dataset_info.get('rows', 0)
        cols_cnt = len(df.columns) if df is not None else dataset_info.get('columns', 0)
        
        return {
            'appUI': {
                'theme': {
                    'name': 'dark',
                    'primaryColor': '#2563EB',
                    'backgroundColor': '#1F2937'
                },
                'currentPage': 'visualization_dashboard',
                'pageTitle': 'Data Visualization Dashboard',
                'subtitle': 'Create, customize, and export data visualizations'
            },
            'currentDataset': {
                'id': dataset_id,
                'name': dataset_info['name'],
                'rows': rows_cnt,
                'columns': cols_cnt
            },
            'visualizationOptions': {
                'availableTypes': [
                    {'id': 'bar', 'name': 'Bar Chart', 'icon': '📊'},
                    {'id': 'line', 'name': 'Line Chart', 'icon': '📈'},
                    {'id': 'pie', 'name': 'Pie Chart', 'icon': '🥧'},
                    {'id': 'scatter', 'name': 'Scatter Plot', 'icon': '🔍'},
                    {'id': 'histogram', 'name': 'Histogram', 'icon': '⊞'}
                ]
            },
            'aiTools': {
                'enabled': True,
                'features': ['auto-generate', 'customize', 'insights']
            }
        }
    
    async def generate_ai_suggestions(self, dataset_id: str, prompt: str, action: str) -> List[Dict[str, Any]]:
        """Generate AI-powered chart suggestions"""
        if dataset_id not in self.datasets:
            raise ValueError("Dataset not found")
        
        # For now, return sample suggestions based on action
        if action == 'auto-generate':
            return await self.generate_sample_charts(dataset_id)
        else:
            # Customization suggestions
            return [
                {
                    'title': 'Custom Chart Based on Your Request',
                    'chart_type': 'bar',
                    'x_column': 'index',
                    'y_column': 'count',
                    'confidence': 0.7,
                    'reason': f'Generated based on: {prompt}'
                }
            ]


# Global service instance
dataset_service = DatasetService()