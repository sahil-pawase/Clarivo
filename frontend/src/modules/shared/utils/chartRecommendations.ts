/**
 * Shared chart recommendation utilities
 * Eliminates code duplication between components
 */

import { ColumnAnalysis } from './dataAnalysis';

export interface ChartRecommendation {
  type: 'bar' | 'line' | 'donut' | 'pie' | 'scatter' | 'histogram';
  title: string;
  xColumn: string;
  yColumn: string;
  reason: string;
  confidence: number;
}

/**
 * Generates chart recommendations based on column analysis
 */
export const generateChartRecommendations = (
  columnAnalyses: ColumnAnalysis[]
): ChartRecommendation[] => {
  const recommendations: ChartRecommendation[] = [];
  
  const categoricalColumns = columnAnalyses.filter(col => col.type === 'categorical');
  const numericColumns = columnAnalyses.filter(col => col.type === 'numeric');
  const dateColumns = columnAnalyses.filter(col => col.type === 'date');

  // Single column recommendations
  categoricalColumns.forEach(catCol => {
    recommendations.push(
      {
        type: 'bar',
        title: `${catCol.column} Distribution`,
        xColumn: catCol.column,
        yColumn: 'count',
        reason: 'Shows frequency of each category',
        confidence: 0.9
      },
      {
        type: 'donut',
        title: `${catCol.column} Breakdown`,
        xColumn: catCol.column,
        yColumn: 'count',
        reason: 'Visual proportion of categories',
        confidence: 0.85
      }
    );
  });

  numericColumns.forEach(numCol => {
    recommendations.push(
      {
        type: 'line',
        title: `${numCol.column} Trend`,
        xColumn: 'index',
        yColumn: numCol.column,
        reason: 'Shows progression over time/order',
        confidence: 0.8
      },
      {
        type: 'histogram',
        title: `${numCol.column} Distribution`,
        xColumn: numCol.column,
        yColumn: 'frequency',
        reason: 'Shows distribution of numeric values',
        confidence: 0.85
      }
    );
  });

  // Cross-column recommendations
  categoricalColumns.forEach(catCol => {
    numericColumns.forEach(numCol => {
      recommendations.push({
        type: 'bar',
        title: `${numCol.column} by ${catCol.column}`,
        xColumn: catCol.column,
        yColumn: numCol.column,
        reason: `Compare ${numCol.column} across different ${catCol.column} categories`,
        confidence: 0.95
      });
    });
  });

  // Time series recommendations
  if (dateColumns.length > 0) {
    const dateCol = dateColumns[0];
    numericColumns.forEach(numCol => {
      recommendations.push({
        type: 'line',
        title: `${numCol.column} over ${dateCol.column}`,
        xColumn: dateCol.column,
        yColumn: numCol.column,
        reason: 'Shows trend over time',
        confidence: 0.95
      });
    });
  }

  // Numeric vs Numeric (scatter plots)
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      recommendations.push({
        type: 'scatter',
        title: `${numericColumns[j].column} vs ${numericColumns[i].column}`,
        xColumn: numericColumns[i].column,
        yColumn: numericColumns[j].column,
        reason: 'Explore correlation between numeric values',
        confidence: 0.8
      });
    }
  }

  // Sort by confidence and limit results
  return recommendations
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);
};

/**
 * Gets appropriate icon for chart type
 */
export const getChartIcon = (type: string): string => {
  const icons: Record<string, string> = {
    bar: '📊',
    line: '📈',
    donut: '🍩',
    pie: '🥧',
    scatter: '📍',
    histogram: '📊',
    heatmap: '🔥'
  };
  return icons[type] || '📊';
};

/**
 * Gets appropriate icon for data type
 */
export const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    numeric: '🔢',
    categorical: '🏷️',
    date: '📅'
  };
  return icons[type] || '❓';
};