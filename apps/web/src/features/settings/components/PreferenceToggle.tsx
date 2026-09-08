import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { ToggleRow } from '@/components/ui/ToggleRow';

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

  return (
    <ToggleRow
      label={label}
      description={description}
      checked={value}
      disabled={isLoading}
      onChange={(next) => void setSetting({ key: settingKey, value: next ? 'true' : 'false' })}
    />
  );
}
