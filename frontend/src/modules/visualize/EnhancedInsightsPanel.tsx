import React from 'react';
import { ChartDataPoint } from '../shared/chartUtils';

interface InsightData {
  type: 'trend' | 'outlier' | 'correlation' | 'distribution' | 'comparison';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  value?: number;
  recommendation?: string;
}

interface EnhancedInsightsPanelProps {
  data: ChartDataPoint[];
  chartType: string;
  xColumn: string;
  yColumn: string;
}

export const EnhancedInsightsPanel: React.FC<EnhancedInsightsPanelProps> = ({
  data,
  chartType,
  xColumn,
  yColumn
}) => {
  const generateInsights = React.useMemo((): InsightData[] => {
    if (!data || data.length === 0) return [];

    const insights: InsightData[] = [];
    const values = data.map(d => d.value).filter(v => typeof v === 'number');
    
    if (values.length === 0) return insights;

    // Statistical calculations
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues[Math.floor(sortedValues.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // Coefficient of variation

    // 1. Distribution Analysis
    if (chartType === 'histogram' || chartType === 'boxplot') {
      if (cv > 0.5) {
        insights.push({
          type: 'distribution',
          title: 'High Variability Detected',
          description: `The data shows high variability with a coefficient of variation of ${(cv * 100).toFixed(1)}%. This suggests significant spread in the values.`,
          confidence: 0.9,
          impact: 'high',
          value: cv,
          recommendation: 'Consider investigating the causes of this variability or segmenting the data for better analysis.'
        });
      }

      // Skewness detection (simplified)
      const skewness = (mean - median) / stdDev;
      if (Math.abs(skewness) > 0.5) {
        insights.push({
          type: 'distribution',
          title: skewness > 0 ? 'Right-Skewed Distribution' : 'Left-Skewed Distribution',
          description: `The distribution is ${skewness > 0 ? 'right' : 'left'}-skewed, meaning most values are concentrated on the ${skewness > 0 ? 'left' : 'right'} side.`,
          confidence: 0.85,
          impact: 'medium',
          value: Math.abs(skewness),
          recommendation: skewness > 0 ? 'Consider log transformation for analysis.' : 'Look for potential data quality issues or natural lower bounds.'
        });
      }
    }

    // 2. Trend Analysis
    if (chartType === 'line' || chartType === 'area') {
      // Simple trend detection using linear regression
      const n = values.length;
      const xValues = Array.from({ length: n }, (_, i) => i);
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((acc, x, i) => acc + x * values[i], 0);
      const sumXX = xValues.reduce((acc, x) => acc + x * x, 0);
      
      const slope = (n * sumXY - sumX * sum) / (n * sumXX - sumX * sumX);
      const trendStrength = Math.abs(slope) / (range / n);

      if (trendStrength > 0.1) {
        insights.push({
          type: 'trend',
          title: slope > 0 ? 'Positive Trend Detected' : 'Negative Trend Detected',
          description: `There's a ${slope > 0 ? 'upward' : 'downward'} trend in the data with a strength of ${(trendStrength * 100).toFixed(1)}%.`,
          confidence: Math.min(0.95, 0.6 + trendStrength),
          impact: trendStrength > 0.3 ? 'high' : 'medium',
          value: slope,
          recommendation: `Monitor this trend closely as it shows ${slope > 0 ? 'growth' : 'decline'} over time.`
        });
      }
    }

    // 3. Outlier Detection
    const q1 = sortedValues[Math.floor(values.length * 0.25)];
    const q3 = sortedValues[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = values.filter(v => v < lowerBound || v > upperBound);

    if (outliers.length > 0) {
      const outlierPercentage = (outliers.length / values.length) * 100;
      insights.push({
        type: 'outlier',
        title: 'Outliers Detected',
        description: `Found ${outliers.length} outliers (${outlierPercentage.toFixed(1)}% of data) that fall outside the normal range.`,
        confidence: 0.95,
        impact: outlierPercentage > 5 ? 'high' : 'medium',
        value: outliers.length,
        recommendation: 'Investigate these outliers - they might represent errors, special cases, or important insights.'
      });
    }

    // 4. Comparison Analysis
    if (chartType === 'bar' && data.length > 1) {
      const topValue = Math.max(...values);
      const topCategory = data.find(d => d.value === topValue)?.category;
      const bottomValue = Math.min(...values);
      const bottomCategory = data.find(d => d.value === bottomValue)?.category;
      const ratio = topValue / bottomValue;

      if (ratio > 2) {
        insights.push({
          type: 'comparison',
          title: 'Significant Category Differences',
          description: `"${topCategory}" has ${ratio.toFixed(1)}x more than "${bottomCategory}", indicating significant variation between categories.`,
          confidence: 0.9,
          impact: ratio > 5 ? 'high' : 'medium',
          value: ratio,
          recommendation: 'Focus on understanding what drives the performance difference between top and bottom categories.'
        });
      }
    }

    // 5. Data Quality Insights
    const zeroCount = values.filter(v => v === 0).length;
    if (zeroCount > values.length * 0.1) {
      insights.push({
        type: 'distribution',
        title: 'High Number of Zero Values',
        description: `${((zeroCount / values.length) * 100).toFixed(1)}% of values are zero, which might indicate missing data or a specific business condition.`,
        confidence: 0.8,
        impact: 'medium',
        value: zeroCount,
        recommendation: 'Verify if zero values represent actual measurements or missing data that should be handled differently.'
      });
    }

    return insights.sort((a, b) => {
      // Sort by impact and confidence
      const impactWeight = { high: 3, medium: 2, low: 1 };
      return (impactWeight[b.impact] * b.confidence) - (impactWeight[a.impact] * a.confidence);
    });
  }, [data, chartType, xColumn, yColumn]);

  const getInsightIcon = (type: InsightData['type']) => {
    switch (type) {
      case 'trend': return '📈';
      case 'outlier': return '🎯';
      case 'correlation': return '🔗';
      case 'distribution': return '📊';
      case 'comparison': return '⚖️';
      default: return '💡';
    }
  };

  const getImpactColor = (impact: InsightData['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20';
    }
  };

  if (generateInsights.length === 0) {
    return (
      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="text-center text-gray-400">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-sm">No insights available for this data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white">AI Insights</h3>
        <span className="text-xs text-gray-400">({generateInsights.length} insights)</span>
      </div>

      <div className="space-y-3">
        {generateInsights.map((insight, index) => (
          <div
            key={index}
            className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="text-xl flex-shrink-0 mt-0.5">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-white text-sm">{insight.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs border ${getImpactColor(insight.impact)}`}>
                    {insight.impact}
                  </span>
                  <span className="text-xs text-gray-400">
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2 leading-relaxed">
                  {insight.description}
                </p>
                {insight.recommendation && (
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                    <strong>💡 Recommendation:</strong> {insight.recommendation}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
        <h4 className="text-sm font-medium text-white mb-3">Quick Statistics</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-400">Data Points:</span>
            <span className="text-white ml-2">{data.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Chart Type:</span>
            <span className="text-white ml-2 capitalize">{chartType}</span>
          </div>
          <div>
            <span className="text-gray-400">Columns:</span>
            <span className="text-white ml-2">{xColumn} × {yColumn}</span>
          </div>
          <div>
            <span className="text-gray-400">Insights:</span>
            <span className="text-white ml-2">{generateInsights.length} found</span>
          </div>
        </div>
      </div>
    </div>
  );
};