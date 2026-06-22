import { CreateTokenDialog } from '@/features/cli-tokens/components/CreateTokenDialog';
import { TokenList } from '@/features/cli-tokens/components/TokenList';

// P5: device tokens for the `eventsnare` CLI. Mint, list, and revoke tokens; the CLI uses one to
// authenticate `eventsnare login` and forward live webhooks to localhost.
export function CliTokens() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">CLI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Forward live webhooks to your machine for local development with{' '}
          <code className="font-mono">eventsnare listen</code>.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <CreateTokenDialog />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Tokens</h2>
          <TokenList />
        </section>

        <section className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4">
          <h2 className="text-sm font-medium">Quick start</h2>
          <pre className="overflow-x-auto rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs leading-relaxed">
{`npm i -g @eventsnare/cli   # or run via npx
eventsnare login --token <token> --url <your-deployment.convex.cloud>
eventsnare listen --source <source-id> --forward http://localhost:3000/webhook`}
          </pre>
          <p className="text-xs text-muted-foreground">
            While <code className="font-mono">listen</code> is running, events for that source are
            forwarded to your local URL instead of its production forward URL. Stop the CLI to
            resume normal delivery.
          </p>
        </section>
      </div>
    </div>
  );
}
