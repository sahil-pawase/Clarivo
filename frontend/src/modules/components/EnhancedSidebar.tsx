import React from 'react';
import { useTheme, useThemeStyles } from '../shared/design/ThemeProvider';
import { useDatasets } from '../state/DatasetsContext';

interface EnhancedSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  isCollapsed,
  onToggleCollapse
}) => {
  const { theme, toggleTheme } = useTheme();
  const styles = useThemeStyles();
  const { datasets, selectedId, preview, select } = useDatasets();

  const currentDataset = datasets.find(d => d.id === selectedId);
  const columns = preview?.columns || [];
  const data = preview?.data || [];

  // Get column types for better display
  const getColumnType = (column: string) => {
    if (!data.length) return 'string';
    const sample = data.slice(0, 10);
    const values = sample.map(row => row[column]).filter(v => v != null);
    
    if (values.some(v => typeof v === 'number')) return 'number';
    if (values.some(v => typeof v === 'string' && !isNaN(Date.parse(v)))) return 'date';
    return 'string';
  };

  const numericColumns = columns.filter(col => getColumnType(col) === 'number');
  const categoricalColumns = columns.filter(col => getColumnType(col) === 'string');
  const dateColumns = columns.filter(col => getColumnType(col) === 'date');

  if (isCollapsed) {
    return (
      <div className="enhanced-sidebar" style={{ width: '64px' }}>
        <div className="enhanced-sidebar-header">
          <button
            onClick={onToggleCollapse}
            className="enhanced-button enhanced-button-ghost w-full h-10 flex items-center justify-center"
            title="Expand sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        <div className="enhanced-sidebar-section">
          <div className="flex flex-col items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-sidebar" style={{ width: '320px' }}>
      {/* Header */}
      <div className="enhanced-sidebar-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Dashboard</h2>
              <p className="text-xs text-secondary">Cricket Player Stats</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="enhanced-button enhanced-button-ghost w-8 h-8 p-0 flex items-center justify-center"
              title="Toggle theme"
            >
              {theme.id === 'dark' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={onToggleCollapse}
              className="enhanced-button enhanced-button-ghost w-8 h-8 p-0 flex items-center justify-center"
              title="Collapse sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Info Section */}
      <div className="enhanced-sidebar-section">
        <div className="enhanced-sidebar-section-title">Dataset</div>
        <div className="px-6 space-y-3">
          {currentDataset ? (
            <div className="enhanced-card">
              <div className="enhanced-card-content p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-primary truncate">{currentDataset.name}</h3>
                    <p className="text-xs text-secondary">Excel file</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center p-2 rounded-lg surface-secondary">
                    <div className="font-semibold text-primary">{data.length}</div>
                    <div className="text-xs text-secondary">rows</div>
                  </div>
                  <div className="text-center p-2 rounded-lg surface-secondary">
                    <div className="font-semibold text-primary">{columns.length}</div>
                    <div className="text-xs text-secondary">columns</div>
                  </div>
                </div>
                
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-secondary">Numeric:</span>
                    <span className="text-primary font-medium">{numericColumns.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Categorical:</span>
                    <span className="text-primary font-medium">{categoricalColumns.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Date:</span>
                    <span className="text-primary font-medium">{dateColumns.length}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="enhanced-empty-state py-8">
              <div className="enhanced-empty-state-icon">
                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="enhanced-empty-state-title">No Dataset Selected</div>
              <div className="enhanced-empty-state-description">
                Choose a dataset to start creating visualizations
              </div>
              <div className="mt-4">
                <select
                  className="enhanced-input text-sm"
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
          )}
        </div>
      </div>

      {/* Actions Section */}
      <div className="enhanced-sidebar-section">
        <div className="enhanced-sidebar-section-title">Actions</div>
        <div className="px-6 space-y-2">
          <button className="enhanced-button enhanced-button-primary w-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Chart
          </button>
          <button className="enhanced-button enhanced-button-secondary w-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Add Filter
          </button>
          <button className="enhanced-button enhanced-button-ghost w-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Dashboard
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="enhanced-sidebar-section flex-1">
        <div className="enhanced-sidebar-section-title">Charts (4)</div>
        <div className="px-6 space-y-2 max-h-40 overflow-y-auto">
          <div className="enhanced-sidebar-item selected">
            <div className="enhanced-sidebar-item-icon">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="enhanced-sidebar-item-content">
              <div className="enhanced-sidebar-item-title">Country Box Plot</div>
              <div className="enhanced-sidebar-item-subtitle">boxplot • Country × Test Runs</div>
            </div>
          </div>
          
          <div className="enhanced-sidebar-item">
            <div className="enhanced-sidebar-item-icon">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="enhanced-sidebar-item-content">
              <div className="enhanced-sidebar-item-title">T20 Runs Trend</div>
              <div className="enhanced-sidebar-item-subtitle">area • index × T20 Runs</div>
            </div>
          </div>
          
          <div className="enhanced-sidebar-item">
            <div className="enhanced-sidebar-item-icon">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="enhanced-sidebar-item-content">
              <div className="enhanced-sidebar-item-title">ODI Runs Trend</div>
              <div className="enhanced-sidebar-item-subtitle">area • index × ODI Runs</div>
            </div>
          </div>
          
          <div className="enhanced-sidebar-item">
            <div className="enhanced-sidebar-item-icon">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
            </div>
            <div className="enhanced-sidebar-item-content">
              <div className="enhanced-sidebar-item-title">Country Breakdown</div>
              <div className="enhanced-sidebar-item-subtitle">donut • Country × count</div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="enhanced-sidebar-section">
        <div className="enhanced-sidebar-section-title">Export</div>
        <div className="px-6 space-y-2">
          <button className="enhanced-button enhanced-button-ghost w-full text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Export as PNG
          </button>
          <button className="enhanced-button enhanced-button-ghost w-full text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
};