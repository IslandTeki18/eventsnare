import { useState } from 'react';

// Helpers for the custom forward-header editor (P2). Kept out of the component file so fast
// refresh stays happy (component files should export only components).

export interface HeaderRow {
  key: string;
  value: string;
}

// Convert editor rows to the header map sent to the backend, dropping blank-named rows and
// trimming names. Later rows win on duplicate names.
export function rowsToHeaderMap(rows: HeaderRow[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const { key, value } of rows) {
    const name = key.trim();
    if (name) map[name] = value;
  }
  return map;
}

// Manage editor rows seeded from existing header key names (values are write-only server-side).
export function useHeaderRows(initialKeys: string[]): {
  rows: HeaderRow[];
  setRows: (rows: HeaderRow[]) => void;
} {
  const [rows, setRows] = useState<HeaderRow[]>(initialKeys.map((key) => ({ key, value: '' })));
  return { rows, setRows };
}
