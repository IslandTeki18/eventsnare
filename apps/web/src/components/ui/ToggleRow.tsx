import { Switch } from '@/components/ui/Switch';

// Label + explanation on the left, a switch on the right, divided by a hairline.

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-[18px] border-b border-border-soft py-[11px] last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm">{label}</div>
        {description ? (
          <div className="mt-0.5 text-sm leading-[18px] text-muted-foreground">{description}</div>
        ) : null}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  );
}
