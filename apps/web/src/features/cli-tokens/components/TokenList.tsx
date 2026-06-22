import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

function formatDate(ts: number | null): string {
  if (ts === null) return '—';
  return new Date(ts).toLocaleString();
}

export function TokenList() {
  const tokens = useQuery(api.cliTokens.listTokens);
  const revoke = useMutation(api.cliTokens.revokeToken);
  const [revoking, setRevoking] = useState<Id<'cliTokens'> | null>(null);

  const onRevoke = async (tokenId: Id<'cliTokens'>) => {
    setRevoking(tokenId);
    try {
      await revoke({ tokenId });
    } finally {
      setRevoking(null);
    }
  };

  if (tokens === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (tokens.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No CLI tokens yet. Create one to authenticate the <code className="font-mono">eventsnare</code>{' '}
          CLI.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="px-4 py-2.5 font-medium">Prefix</th>
            <th className="px-4 py-2.5 font-medium">Created</th>
            <th className="px-4 py-2.5 font-medium">Last used</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium" />
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => {
            const revoked = token.revokedAt !== null;
            return (
              <tr key={token._id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{token.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {token.prefix}…
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(token.createdAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(token.lastUsedAt)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      revoked
                        ? 'text-xs text-rose-400'
                        : 'text-xs text-emerald-400'
                    }
                  >
                    {revoked ? 'Revoked' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {!revoked ? (
                    <button
                      type="button"
                      disabled={revoking === token._id}
                      onClick={() => void onRevoke(token._id)}
                      className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      {revoking === token._id ? 'Revoking…' : 'Revoke'}
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
