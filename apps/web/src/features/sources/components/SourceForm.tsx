import { useState, type FormEvent } from 'react';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { getProviderMeta } from '@/features/sources/lib/providers';

// Secret entry + forward URL for a chosen provider (SPEC §10 step 5). Calls the create
// action, which encrypts the secret server-side before persisting.

interface SourceFormProps {
  provider: string;
  onCreated: (result: { sourceId: Id<'sources'>; ingressPath: string }) => void;
}

export function SourceForm({ provider, onCreated }: SourceFormProps) {
  const create = useAction(api.sources.create);
  const meta = getProviderMeta(provider);

  const [name, setName] = useState('');
  const [forwardUrl, setForwardUrl] = useState('');
  const [signingSecret, setSigningSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await create({
        provider,
        name: name || `${meta?.name ?? provider} source`,
        forwardUrl,
        signingSecret,
      });
      onCreated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create source');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      {meta ? (
        <p className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          {meta.guide}
        </p>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${meta?.name ?? provider} production`}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Forward URL</span>
        <input
          value={forwardUrl}
          onChange={(e) => setForwardUrl(e.target.value)}
          placeholder="https://your-app.com/webhooks/incoming"
          required
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{meta?.secretLabel ?? 'Signing secret'}</span>
        <input
          value={signingSecret}
          onChange={(e) => setSigningSecret(e.target.value)}
          type="password"
          required
          className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary"
        />
      </label>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create source'}
      </button>
    </form>
  );
}
