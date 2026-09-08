import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Hairline-outlined transparent input from the redesign. `mono` for URLs, secrets, and ids.

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

export function Input({ mono = false, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'min-w-0 rounded-md border border-border bg-transparent px-2.5 py-[7px] text-sm text-foreground outline-none focus:border-subtle',
        mono && 'font-mono text-xs',
        className,
      )}
      {...props}
    />
  );
}
