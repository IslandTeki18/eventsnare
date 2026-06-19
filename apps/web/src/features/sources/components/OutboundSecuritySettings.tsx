import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { ForwardHeadersEditor } from '@/features/sources/components/ForwardHeadersEditor';
import { rowsToHeaderMap, useHeaderRows } from '@/features/sources/lib/forwardHeaders';

// P2 outbound security: custom forward headers (write-only, replace-all) and the Eventsnare
// outbound signing secret (reveal once / rotate) plus a short verification snippet.

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
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Custom forward headers</h2>
        <p className="text-xs text-muted-foreground">
          Added to every forwarded request, e.g. an Authorization header for a protected
          endpoint. Values are stored encrypted and never shown again, so re-enter them to
          change. Saving replaces the full set. Reserved headers (Content-Type, X-Eventsnare-*)
          cannot be overridden.
        </p>
        <ForwardHeadersEditor rows={rows} onChange={setRows} />
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={savingHeaders}
            onClick={() => void saveHeaders()}
            className="self-start rounded-md border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {savingHeaders ? 'Saving…' : 'Save headers'}
          </button>
          {headersSaved ? <span className="text-xs text-emerald-400">Saved</span> : null}
          {headersError ? <span className="text-xs text-rose-400">{headersError}</span> : null}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Outbound signing</h2>
        <p className="text-xs text-muted-foreground">
          Eventsnare signs every forwarded request with{' '}
          <code className="font-mono">X-Eventsnare-Signature: t=&lt;ts&gt;,v1=&lt;hmac&gt;</code>.
          Verify it on your endpoint by computing an HMAC-SHA256 of{' '}
          <code className="font-mono">{'`${t}.${rawBody}`'}</code> with the secret below and
          comparing to <code className="font-mono">v1</code>. Also reject the request if{' '}
          <code className="font-mono">t</code> is more than a few minutes (e.g. 300s) from your
          server clock to prevent replay.
        </p>

        {secret ? (
          <code className="break-all rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs">
            {secret}
          </code>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {hasOutboundSecret ? (
            <button
              type="button"
              disabled={busySecret}
              onClick={() => void reveal()}
              className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              {busySecret ? 'Working…' : secret ? 'Reveal again' : 'Reveal secret'}
            </button>
          ) : null}
          <button
            type="button"
            disabled={busySecret}
            onClick={() => void rotate()}
            className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {hasOutboundSecret ? 'Rotate secret' : 'Generate secret'}
          </button>
        </div>
      </section>
    </div>
  );
}
