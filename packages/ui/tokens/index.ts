export const colors = {
  background: { light: '#ffffff', dark: '#0a0a0a' },
  foreground: { light: '#0a0a0a', dark: '#fafafa' },
  primary: { light: '#18181b', dark: '#fafafa' },
  primaryForeground: { light: '#fafafa', dark: '#18181b' },
  muted: { light: '#f4f4f5', dark: '#27272a' },
  mutedForeground: { light: '#71717a', dark: '#a1a1aa' },
  border: { light: '#e4e4e7', dark: '#27272a' },
  destructive: { light: '#ef4444', dark: '#7f1d1d' },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, monospace',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
