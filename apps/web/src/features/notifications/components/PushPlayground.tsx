import { useWebPush } from '@/features/notifications/hooks/useWebPush';

type RowState = 'ok' | 'pending' | 'blocked';

function StatusRow({ label, value, state }: { label: string; value: string; state: RowState }) {
  const dot =
    state === 'ok' ? 'bg-emerald-500' : state === 'blocked' ? 'bg-red-500' : 'bg-amber-500';
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-2 text-sm font-medium">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} aria-hidden />
        {value}
      </span>
    </div>
  );
}

export function PushPlayground() {
  const {
    support,
    permission,
    isSubscribed,
    subscriptionCount,
    isBusy,
    error,
    lastSend,
    enable,
    disable,
    sendTest,
  } = useWebPush();

  const permissionState: RowState =
    permission === 'granted' ? 'ok' : permission === 'denied' ? 'blocked' : 'pending';

  const missing = [
    !support.serviceWorker && 'Service Worker',
    !support.pushManager && 'Push API',
    !support.notification && 'Notifications API',
  ].filter(Boolean);

  return (
    <div className="w-full max-w-xl rounded-lg border border-border bg-background p-8 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Web Push Playground</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Subscribe this browser, then send a push to your own devices through Convex.
      </p>

      <div className="mt-6 rounded-md border border-border px-4 py-2">
        <StatusRow
          label="Browser support"
          value={support.isSupported ? 'Supported' : `Missing: ${missing.join(', ')}`}
          state={support.isSupported ? 'ok' : 'blocked'}
        />
        <StatusRow label="Notification permission" value={permission} state={permissionState} />
        <StatusRow
          label="This browser"
          value={isSubscribed ? 'Subscribed' : 'Not subscribed'}
          state={isSubscribed ? 'ok' : 'pending'}
        />
        <StatusRow
          label="Subscribed devices"
          value={String(subscriptionCount)}
          state={subscriptionCount > 0 ? 'ok' : 'pending'}
        />
      </div>

      {!support.isSupported ? (
        <p className="mt-4 text-sm text-amber-500">
          This browser cannot run web push. On iOS, add the site to your Home Screen first, then
          reopen it from there.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {isSubscribed ? (
          <>
            <button
              type="button"
              onClick={() => void sendTest()}
              disabled={isBusy}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Send to self
            </button>
            <button
              type="button"
              onClick={() => void disable()}
              disabled={isBusy}
              className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Disable
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void enable()}
            disabled={isBusy || !support.isSupported}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isBusy ? 'Working…' : 'Enable push'}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {lastSend ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Last send — sent: {lastSend.sent}, failed: {lastSend.failed}, removed dead:{' '}
          {lastSend.removed}
        </p>
      ) : null}
    </div>
  );
}
