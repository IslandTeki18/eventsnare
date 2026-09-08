import type { HeaderRow } from '@/features/sources/lib/forwardHeaders';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
        <div key={i} className="flex gap-2">
          <Input
            mono
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder="Header name"
            className="w-[38%]"
          />
          <Input
            mono
            type="password"
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="Value"
            className="flex-1"
          />
          <Button onClick={() => remove(i)} aria-label="Remove this header">
            Remove
          </Button>
        </div>
      ))}
      <div>
        <Button onClick={add}>Add header</Button>
      </div>
    </div>
  );
}
