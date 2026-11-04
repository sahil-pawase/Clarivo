import React from 'react';
import { BarChart } from '../shared/charts/BarChart';
import { LineChart } from '../shared/charts/LineChart';
import { DonutChart } from '../shared/charts/DonutChart';

export interface DashboardChart {
  id: string;
  type: 'bar' | 'line' | 'donut' | 'pie' | 'scatter' | 'histogram';
  title: string;
  subtitle?: string;
  data: any[];
  config?: any;
  insight?: string;
  xColumn?: string;
  yColumn?: string;
}

interface SmartVisualizationDashboardProps {
  charts: DashboardChart[];
  onChartUpdate?: (chartId: string, data: any) => void;
  onChartRemove?: (chartId: string) => void;
}

export const SmartVisualizationDashboard: React.FC<SmartVisualizationDashboardProps> = ({
  charts,
  onChartUpdate,
  onChartRemove
}) => {
  if (!charts || charts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Smart Charts Available</h3>
          <p className="text-sm">Use AI-powered analysis to generate intelligent visualizations.</p>
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
            <p>Chart type '{chart.type}' coming soon...</p>
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
            className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden flex flex-col"
            style={{ minHeight: '500px' }}
          >
            {/* Chart Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-start flex-shrink-0">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{chart.title}</h3>
                {chart.subtitle && (
                  <p className="text-sm text-gray-400 mt-1">{chart.subtitle}</p>
                )}
              </div>
              {onChartRemove && (
                <button
                  onClick={() => onChartRemove(chart.id)}
                  className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-gray-700/50"
                  title="Remove chart"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Chart Content - Increased height */}
            <div className="flex-1 p-2" style={{ minHeight: '400px' }}>
              {renderChart(chart)}
            </div>

            {/* Chart Insight */}
            {chart.insight && (
              <div className="p-4 border-t border-gray-700 bg-gray-800/30 flex-shrink-0">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-300 mb-1">AI Insight</h4>
                    <p className="text-sm text-gray-300">{chart.insight}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};