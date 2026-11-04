import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDatasets } from '../state/DatasetsContext';
import { BarChart } from '../shared/charts/BarChart';
import { LineChart } from '../shared/charts/LineChart';
import { DonutChart } from '../shared/charts/DonutChart';
import { ScatterChart } from '../shared/charts/ScatterChart';
import { HistogramChart } from '../shared/charts/HistogramChart';
import { AreaChart } from '../shared/charts/AreaChart';
import { BoxPlotChart } from '../shared/charts/BoxPlotChart';
import { HeatmapChart } from '../shared/charts/HeatmapChart';
import { sanitizeChartData } from '../shared/chartUtils';
import toast from 'react-hot-toast';

interface ChartInstance {
  id: string;
  type: 'bar' | 'line' | 'donut' | 'pie' | 'scatter' | 'histogram' | 'heatmap' | 'area' | 'boxplot';
  title: string;
  xColumn: string;
  yColumn: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any[];
  config: ChartConfig;
}

interface ChartConfig {
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  theme: 'light' | 'dark';
  showValues?: boolean;
  colorScheme?: 'default' | 'gradient' | 'categorical' | 'performance';
  showAverage?: boolean;
  sortBy?: 'none' | 'ascending' | 'descending' | 'alphabetical';
}

interface Filter {
  id: string;
  column: string;
  type: 'range' | 'categorical' | 'date';
  values: any[];
  operator: 'equals' | 'contains' | 'between' | 'greater' | 'less';
  active: boolean;
}

export const VisualizationStudio: React.FC = () => {
  const { datasets, selectedId, preview, select } = useDatasets();
  const [charts, setCharts] = useState<ChartInstance[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [showChartPanel, setShowChartPanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [draggedChart, setDraggedChart] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dashboardName, setDashboardName] = useState('Untitled Dashboard');
  const [customChart, setCustomChart] = useState({
    type: 'bar' as ChartInstance['type'],
    title: '',
    xColumn: '',
    yColumn: '',
    showValues: false,
    colorScheme: 'default' as 'default' | 'gradient' | 'categorical' | 'performance',
    showAverage: false,
    sortBy: 'none' as 'none' | 'ascending' | 'descending' | 'alphabetical'
  });
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentDataset = datasets.find(d => d.id === selectedId);
  const columns = preview?.columns || [];
  const data = preview?.data || [];

  // Get column types for better recommendations
  const getColumnType = useCallback((column: string) => {
    if (!data.length) return 'string';
    const sample = data.slice(0, 10);
    const values = sample.map(row => row[column]).filter(v => v != null);
    
    if (values.some(v => typeof v === 'number')) return 'number';
    if (values.some(v => typeof v === 'string' && !isNaN(Date.parse(v)))) return 'date';
    return 'string';
  }, [data]);

  const numericColumns = columns.filter(col => getColumnType(col) === 'number');
  const categoricalColumns = columns.filter(col => getColumnType(col) === 'string');
  const dateColumns = columns.filter(col => getColumnType(col) === 'date');

  // Create chart data based on columns
  const createChartData = useCallback((xColumn: string, yColumn: string) => {
    console.log('Creating chart data:', { xColumn, yColumn, dataLength: data.length });
    
    if (!data.length) {
      console.log('No data available');
      return [];
    }

    let chartData = [];

    if (yColumn === 'count') {
      // Count aggregation for categorical data
      const counts = data.reduce((acc, row) => {
        const key = String(row[xColumn] || 'Unknown');
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      chartData = Object.entries(counts)
        .sort(([,a], [,b]) => b - a) // Sort by count descending
        .slice(0, 20) // Limit to top 20 categories
        .map(([category, value]) => ({
          category,
          value,
          [xColumn]: category,
          [yColumn]: value
        }));
    } else if (xColumn === 'index') {
      // Index-based data for trends
      chartData = data.map((row, index) => ({
        category: (index + 1).toString(),
        value: Number(row[yColumn]) || 0,
        [xColumn]: index + 1,
        [yColumn]: Number(row[yColumn]) || 0
      }));
    } else {
      // Direct column mapping with aggregation for categorical x-axis
      if (getColumnType(xColumn) === 'string') {
        // Group by categorical column and aggregate numeric column
        const groups = data.reduce((acc, row) => {
          const key = String(row[xColumn] || 'Unknown');
          if (!acc[key]) acc[key] = [];
          acc[key].push(Number(row[yColumn]) || 0);
          return acc;
        }, {} as Record<string, number[]>);

        chartData = Object.entries(groups)
          .map(([category, values]) => ({
            category,
            value: values.reduce((sum: number, val: number) => sum + val, 0) / values.length, // Average
            [xColumn]: category,
            [yColumn]: values.reduce((sum: number, val: number) => sum + val, 0) / values.length
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 20);
      } else {
        // Both numeric - direct mapping
        chartData = data
          .filter(row => row[xColumn] != null && row[yColumn] != null)
          .map(row => ({
            category: String(row[xColumn]),
            value: Number(row[yColumn]) || 0,
            [xColumn]: Number(row[xColumn]) || 0,
            [yColumn]: Number(row[yColumn]) || 0
          }))
          .slice(0, 100); // Limit for performance
      }
    }

    console.log('Created chart data:', chartData.length, 'points', chartData.slice(0, 3));
    return chartData;
  }, [data, getColumnType]);

  // Chart type recommendations
  const getChartRecommendations = useCallback(() => {
    if (!data.length || !columns.length) return [];

    const recommendations: Array<{
      type: 'bar' | 'line' | 'donut' | 'pie' | 'area' | 'scatter' | 'histogram' | 'heatmap' | 'boxplot';
      title: string;
      xColumn: string;
      yColumn: string;
      reason: string;
      confidence: number;
    }> = [];

    // Categorical distributions
    categoricalColumns.slice(0, 3).forEach(catCol => {
      recommendations.push({
        type: 'bar' as const,
        title: `${catCol} Distribution`,
        xColumn: catCol,
        yColumn: 'count',
        reason: 'Shows frequency of categories',
        confidence: 0.9
      });
      
      recommendations.push({
        type: 'donut' as const,
        title: `${catCol} Breakdown`,
        xColumn: catCol,
        yColumn: 'count',
        reason: 'Visual proportion of categories',
        confidence: 0.85
      });
    });

    // Numeric trends
    numericColumns.slice(0, 3).forEach(numCol => {
      recommendations.push({
        type: 'line' as const,
        title: `${numCol} Trend`,
        xColumn: 'index',
        yColumn: numCol,
        reason: 'Shows progression over sequence',
        confidence: 0.8
      });
      
      recommendations.push({
        type: 'area' as const,
        title: `${numCol} Area Trend`,
        xColumn: 'index',
        yColumn: numCol,
        reason: 'Shows cumulative progression with filled area',
        confidence: 0.75
      });

      recommendations.push({
        type: 'histogram' as const,
        title: `${numCol} Distribution`,
        xColumn: numCol,
        yColumn: 'frequency',
        reason: 'Shows distribution shape and outliers',
        confidence: 0.85
      });
    });

    // Cross-column analysis
    categoricalColumns.slice(0, 2).forEach(catCol => {
      numericColumns.slice(0, 2).forEach(numCol => {
        recommendations.push({
          type: 'bar' as const,
          title: `Average ${numCol} by ${catCol}`,
          xColumn: catCol,
          yColumn: numCol,
          reason: `Compare ${numCol} across ${catCol} categories`,
          confidence: 0.95
        });
      });
    });

    // Box plots for numeric distributions
    numericColumns.slice(0, 2).forEach(numCol => {
      recommendations.push({
        type: 'boxplot' as const,
        title: `${numCol} Box Plot`,
        xColumn: 'category',
        yColumn: numCol,
        reason: 'Shows quartiles, median, and outliers',
        confidence: 0.8
      });
    });

    // Correlation analysis (scatter plots)
    for (let i = 0; i < numericColumns.length - 1; i++) {
      for (let j = i + 1; j < numericColumns.length && j < i + 2; j++) {
        recommendations.push({
          type: 'scatter' as const,
          title: `${numericColumns[i]} vs ${numericColumns[j]}`,
          xColumn: numericColumns[i],
          yColumn: numericColumns[j],
          reason: 'Explore correlation between numeric variables',
          confidence: 0.8
        });
      }
    }

    // Box plots for numeric distributions by category
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      recommendations.push({
        type: 'boxplot' as const,
        title: `${numericColumns[0]} Distribution Analysis`,
        xColumn: categoricalColumns[0],
        yColumn: numericColumns[0],
        reason: 'Shows quartiles, outliers, and distribution shape',
        confidence: 0.7
      });
    }

    // Heatmap for correlation matrix
    if (numericColumns.length >= 2) {
      recommendations.push({
        type: 'heatmap' as const,
        title: 'Data Correlation Heatmap',
        xColumn: numericColumns[0],
        yColumn: numericColumns[1],
        reason: 'Shows relationships between multiple variables',
        confidence: 0.6
      });
    }

    return recommendations.slice(0, 12);
  }, [data, columns, categoricalColumns, numericColumns]);

  // Add new chart to canvas
  const addChart = useCallback((type: ChartInstance['type'], title: string, xColumn: string, yColumn: string) => {
    const chartData = createChartData(xColumn, yColumn);
    
    if (chartData.length === 0) {
      toast.error('No data available for this combination');
      return;
    }
    
    const newChart: ChartInstance = {
      id: `chart-${Date.now()}`,
      type,
      title,
      xColumn,
      yColumn,
      position: { x: 50 + charts.length * 30, y: 50 + charts.length * 30 },
      size: { width: 500, height: 400 },
      data: chartData,
      config: {
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        showLegend: true,
        showGrid: true,
        theme: 'dark',
        showValues: false,
        colorScheme: 'default',
        showAverage: false,
        sortBy: 'none'
      }
    };

    setCharts(prev => [...prev, newChart]);
    setSelectedChart(newChart.id);
    toast.success(`Added ${title} chart`);
  }, [charts.length, createChartData]);

  // Remove chart
  const removeChart = useCallback((chartId: string) => {
    setCharts(prev => prev.filter(c => c.id !== chartId));
    if (selectedChart === chartId) {
      setSelectedChart(null);
    }
    toast.success('Chart removed');
  }, [selectedChart]);

  // Mouse event handlers for drag and drop
  const handleMouseDown = useCallback((e: React.MouseEvent, chartId: string) => {
    if (e.target instanceof HTMLElement && e.target.classList.contains('resize-handle')) {
      setIsResizing(chartId);
      return;
    }

    const chart = charts.find(c => c.id === chartId);
    if (!chart) return;

    setDraggedChart(chartId);
    setSelectedChart(chartId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [charts]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggedChart && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;
      
      // Constrain to canvas bounds (with larger canvas area)
      const chart = charts.find(c => c.id === draggedChart);
      const chartWidth = chart?.size.width || 500;
      const chartHeight = chart?.size.height || 400;
      const canvasWidth = Math.max(2000, canvasRect.width);
      const canvasHeight = Math.max(1500, canvasRect.height);
      const constrainedX = Math.max(0, Math.min(newX, canvasWidth - chartWidth));
      const constrainedY = Math.max(0, Math.min(newY, canvasHeight - chartHeight));
      
      setCharts(prev => prev.map(chart => 
        chart.id === draggedChart 
          ? { ...chart, position: { x: constrainedX, y: constrainedY } }
          : chart
      ));
    }

    if (isResizing && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const chart = charts.find(c => c.id === isResizing);
      if (chart) {
        const newWidth = Math.max(300, Math.min(800, e.clientX - canvasRect.left - chart.position.x));
        const newHeight = Math.max(200, Math.min(600, e.clientY - canvasRect.top - chart.position.y));
        
        setCharts(prev => prev.map(c => 
          c.id === isResizing 
            ? { ...c, size: { width: newWidth, height: newHeight } }
            : c
        ));
      }
    }
  }, [draggedChart, isResizing, dragOffset, charts]);

  const handleMouseUp = useCallback(() => {
    setDraggedChart(null);
    setIsResizing(null);
  }, []);

  // Add event listeners
  useEffect(() => {
    if (draggedChart || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedChart, isResizing, handleMouseMove, handleMouseUp]);

  // Apply filters to chart data
  const getFilteredData = useCallback((originalData: any[]) => {
    let filteredData = [...originalData];

    filters.filter(f => f.active).forEach(filter => {
      filteredData = filteredData.filter(row => {
        const value = row[filter.column];
        
        switch (filter.operator) {
          case 'equals':
            return filter.values.includes(value);
          case 'contains':
            return filter.values.some(filterVal => 
              String(value).toLowerCase().includes(String(filterVal).toLowerCase())
            );
          case 'between':
            return value >= filter.values[0] && value <= filter.values[1];
          case 'greater':
            return value > filter.values[0];
          case 'less':
            return value < filter.values[0];
          default:
            return true;
        }
      });
    });

    return filteredData;
  }, [filters]);

  // Render chart component
  const renderChart = useCallback((chart: ChartInstance) => {
    const filteredData = getFilteredData(chart.data);
    const commonProps = {
      data: filteredData,
      title: '', // We'll show title in header
      showLegend: chart.config.showLegend,
      showGrid: chart.config.showGrid
    };

    // Debug: Log chart data
    console.log('Rendering chart:', chart.type, 'with data:', filteredData.length, 'points');

    switch (chart.type) {
      case 'bar':
        return (
          <BarChart 
            {...commonProps} 
            showValues={chart.config.showValues}
            colorScheme={chart.config.colorScheme}
            showAverage={chart.config.showAverage}
            sortBy={chart.config.sortBy}
          />
        );
      case 'line':
        return <LineChart {...commonProps} />;
      case 'donut':
      case 'pie':
        return <DonutChart {...commonProps} />;
      case 'scatter':
        return <ScatterChart {...commonProps} />;
      case 'histogram':
        return <HistogramChart {...commonProps} bins={15} />;
      case 'area':
        return <AreaChart {...commonProps} />;
      case 'heatmap':
        // Transform data for heatmap
        const heatmapData = filteredData.map((item, index) => ({
          x: item.category,
          y: 'Value',
          value: item.value
        }));
        return <HeatmapChart data={heatmapData} title={chart.title} />;
      case 'boxplot':
        // Transform data for box plot (simplified - in real use you'd calculate quartiles)
        if (filteredData.length === 0) {
          return <div className="flex items-center justify-center h-full text-gray-400">No data for box plot</div>;
        }
        const values = filteredData.map(d => d.value).sort((a, b) => a - b);
        const boxplotData = [{
          category: 'Data',
          value: values[Math.floor(values.length * 0.5)] || 0, // median as main value
          min: Math.min(...values),
          q1: values[Math.floor(values.length * 0.25)] || 0,
          median: values[Math.floor(values.length * 0.5)] || 0,
          q3: values[Math.floor(values.length * 0.75)] || 0,
          max: Math.max(...values)
        }];
        return <BoxPlotChart data={boxplotData} title={chart.title} />;
      default:
        return <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">🚧</div>
            <p>Chart type '{chart.type}' coming soon...</p>
          </div>
        </div>;
    }
  }, [getFilteredData]);

  // Save dashboard
  const saveDashboard = useCallback(() => {
    const dashboard = {
      name: dashboardName,
      charts,
      filters,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`clarivo-dashboard-${Date.now()}`, JSON.stringify(dashboard));
    toast.success('Dashboard saved successfully!');
  }, [dashboardName, charts, filters]);

  // Export dashboard
  const exportDashboard = useCallback(async (format: 'png' | 'pdf') => {
    if (!canvasRef.current) {
      toast.error('Canvas not available for export');
      return;
    }

    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      
      // Create canvas from the dashboard
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#111827', // gray-900
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        width: canvasRef.current.scrollWidth,
        height: canvasRef.current.scrollHeight
      });

      if (format === 'png') {
        // Download as PNG
        const link = document.createElement('a');
        link.download = `${dashboardName.replace(/\s+/g, '_')}_dashboard.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('Dashboard exported as PNG!');
      } else if (format === 'pdf') {
        // Import jsPDF dynamically
        const { jsPDF } = await import('jspdf');
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${dashboardName.replace(/\s+/g, '_')}_dashboard.pdf`);
        toast.success('Dashboard exported as PDF!');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  }, [dashboardName]);

  // Handle custom chart creation
  const handleCustomChartSubmit = useCallback(() => {
    if (!customChart.title || !customChart.xColumn || !customChart.yColumn) {
      toast.error('Please fill in all fields');
      return;
    }

    const newChart: ChartInstance = {
      id: `chart-${Date.now()}`,
      type: customChart.type,
      title: customChart.title,
      xColumn: customChart.xColumn,
      yColumn: customChart.yColumn,
      position: { x: 50 + charts.length * 30, y: 50 + charts.length * 30 },
      size: { width: 500, height: 400 },
      data: createChartData(customChart.xColumn, customChart.yColumn),
      config: {
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        showLegend: true,
        showGrid: true,
        theme: 'dark',
        showValues: customChart.showValues,
        colorScheme: customChart.colorScheme,
        showAverage: customChart.showAverage,
        sortBy: customChart.sortBy
      }
    };

    setCharts(prev => [...prev, newChart]);
    setSelectedChart(newChart.id);
    toast.success(`Added ${customChart.title} chart`);
    
    setCustomChart({ 
      type: 'bar', 
      title: '', 
      xColumn: '', 
      yColumn: '',
      showValues: false,
      colorScheme: 'default',
      showAverage: false,
      sortBy: 'none'
    });
    setShowChartPanel(false);
  }, [customChart, addChart]);

  if (!currentDataset) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Select a Dataset</h3>
          <p className="text-gray-400">Choose a dataset to start creating visualizations</p>
          <div className="mt-4">
            <select
              className="bg-gray-800 border border-gray-600 rounded-md px-4 py-2 text-white"
              value={selectedId || ''}
              onChange={(e) => select(e.target.value || null)}
            >
              <option value="">Select a dataset</option>
              {datasets.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-900">
      {/* Left Toolbar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            placeholder="Dashboard name"
          />
        </div>

        {/* Dataset Info */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-medium text-white mb-2">Dataset</h3>
          <div className="text-xs text-gray-400">
            <div>{currentDataset.name}</div>
            <div>{data.length} rows • {columns.length} columns</div>
          </div>
          <div className="mt-2 text-xs">
            <div className="text-gray-300">Numeric: {numericColumns.length}</div>
            <div className="text-gray-300">Categorical: {categoricalColumns.length}</div>
            <div className="text-gray-300">Date: {dateColumns.length}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => setShowChartPanel(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            + Add Chart
          </button>
          <button
            onClick={() => {
              // Create a test chart with sample data
              const testData = [
                { category: 'A', value: 10 },
                { category: 'B', value: 20 },
                { category: 'C', value: 15 },
                { category: 'D', value: 25 },
                { category: 'E', value: 12 }
              ];
              const testChart: ChartInstance = {
                id: `test-chart-${Date.now()}`,
                type: 'bar',
                title: 'Test Bar Chart',
                xColumn: 'category',
                yColumn: 'value',
                position: { x: 100, y: 100 },
                size: { width: 500, height: 400 },
                data: testData,
                config: {
                  colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                  showLegend: true,
                  showGrid: true,
                  theme: 'dark',
                  showValues: true,
                  colorScheme: 'categorical',
                  showAverage: true,
                  sortBy: 'descending'
                }
              };
              setCharts(prev => [...prev, testChart]);
              toast.success('Test chart added!');
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            + Test Chart
          </button>
          <button
            onClick={() => setShowFilterPanel(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            + Add Filter
          </button>
          <button
            onClick={saveDashboard}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Save Dashboard
          </button>
        </div>

        {/* Chart List */}
        {charts.length > 0 && (
          <div className="p-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-white mb-2">Charts ({charts.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {charts.map(chart => (
                <div
                  key={chart.id}
                  className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                    selectedChart === chart.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedChart(chart.id)}
                >
                  <div className="font-medium truncate">{chart.title}</div>
                  <div className="text-gray-400">{chart.type} • {chart.xColumn} × {chart.yColumn}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="mt-auto p-4 border-t border-gray-700">
          <h3 className="text-sm font-medium text-white mb-2">Export</h3>
          <div className="space-y-2">
            <button
              onClick={() => exportDashboard('png')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-xs transition-colors"
            >
              Export as PNG
            </button>
            <button
              onClick={() => exportDashboard('pdf')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-xs transition-colors"
            >
              Export as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative overflow-auto">
        <div
          ref={canvasRef}
          className="relative bg-gray-900 cursor-default"
          style={{ 
            backgroundImage: 'radial-gradient(circle, #374151 1px, transparent 1px)', 
            backgroundSize: '20px 20px',
            minWidth: '2000px',
            minHeight: '1500px',
            width: 'max-content',
            height: 'max-content'
          }}
        >
          {charts.map(chart => (
            <div
              key={chart.id}
              className={`absolute bg-gray-800 border rounded-lg shadow-lg cursor-move select-none ${
                selectedChart === chart.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-600'
              }`}
              style={{
                left: chart.position.x,
                top: chart.position.y,
                width: chart.size.width,
                height: chart.size.height
              }}
              onMouseDown={(e) => handleMouseDown(e, chart.id)}
            >
              {/* Chart Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-700 cursor-move">
                <h4 className="text-sm font-medium text-white truncate">{chart.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{chart.data.length} points</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeChart(chart.id);
                    }}
                    className="text-gray-400 hover:text-red-400 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Chart Content */}
              <div className="p-1" style={{ height: chart.size.height - 50 }}>
                {renderChart(chart)}
              </div>

              {/* Resize Handle */}
              <div 
                className="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-gray-600 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
                style={{ clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)' }}
              />
            </div>
          ))}

          {/* Empty State */}
          {charts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Start Building Your Dashboard</h3>
                <p className="text-gray-400 mb-4">Drag and drop charts to create insights</p>
                <button
                  onClick={() => setShowChartPanel(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition-colors"
                >
                  Add Your First Chart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Selection Panel */}
      {showChartPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[700px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Add Chart</h2>
              <button
                onClick={() => setShowChartPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Custom Chart Builder */}
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-4">Create Custom Chart</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Chart Type</label>
                  <select
                    value={customChart.type}
                    onChange={(e) => setCustomChart(prev => ({ ...prev, type: e.target.value as ChartInstance['type'] }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="area">Area Chart</option>
                    <option value="donut">Donut Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="scatter">Scatter Plot</option>
                    <option value="histogram">Histogram</option>
                    <option value="boxplot">Box Plot</option>
                    <option value="heatmap">Heatmap</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Chart Title</label>
                  <input
                    type="text"
                    value={customChart.title}
                    onChange={(e) => setCustomChart(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="Enter chart title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">X-Axis Column</label>
                  <select
                    value={customChart.xColumn}
                    onChange={(e) => setCustomChart(prev => ({ ...prev, xColumn: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="">Select column</option>
                    <option value="index">Index (Row Number)</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col} ({getColumnType(col)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Y-Axis Column</label>
                  <select
                    value={customChart.yColumn}
                    onChange={(e) => setCustomChart(prev => ({ ...prev, yColumn: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="">Select column</option>
                    <option value="count">Count (Frequency)</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col} ({getColumnType(col)})</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Advanced Options for Bar Charts */}
              {customChart.type === 'bar' && (
                <div className="mt-4 p-3 bg-gray-600 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-3">Bar Chart Options</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Color Scheme</label>
                      <select
                        value={customChart.colorScheme}
                        onChange={(e) => setCustomChart(prev => ({ ...prev, colorScheme: e.target.value as any }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value="default">Default</option>
                        <option value="gradient">Gradient</option>
                        <option value="categorical">Categorical</option>
                        <option value="performance">Performance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Sort By</label>
                      <select
                        value={customChart.sortBy}
                        onChange={(e) => setCustomChart(prev => ({ ...prev, sortBy: e.target.value as any }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value="none">None</option>
                        <option value="ascending">Ascending</option>
                        <option value="descending">Descending</option>
                        <option value="alphabetical">Alphabetical</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={customChart.showValues}
                        onChange={(e) => setCustomChart(prev => ({ ...prev, showValues: e.target.checked }))}
                        className="accent-blue-500"
                      />
                      Show Values
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={customChart.showAverage}
                        onChange={(e) => setCustomChart(prev => ({ ...prev, showAverage: e.target.checked }))}
                        className="accent-blue-500"
                      />
                      Show Average Line
                    </label>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleCustomChartSubmit}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Create Chart
              </button>
            </div>

            {/* Recommended Charts */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Recommended Charts</h3>
              <div className="grid grid-cols-1 gap-3">
                {getChartRecommendations().map((rec, idx) => (
                  <button
                    key={idx}
                    onClick={() => addChart(rec.type, rec.title, rec.xColumn, rec.yColumn)}
                    className="text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {rec.type === 'bar' ? '📊' : 
                           rec.type === 'line' ? '📈' : 
                           rec.type === 'area' ? '📊' :
                           rec.type === 'scatter' ? '🔵' :
                           rec.type === 'histogram' ? '📊' :
                           rec.type === 'boxplot' ? '📦' :
                           rec.type === 'heatmap' ? '🔥' : '🍩'}
                        </div>
                        <div>
                          <div className="text-white font-medium">{rec.title}</div>
                          <div className="text-sm text-gray-400">{rec.xColumn} × {rec.yColumn}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-400">{Math.round(rec.confidence * 100)}%</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{rec.reason}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};