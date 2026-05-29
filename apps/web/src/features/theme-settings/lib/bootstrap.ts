import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { applyTheme, getStoredTheme, getTheme } from '@/features/theme-settings/lib/theme';
import { ThemeToggle } from '@/features/theme-settings/components/ThemeToggle';

applyTheme(getStoredTheme());

if (typeof document !== 'undefined') {
  const mount = (): void => {
    if (document.getElementById('theme-toggle-portal')) return;
    const div = document.createElement('div');
    div.id = 'theme-toggle-portal';
    document.body.appendChild(div);
    createRoot(div).render(createElement(ThemeToggle));
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
}

if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'system') applyTheme('system');
  });
}
