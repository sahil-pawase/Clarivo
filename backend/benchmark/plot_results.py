"""Generate interactive Plotly charts from benchmark results

Creates HTML charts in backend/benchmark/charts/ and writes a CSV summary.
"""
import json
from pathlib import Path
import pandas as pd
import plotly.express as px

ROOT = Path(__file__).resolve().parent
RESULTS_FILE = ROOT / 'results.json'
OUT_DIR = ROOT / 'charts'
OUT_DIR.mkdir(exist_ok=True)

with open(RESULTS_FILE, 'r', encoding='utf-8') as f:
    results = json.load(f)

# Normalize into DataFrame
df = pd.json_normalize(results)
# Replace nulls with NaN for plotting
df = df.replace({None: pd.NA})
# Ensure numeric types
for col in ['read_ms','chart_create_ms','preview_serialize_ms','preview_payload_bytes','chart_payload_bytes','completeness_pct','rows','cols','memory_usage_bytes']:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')

# Save summary CSV
summary_csv = ROOT / 'results_summary.csv'
df.to_csv(summary_csv, index=False)

# Chart 1: Read time vs rows (scatter)
if 'read_ms' in df.columns and 'rows' in df.columns:
    fig1 = px.scatter(df, x='rows', y='read_ms', text='file', title='CSV read time vs rows', labels={'read_ms':'Read time (ms)'})
    fig1.update_traces(textposition='top center')
    fig1.write_html(OUT_DIR / 'read_time_vs_rows.html')

# Chart 2: Chart creation time vs rows (bar)
if 'chart_create_ms' in df.columns and 'rows' in df.columns:
    fig2 = px.bar(df.sort_values('rows'), x='file', y='chart_create_ms', title='Chart creation time per file (ms)', labels={'chart_create_ms':'Chart create time (ms)'})
    fig2.write_html(OUT_DIR / 'chart_create_time_by_file.html')

# Chart 3: Completeness (%) by file
if 'completeness_pct' in df.columns:
    fig3 = px.bar(df.sort_values('completeness_pct', ascending=False), x='file', y='completeness_pct', title='Dataset completeness (%)', labels={'completeness_pct':'Completeness (%)'})
    fig3.write_html(OUT_DIR / 'completeness_by_file.html')

print('Charts saved to', str(OUT_DIR))
print('Summary CSV saved to', str(summary_csv))
