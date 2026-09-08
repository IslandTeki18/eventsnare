import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { SettingRow } from '@/components/ui/SettingRow';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import { getProviderMeta } from '@/features/sources/lib/providers';
import { IngressUrlDisplay } from '@/features/sources/components/IngressUrlDisplay';
import { ProviderSetupGuide } from '@/features/sources/components/ProviderSetupGuide';
import { OutboundSecuritySettings } from '@/features/sources/components/OutboundSecuritySettings';
import { TestEventButton } from '@/features/sources/components/TestEventButton';
import { SourceAnalytics } from '@/features/analytics';

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
  const [tab, setTab] = useState<'settings' | 'activity'>('settings');

  if (source === undefined) {
    return <p className="px-[22px] py-4 text-sm text-subtle">Loading…</p>;
  }
  if (source === null) {
    return <p className="px-[22px] py-4 text-sm text-subtle">Source not found.</p>;
  }

  const providerName = getProviderMeta(source.provider)?.name ?? source.provider;

  return (
    <>
      <PageHeader
        title={
          <>
            <Link to="/sources" className="text-subtle">
              Sources
            </Link>
            <span className="text-subtle"> / </span>
            <span className="font-medium">{source.name}</span>
          </>
        }
      >
        {source.status === 'paused' ? (
          <Button onClick={() => void resume({ sourceId: id })}>Resume</Button>
        ) : (
          <Button onClick={() => void pause({ sourceId: id })}>Pause</Button>
        )}
        <TestEventButton sourceId={id} />
      </PageHeader>

      <div className="flex-1 overflow-y-auto">
        <div className="px-[22px] pt-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="m-0 text-xl font-semibold tracking-[-0.01em]">{source.name}</h1>
            <StatusBadge status={source.status} />
          </div>
          <p className="mt-[7px] text-sm text-muted-foreground">
            {providerName} · forwarding to your endpoint
          </p>
        </div>

        <div className="mt-[18px] flex gap-1 border-b border-border px-[22px]">
          <Tab active={tab === 'settings'} onClick={() => setTab('settings')} label="Settings" />
          <Tab active={tab === 'activity'} onClick={() => setTab('activity')} label="Activity" />
        </div>

        {tab === 'activity' ? (
          <div className="px-[22px] py-5">
            <SourceAnalytics sourceId={id} />
          </div>
        ) : (
          <>
            <div className="border-b border-border px-[22px] py-5">
              <div className="mb-1 text-sm font-medium">Your Eventsnare address</div>
              <p className="mb-2.5 max-w-[620px] text-sm text-muted-foreground">
                Paste this into {providerName} as the webhook endpoint. {providerName} sends
                events here, and Eventsnare passes them on to you.
              </p>
              <IngressUrlDisplay url={source.ingressUrl} path={source.ingressPath} />
            </div>

            <div className="border-b border-border px-[22px] py-5">
              <ProviderSetupGuide
                provider={source.provider}
                ingressUrl={source.ingressUrl}
                ingressPath={source.ingressPath}
              />
            </div>

            <SettingRow
              label="Where to send events"
              description="Your own endpoint. Verified events are delivered here."
            >
              <div className="flex gap-2">
                <Input
                  mono
                  value={forwardUrl ?? source.forwardUrl}
                  onChange={(e) => setForwardUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  disabled={forwardUrl === null || forwardUrl === source.forwardUrl}
                  onClick={async () => {
                    await update({ sourceId: id, forwardUrl: forwardUrl ?? undefined });
                    setForwardUrl(null);
                  }}
                >
                  Save
                </Button>
              </div>
            </SettingRow>

            <SettingRow
              label="Signing secret"
              description={`${providerName} gives you this. It proves each event really came from them. Paste a new one to replace it.`}
            >
              <div className="flex gap-2">
                <Input
                  mono
                  type="password"
                  value={newSecret}
                  onChange={(e) => setNewSecret(e.target.value)}
                  placeholder="Signing secret"
                  className="flex-1"
                />
                <Button
                  disabled={!newSecret}
                  onClick={async () => {
                    await rotateSecret({ sourceId: id, signingSecret: newSecret });
                    setNewSecret('');
                  }}
                >
                  Replace
                </Button>
              </div>
            </SettingRow>

            <OutboundSecuritySettings
              key={source.forwardHeaderKeys.join(',')}
              sourceId={id}
              forwardHeaderKeys={source.forwardHeaderKeys}
              hasOutboundSecret={source.hasOutboundSecret}
            />

            <SettingRow
              label="Delete this source"
              description="Stops accepting new events from this provider. Existing events are kept until their retention window ends."
              last
            >
              <div>
                <Button
                  variant="danger"
                  onClick={async () => {
                    await softDelete({ sourceId: id });
                    navigate('/sources');
                  }}
                >
                  Delete source
                </Button>
              </div>
            </SettingRow>
          </>
        )}
      </div>
    </>
  );
}

function Tab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        '-mb-px border-b-2 px-2.5 py-2.5 text-sm transition-colors',
        active
          ? 'border-foreground font-medium text-foreground'
          : 'border-transparent text-subtle hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}
