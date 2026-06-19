import type { HeaderRow } from '@/features/sources/lib/forwardHeaders';

// Key/value editor for custom forward headers (P2). Controlled by the parent through a plain
// header map. Header values are write-only server-side (stored encrypted), so when editing an
// existing source the parent seeds rows from the known key names with empty values and saving
// replaces the full set.

interface ForwardHeadersEditorProps {
  rows: HeaderRow[];
  onChange: (rows: HeaderRow[]) => void;
}

export function ForwardHeadersEditor({ rows, onChange }: ForwardHeadersEditorProps) {
  const update = (i: number, patch: Partial<HeaderRow>) => {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const add = () => onChange([...rows, { key: '', value: '' }]);

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder="Header name"
            className="w-2/5 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
          />
          <input
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="Value"
            type="password"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="shrink-0 rounded-md border border-border bg-background px-2.5 py-2 text-xs font-medium transition-colors hover:bg-muted"
            aria-label="Remove header"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
      >
        Add header
      </button>
    </div>
  );
}
