import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

interface PreferenceToggleProps {
  settingKey: string;
  label: string;
  description?: string;
  defaultValue?: boolean;
}

export function PreferenceToggle({
  settingKey,
  label,
  description,
  defaultValue = false,
}: PreferenceToggleProps) {
  const stored = useQuery(api.settings.getMySetting, { key: settingKey });
  const setSetting = useMutation(api.settings.setMySetting);

  const isLoading = stored === undefined;
  const value = stored === null || stored === undefined ? defaultValue : stored === 'true';

  const handleChange = async (next: boolean) => {
    await setSetting({ key: settingKey, value: next ? 'true' : 'false' });
  };

  return (
    <label className="flex items-start justify-between gap-4">
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description ? (
          <span className="text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={value}
        disabled={isLoading}
        onChange={(event) => handleChange(event.target.checked)}
        className="mt-1 h-4 w-4 cursor-pointer rounded border-border accent-foreground"
      />
    </label>
  );
}
