import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useQuery, usePaginatedQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { ProviderGrid } from '@/features/sources/components/ProviderGrid';
import { SourceForm } from '@/features/sources/components/SourceForm';
import { IngressUrlDisplay } from '@/features/sources/components/IngressUrlDisplay';
import { TestEventButton } from '@/features/sources/components/TestEventButton';
import { StatusBadge } from '@/components/ui/StatusBadge';

// SPEC §10 onboarding wizard: pick provider -> configure -> copy ingress URL -> send test /
// trigger real event -> watch it land. Each step unlocks the next.

type Step = 'provider' | 'configure' | 'verify';

export function Onboarding() {
  const [step, setStep] = useState<Step>('provider');
  const [provider, setProvider] = useState<string>();
  const [sourceId, setSourceId] = useState<Id<'sources'>>();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Connect a webhook source</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Point a provider at Eventsnare and never lose another event.
      </p>

      <Step n={1} title="Choose a provider" active={step === 'provider'} done={step !== 'provider'}>
        <ProviderGrid
          selected={provider}
          onSelect={(key) => {
            setProvider(key);
            setStep('configure');
          }}
        />
      </Step>

      {provider && step !== 'provider' ? (
        <Step
          n={2}
          title="Configure the source"
          active={step === 'configure'}
          done={step === 'verify'}
        >
          {step === 'configure' ? (
            <SourceForm
              provider={provider}
              onCreated={(result) => {
                setSourceId(result.sourceId);
                setStep('verify');
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Source created.</p>
          )}
        </Step>
      ) : null}

      {sourceId && step === 'verify' ? (
        <Step n={3} title="Verify delivery" active done={false}>
          <VerifyStep sourceId={sourceId} />
        </Step>
      ) : null}
    </div>
  );
}

function VerifyStep({ sourceId }: { sourceId: Id<'sources'> }) {
  const source = useQuery(api.sources.get, { sourceId });
  const { results } = usePaginatedQuery(
    api.events.list,
    { sourceId },
    { initialNumItems: 5 },
  );

  return (
    <div className="flex flex-col gap-4">
      {source ? (
        <div>
          <p className="mb-2 text-sm font-medium">Paste this URL into your provider:</p>
          <IngressUrlDisplay url={source.ingressUrl} path={source.ingressPath} />
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <TestEventButton sourceId={sourceId} />
        <span className="text-xs text-muted-foreground">
          or trigger a real event from your provider
        </span>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Incoming events</p>
        {results.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            Waiting for the first event…
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.map((event) => (
              <li
                key={event._id}
                className="flex items-center justify-between rounded-md border border-border bg-background p-3 text-sm"
              >
                <span className="font-mono text-xs">{event.eventType}</span>
                <StatusBadge status={event.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to="/"
        className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Go to dashboard
      </Link>
    </div>
  );
}

function Step({
  n,
  title,
  active,
  done,
  children,
}: {
  n: number;
  title: string;
  active: boolean;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <section className={done && !active ? 'mb-6 opacity-60' : 'mb-6'}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          {done && !active ? '✓' : n}
        </span>
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      {active ? <div className="pl-8">{children}</div> : null}
    </section>
  );
}
