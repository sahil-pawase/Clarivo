export interface ChartTheme {
  name: string;
  colors: {
    primary: string[];
    background: string;
    text: string;
    grid: string;
    axis: string;
  };
  gradients?: {
    [key: string]: string;
  };
}

export const chartThemes: Record<string, ChartTheme> = {
  default: {
    name: 'Default',
    colors: {
      primary: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
      background: '#1f2937',
      text: '#f9fafb',
      grid: '#374151',
      axis: '#6b7280'
    }
  },
  
  ocean: {
    name: 'Ocean',
    colors: {
      primary: ['#0ea5e9', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#1e40af', '#1d4ed8'],
      background: '#0f172a',
      text: '#e2e8f0',
      grid: '#1e293b',
      axis: '#475569'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
    }
  },
  
  sunset: {
    name: 'Sunset',
    colors: {
      primary: ['#f97316', '#ea580c', '#dc2626', '#b91c1c', '#991b1b', '#7c2d12', '#92400e', '#a16207'],
      background: '#1c1917',
      text: '#fef7cd',
      grid: '#292524',
      axis: '#57534e'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)'
    }
  },
  
  forest: {
    name: 'Forest',
    colors: {
      primary: ['#16a34a', '#15803d', '#166534', '#14532d', '#365314', '#4d7c0f', '#65a30d', '#84cc16'],
      background: '#0f1419',
      text: '#ecfdf5',
      grid: '#1f2937',
      axis: '#4b5563'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #16a34a 0%, #365314 100%)'
    }
  },
  
  purple: {
    name: 'Purple',
    colors: {
      primary: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#581c87', '#6b21a8', '#7e22ce'],
      background: '#1e1b4b',
      text: '#f3f4f6',
      grid: '#312e81',
      axis: '#6366f1'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
    }
  },
  
  monochrome: {
    name: 'Monochrome',
    colors: {
      primary: ['#6b7280', '#4b5563', '#374151', '#1f2937', '#111827', '#9ca3af', '#d1d5db', '#e5e7eb'],
      background: '#000000',
      text: '#ffffff',
      grid: '#1f2937',
      axis: '#4b5563'
    }
  },
  
  neon: {
    name: 'Neon',
    colors: {
      primary: ['#00ff88', '#00d4ff', '#ff0080', '#ffff00', '#ff8000', '#8000ff', '#ff0040', '#40ff00'],
      background: '#0a0a0a',
      text: '#ffffff',
      grid: '#1a1a1a',
      axis: '#333333'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)'
    }
  },
  
  pastel: {
    name: 'Pastel',
    colors: {
      primary: ['#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa', '#fb7185', '#fcd34d', '#4ade80'],
      background: '#f8fafc',
      text: '#1e293b',
      grid: '#e2e8f0',
      axis: '#64748b'
    }
  }
};

export const getThemeColors = (themeName: string): string[] => {
  return chartThemes[themeName]?.colors.primary || chartThemes.default.colors.primary;
};

export const getThemeColor = (themeName: string, index: number): string => {
  const colors = getThemeColors(themeName);
  return colors[index % colors.length];
};

export const applyThemeToChart = (themeName: string) => {
  const theme = chartThemes[themeName] || chartThemes.default;
  
  return {
    backgroundColor: theme.colors.background,
    textColor: theme.colors.text,
    gridColor: theme.colors.grid,
    axisColor: theme.colors.axis,
    colors: theme.colors.primary,
    gradients: theme.gradients
  };
};

// Color schemes for specific chart types
export const colorSchemes = {
  performance: {
    excellent: '#10b981', // Green
    good: '#84cc16',      // Light green
    average: '#f59e0b',   // Yellow
    poor: '#f97316',      // Orange
    critical: '#ef4444'   // Red
  },
  
  categorical: [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ],
  
  sequential: {
    blue: ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a'],
    green: ['#dcfce7', '#86efac', '#4ade80', '#16a34a', '#15803d', '#14532d'],
    red: ['#fee2e2', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#991b1b'],
    purple: ['#f3e8ff', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#5b21b6']
  },
  
  diverging: {
    redBlue: ['#b91c1c', '#dc2626', '#f87171', '#f3f4f6', '#60a5fa', '#3b82f6', '#1d4ed8'],
    orangeBlue: ['#ea580c', '#f97316', '#fb923c', '#f3f4f6', '#60a5fa', '#3b82f6', '#1d4ed8'],
    purpleGreen: ['#7c2d12', '#a16207', '#ca8a04', '#f3f4f6', '#65a30d', '#16a34a', '#14532d']
  }
};

export const getColorScheme = (schemeName: string, count?: number): string[] => {
  switch (schemeName) {
    case 'performance':
      return Object.values(colorSchemes.performance);
    case 'categorical':
      return colorSchemes.categorical.slice(0, count || colorSchemes.categorical.length);
    case 'sequential-blue':
      return colorSchemes.sequential.blue;
    case 'sequential-green':
      return colorSchemes.sequential.green;
    case 'sequential-red':
      return colorSchemes.sequential.red;
    case 'sequential-purple':
      return colorSchemes.sequential.purple;
    case 'diverging-redblue':
      return colorSchemes.diverging.redBlue;
    case 'diverging-orangeblue':
      return colorSchemes.diverging.orangeBlue;
    case 'diverging-purplegreen':
      return colorSchemes.diverging.purpleGreen;
    default:
      return chartThemes.default.colors.primary;
  }
};