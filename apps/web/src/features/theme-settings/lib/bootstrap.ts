import { applyTheme, getStoredTheme } from '@/features/theme-settings/lib/theme';

applyTheme(getStoredTheme());

window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getStoredTheme() === 'system') applyTheme('system');
});
