import {
  ShieldCheck,
  Database,
  RefreshCw,
  Fingerprint,
  PlayCircle,
  Activity,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useReveal } from '@/lib/useReveal'

interface FeatureCardProps {
  Icon: LucideIcon
  title: string
  body: string
}

function FeatureCard({ Icon, title, body }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted p-6">
      <Icon className="text-primary" size={22} />
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

const FEATURES = [
  {
    Icon: ShieldCheck,
    title: 'Provider-native signature verification',
    body: 'Every adapter is built against real captured payloads. Signatures are verified before any storage or delivery occurs. Forged or malformed requests are rejected immediately.',
  },
  {
    Icon: Database,
    title: 'Durable event persistence',
    body: 'The raw payload is stored before we return 2xx — no event is lost due to a downstream failure. Payloads ≤100KB stored inline; larger payloads go to file storage automatically.',
  },
  {
    Icon: RefreshCw,
    title: 'Automatic retries with backoff',
    body: 'Seven-attempt schedule: 10s, 30s, 2m, 10m, 1h, 6h, 24h. Per-source max configurable 1–7. Events that exhaust all attempts move to dead-letter, not the void.',
  },
  {
    Icon: Fingerprint,
    title: 'Deduplication built in',
    body: 'Duplicate events from the same provider are detected and suppressed. First write wins — your endpoint receives each logical event exactly once.',
  },
  {
    Icon: PlayCircle,
    title: 'One-click replay',
    body: 'Any event — delivered, failed, or dead-lettered — can be replayed from the dashboard. Filter by provider, source, status, or time window. Replay individually or in bulk.',
  },
  {
    Icon: Activity,
    title: 'Real-time delivery dashboard',
    body: 'Live delivery status, per-attempt response codes and latency, event payload inspection, and full attempt history. Updates reactively — no polling.',
  },
] as const

const HEADER_NAMES = [
  'X-Eventsnare-Event-Id',
  'X-Eventsnare-Attempt',
  'X-Eventsnare-Source',
  'X-Eventsnare-Original-Signature',
]

export function Features() {
  const heading = useReveal()
  const grid = useReveal()

  return (
    <section aria-labelledby="heading-features" className="mx-auto max-w-6xl px-6 py-24">
      <div ref={heading.ref} className={heading.className}>
        <div className="mb-12 text-center">
          <h2 id="heading-features" className="text-3xl font-bold text-foreground">
            Everything your webhook pipeline needs
          </h2>
          <p className="mt-3 text-muted-foreground">Built for reliability from day one.</p>
        </div>
      </div>

      <div ref={grid.ref} className={grid.className}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {FEATURES.map(f => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-muted px-8 py-6">
          <p className="font-mono text-sm text-muted-foreground">
            {HEADER_NAMES.join(' · ')}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Every forwarded request carries these headers so your endpoint always knows exactly
            what it&apos;s receiving and why.
          </p>
        </div>
      </div>
    </section>
  )
}
