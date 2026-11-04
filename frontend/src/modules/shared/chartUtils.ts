export interface ChartDataPoint {
  category: string;
  value: number;
  [key: string]: any;
}

export const getChartColor = (index: number): string => {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6366f1', // indigo
  ];
  return colors[index % colors.length];
};

export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toLocaleString();
};

export const truncateCategory = (category: string, maxLength: number = 15): string => {
  if (category.length <= maxLength) {
    return category;
  }
  return category.substring(0, maxLength - 3) + '...';
};

export const shouldUseHorizontalBars = (categories: string[]): boolean => {
  // Use horizontal bars if there are many categories or long category names
  const hasLongNames = categories.some(cat => cat.length > 10);
  const hasManyCategories = categories.length > 8;
  return hasLongNames || hasManyCategories;
};

export const sanitizeChartData = (data: any[]): ChartDataPoint[] => {
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data.map((item, index) => ({
    category: item.category || item.name || `Item ${index + 1}`,
    value: typeof item.value === 'number' ? item.value : 0,
    ...item
  }));
};