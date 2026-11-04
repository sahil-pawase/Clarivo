import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { EnhancedTheme, themes, defaultTheme } from './themes';

interface ThemeContextType {
  theme: EnhancedTheme;
  themeId: string;
  setTheme: (themeId: string) => void;
  toggleTheme: () => void;
  availableThemes: Record<string, EnhancedTheme>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultThemeId?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultThemeId = 'dark' 
}) => {
  const [themeId, setThemeId] = useState<string>(() => {
    // Try to load theme from localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('clarivo-theme');
      return savedTheme || defaultThemeId;
    }
    return defaultThemeId;
  });

  const theme = themes[themeId] || defaultTheme;

  const setTheme = (newThemeId: string) => {
    if (themes[newThemeId]) {
      setThemeId(newThemeId);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('clarivo-theme', newThemeId);
      }
    }
  };

  const toggleTheme = () => {
    const newThemeId = themeId === 'dark' ? 'light' : 'dark';
    setTheme(newThemeId);
  };

  // Apply CSS custom properties when theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      // Apply color variables
      Object.entries(theme.colors.background).forEach(([key, value]) => {
        root.style.setProperty(`--color-background-${key}`, value);
      });
      
      Object.entries(theme.colors.surface).forEach(([key, value]) => {
        root.style.setProperty(`--color-surface-${key}`, value);
      });
      
      Object.entries(theme.colors.border).forEach(([key, value]) => {
        root.style.setProperty(`--color-border-${key}`, value);
      });
      
      Object.entries(theme.colors.text).forEach(([key, value]) => {
        root.style.setProperty(`--color-text-${key}`, value);
      });
      
      Object.entries(theme.colors.accent).forEach(([key, value]) => {
        root.style.setProperty(`--color-accent-${key}`, value);
      });

      // Apply component theme variables
      root.style.setProperty('--card-background', theme.components.card.background);
      root.style.setProperty('--card-border', theme.components.card.border);
      root.style.setProperty('--card-shadow', theme.components.card.shadow);
      root.style.setProperty('--card-hover-background', theme.components.card.hover.background);
      root.style.setProperty('--card-hover-border', theme.components.card.hover.border);
      root.style.setProperty('--card-hover-shadow', theme.components.card.hover.shadow);

      root.style.setProperty('--sidebar-background', theme.components.sidebar.background);
      root.style.setProperty('--sidebar-border', theme.components.sidebar.border);
      root.style.setProperty('--sidebar-header-background', theme.components.sidebar.header.background);
      root.style.setProperty('--sidebar-header-text', theme.components.sidebar.header.text);
      root.style.setProperty('--sidebar-item-text', theme.components.sidebar.item.text);
      root.style.setProperty('--sidebar-item-text-secondary', theme.components.sidebar.item.textSecondary);
      root.style.setProperty('--sidebar-item-hover', theme.components.sidebar.item.hover);
      root.style.setProperty('--sidebar-item-active', theme.components.sidebar.item.active);
      root.style.setProperty('--sidebar-item-selected', theme.components.sidebar.item.selected);

      root.style.setProperty('--input-background', theme.components.input.background);
      root.style.setProperty('--input-border', theme.components.input.border);
      root.style.setProperty('--input-text', theme.components.input.text);
      root.style.setProperty('--input-placeholder', theme.components.input.placeholder);
      root.style.setProperty('--input-focus-background', theme.components.input.focus.background);
      root.style.setProperty('--input-focus-border', theme.components.input.focus.border);
      root.style.setProperty('--input-focus-shadow', theme.components.input.focus.shadow);

      // Apply animation variables
      root.style.setProperty('--animation-duration-fast', theme.animations.duration.fast);
      root.style.setProperty('--animation-duration-normal', theme.animations.duration.normal);
      root.style.setProperty('--animation-duration-slow', theme.animations.duration.slow);
      root.style.setProperty('--animation-easing-default', theme.animations.easing.default);
      root.style.setProperty('--animation-easing-bounce', theme.animations.easing.bounce);
      root.style.setProperty('--animation-easing-spring', theme.animations.easing.spring);

      // Set data attribute for theme-specific styling
      root.setAttribute('data-theme', themeId);
    }
  }, [theme, themeId]);

  const value: ThemeContextType = {
    theme,
    themeId,
    setTheme,
    toggleTheme,
    availableThemes: themes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for getting theme-aware styles
export const useThemeStyles = () => {
  const { theme } = useTheme();
  
  return {
    // Common style generators
    card: (variant: 'default' | 'hover' = 'default') => ({
      backgroundColor: variant === 'hover' ? theme.components.card.hover.background : theme.components.card.background,
      borderColor: variant === 'hover' ? theme.components.card.hover.border : theme.components.card.border,
      boxShadow: variant === 'hover' ? theme.components.card.hover.shadow : theme.components.card.shadow,
    }),
    
    button: (variant: 'primary' | 'secondary' | 'ghost' | 'danger', state: 'default' | 'hover' | 'active' | 'disabled' = 'default') => {
      const buttonTheme = theme.components.button[variant];
      let stateTheme;
      
      if (state === 'default') {
        stateTheme = buttonTheme;
      } else {
        stateTheme = buttonTheme[state as keyof typeof buttonTheme] as any;
      }
      
      return {
        backgroundColor: stateTheme.background,
        color: stateTheme.text,
        borderColor: stateTheme.border,
      };
    },
    
    input: (state: 'default' | 'focus' | 'error' = 'default') => {
      const inputTheme = theme.components.input;
      
      if (state === 'focus') {
        return {
          backgroundColor: inputTheme.focus.background,
          borderColor: inputTheme.focus.border,
          boxShadow: inputTheme.focus.shadow,
          color: inputTheme.text,
        };
      }
      
      if (state === 'error') {
        return {
          backgroundColor: inputTheme.error.background,
          borderColor: inputTheme.error.border,
          color: inputTheme.text,
        };
      }
      
      return {
        backgroundColor: inputTheme.background,
        borderColor: inputTheme.border,
        color: inputTheme.text,
      };
    },
    
    text: (variant: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'disabled' | 'link' | 'linkHover') => ({
      color: theme.colors.text[variant],
    }),
    
    surface: (variant: 'primary' | 'secondary' | 'tertiary' | 'hover' | 'active' | 'disabled' | 'selected') => ({
      backgroundColor: theme.colors.surface[variant],
    }),
    
    border: (variant: 'primary' | 'secondary' | 'tertiary' | 'focus' | 'error' | 'success' | 'warning') => ({
      borderColor: theme.colors.border[variant],
    }),
  };
};