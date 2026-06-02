import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getProviderMeta } from '@/features/sources/lib/providers';
import { IngressUrlDisplay } from '@/features/sources/components/IngressUrlDisplay';
import { TestEventButton } from '@/features/sources/components/TestEventButton';

export function SourceDetail() {
  const { sourceId } = useParams();
  const id = sourceId as Id<'sources'>;
  const navigate = useNavigate();

  const source = useQuery(api.sources.get, { sourceId: id });
  const update = useAction(api.sources.update);
  const rotateSecret = useAction(api.sources.rotateSecret);
  const pause = useMutation(api.sources.pause);
  const resume = useMutation(api.sources.resume);
  const softDelete = useMutation(api.sources.softDelete);

  const [forwardUrl, setForwardUrl] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState('');

  if (source === undefined) {
    return <p className="px-6 py-10 text-sm text-muted-foreground">Loading…</p>;
  }
  if (source === null) {
    return <p className="px-6 py-10 text-sm text-muted-foreground">Source not found.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/sources" className="text-xs text-muted-foreground hover:text-foreground">
        ← Sources
      </Link>

      <div className="mb-6 mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{source.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {getProviderMeta(source.provider)?.name ?? source.provider}
          </p>
        </div>
        <StatusBadge status={source.status} />
      </div>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-medium">Ingress URL</h2>
        <IngressUrlDisplay url={source.ingressUrl} path={source.ingressPath} />
        <p className="mt-2 text-xs text-muted-foreground">
          Paste this into your {getProviderMeta(source.provider)?.name ?? source.provider}{' '}
          webhook settings.
        </p>
      </section>

      <div className="mb-8 flex flex-wrap gap-2">
        <TestEventButton sourceId={id} />
        <Link
          to={`/events?sourceId=${id}`}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          View events
        </Link>
        {source.status === 'paused' ? (
          <button
            type="button"
            onClick={() => void resume({ sourceId: id })}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Resume
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void pause({ sourceId: id })}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={async () => {
            await softDelete({ sourceId: id });
            navigate('/sources');
          }}
          className="rounded-md border border-rose-500/40 bg-background px-3 py-1.5 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
        >
          Delete
        </button>
      </div>

      <section className="mb-6 flex flex-col gap-2">
        <h2 className="text-sm font-medium">Forward URL</h2>
        <div className="flex items-center gap-2">
          <input
            value={forwardUrl ?? source.forwardUrl}
            onChange={(e) => setForwardUrl(e.target.value)}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={forwardUrl === null || forwardUrl === source.forwardUrl}
            onClick={async () => {
              await update({ sourceId: id, forwardUrl: forwardUrl ?? undefined });
              setForwardUrl(null);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Rotate signing secret</h2>
        <div className="flex items-center gap-2">
          <input
            value={newSecret}
            onChange={(e) => setNewSecret(e.target.value)}
            type="password"
            placeholder="New signing secret"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={!newSecret}
            onClick={async () => {
              await rotateSecret({ sourceId: id, signingSecret: newSecret });
              setNewSecret('');
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            Rotate
          </button>
        </div>
      </section>
    </div>
  );
}
