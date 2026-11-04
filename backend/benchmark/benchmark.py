"""Standalone benchmark runner for Clarivo backend data samples.

This script avoids importing application modules (to prevent Gemini/init side-effects)
and measures read time, analysis time (pandas-based), preview serialization time,
and Plotly chart creation + serialization time for up to 5 CSVs in backend/data.
"""

import time
import json
import os
from pathlib import Path
import pandas as pd
import numpy as np
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
BENCHMARK_FILES = [p for p in DATA_DIR.glob("*.csv")][:5]

results = []

def safe_numeric_stats(series: pd.Series):
    try:
        return {
            'mean': float(series.mean()) if not series.empty else None,
            'median': float(series.median()) if not series.empty else None,
            'std': float(series.std()) if not series.empty else None,
            'min': float(series.min()) if not series.empty else None,
            'max': float(series.max()) if not series.empty else None,
        }
    except Exception:
        return {'mean': None, 'median': None, 'std': None, 'min': None, 'max': None}

for fp in BENCHMARK_FILES:
    row = {}
    row['file'] = fp.name

    # Read CSV
    t0 = time.perf_counter()
    try:
        df = pd.read_csv(fp)
        read_error = None
    except Exception as e:
        df = None
        read_error = str(e)
    t1 = time.perf_counter()
    row['read_ms'] = (t1 - t0) * 1000.0

    if df is None:
        row.update({
            'rows': None, 'cols': None, 'read_error': read_error
        })
        results.append(row)
        continue

    # Basic shape and memory
    row['rows'] = int(len(df))
    row['cols'] = int(len(df.columns))
    try:
        row['memory_usage_bytes'] = int(df.memory_usage(deep=True).sum())
    except Exception:
        row['memory_usage_bytes'] = None

    # Data quality
    t_q0 = time.perf_counter()
    total_cells = len(df) * len(df.columns) if len(df.columns) > 0 else 0
    missing_cells = int(df.isnull().sum().sum())
    try:
        completeness = float((total_cells - missing_cells) / total_cells * 100) if total_cells > 0 else 0.0
    except Exception:
        completeness = 0.0
    duplicate_rows = int(df.duplicated().sum())
    t_q1 = time.perf_counter()
    row['data_quality_ms'] = (t_q1 - t_q0) * 1000.0
    row['total_cells'] = int(total_cells)
    row['missing_cells'] = int(missing_cells)
    row['completeness_pct'] = float(completeness)
    row['duplicate_rows'] = int(duplicate_rows)

    # Numeric column stats (sample up to 3 numeric cols)
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    num_stats = {}
    for c in numeric_cols[:3]:
        num_stats[c] = safe_numeric_stats(df[c].dropna())
    row['numeric_stats'] = num_stats

    # Preview serialization (first 100 rows)
    preview = df.head(100).fillna(value=pd.NA).to_dict(orient='records')
    t_p0 = time.perf_counter()
    try:
        preview_json = json.dumps({'data': preview, 'columns': list(df.columns)}, default=str)
        preview_bytes = len(preview_json.encode('utf-8'))
    except Exception as e:
        preview_json = None
        preview_bytes = None
    t_p1 = time.perf_counter()
    row['preview_serialize_ms'] = (t_p1 - t_p0) * 1000.0
    row['preview_payload_bytes'] = preview_bytes

    # Chart creation + serialization (histogram of first numeric col)
    if numeric_cols:
        xcol = numeric_cols[0]
        t_c0 = time.perf_counter()
        try:
            fig = px.histogram(df, x=xcol, title=f'Distribution of {xcol}')
            fig_json = json.dumps(fig, cls=PlotlyJSONEncoder)
            fig_bytes = len(fig_json.encode('utf-8'))
            chart_error = None
        except Exception as e:
            fig = None
            fig_bytes = None
            chart_error = str(e)
        t_c1 = time.perf_counter()
        row['chart_create_ms'] = (t_c1 - t_c0) * 1000.0
        row['chart_payload_bytes'] = fig_bytes
        row['chart_error'] = chart_error
    else:
        row['chart_create_ms'] = None
        row['chart_payload_bytes'] = None
        row['chart_error'] = 'no_numeric_columns'

    results.append(row)

print(json.dumps(results, indent=2))