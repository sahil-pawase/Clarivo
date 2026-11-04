/**
 * Shared data analysis utilities to eliminate code duplication
 * and provide consistent data processing across components
 */

export interface DataRow {
  [key: string]: any;
}

export interface ColumnAnalysis {
  column: string;
  type: 'numeric' | 'categorical' | 'date';
  uniqueValues: number;
  nullValues: number;
  sampleValues: any[];
  missingPercentage: number;
}

/**
 * Analyzes data columns to determine their types and characteristics
 */
export const analyzeColumns = (data: DataRow[], columns: string[]): ColumnAnalysis[] => {
  if (!data || data.length === 0 || !columns || columns.length === 0) {
    return [];
  }

  return columns.map(column => {
    const values = data.map(row => row[column]).filter(val => val != null && val !== '');
    const uniqueValues = new Set(values).size;
    const nullValues = data.length - values.length;
    const sampleValues = Array.from(new Set(values)).slice(0, 5);
    const missingPercentage = Math.round((nullValues / data.length) * 100);

    // Determine column type with improved accuracy
    const numericValues = values.filter(val => !isNaN(Number(val)) && isFinite(Number(val)));
    const isNumeric = numericValues.length / values.length > 0.7;
    
    // Strict date detection to avoid false positives
    const isDate = values.some(val => {
      const str = String(val);
      return (/[\-\/\.]/.test(str) || /\d{4}/.test(str)) && 
             !isNaN(Date.parse(str)) && 
             isNaN(Number(val));
    });
    
    const type: 'numeric' | 'categorical' | 'date' = 
      isNumeric ? 'numeric' : isDate ? 'date' : 'categorical';

    return {
      column,
      type,
      uniqueValues,
      nullValues,
      sampleValues,
      missingPercentage
    };
  });
};

/**
 * Detects outliers using the IQR method
 */
export const detectOutliersIQR = (
  data: DataRow[], 
  column: string, 
  iqrFactor: number = 1.5
): number[] => {
  const values = data.map(r => r[column]).filter((v): v is number => typeof v === 'number');
  
  if (values.length < 4) return [];
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - iqrFactor * iqr;
  const upperBound = q3 + iqrFactor * iqr;
  
  const outlierIndices: number[] = [];
  data.forEach((row, index) => {
    const value = row[column];
    if (typeof value === 'number' && (value < lowerBound || value > upperBound)) {
      outlierIndices.push(index);
    }
  });
  
  return outlierIndices;
};

/**
 * Calculates missing value statistics for all columns
 */
export const calculateMissingValueStats = (
  data: DataRow[], 
  columns: string[]
): Array<{ col: string; count: number; percentage: number }> => {
  if (!data.length || !columns.length) return [];
  
  const total = data.length;
  return columns.map(col => {
    const missing = data.filter(row => row[col] == null || row[col] === '').length;
    return {
      col,
      count: missing,
      percentage: Math.round((missing / total) * 100)
    };
  }).sort((a, b) => b.percentage - a.percentage);
};

/**
 * Removes duplicate rows from data
 */
export const removeDuplicateRows = (data: DataRow[]): DataRow[] => {
  const seen = new Set<string>();
  return data.filter(row => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Standardizes text values in specified columns
 */
export const standardizeTextValues = (
  data: DataRow[], 
  columns: string[], 
  mode: 'lower' | 'upper' | 'title' = 'lower'
): DataRow[] => {
  return data.map(row => {
    const newRow = { ...row };
    columns.forEach(col => {
      const value = newRow[col];
      if (typeof value === 'string') {
        const trimmed = value.trim().replace(/\s+/g, ' ');
        switch (mode) {
          case 'upper':
            newRow[col] = trimmed.toUpperCase();
            break;
          case 'title':
            newRow[col] = trimmed.replace(/\w\S*/g, (word) => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            );
            break;
          default:
            newRow[col] = trimmed.toLowerCase();
        }
      }
    });
    return newRow;
  });
};

/**
 * Converts numeric-like strings to numbers
 */
export const convertNumericStrings = (data: DataRow[], columns: string[]): DataRow[] => {
  return data.map(row => {
    const newRow = { ...row };
    columns.forEach(col => {
      const value = newRow[col];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^[+-]?\d+(?:\.\d+)?$/.test(trimmed)) {
          const num = parseFloat(trimmed);
          if (!Number.isNaN(num)) {
            newRow[col] = num;
          }
        }
      }
    });
    return newRow;
  });
};

/**
 * Fills missing values using intelligent strategies
 */
export const fillMissingValues = (data: DataRow[], columns: string[]): DataRow[] => {
  return data.map(row => {
    const newRow = { ...row };
    columns.forEach(col => {
      if (newRow[col] == null || newRow[col] === '') {
        // Get non-null values for this column
        const nonNullValues = data.map(r => r[col]).filter(v => v != null && v !== '');
        
        if (nonNullValues.length > 0) {
          const firstValue = nonNullValues[0];
          
          if (typeof firstValue === 'number') {
            // Use median for numeric values
            const sorted = nonNullValues.sort((a, b) => a - b);
            newRow[col] = sorted[Math.floor(sorted.length / 2)];
          } else {
            // Use mode (most frequent value) for categorical values
            const counts = nonNullValues.reduce((acc, val) => {
              acc[val] = (acc[val] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            newRow[col] = Object.keys(counts).reduce((a, b) => 
              counts[a] > counts[b] ? a : b
            );
          }
        }
      }
    });
    return newRow;
  });
};