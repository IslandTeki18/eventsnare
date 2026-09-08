import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Two button weights from the redesign: `default` is a hairline-outlined neutral button,
// `primary` is the solid ink-on-background call to action. `sm` is the in-table/inline size.

type Variant = 'default' | 'primary' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  default: 'border-border bg-transparent text-foreground hover:bg-muted',
  primary: 'border-primary bg-primary font-medium text-primary-foreground',
  danger: 'border-bad/40 bg-transparent text-bad hover:bg-bad/10',
};

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-2.5 py-[5px] text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = 'default',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center gap-2 rounded-md border transition-colors disabled:cursor-not-allowed disabled:text-subtle disabled:hover:bg-transparent',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
