import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/Button';
import { SettingRow } from '@/components/ui/SettingRow';
import { ForwardHeadersEditor } from '@/features/sources/components/ForwardHeadersEditor';
import { rowsToHeaderMap, useHeaderRows } from '@/features/sources/lib/forwardHeaders';

// P2 outbound security: custom forward headers (write-only, replace-all) and the Eventsnare
// outbound signing secret (reveal once / rotate) plus a short verification snippet.

const VERIFY_SNIPPET = 'X-Eventsnare-Signature: t=<unix seconds>,v1=<hmac-sha256>';

interface OutboundSecuritySettingsProps {
  sourceId: Id<'sources'>;
  forwardHeaderKeys: string[];
  hasOutboundSecret: boolean;
}

export function OutboundSecuritySettings({
  sourceId,
  forwardHeaderKeys,
  hasOutboundSecret,
}: OutboundSecuritySettingsProps) {
  const update = useAction(api.sources.update);
  const rotateOutbound = useAction(api.sources.rotateOutboundSecret);
  const revealOutbound = useAction(api.sources.revealOutboundSecret);

  const { rows, setRows } = useHeaderRows(forwardHeaderKeys);
  const [savingHeaders, setSavingHeaders] = useState(false);
  const [headersSaved, setHeadersSaved] = useState(false);
  const [headersError, setHeadersError] = useState<string | null>(null);

  const [secret, setSecret] = useState<string | null>(null);
  const [busySecret, setBusySecret] = useState(false);

  const saveHeaders = async () => {
    setSavingHeaders(true);
    setHeadersSaved(false);
    setHeadersError(null);
    try {
      await update({ sourceId, forwardHeaders: rowsToHeaderMap(rows) });
      setHeadersSaved(true);
    } catch (err) {
      setHeadersError(err instanceof Error ? err.message : 'Failed to save headers');
    } finally {
      setSavingHeaders(false);
    }
  };

  const reveal = async () => {
    setBusySecret(true);
    try {
      const { secret: value } = await revealOutbound({ sourceId });
      setSecret(value);
    } finally {
      setBusySecret(false);
    }
  };

  const rotate = async () => {
    setBusySecret(true);
    try {
      await rotateOutbound({ sourceId });
      const { secret: value } = await revealOutbound({ sourceId });
      setSecret(value);
    } finally {
      setBusySecret(false);
    }
  };

  return (
    <>
      <SettingRow
        label="Extra headers"
        description="Sent with every delivery — useful if your endpoint needs an API key. Values are stored encrypted and never shown again, so re-enter them to change. Saving replaces the whole set. Reserved headers (Content-Type, X-Eventsnare-*) cannot be overridden."
      >
        <ForwardHeadersEditor rows={rows} onChange={setRows} />
        <div className="flex items-center gap-3">
          <Button disabled={savingHeaders} onClick={() => void saveHeaders()}>
            {savingHeaders ? 'Saving…' : 'Save headers'}
          </Button>
          {headersSaved ? <span className="text-xs text-ok">Saved</span> : null}
          {headersError ? <span className="text-xs text-bad">{headersError}</span> : null}
        </div>
      </SettingRow>

      <SettingRow
        label="Prove deliveries came from us"
        description="Eventsnare signs every delivery so your endpoint can confirm it is genuine. Verify it by computing an HMAC-SHA256 of `${t}.${rawBody}` with the secret below and comparing it to v1, and reject anything where t is more than a few minutes from your server clock."
      >
        <pre className="m-0 overflow-x-auto rounded-md border border-border bg-panel px-[11px] py-2 font-mono text-xs leading-[17px] text-muted-foreground">
          {VERIFY_SNIPPET}
        </pre>
        {secret ? (
          <code className="break-all rounded-md border border-border bg-panel px-[11px] py-2 font-mono text-xs">
            {secret}
          </code>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {hasOutboundSecret ? (
            <Button disabled={busySecret} onClick={() => void reveal()}>
              {busySecret ? 'Working…' : secret ? 'Show again' : 'Show secret'}
            </Button>
          ) : null}
          <Button disabled={busySecret} onClick={() => void rotate()}>
            {hasOutboundSecret ? 'Replace' : 'Generate secret'}
          </Button>
        </div>
      </SettingRow>
    </>
  );
}
