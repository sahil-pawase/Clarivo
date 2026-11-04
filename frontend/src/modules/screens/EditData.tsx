import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDatasets } from '../state/DatasetsContext';
import toast from 'react-hot-toast';

interface EditDataProps {
  datasetId?: string;
}

interface CellData {
  value: any;
  type: 'string' | 'number' | 'boolean' | 'date';
  isEditing: boolean;
  isModified?: boolean;
}

interface FilterConfig {
  column: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'not_empty' | 'empty';
  value: string;
}

export const EditData: React.FC<EditDataProps> = ({ datasetId }) => {
  const { datasets, preview } = useDatasets();
  const [data, setData] = useState<CellData[][]>([]);
  const [originalData, setOriginalData] = useState<CellData[][]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [anchorCell, setAnchorCell] = useState<{ row: number; col: number } | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ startRow: number; endRow: number; startCol: number; endCol: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
  const [clipboard, setClipboard] = useState<any[][]>([]);
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Initialize data from preview
  useEffect(() => {
    if (preview?.data && preview?.columns) {
      const cols = preview.columns;
      const rows = preview.data.slice(0, 500); // Increased limit for better editing experience
      
      setColumns(cols);
      
      const cellData: CellData[][] = rows.map(row => 
        cols.map(col => ({
          value: row[col] ?? '',
          type: inferType(row[col]),
          isEditing: false,
          isModified: false
        }))
      );
      
      setData(cellData);
      setOriginalData(JSON.parse(JSON.stringify(cellData))); // Deep copy for comparison
    }
  }, [preview]);

  const inferType = (value: any): 'string' | 'number' | 'boolean' | 'date' => {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string' && !isNaN(Date.parse(value))) return 'date';
    if (typeof value === 'string' && !isNaN(Number(value))) return 'number';
    return 'string';
  };

  const handleCellClick = (row: number, col: number, e?: React.MouseEvent) => {
    const isShift = !!e?.shiftKey;
    if (isShift && anchorCell) {
      const startRow = Math.min(anchorCell.row, row);
      const endRow = Math.max(anchorCell.row, row);
      const startCol = Math.min(anchorCell.col, col);
      const endCol = Math.max(anchorCell.col, col);
      setSelectionRange({ startRow, endRow, startCol, endCol });
      setSelectedCell({ row, col });
      return;
    }

    setAnchorCell({ row, col });
    setSelectionRange(null);
    setSelectedCell({ row, col });
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell({ row, col });
    setEditValue(String(data[row][col].value));
  };

  const handleCellEdit = (value: string) => {
    if (!editingCell) return;
    
    const { row, col } = editingCell;
    const newData = [...data];
    const cellType = newData[row][col].type;
    
    let parsedValue: any = value;
    
    // Parse value based on type
    switch (cellType) {
      case 'number':
        parsedValue = isNaN(Number(value)) ? value : Number(value);
        break;
      case 'boolean':
        parsedValue = value.toLowerCase() === 'true';
        break;
      case 'date':
        parsedValue = new Date(value);
        break;
      default:
        parsedValue = value;
    }
    
    newData[row][col] = {
      ...newData[row][col],
      value: parsedValue,
      isEditing: false,
      isModified: true
    };
    
    setData(newData);
    setEditingCell(null);
    setHasChanges(true);
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    if (filters.length > 0) {
      result = result.filter((row, rowIndex) => {
        return filters.every(filter => {
          const colIndex = columns.indexOf(filter.column);
          if (colIndex === -1) return true;
          
          const cellValue = String(row[colIndex].value).toLowerCase();
          const filterValue = filter.value.toLowerCase();
          
          switch (filter.operator) {
            case 'equals':
              return cellValue === filterValue;
            case 'contains':
              return cellValue.includes(filterValue);
            case 'greater':
              return Number(cellValue) > Number(filterValue);
            case 'less':
              return Number(cellValue) < Number(filterValue);
            case 'not_empty':
              return cellValue !== '' && cellValue !== 'null' && cellValue !== 'undefined';
            case 'empty':
              return cellValue === '' || cellValue === 'null' || cellValue === 'undefined';
            default:
              return true;
          }
        });
      });
    }

    // Apply search
    if (searchTerm) {
      result = result.filter(row => 
        row.some(cell => 
          String(cell.value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortConfig) {
      const colIndex = columns.indexOf(sortConfig.column);
      if (colIndex !== -1) {
        result.sort((a, b) => {
          const aVal = a[colIndex].value;
          const bVal = b[colIndex].value;
          
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }

    return result;
  }, [data, filters, searchTerm, sortConfig, columns]);

  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev?.column === column) {
        return prev.direction === 'asc' 
          ? { column, direction: 'desc' }
          : null;
      }
      return { column, direction: 'asc' };
    });
  };

  const addFilter = () => {
    setFilters([...filters, { column: columns[0] || '', operator: 'contains', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: keyof FilterConfig, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Global shortcuts (work even without cell selection)
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'c':
          e.preventDefault();
          copySelection();
          return;
        case 'v':
          e.preventDefault();
          pasteSelection();
          return;
        case 'a':
          e.preventDefault();
          if (data.length > 0 && columns.length > 0) {
            setSelectionRange({ startRow: 0, endRow: data.length - 1, startCol: 0, endCol: columns.length - 1 });
            setSelectedCell({ row: 0, col: 0 });
          }
          return;
      }
    }

    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    
    switch (e.key) {
      case 'Enter':
        if (editingCell) {
          handleCellEdit(editValue);
        } else {
          handleCellDoubleClick(row, col);
        }
        break;
      case 'Escape':
        setEditingCell(null);
        setEditValue('');
        setShowContextMenu(null);
        break;
      case 'ArrowUp':
        if (row > 0) setSelectedCell({ row: row - 1, col });
        break;
      case 'ArrowDown':
        if (row < data.length - 1) setSelectedCell({ row: row + 1, col });
        break;
      case 'ArrowLeft':
        if (col > 0) setSelectedCell({ row, col: col - 1 });
        break;
      case 'ArrowRight':
        if (col < columns.length - 1) setSelectedCell({ row, col: col + 1 });
        break;
      case 'Delete':
        if (!editingCell) {
          clearSelection();
        }
        break;
    }
  };

  const isCellInSelection = (r: number, c: number): boolean => {
    if (selectionRange) {
      const { startRow, endRow, startCol, endCol } = selectionRange;
      return r >= startRow && r <= endRow && c >= startCol && c <= endCol;
    }
    return selectedCell?.row === r && selectedCell?.col === c;
  };

  const selectedCellsValues = useMemo(() => {
    if (!data.length) return [] as number[];
    const values: number[] = [];
    if (selectionRange) {
      for (let r = selectionRange.startRow; r <= selectionRange.endRow; r++) {
        for (let c = selectionRange.startCol; c <= selectionRange.endCol; c++) {
          const v = data[r]?.[c]?.value;
          const num = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)) ? Number(v) : null);
          if (num != null && Number.isFinite(num)) values.push(num);
        }
      }
    } else if (selectedCell) {
      const v = data[selectedCell.row]?.[selectedCell.col]?.value;
      const num = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)) ? Number(v) : null);
      if (num != null && Number.isFinite(num)) values.push(num);
    }
    return values;
  }, [data, selectionRange, selectedCell]);

  const selectionStats = useMemo(() => {
    const count = selectedCellsValues.length;
    if (count === 0) return { 
      count: 0, sum: 0, avg: 0, min: undefined as number | undefined, max: undefined as number | undefined,
      product: 0, median: 0, stdDev: 0
    };
    const sum = selectedCellsValues.reduce((acc, n) => acc + n, 0);
    const product = selectedCellsValues.reduce((acc, n) => acc * n, 1);
    const min = Math.min(...selectedCellsValues);
    const max = Math.max(...selectedCellsValues);
    const avg = sum / count;
    
    // Calculate median
    const sorted = [...selectedCellsValues].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    // Calculate standard deviation
    const variance = selectedCellsValues.reduce((acc, n) => acc + Math.pow(n - avg, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    
    return { count, sum, avg, min, max, product, median, stdDev };
  }, [selectedCellsValues]);

  // Copy selected cells to clipboard
  const copySelection = () => {
    if (!selectionRange && !selectedCell) return;
    
    let cellsToCopy: any[][] = [];
    
    if (selectionRange) {
      const { startRow, endRow, startCol, endCol } = selectionRange;
      for (let r = startRow; r <= endRow; r++) {
        const row: any[] = [];
        for (let c = startCol; c <= endCol; c++) {
          row.push(data[r]?.[c]?.value ?? '');
        }
        cellsToCopy.push(row);
      }
    } else if (selectedCell) {
      cellsToCopy = [[data[selectedCell.row]?.[selectedCell.col]?.value ?? '']];
    }
    
    setClipboard(cellsToCopy);
    toast.success(`Copied ${cellsToCopy.length} × ${cellsToCopy[0]?.length || 0} cells`);
  };

  // Paste clipboard to selected area
  const pasteSelection = () => {
    if (clipboard.length === 0 || (!selectionRange && !selectedCell)) return;
    
    const newData = [...data];
    let startRow = 0, startCol = 0;
    
    if (selectionRange) {
      startRow = selectionRange.startRow;
      startCol = selectionRange.startCol;
    } else if (selectedCell) {
      startRow = selectedCell.row;
      startCol = selectedCell.col;
    }
    
    clipboard.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        const targetRow = startRow + rowIndex;
        const targetCol = startCol + colIndex;
        
        if (targetRow < data.length && targetCol < columns.length) {
          newData[targetRow][targetCol] = {
            ...newData[targetRow][targetCol],
            value: value,
            isModified: true
          };
        }
      });
    });
    
    setData(newData);
    setHasChanges(true);
    toast.success(`Pasted ${clipboard.length} × ${clipboard[0]?.length || 0} cells`);
  };

  // Clear selected cells
  const clearSelection = () => {
    if (!selectionRange && !selectedCell) return;
    
    const newData = [...data];
    
    if (selectionRange) {
      const { startRow, endRow, startCol, endCol } = selectionRange;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (newData[r]?.[c]) {
            newData[r][c] = { ...newData[r][c], value: '', isModified: true };
          }
        }
      }
    } else if (selectedCell) {
      newData[selectedCell.row][selectedCell.col] = {
        ...newData[selectedCell.row][selectedCell.col],
        value: '',
        isModified: true
      };
    }
    
    setData(newData);
    setHasChanges(true);
    toast.success('Cleared selected cells');
  };

  // Fill down operation
  const fillDown = () => {
    if (!selectionRange) return;
    
    const { startRow, endRow, startCol, endCol } = selectionRange;
    const newData = [...data];
    
    for (let c = startCol; c <= endCol; c++) {
      const sourceValue = data[startRow][c].value;
      for (let r = startRow + 1; r <= endRow; r++) {
        newData[r][c] = { ...newData[r][c], value: sourceValue, isModified: true };
      }
    }
    
    setData(newData);
    setHasChanges(true);
    toast.success('Filled down');
  };

  // Fill right operation
  const fillRight = () => {
    if (!selectionRange) return;
    
    const { startRow, endRow, startCol, endCol } = selectionRange;
    const newData = [...data];
    
    for (let r = startRow; r <= endRow; r++) {
      const sourceValue = data[r][startCol].value;
      for (let c = startCol + 1; c <= endCol; c++) {
        newData[r][c] = { ...newData[r][c], value: sourceValue, isModified: true };
      }
    }
    
    setData(newData);
    setHasChanges(true);
    toast.success('Filled right');
  };

  const addRow = () => {
    const newRow: CellData[] = columns.map(() => ({
      value: '',
      type: 'string',
      isEditing: false
    }));
    setData([...data, newRow]);
    setHasChanges(true);
  };

  const deleteRow = (rowIndex: number) => {
    const newData = data.filter((_, index) => index !== rowIndex);
    setData(newData);
    setHasChanges(true);
    
    // Adjust selected cell if necessary
    if (selectedCell && selectedCell.row === rowIndex) {
      setSelectedCell(null);
    } else if (selectedCell && selectedCell.row > rowIndex) {
      setSelectedCell({ ...selectedCell, row: selectedCell.row - 1 });
    }
  };

  const saveChanges = async () => {
    try {
      // Convert cell data back to regular data format
      const exportData = data.map(row => {
        const rowData: any = {};
        row.forEach((cell, colIndex) => {
          rowData[columns[colIndex]] = cell.value;
        });
        return rowData;
      });
      
      // Here you would send the data to your backend API
      // For now, we'll just show a success message
      toast.success('Changes saved successfully!');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  if (!preview?.data) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Dataset Selected</h3>
          <p className="text-sm">Please select a dataset to edit its data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-white">Edit Data</h2>
          <p className="text-sm text-gray-400">
            {data.length} rows × {columns.length} columns
            {hasChanges && <span className="text-yellow-400 ml-2">• Unsaved changes</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Row
          </button>
          <button
            onClick={saveChanges}
            disabled={!hasChanges}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Operations Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-1">
          <button
            onClick={copySelection}
            disabled={!selectedCell && !selectionRange}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
            title="Copy (Ctrl+C)"
          >
            Copy
          </button>
          <button
            onClick={pasteSelection}
            disabled={clipboard.length === 0}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
            title="Paste (Ctrl+V)"
          >
            Paste
          </button>
          <button
            onClick={clearSelection}
            disabled={!selectedCell && !selectionRange}
            className="px-3 py-1 bg-red-700 text-red-200 rounded hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
            title="Clear (Delete)"
          >
            Clear
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-600"></div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={fillDown}
            disabled={!selectionRange}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
            title="Fill Down"
          >
            Fill ↓
          </button>
          <button
            onClick={fillRight}
            disabled={!selectionRange}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
            title="Fill Right"
          >
            Fill →
          </button>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto" onKeyDown={handleKeyDown} tabIndex={0}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-800 z-10">
            <tr>
              <th className="w-12 p-2 border border-gray-600 bg-gray-700 text-gray-300 text-xs">#</th>
              {columns.map((col, colIndex) => (
                <th
                  key={colIndex}
                  className="min-w-32 p-2 border border-gray-600 bg-gray-700 text-gray-300 text-xs font-medium text-left"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-800/50">
                <td className="p-2 border border-gray-600 bg-gray-800 text-gray-400 text-xs text-center">
                  <div className="flex items-center justify-between">
                    <span>{rowIndex + 1}</span>
                    <button
                      onClick={() => deleteRow(rowIndex)}
                      className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete row"
                    >
                      ×
                    </button>
                  </div>
                </td>
                {row.map((cell, colIndex) => {
                  const isSelected = isCellInSelection(rowIndex, colIndex);
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                  
                  return (
                    <td
                      key={colIndex}
                      className={`p-0 border border-gray-600 ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-900/20' : 'bg-gray-900'
                      }`}
                      onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellEdit(editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellEdit(editValue);
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                              setEditValue('');
                            }
                          }}
                          className="w-full h-full p-2 bg-transparent text-white text-sm outline-none"
                          autoFocus
                        />
                      ) : (
                        <div className="p-2 text-sm text-gray-200 min-h-8 cursor-cell">
                          {String(cell.value)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-700 bg-gray-800 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <div>
            Use arrow keys to navigate • Double-click or Enter to edit • Delete key to clear cell • Hold Shift to multi-select • Ctrl+C/V for copy/paste • Ctrl+A to select all
          </div>
          <div className="flex items-center gap-4">
            {selectedCell && (
              <span>
                Selected: Row {selectedCell.row + 1}, Column {columns[selectedCell.col]}
              </span>
            )}
            {(selectionStats.count > 0) && (
              <div className="flex items-center gap-2 text-gray-300">
                <span>Count: {selectionStats.count}</span>
                <span>Sum: {selectionStats.sum.toFixed(2)}</span>
                <span>Avg: {Number.isFinite(selectionStats.avg) ? selectionStats.avg.toFixed(2) : '-'}</span>
                <span>Min: {selectionStats.min ?? '-'}</span>
                <span>Max: {selectionStats.max ?? '-'}</span>
                <span>Product: {selectionStats.product.toExponential(2)}</span>
                <span>Median: {Number.isFinite(selectionStats.median) ? selectionStats.median.toFixed(2) : '-'}</span>
                <span>Std Dev: {Number.isFinite(selectionStats.stdDev) ? selectionStats.stdDev.toFixed(2) : '-'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};