// Light Design Tokens — DaVinci Inspired (light variant)
export const colors = {
  // Backgrounds
  bg: {
    primary: '#FFFFFF',     // main canvas
    surface: '#F5F5F5',     // panels, sidebars
    elevated: '#E0E0E0',    // cards, modals, dropdowns
    hover: '#D5D5D5',       // hover states
    active: '#C8C8C8',      // pressed / selected
    toolbar: '#FAFAFA',     // top bar, bottom bar
  },
  // Brand — DaVinci orange-red accent (kept for recognition)
  brand: {
    primary: '#E85D2A',     // primary actions, playheads, active states
    secondary: '#4A9EE5',   // waveforms, progress, links
    gradient: 'linear-gradient(135deg, #E85D2A, #D4451A)',
    muted: 'rgba(232, 93, 42, 0.15)',  // subtle accent bg
  },
  // Semantic
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#4A9EE5',
  // Text — high contrast on light
  text: {
    primary: '#1B1B1B',
    secondary: '#424242',
    muted: '#757575',
    inverse: '#FFFFFF',     // text on accent bg
  },
  // Border — subtle separators
  border: {
    default: '#CCCCCC',
    hover: '#BDBDBD',
    active: '#E85D2A',
    subtle: '#E0E0E0',
  },
} as const;

// Spacing — same as dark
export const spacing = {
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '48px',
} as const;

// Border Radius — same as dark
export const radii = {
  sm: '3px',
  md: '4px',
  lg: '6px',
  full: '9999px',
} as const;

// Shadows — same as dark
export const shadows = {
  none: 'none',
  low: '0 1px 2px rgba(0, 0, 0, 0.1)',
  medium: '0 2px 8px rgba(0, 0, 0, 0.15)',
  panel: '0 4px 16px rgba(0, 0, 0, 0.2)',
} as const;

// Typography — same as dark
export const typography = {
  fontFamily: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", "Fira Code", Consolas, monospace',
  },
  fontSize: {
    display: '42px',
    h1: '28px',
    h2: '20px',
    h3: '16px',
    body: '14px',
    caption: '12px',
    small: '11px',
    tiny: '10px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

// Components — same as dark
export const components = {
  button: {
    height: {
      sm: '24px',
      md: '28px',
      lg: '32px',
    },
    padding: {
      sm: '3px 8px',
      md: '5px 12px',
      lg: '7px 16px',
    },
    fontSize: {
      sm: '10px',
      md: '11px',
      lg: '12px',
    },
  },
  input: {
    height: '26px',
    padding: '3px 8px',
    fontSize: '11px',
  },
  card: {
    padding: '10px',
    gap: '6px',
    borderRadius: '3px',
  },
  badge: {
    height: '18px',
    padding: '2px 6px',
    fontSize: '9px',
  },
} as const;

// Layout — same as dark
export const layout = {
  sidebar: {
    width: '200px',
    collapsedWidth: '44px',
  },
  topbar: {
    height: '36px',
  },
  inspector: {
    width: '260px',
  },
  timeline: {
    height: '140px',
  },
} as const;

// Type exports
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radii = typeof radii;