import React from 'react';
import { useTheme } from '../shared/design/ThemeProvider';

interface ChartInstance {
  id: string;
  type: 'bar' | 'line' | 'donut' | 'pie' | 'scatter' | 'histogram' | 'heatmap' | 'area' | 'boxplot';
  title: string;
  subtitle?: string;
  xColumn: string;
  yColumn: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any[];
  config: any;
}

interface EnhancedChartCardProps {
  chart: ChartInstance;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onResize: (size: { width: number; height: number }) => void;
  children: React.ReactNode;
}

export const EnhancedChartCard: React.FC<EnhancedChartCardProps> = ({
  chart,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onDelete,
  onMove,
  onResize,
  children
}) => {
  const { theme } = useTheme();

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.classList.contains('resize-handle')) {
      return; // Let resize handle take precedence
    }
    onSelect();
  };

  return (
    <div
      className={`enhanced-chart-card ${isSelected ? 'selected' : ''}`}
      style={{
        left: chart.position.x,
        top: chart.position.y,
        width: chart.size.width,
        height: chart.size.height,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Chart Header */}
      <div className="enhanced-chart-card-header">
        <div className="flex-1 min-w-0">
          <h3 className="enhanced-chart-card-title">{chart.title}</h3>
          {chart.subtitle && (
            <p className="enhanced-chart-card-subtitle">{chart.subtitle}</p>
          )}
        </div>
        
        <div className="enhanced-chart-card-actions">
          <button
            className="enhanced-chart-card-action"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit chart"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            className="enhanced-chart-card-action"
            onClick={(e) => {
              e.stopPropagation();
              // Add duplicate functionality
            }}
            title="Duplicate chart"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button
            className="enhanced-chart-card-action"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete chart"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="enhanced-chart-card-content">
        {children}
      </div>

      {/* Resize Handle */}
      <div 
        className="enhanced-chart-card-resize-handle resize-handle"
        onMouseDown={(e) => {
          e.stopPropagation();
          // Resize logic would be handled by parent component
        }}
      />

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 border-blue-500 rounded-lg" />
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  );
};