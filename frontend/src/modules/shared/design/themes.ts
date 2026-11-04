import { designTokens } from './tokens';

// Enhanced theme interface with comprehensive styling options
export interface EnhancedTheme {
  id: string;
  name: string;
  displayName: string;
  colors: ThemeColors;
  components: ComponentThemes;
  charts: ChartThemeConfig;
  animations: AnimationConfig;
}

export interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    overlay: string;
  };
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
    hover: string;
    active: string;
    disabled: string;
    selected: string;
  };
  border: {
    primary: string;
    secondary: string;
    tertiary: string;
    focus: string;
    error: string;
    success: string;
    warning: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
    link: string;
    linkHover: string;
  };
  accent: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
}

export interface ComponentThemes {
  button: {
    primary: ButtonVariant;
    secondary: ButtonVariant;
    ghost: ButtonVariant;
    danger: ButtonVariant;
  };
  card: {
    background: string;
    border: string;
    shadow: string;
    hover: {
      background: string;
      border: string;
      shadow: string;
    };
  };
  input: {
    background: string;
    border: string;
    text: string;
    placeholder: string;
    focus: {
      background: string;
      border: string;
      shadow: string;
    };
    error: {
      border: string;
      background: string;
    };
  };
  sidebar: {
    background: string;
    border: string;
    header: {
      background: string;
      text: string;
    };
    section: {
      background: string;
      text: string;
      hover: string;
    };
    item: {
      text: string;
      textSecondary: string;
      hover: string;
      active: string;
      selected: string;
    };
  };
  modal: {
    background: string;
    overlay: string;
    border: string;
    shadow: string;
  };
}

export interface ButtonVariant {
  background: string;
  text: string;
  border: string;
  hover: {
    background: string;
    text: string;
    border: string;
  };
  active: {
    background: string;
    text: string;
    border: string;
  };
  disabled: {
    background: string;
    text: string;
    border: string;
  };
}

export interface ChartThemeConfig {
  colors: string[];
  background: string;
  text: string;
  grid: string;
  axis: string;
  tooltip: {
    background: string;
    text: string;
    border: string;
    shadow: string;
  };
}

export interface AnimationConfig {
  level: 'none' | 'reduced' | 'full';
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    default: string;
    bounce: string;
    spring: string;
  };
}

// Dark theme (enhanced version of current theme)
export const darkTheme: EnhancedTheme = {
  id: 'dark',
  name: 'dark',
  displayName: 'Dark',
  colors: {
    background: {
      primary: designTokens.colors.neutral[900],
      secondary: designTokens.colors.neutral[800],
      tertiary: designTokens.colors.neutral[700],
      elevated: designTokens.colors.neutral[800],
      overlay: 'rgba(0, 0, 0, 0.75)'
    },
    surface: {
      primary: designTokens.colors.neutral[800],
      secondary: designTokens.colors.neutral[700],
      tertiary: designTokens.colors.neutral[600],
      hover: designTokens.colors.neutral[700],
      active: designTokens.colors.neutral[600],
      disabled: designTokens.colors.neutral[800],
      selected: designTokens.colors.primary[900]
    },
    border: {
      primary: designTokens.colors.neutral[700],
      secondary: designTokens.colors.neutral[600],
      tertiary: designTokens.colors.neutral[500],
      focus: designTokens.colors.primary[500],
      error: designTokens.colors.semantic.error[500],
      success: designTokens.colors.semantic.success[500],
      warning: designTokens.colors.semantic.warning[500]
    },
    text: {
      primary: designTokens.colors.neutral[50],
      secondary: designTokens.colors.neutral[300],
      tertiary: designTokens.colors.neutral[400],
      inverse: designTokens.colors.neutral[900],
      disabled: designTokens.colors.neutral[500],
      link: designTokens.colors.primary[400],
      linkHover: designTokens.colors.primary[300]
    },
    accent: {
      primary: designTokens.colors.primary[500],
      secondary: designTokens.colors.secondary[500],
      tertiary: designTokens.colors.accent[500]
    }
  },
  components: {
    button: {
      primary: {
        background: designTokens.colors.primary[600],
        text: designTokens.colors.neutral[50],
        border: designTokens.colors.primary[600],
        hover: {
          background: designTokens.colors.primary[700],
          text: designTokens.colors.neutral[50],
          border: designTokens.colors.primary[700]
        },
        active: {
          background: designTokens.colors.primary[800],
          text: designTokens.colors.neutral[50],
          border: designTokens.colors.primary[800]
        },
        disabled: {
          background: designTokens.colors.neutral[700],
          text: designTokens.colors.neutral[500],
          border: designTokens.colors.neutral[700]
        }
      },
      secondary: {
        background: 'transparent',
        text: designTokens.colors.neutral[300],
        border: designTokens.colors.neutral[600],
        hover: {
          background: designTokens.colors.neutral[800],
          text: designTokens.colors.neutral[200],
          border: designTokens.colors.neutral[500]
        },
        active: {
          background: designTokens.colors.neutral[700],
          text: designTokens.colors.neutral[100],
          border: designTokens.colors.neutral[400]
        },
        disabled: {
          background: 'transparent',
          text: designTokens.colors.neutral[600],
          border: designTokens.colors.neutral[700]
        }
      },
      ghost: {
        background: 'transparent',
        text: designTokens.colors.neutral[300],
        border: 'transparent',
        hover: {
          background: designTokens.colors.neutral[800],
          text: designTokens.colors.neutral[200],
          border: 'transparent'
        },
        active: {
          background: designTokens.colors.neutral[700],
          text: designTokens.colors.neutral[100],
          border: 'transparent'
        },
        disabled: {
          background: 'transparent',
          text: designTokens.colors.neutral[600],
          border: 'transparent'
        }
      },
      danger: {
        background: designTokens.colors.semantic.error[600],
        text: designTokens.colors.neutral[50],
        border: designTokens.colors.semantic.error[600],
        hover: {
          background: designTokens.colors.semantic.error[700],
          text: designTokens.colors.neutral[50],
          border: designTokens.colors.semantic.error[700]
        },
        active: {
          background: designTokens.colors.semantic.error[800],
          text: designTokens.colors.neutral[50],
          border: designTokens.colors.semantic.error[800]
        },
        disabled: {
          background: designTokens.colors.neutral[700],
          text: designTokens.colors.neutral[500],
          border: designTokens.colors.neutral[700]
        }
      }
    },
    card: {
      background: designTokens.colors.neutral[800],
      border: designTokens.colors.neutral[700],
      shadow: designTokens.shadows.sm,
      hover: {
        background: designTokens.colors.neutral[700],
        border: designTokens.colors.neutral[600],
        shadow: designTokens.shadows.md
      }
    },
    input: {
      background: designTokens.colors.neutral[800],
      border: designTokens.colors.neutral[600],
      text: designTokens.colors.neutral[100],
      placeholder: designTokens.colors.neutral[400],
      focus: {
        background: designTokens.colors.neutral[800],
        border: designTokens.colors.primary[500],
        shadow: `0 0 0 3px ${designTokens.colors.primary[500]}20`
      },
      error: {
        border: designTokens.colors.semantic.error[500],
        background: designTokens.colors.semantic.error[950]
      }
    },
    sidebar: {
      background: designTokens.colors.neutral[800],
      border: designTokens.colors.neutral[700],
      header: {
        background: designTokens.colors.neutral[800],
        text: designTokens.colors.neutral[100]
      },
      section: {
        background: 'transparent',
        text: designTokens.colors.neutral[200],
        hover: designTokens.colors.neutral[700]
      },
      item: {
        text: designTokens.colors.neutral[300],
        textSecondary: designTokens.colors.neutral[400],
        hover: designTokens.colors.neutral[700],
        active: designTokens.colors.neutral[600],
        selected: designTokens.colors.primary[900]
      }
    },
    modal: {
      background: designTokens.colors.neutral[800],
      overlay: 'rgba(0, 0, 0, 0.75)',
      border: designTokens.colors.neutral[700],
      shadow: designTokens.shadows.xl
    }
  },
  charts: {
    colors: [
      designTokens.colors.primary[500],
      designTokens.colors.secondary[500],
      designTokens.colors.accent[500],
      designTokens.colors.semantic.error[500],
      designTokens.colors.primary[400],
      designTokens.colors.secondary[400],
      designTokens.colors.accent[400],
      designTokens.colors.semantic.warning[500]
    ],
    background: designTokens.colors.neutral[800],
    text: designTokens.colors.neutral[200],
    grid: designTokens.colors.neutral[700],
    axis: designTokens.colors.neutral[600],
    tooltip: {
      background: designTokens.colors.neutral[900],
      text: designTokens.colors.neutral[100],
      border: designTokens.colors.neutral[700],
      shadow: designTokens.shadows.lg
    }
  },
  animations: {
    level: 'full',
    duration: {
      fast: designTokens.transitions.fast,
      normal: designTokens.transitions.normal,
      slow: designTokens.transitions.slow
    },
    easing: {
      default: designTokens.transitions.easing.easeInOut,
      bounce: designTokens.transitions.easing.bounce,
      spring: designTokens.transitions.easing.spring
    }
  }
};

// Light theme
export const lightTheme: EnhancedTheme = {
  id: 'light',
  name: 'light',
  displayName: 'Light',
  colors: {
    background: {
      primary: designTokens.colors.neutral[50],
      secondary: designTokens.colors.neutral[100],
      tertiary: designTokens.colors.neutral[200],
      elevated: designTokens.colors.neutral[50],
      overlay: 'rgba(0, 0, 0, 0.50)'
    },
    surface: {
      primary: designTokens.colors.neutral[50],
      secondary: designTokens.colors.neutral[100],
      tertiary: designTokens.colors.neutral[200],
      hover: designTokens.colors.neutral[100],
      active: designTokens.colors.neutral[200],
      disabled: designTokens.colors.neutral[100],
      selected: designTokens.colors.primary[50]
    },
    border: {
      primary: designTokens.colors.neutral[200],
      secondary: designTokens.colors.neutral[300],
      tertiary: designTokens.colors.neutral[400],
      focus: designTokens.colors.primary[500],
      error: designTokens.colors.semantic.error[500],
      success: designTokens.colors.semantic.success[500],
      warning: designTokens.colors.semantic.warning[500]
    },
    text: {
      primary: designTokens.colors.neutral[900],
      secondary: designTokens.colors.neutral[700],
      tertiary: designTokens.colors.neutral[600],
      inverse: designTokens.colors.neutral[50],
      disabled: designTokens.colors.neutral[400],
      link: designTokens.colors.primary[600],
      linkHover: designTokens.colors.primary[700]
    },
    accent: {
      primary: designTokens.colors.primary[600],
      secondary: designTokens.colors.secondary[600],
      tertiary: designTokens.colors.accent[600]
    }
  },
  components: {
    button: {
      primary: {
        background: designTokens.colors.primary[600],
        text: designTokens.colors.neutral[50],
        border: designTokens.colors.primary[600],
        hover: {
          background: designTokens.colors.primary[700],
          text: designTokens.colors.neutral[50],
          border: designTokens.colors.primary[700]
        },
        active: {
          background: designTokens.colors.primary[800],
          text: designTokens.colors.neutral[50],
          border: designTokens.colors.primary[800]
        },
        disabled: {
          background: designTokens.colors.neutral[200],
          text: designTokens.colors.neutral[400],
          border: designTokens.colors.neutral[200]
        }
      },
      secondary: {
        background: 'transparent',
        text: designTokens.colors.neutral[700],
        border: designTokens.colors.neutral[300],
        hover: {
          background: designTokens.colors.neutral[100],
          text: designTokens.colors.neutral[800],
          border: designTokens.colors.neutral[400]
        },
        active: {
          background: designTokens.colors.neutral[200],
          text: designTokens.colors.neutral[900],
          border: designTokens.colors.neutral[500]
        },
        disabled: {
          background: 'transparent',
          text: designTokens.colors.neutral[400],
          border: designTokens.colors.neutral[200]
        }
      },
      ghost: {
        background: 'transparent',
        text: designTokens.colors.neutral[700],
        border: 'transparent',
        hover: {
          background: designTokens.colors.neutral[100],
          text: designTokens.colors.neutral[800],
          border: 'transparent'
        },
        active: {
          background: designTokens.colors.neutral[200],
          text: designTokens.colors.neutral[900],
          border: 'transparent'
        },
        disabled: {
          background: 'transparent',
          text: designTokens.colors.neutral[400],
          border: 'transparent'
        }
      },
      danger: {
        background: designTokens.colors.semantic.error[600],
        text: designTokens.colors.neutral[50],
        border: designTokens.colors.semantic.error[600],
        hover: {
          background: designTokens.colors.semantic.error[700],
          text: designTokens.colors.neutral[50],
          border: designTokens.colors.semantic.error[700]
        },
        active: {
          background: designTokens.colors.semantic.error[800],
          text: designTokens.colors.neutral[50],
          border: designTokens.colors.semantic.error[800]
        },
        disabled: {
          background: designTokens.colors.neutral[200],
          text: designTokens.colors.neutral[400],
          border: designTokens.colors.neutral[200]
        }
      }
    },
    card: {
      background: designTokens.colors.neutral[50],
      border: designTokens.colors.neutral[200],
      shadow: designTokens.shadows.sm,
      hover: {
        background: designTokens.colors.neutral[50],
        border: designTokens.colors.neutral[300],
        shadow: designTokens.shadows.md
      }
    },
    input: {
      background: designTokens.colors.neutral[50],
      border: designTokens.colors.neutral[300],
      text: designTokens.colors.neutral[900],
      placeholder: designTokens.colors.neutral[500],
      focus: {
        background: designTokens.colors.neutral[50],
        border: designTokens.colors.primary[500],
        shadow: `0 0 0 3px ${designTokens.colors.primary[500]}20`
      },
      error: {
        border: designTokens.colors.semantic.error[500],
        background: designTokens.colors.semantic.error[50]
      }
    },
    sidebar: {
      background: designTokens.colors.neutral[50],
      border: designTokens.colors.neutral[200],
      header: {
        background: designTokens.colors.neutral[50],
        text: designTokens.colors.neutral[900]
      },
      section: {
        background: 'transparent',
        text: designTokens.colors.neutral[800],
        hover: designTokens.colors.neutral[100]
      },
      item: {
        text: designTokens.colors.neutral[700],
        textSecondary: designTokens.colors.neutral[600],
        hover: designTokens.colors.neutral[100],
        active: designTokens.colors.neutral[200],
        selected: designTokens.colors.primary[50]
      }
    },
    modal: {
      background: designTokens.colors.neutral[50],
      overlay: 'rgba(0, 0, 0, 0.50)',
      border: designTokens.colors.neutral[200],
      shadow: designTokens.shadows.xl
    }
  },
  charts: {
    colors: [
      designTokens.colors.primary[600],
      designTokens.colors.secondary[600],
      designTokens.colors.accent[600],
      designTokens.colors.semantic.error[600],
      designTokens.colors.primary[500],
      designTokens.colors.secondary[500],
      designTokens.colors.accent[500],
      designTokens.colors.semantic.warning[600]
    ],
    background: designTokens.colors.neutral[50],
    text: designTokens.colors.neutral[800],
    grid: designTokens.colors.neutral[200],
    axis: designTokens.colors.neutral[400],
    tooltip: {
      background: designTokens.colors.neutral[900],
      text: designTokens.colors.neutral[100],
      border: designTokens.colors.neutral[700],
      shadow: designTokens.shadows.lg
    }
  },
  animations: {
    level: 'full',
    duration: {
      fast: designTokens.transitions.fast,
      normal: designTokens.transitions.normal,
      slow: designTokens.transitions.slow
    },
    easing: {
      default: designTokens.transitions.easing.easeInOut,
      bounce: designTokens.transitions.easing.bounce,
      spring: designTokens.transitions.easing.spring
    }
  }
};

// Available themes
export const themes: Record<string, EnhancedTheme> = {
  dark: darkTheme,
  light: lightTheme
};

// Default theme
export const defaultTheme = darkTheme;

// Utility functions
export const getTheme = (themeId: string): EnhancedTheme => {
  return themes[themeId] || defaultTheme;
};

export const getThemeColor = (theme: EnhancedTheme, path: string): string => {
  const keys = path.split('.');
  let value: any = theme.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || theme.colors.text.primary;
};