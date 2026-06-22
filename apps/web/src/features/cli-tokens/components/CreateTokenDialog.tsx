import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';

// Mint a CLI device token. The raw token is returned exactly once by the action and never
// retrievable again, so it is shown inline with a copy button until dismissed.
export function CreateTokenDialog() {
  const issue = useAction(api.cliTokens.issueToken);

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ token: string; prefix: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await issue({ name });
      setIssued(result);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!issued) return;
    await navigator.clipboard.writeText(issued.token);
    setCopied(true);
  };

  if (issued) {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <h2 className="text-sm font-medium">Token created</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Copy it now. For security it is shown only once and cannot be retrieved later.
        </p>
        <code className="mt-3 block break-all rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs">
          {issued.token}
        </code>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void copy()}
            className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
          >
            {copied ? 'Copied' : 'Copy token'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIssued(null);
              setCopied(false);
            }}
            className="rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Done
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Use it with{' '}
          <code className="font-mono">eventsnare login --token {issued.prefix}…</code>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <h2 className="text-sm font-medium">Create a CLI token</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Authenticates the <code className="font-mono">eventsnare</code> CLI on your machine.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Label (e.g. laptop)"
          className="min-w-48 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create token'}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}
