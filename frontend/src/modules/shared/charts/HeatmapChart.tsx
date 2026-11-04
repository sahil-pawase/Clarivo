import React from 'react';
import { ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber } from '../chartUtils';

interface HeatmapData {
  x: string;
  y: string;
  value: number;
  category?: string;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple';
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  title,
  subtitle,
  width,
  height,
  colorScheme = 'blue'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Get unique x and y values
  const xValues = Array.from(new Set(data.map(d => d.x))).sort();
  const yValues = Array.from(new Set(data.map(d => d.y))).sort();
  
  // Find min and max values for color scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Color schemes
  const colorSchemes = {
    blue: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
    green: ['#14532d', '#16a34a', '#4ade80', '#86efac', '#dcfce7'],
    red: ['#7f1d1d', '#dc2626', '#f87171', '#fca5a5', '#fee2e2'],
    purple: ['#581c87', '#9333ea', '#a855f7', '#c084fc', '#e9d5ff']
  };
  
  const colors = colorSchemes[colorScheme];
  
  // Function to get color based on value
  const getColor = (value: number): string => {
    if (minValue === maxValue) return colors[2]; // Middle color if all values are the same
    
    const normalized = (value - minValue) / (maxValue - minValue);
    const colorIndex = Math.floor(normalized * (colors.length - 1));
    return colors[Math.min(colorIndex, colors.length - 1)];
  };
  
  // Create a map for quick lookup
  const dataMap = new Map<string, number>();
  data.forEach(d => {
    dataMap.set(`${d.x}-${d.y}`, d.value);
  });
  
  const [hoveredCell, setHoveredCell] = React.useState<{x: string, y: string, value: number} | null>(null);
  const [mousePosition, setMousePosition] = React.useState<{x: number, y: number}>({x: 0, y: 0});

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="w-full h-full p-2">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      )}
      {subtitle && (
        <p className="text-sm text-gray-400 mb-2">{subtitle}</p>
      )}
      
      <div className="mb-2 text-xs text-gray-400">
        Heatmap • {xValues.length} × {yValues.length} cells
      </div>
      
      <div className="flex-1 w-full relative" style={{ height: title || subtitle ? 'calc(100% - 80px)' : 'calc(100% - 20px)' }}>
        <div className="w-full h-full overflow-auto">
          <div className="min-w-full min-h-full p-4">
            {/* Y-axis labels */}
            <div className="flex">
              <div className="w-20 flex flex-col justify-between pr-2">
                {yValues.map((y, index) => (
                  <div 
                    key={y} 
                    className="text-xs text-gray-400 text-right py-1"
                    style={{ height: `${100 / yValues.length}%` }}
                  >
                    {y}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="flex-1">
                <div className="grid gap-1" style={{ 
                  gridTemplateColumns: `repeat(${xValues.length}, 1fr)`,
                  gridTemplateRows: `repeat(${yValues.length}, 1fr)`,
                  aspectRatio: `${xValues.length} / ${yValues.length}`
                }}>
                  {yValues.map(y => 
                    xValues.map(x => {
                      const value = dataMap.get(`${x}-${y}`) || 0;
                      const color = getColor(value);
                      
                      return (
                        <div
                          key={`${x}-${y}`}
                          className="relative rounded cursor-pointer transition-all duration-200 hover:scale-105 hover:z-10"
                          style={{ 
                            backgroundColor: color,
                            minHeight: '20px',
                            minWidth: '20px'
                          }}
                          onMouseEnter={() => setHoveredCell({ x, y, value })}
                          onMouseLeave={() => setHoveredCell(null)}
                          onMouseMove={handleMouseMove}
                        >
                          {/* Optional: Show value in cell if space allows */}
                          {xValues.length <= 10 && yValues.length <= 10 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-medium text-white drop-shadow-sm">
                                {formatNumber(value)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* X-axis labels */}
                <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: `repeat(${xValues.length}, 1fr)` }}>
                  {xValues.map(x => (
                    <div key={x} className="text-xs text-gray-400 text-center">
                      {x}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Color scale legend */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-400">Low</span>
              <div className="flex h-4 w-32 rounded overflow-hidden">
                {colors.map((color, index) => (
                  <div 
                    key={index}
                    className="flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">High</span>
              <span className="text-xs text-gray-500 ml-2">
                {formatNumber(minValue)} - {formatNumber(maxValue)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Custom tooltip */}
        {hoveredCell && (
          <div 
            className="fixed bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg z-50 pointer-events-none"
            style={{ 
              left: mousePosition.x + 10, 
              top: mousePosition.y - 10,
              transform: 'translate(0, -100%)'
            }}
          >
            <div className="text-white font-medium mb-1">
              {hoveredCell.x} × {hoveredCell.y}
            </div>
            <div className="text-sm text-blue-400">
              Value: {formatNumber(hoveredCell.value)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};