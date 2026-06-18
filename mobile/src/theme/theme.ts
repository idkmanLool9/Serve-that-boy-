export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    primary: string;
    primaryText: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    info: string;
    danger: string;
    // Status colors
    pending: string;
    accepted: string;
    completed: string;
  };
  spacing: (n: number) => number;
  radius: { sm: number; md: number; lg: number; pill: number };
}

const spacing = (n: number) => n * 8;
const radius = { sm: 8, md: 14, lg: 22, pill: 999 };

// Selectable accent colors (the "primary" color). Labels are in Dutch.
export interface AccentOption {
  key: string;
  label: string;
  light: string;
  dark: string;
}

export const ACCENTS: AccentOption[] = [
  { key: 'orange', label: 'Oranje', light: '#E8590C', dark: '#FB923C' },
  { key: 'blue', label: 'Blauw', light: '#2563EB', dark: '#60A5FA' },
  { key: 'green', label: 'Groen', light: '#16A34A', dark: '#34D399' },
  { key: 'red', label: 'Rood', light: '#DC2626', dark: '#F87171' },
  { key: 'purple', label: 'Paars', light: '#6C5CE7', dark: '#8B7BFF' },
  { key: 'pink', label: 'Roze', light: '#DB2777', dark: '#F472B6' },
  { key: 'teal', label: 'Turquoise', light: '#0D9488', dark: '#2DD4BF' },
  { key: 'indigo', label: 'Indigo', light: '#4F46E5', dark: '#818CF8' },
];

export const DEFAULT_ACCENT = 'orange';

export function accentFor(key: string, mode: 'light' | 'dark'): string {
  const accent = ACCENTS.find((a) => a.key === key) ?? ACCENTS[0];
  return mode === 'dark' ? accent.dark : accent.light;
}

export const lightTheme: Theme = {
  mode: 'light',
  spacing,
  radius,
  colors: {
    background: '#F4F5FB',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F8',
    primary: '#6C5CE7',
    primaryText: '#FFFFFF',
    text: '#1A1B25',
    textMuted: '#71727F',
    border: '#E4E6F0',
    success: '#1FA971',
    warning: '#E8A317',
    info: '#3B82F6',
    danger: '#E5484D',
    pending: '#E8A317',
    accepted: '#3B82F6',
    completed: '#1FA971',
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  spacing,
  radius,
  colors: {
    background: '#0F1018',
    surface: '#1A1B26',
    surfaceAlt: '#23242F',
    primary: '#8B7BFF',
    primaryText: '#FFFFFF',
    text: '#F2F3FA',
    textMuted: '#9A9BAA',
    border: '#2C2D3A',
    success: '#34D399',
    warning: '#F5C451',
    info: '#60A5FA',
    danger: '#F87171',
    pending: '#F5C451',
    accepted: '#60A5FA',
    completed: '#34D399',
  },
};
