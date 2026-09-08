import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Input } from '@/components/ui/Input';
import { ToggleRow } from '@/components/ui/ToggleRow';

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
    return <p className="text-sm text-subtle">Loading alert settings…</p>;
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
    <div className="flex flex-wrap gap-4">
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

  const configured = target.trim().length > 0;
  const enabledCount = ALERT_TYPES.filter(
    (t) => byKey.get(keyOf(t.type, channel))?.enabled,
  ).length;

  return (
    <div className="min-w-0 flex-1 basis-[300px] overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between gap-2.5 border-b border-border bg-panel px-3.5 py-2.5">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-xs ${configured ? 'text-ok' : 'text-subtle'}`}>
          {configured ? `${enabledCount} of ${ALERT_TYPES.length} on` : 'Not set up'}
        </span>
      </div>
      <div className="px-3.5 py-3">
        <Input
          type={inputType}
          value={target}
          placeholder={placeholder}
          onChange={(e) => setTarget(e.target.value)}
          onBlur={() => {
            if (target !== savedTarget) onTargetSave(channel, target.trim());
          }}
          className="w-full"
        />
        <div className="mt-2.5">
          {ALERT_TYPES.map((t) => (
            <ToggleRow
              key={t.type}
              label={t.label}
              description={t.description}
              checked={byKey.get(keyOf(t.type, channel))?.enabled ?? false}
              disabled={!configured}
              onChange={(next) => onToggle(t.type, channel, next, target.trim())}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
