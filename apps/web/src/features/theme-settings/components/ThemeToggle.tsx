import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  type Theme,
  applyTheme,
  getStoredTheme,
  setStoredTheme,
} from '@/features/theme-settings/lib/theme';

// Dark | Light segmented control. `system` remains the stored default until the user picks
// explicitly, so an unset preference still follows the OS.

const OPTIONS: { value: Exclude<Theme, 'system'>; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  const select = (next: Theme) => {
    setStoredTheme(next);
    applyTheme(next);
    setThemeState(next);
  };

  return (
    <div className={cn('flex overflow-hidden rounded-md border border-border', className)}>
      {OPTIONS.map((option, index) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => select(option.value)}
            className={cn(
              'flex-1 px-3.5 py-[5px] text-sm transition-colors',
              index > 0 && 'border-l border-border',
              active ? 'bg-foreground text-background' : 'text-subtle hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
