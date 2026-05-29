import { useSyncExternalStore } from 'react';
import {
  type Theme,
  getEffectiveTheme,
  getTheme,
  setTheme,
  subscribe,
} from '@/features/theme-settings/lib/theme';

export interface UseThemeResult {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effective: 'light' | 'dark';
}

export function useTheme(): UseThemeResult {
  const theme = useSyncExternalStore(subscribe, getTheme, getTheme);
  return {
    theme,
    setTheme,
    effective: getEffectiveTheme(theme),
  };
}
