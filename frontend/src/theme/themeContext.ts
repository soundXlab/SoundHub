import React, { createContext, useContext, useState } from 'react';
import { colors as darkColors, spacing, radii, shadows, typography, components, layout } from '../design-tokens';
import { colors as lightColors } from './design-tokens.light';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof darkColors | typeof lightColors;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  typography: typeof typography;
  components: typeof components;
  layout: typeof layout;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  const ctxValue: ThemeContextValue = {
    theme,
    toggleTheme,
    colors,
    spacing,
    radii,
    shadows,
    typography,
    components,
    layout,
  };

  return React.createElement(ThemeContext.Provider, { value: ctxValue }, children);
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
