import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

// Alert configuration (SPEC FR-DASH-6, FR-ALERT-5). Per channel (email, Slack) the customer
// sets one target and toggles which alert types are delivered to it. Each (type, channel) pair
// is one row in the `alerts` table; toggles and target edits upsert via api.alerts.setConfig.

type AlertType = 'delivery_failure' | 'dead_letter' | 'quota';
type Channel = 'email' | 'slack';

interface AlertConfigRow {
  type: AlertType;
  channel: Channel;
  enabled: boolean;
  target: string;
}

const ALERT_TYPES: { type: AlertType; label: string; description: string }[] = [
  {
    type: 'delivery_failure',
    label: 'Delivery failures',
    description: 'A source fails more than 10 deliveries in 5 minutes.',
  },
  {
    type: 'dead_letter',
    label: 'Dead-lettered events',
    description: 'An event exhausts its retries and is dead-lettered.',
  },
  {
    type: 'quota',
    label: 'Usage quota',
    description: 'Monthly usage crosses 80%, 100%, or 110% of the plan limit.',
  },
];

function keyOf(type: AlertType, channel: Channel): string {
  return `${type}:${channel}`;
}

export function AlertSettings() {
  const config = useQuery(api.alerts.listConfig);
  const setConfig = useMutation(api.alerts.setConfig);

  if (config === undefined) {
    return <p className="text-sm text-muted-foreground">Loading alert settings…</p>;
  }

  const byKey = new Map<string, AlertConfigRow>();
  for (const row of config as AlertConfigRow[]) byKey.set(keyOf(row.type, row.channel), row);

  const targetFor = (channel: Channel): string => {
    for (const t of ALERT_TYPES) {
      const row = byKey.get(keyOf(t.type, channel));
      if (row && row.target) return row.target;
    }
    return '';
  };

  return (
    <div className="flex flex-col gap-6">
      <ChannelBlock
        channel="email"
        label="Email"
        placeholder="alerts@yourcompany.com"
        inputType="email"
        savedTarget={targetFor('email')}
        byKey={byKey}
        onToggle={(type, channel, enabled, target) =>
          setConfig({ type, channel, enabled, target })
        }
        onTargetSave={(channel, target) => {
          for (const t of ALERT_TYPES) {
            const row = byKey.get(keyOf(t.type, channel));
            void setConfig({
              type: t.type,
              channel,
              enabled: row?.enabled ?? false,
              target,
            });
          }
        }}
      />
      <ChannelBlock
        channel="slack"
        label="Slack"
        placeholder="https://hooks.slack.com/services/…"
        inputType="url"
        savedTarget={targetFor('slack')}
        byKey={byKey}
        onToggle={(type, channel, enabled, target) =>
          setConfig({ type, channel, enabled, target })
        }
        onTargetSave={(channel, target) => {
          for (const t of ALERT_TYPES) {
            const row = byKey.get(keyOf(t.type, channel));
            void setConfig({
              type: t.type,
              channel,
              enabled: row?.enabled ?? false,
              target,
            });
          }
        }}
      />
    </div>
  );
}

interface ChannelBlockProps {
  channel: Channel;
  label: string;
  placeholder: string;
  inputType: 'email' | 'url';
  savedTarget: string;
  byKey: Map<string, AlertConfigRow>;
  onToggle: (type: AlertType, channel: Channel, enabled: boolean, target: string) => void;
  onTargetSave: (channel: Channel, target: string) => void;
}

function ChannelBlock({
  channel,
  label,
  placeholder,
  inputType,
  savedTarget,
  byKey,
  onToggle,
  onTargetSave,
}: ChannelBlockProps) {
  const [target, setTarget] = useState(savedTarget);

  return (
    <div className="rounded-md border border-border p-4">
      <div className="mb-3 text-sm font-medium">{label}</div>
      <input
        type={inputType}
        value={target}
        placeholder={placeholder}
        onChange={(e) => setTarget(e.target.value)}
        onBlur={() => {
          if (target !== savedTarget) onTargetSave(channel, target.trim());
        }}
        className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
      />
      <div className="flex flex-col gap-3">
        {ALERT_TYPES.map((t) => {
          const row = byKey.get(keyOf(t.type, channel));
          const enabled = row?.enabled ?? false;
          const disabled = target.trim().length === 0;
          return (
            <label key={t.type} className="flex items-start justify-between gap-4">
              <span className="flex flex-col">
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </span>
              <input
                type="checkbox"
                checked={enabled}
                disabled={disabled}
                onChange={(e) => onToggle(t.type, channel, e.target.checked, target.trim())}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-border accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
