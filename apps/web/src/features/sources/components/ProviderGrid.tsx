import { cn } from '@/lib/utils';
import { PROVIDERS } from '@/features/sources/lib/providers';

// Visual provider picker (SPEC §10 step 3). Stripe is first and tagged Most Popular.

interface ProviderGridProps {
  selected?: string;
  onSelect: (key: string) => void;
}

export function ProviderGrid({ selected, onSelect }: ProviderGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {PROVIDERS.map((provider) => (
        <button
          key={provider.key}
          type="button"
          onClick={() => onSelect(provider.key)}
          className={cn(
            'relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors',
            selected === provider.key
              ? 'border-primary bg-primary/5'
              : 'border-border bg-background hover:bg-muted',
          )}
        >
          {provider.popular ? (
            <span className="absolute right-2 top-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              Most Popular
            </span>
          ) : null}
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-sm font-semibold">
            {provider.glyph}
          </span>
          <span className="text-sm font-medium">{provider.name}</span>
        </button>
      ))}
    </div>
  );
}
