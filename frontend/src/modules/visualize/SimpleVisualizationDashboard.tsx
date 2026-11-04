import React from 'react';
import { BarChart } from '../shared/charts/BarChart';
import { LineChart } from '../shared/charts/LineChart';
import { DonutChart } from '../shared/charts/DonutChart';

export interface DashboardChart {
  id: string;
  type: 'bar' | 'line' | 'donut' | 'pie';
  title: string;
  subtitle?: string;
  data: any[];
  config?: any;
  xColumn?: string;
  yColumn?: string;
}

interface SimpleVisualizationDashboardProps {
  charts?: DashboardChart[];
  selectedDatasetId?: string | null;
  onChartUpdate?: (chartId: string, data: any) => void;
}

export const SimpleVisualizationDashboard: React.FC<SimpleVisualizationDashboardProps> = ({
  charts = [],
  selectedDatasetId,
  onChartUpdate
}) => {
  if (!selectedDatasetId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Select a Dataset</h3>
          <p className="text-sm">Choose a dataset from the sidebar to start creating visualizations.</p>
        </div>
      </div>
    );
  }

  if (!charts || charts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Charts Available</h3>
          <p className="text-sm">Upload a dataset and create some visualizations to get started.</p>
        </div>
      </div>
    );
  }

  const renderChart = (chart: DashboardChart) => {
    const commonProps = {
      data: chart.data,
      title: chart.title,
      subtitle: chart.subtitle,
      ...chart.config
    };

    switch (chart.type) {
      case 'bar':
        return <BarChart {...commonProps} />;
      case 'line':
        return <LineChart {...commonProps} />;
      case 'donut':
      case 'pie':
        return <DonutChart {...commonProps} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Unsupported chart type: {chart.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="p-6 space-y-6">
        {charts.map((chart) => (
          <div
            key={chart.id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-2"
            style={{ minHeight: '450px' }}
          >
            {renderChart(chart)}
          </div>
        ))}
      </div>
    </div>
  );
};