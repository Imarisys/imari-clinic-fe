import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  cssVariables: Record<string, string>;
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Medical Blue',
    description: 'Classic medical theme with calming blue tones',
    colors: {
      primary: '#3B82F6',
      secondary: '#64748B',
      accent: '#10B981',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#1E293B',
      textSecondary: '#64748B',
    },
    cssVariables: {
      '--color-primary-50': '#EFF6FF',
      '--color-primary-100': '#DBEAFE',
      '--color-primary-200': '#BFDBFE',
      '--color-primary-300': '#93C5FD',
      '--color-primary-400': '#60A5FA',
      '--color-primary-500': '#3B82F6',
      '--color-primary-600': '#2563EB',
      '--color-primary-700': '#1D4ED8',
      '--color-primary-800': '#1E40AF',
      '--color-primary-900': '#1E3A8A',
    }
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural and calming green theme',
    colors: {
      primary: '#059669',
      secondary: '#64748B',
      accent: '#F59E0B',
      background: '#F0FDF4',
      surface: '#FFFFFF',
      text: '#1E293B',
      textSecondary: '#64748B',
    },
    cssVariables: {
      '--color-primary-50': '#ECFDF5',
      '--color-primary-100': '#D1FAE5',
      '--color-primary-200': '#A7F3D0',
      '--color-primary-300': '#6EE7B7',
      '--color-primary-400': '#34D399',
      '--color-primary-500': '#10B981',
      '--color-primary-600': '#059669',
      '--color-primary-700': '#047857',
      '--color-primary-800': '#065F46',
      '--color-primary-900': '#064E3B',
    }
  },
  {
    id: 'sunset',
    name: 'Warm Sunset',
    description: 'Warm orange and amber tones',
    colors: {
      primary: '#EA580C',
      secondary: '#64748B',
      accent: '#8B5CF6',
      background: '#FFF7ED',
      surface: '#FFFFFF',
      text: '#1E293B',
      textSecondary: '#64748B',
    },
    cssVariables: {
      '--color-primary-50': '#FFF7ED',
      '--color-primary-100': '#FFEDD5',
      '--color-primary-200': '#FED7AA',
      '--color-primary-300': '#FDBA74',
      '--color-primary-400': '#FB923C',
      '--color-primary-500': '#F97316',
      '--color-primary-600': '#EA580C',
      '--color-primary-700': '#C2410C',
      '--color-primary-800': '#9A3412',
      '--color-primary-900': '#7C2D12',
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Deep ocean blues and teals',
    colors: {
      primary: '#0891B2',
      secondary: '#64748B',
      accent: '#06B6D4',
      background: '#F0F9FF',
      surface: '#FFFFFF',
      text: '#1E293B',
      textSecondary: '#64748B',
    },
    cssVariables: {
      '--color-primary-50': '#F0F9FF',
      '--color-primary-100': '#E0F2FE',
      '--color-primary-200': '#BAE6FD',
      '--color-primary-300': '#7DD3FC',
      '--color-primary-400': '#38BDF8',
      '--color-primary-500': '#0EA5E9',
      '--color-primary-600': '#0284C7',
      '--color-primary-700': '#0369A1',
      '--color-primary-800': '#075985',
      '--color-primary-900': '#0C4A6E',
    }
  },
  {
    id: 'lavender',
    name: 'Lavender Purple',
    description: 'Soft purple and violet theme',
    colors: {
      primary: '#7C3AED',
      secondary: '#64748B',
      accent: '#EC4899',
      background: '#FAF5FF',
      surface: '#FFFFFF',
      text: '#1E293B',
      textSecondary: '#64748B',
    },
    cssVariables: {
      '--color-primary-50': '#FAF5FF',
      '--color-primary-100': '#F3E8FF',
      '--color-primary-200': '#E9D5FF',
      '--color-primary-300': '#D8B4FE',
      '--color-primary-400': '#C084FC',
      '--color-primary-500': '#A855F7',
      '--color-primary-600': '#9333EA',
      '--color-primary-700': '#7C3AED',
      '--color-primary-800': '#6B21A8',
      '--color-primary-900': '#581C87',
    }
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    description: 'Elegant rose and pink tones',
    colors: {
      primary: '#E11D48',
      secondary: '#64748B',
      accent: '#F59E0B',
      background: '#FFF1F2',
      surface: '#FFFFFF',
      text: '#1E293B',
      textSecondary: '#64748B',
    },
    cssVariables: {
      '--color-primary-50': '#FFF1F2',
      '--color-primary-100': '#FFE4E6',
      '--color-primary-200': '#FECDD3',
      '--color-primary-300': '#FDA4AF',
      '--color-primary-400': '#FB7185',
      '--color-primary-500': '#F43F5E',
      '--color-primary-600': '#E11D48',
      '--color-primary-700': '#BE123C',
      '--color-primary-800': '#9F1239',
      '--color-primary-900': '#881337',
    }
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Dark theme for reduced eye strain',
    colors: {
      primary: '#3B82F6',
      secondary: '#94A3B8',
      accent: '#10B981',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
    },
    cssVariables: {
      '--color-primary-50': '#1E293B',
      '--color-primary-100': '#334155',
      '--color-primary-200': '#475569',
      '--color-primary-300': '#64748B',
      '--color-primary-400': '#94A3B8',
      '--color-primary-500': '#3B82F6',
      '--color-primary-600': '#2563EB',
      '--color-primary-700': '#1D4ED8',
      '--color-primary-800': '#1E40AF',
      '--color-primary-900': '#1E3A8A',
    }
  }
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedThemeId = localStorage.getItem('selectedTheme');
    if (savedThemeId) {
      const theme = themes.find(t => t.id === savedThemeId);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  useEffect(() => {
    // Apply theme CSS variables to document root
    const root = document.documentElement;
    Object.entries(currentTheme.cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Add theme class to body for specific styling
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${currentTheme.id}`);
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('selectedTheme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};
