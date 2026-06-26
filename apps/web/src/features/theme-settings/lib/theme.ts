export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'app-theme';
const DEFAULT_THEME: Theme = 'system';
const VALID_THEMES = new Set<Theme>(['light', 'dark', 'system']);

export function getStoredTheme(): Theme {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && VALID_THEMES.has(raw as Theme)) return raw as Theme;
  } catch {
    // private mode / disabled storage
  }
  return DEFAULT_THEME;
}

export function setStoredTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
}

export function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', getEffectiveTheme(theme) === 'dark');
}
