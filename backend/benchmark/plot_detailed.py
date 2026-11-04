"""Generate detailed visualizations from benchmark results.json
Creates multiple HTML charts in backend/benchmark/charts/
"""
import json
from pathlib import Path
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

ROOT = Path(__file__).resolve().parent
RESULTS_FILE = ROOT / 'results.json'
OUT_DIR = ROOT / 'charts'
OUT_DIR.mkdir(exist_ok=True)

with open(RESULTS_FILE, 'r', encoding='utf-8') as f:
    results = json.load(f)

# Normalize
df = pd.json_normalize(results)
# Ensure numeric
for c in ['read_ms','chart_create_ms','preview_serialize_ms','preview_payload_bytes','chart_payload_bytes','completeness_pct','rows','cols','memory_usage_bytes']:
    if c in df.columns:
        df[c] = pd.to_numeric(df[c], errors='coerce')

# 1) Bar Chart: read times, preprocessing (data_quality_ms), chart rendering times
bar_df = df[['file']].copy()
for col in ['read_ms','data_quality_ms','preview_serialize_ms','chart_create_ms']:
    if col in df.columns:
        bar_df[col] = df[col]
bar_df = bar_df.fillna(0)
fig_bar = go.Figure()
if 'read_ms' in bar_df.columns:
    fig_bar.add_trace(go.Bar(x=bar_df['file'], y=bar_df['read_ms'], name='Read (ms)'))
if 'data_quality_ms' in bar_df.columns:
    fig_bar.add_trace(go.Bar(x=bar_df['file'], y=bar_df['data_quality_ms'], name='Quality check (ms)'))
if 'preview_serialize_ms' in bar_df.columns:
    fig_bar.add_trace(go.Bar(x=bar_df['file'], y=bar_df['preview_serialize_ms'], name='Preview serialize (ms)'))
if 'chart_create_ms' in bar_df.columns:
    fig_bar.add_trace(go.Bar(x=bar_df['file'], y=bar_df['chart_create_ms'], name='Chart create (ms)'))
fig_bar.update_layout(barmode='group', title='Processing phase times by file (grouped)')
fig_bar.write_html(OUT_DIR / 'grouped_phase_times.html')

# 2) Stacked Bar Chart: breakdown into stacked phases (same columns stacked)
fig_stack = go.Figure()
if 'read_ms' in bar_df.columns:
    fig_stack.add_trace(go.Bar(x=bar_df['file'], y=bar_df['read_ms'], name='Read (ms)'))
if 'data_quality_ms' in bar_df.columns:
    fig_stack.add_trace(go.Bar(x=bar_df['file'], y=bar_df['data_quality_ms'], name='Quality check (ms)'))
if 'preview_serialize_ms' in bar_df.columns:
    fig_stack.add_trace(go.Bar(x=bar_df['file'], y=bar_df['preview_serialize_ms'], name='Preview serialize (ms)'))
if 'chart_create_ms' in bar_df.columns:
    fig_stack.add_trace(go.Bar(x=bar_df['file'], y=bar_df['chart_create_ms'], name='Chart create (ms)'))
fig_stack.update_layout(barmode='stack', title='Processing time distribution by file (stacked)')
fig_stack.write_html(OUT_DIR / 'stacked_phase_times.html')

# 3) Line Chart / Scatter: memory usage and processing time vs rows
if 'rows' in df.columns:
    fig_line = make_subplots(specs=[[{"secondary_y": True}]])
    if 'memory_usage_bytes' in df.columns:
        fig_line.add_trace(go.Scatter(x=df['rows'], y=df['memory_usage_bytes'], mode='lines+markers', name='Memory (bytes)'), secondary_y=False)
    if 'read_ms' in df.columns:
        fig_line.add_trace(go.Scatter(x=df['rows'], y=df['read_ms'], mode='markers', name='Read ms'), secondary_y=True)
    fig_line.update_xaxes(title_text='Rows')
    fig_line.update_yaxes(title_text='Memory (bytes)', secondary_y=False)
    fig_line.update_yaxes(title_text='Read time (ms)', secondary_y=True)
    fig_line.update_layout(title='Memory and Read time vs Rows')
    fig_line.write_html(OUT_DIR / 'memory_and_read_vs_rows.html')

# 4) Scatter: Chart creation time vs rows
if 'chart_create_ms' in df.columns and 'rows' in df.columns:
    fig_scatter = px.scatter(df, x='rows', y='chart_create_ms', text='file', title='Chart creation time vs Rows')
    fig_scatter.update_traces(textposition='top center')
    fig_scatter.write_html(OUT_DIR / 'chart_create_vs_rows.html')

# 5) Pie/Donut: completeness and missing proportion per file (create one per file)
for _, r in df.iterrows():
    labels = ['Complete', 'Missing']
    complete = float(r['completeness_pct']) if not pd.isna(r.get('completeness_pct')) else 0.0
    missing = 100.0 - complete
    values = [complete, missing]
    fig_pie = px.pie(names=labels, values=values, title=f"Completeness for {r['file']}")
    fig_pie.update_traces(hole=0.4)
    safe_name = r['file'].replace('/', '_')
    fig_pie.write_html(OUT_DIR / f"completeness_{safe_name}.html")

# 6) Heatmap / Correlation matrix among numeric metrics
num_cols = ['rows','cols','read_ms','chart_create_ms','preview_serialize_ms','memory_usage_bytes','completeness_pct']
exist_cols = [c for c in num_cols if c in df.columns]
if exist_cols:
    corr = df[exist_cols].corr()
    fig_heat = px.imshow(corr, text_auto=True, title='Correlation matrix of metrics')
    fig_heat.write_html(OUT_DIR / 'metrics_correlation_heatmap.html')

# 7) Latency distribution histograms (read_ms and chart_create_ms)
if 'read_ms' in df.columns:
    fig_hist_read = px.histogram(df, x='read_ms', nbins=10, title='Distribution of CSV read times (ms)')
    fig_hist_read.write_html(OUT_DIR / 'hist_read_ms.html')
if 'chart_create_ms' in df.columns:
    fig_hist_chart = px.histogram(df, x='chart_create_ms', nbins=10, title='Distribution of chart creation times (ms)')
    fig_hist_chart.write_html(OUT_DIR / 'hist_chart_create_ms.html')

print('Detailed charts saved to', str(OUT_DIR))
