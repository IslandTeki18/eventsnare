import { cn } from '@/lib/utils';

// 30x17 track switch from the redesign. On is solid ink with a background-coloured knob.

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[17px] w-[30px] flex-shrink-0 rounded-full border p-0 transition-colors',
        checked ? 'border-foreground bg-foreground' : 'border-rail bg-transparent',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] h-[11px] w-[11px] rounded-full transition-[left]',
          checked ? 'left-[15px] bg-background' : 'left-[2px] bg-subtle',
        )}
      />
    </button>
  );
}
