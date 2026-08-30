// SoundHub Design Tokens — DaVinci Resolve 21 inspired
// Dark professional NLE aesthetic: dense panels, orange accent, minimal chrome

export const colors = {
  // Backgrounds — DaVinci Resolve 21 gray scale
  bg: {
    primary: '#1B1B1B',     // main canvas
    surface: '#232323',     // panels, sidebars
    elevated: '#2D2D2D',    // cards, modals, dropdowns
    hover: '#383838',       // hover states
    active: '#444444',      // pressed / selected
    toolbar: '#1E1E1E',     // top bar, bottom bar
  },
  // Brand — DaVinci orange-red accent
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
  // Text — high contrast on dark
  text: {
    primary: '#E0E0E0',
    secondary: '#9E9E9E',
    muted: '#616161',
    inverse: '#1B1B1B',     // text on accent bg
  },
  // Border — subtle separators
  border: {
    default: '#333333',
    hover: '#444444',
    active: '#E85D2A',
    subtle: '#2A2A2A',
  },
} as const;

// Spacing — tighter than before, DaVinci density
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

// Border Radius — nearly flat, DaVinci style
export const radii = {
  sm: '3px',
  md: '4px',
  lg: '6px',
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  low: '0 1px 2px rgba(0, 0, 0, 0.4)',
  medium: '0 2px 8px rgba(0, 0, 0, 0.5)',
  panel: '0 4px 16px rgba(0, 0, 0, 0.6)',
} as const;

// Typography — dense, small, professional (DaVinci style)
export const typography = {
  fontFamily: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", "Fira Code", Consolas, monospace',
  },
  fontSize: {
    display: '36px',     // was 48px — tighter
    h1: '22px',          // was 32px
    h2: '15px',          // was 24px
    h3: '13px',          // was 20px
    body: '12px',        // was 16px
    caption: '11px',     // was 14px
    small: '10px',       // was 12px
    tiny: '9px',
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

// Components — DaVinci density
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

// Layout — DaVinci panel widths
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

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
