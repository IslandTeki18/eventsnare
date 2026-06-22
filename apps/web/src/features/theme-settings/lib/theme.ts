export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'app-theme';
const DEFAULT_THEME: Theme = 'system';
const VALID_THEMES: ReadonlySet<Theme> = new Set<Theme>(['light', 'dark', 'system']);

let current: Theme = DEFAULT_THEME;
const listeners = new Set<() => void>();

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && VALID_THEMES.has(raw as Theme)) {
      return raw as Theme;
    }
  } catch {
    // private mode / disabled storage — fall through
  }
  return DEFAULT_THEME;
}

 function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
}

export function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const effective = getEffectiveTheme(theme);
  const root = document.documentElement;
  if (effective === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  current = theme;
}

export function getTheme(): Theme {
  return current;
}

export function setTheme(theme: Theme): void {
  setStoredTheme(theme);
  applyTheme(theme);
  listeners.forEach((fn) => fn());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

current = getStoredTheme();
