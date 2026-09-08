import { SectionHeading } from './SectionHeading'

const FEATURES = [
  {
    title: 'Provider-native signature verification',
    body: 'Every adapter is built against real captured payloads. Signatures are verified before any storage or delivery occurs. Forged or malformed requests are rejected immediately.',
  },
  {
    title: 'Durable event persistence',
    body: 'The raw payload is stored before we return 2xx — no event is lost due to a downstream failure. Payloads ≤100KB stored inline; larger payloads go to file storage automatically.',
  },
  {
    title: 'Automatic retries with backoff',
    body: 'Seven-attempt schedule: 10s, 30s, 2m, 10m, 1h, 6h, 24h. Per-source max configurable 1–7. Events that exhaust all attempts move to dead-letter, not the void.',
  },
  {
    title: 'Deduplication built in',
    body: 'Duplicate events from the same provider are detected and suppressed. First write wins — your endpoint receives each logical event exactly once.',
  },
  {
    title: 'One-click replay',
    body: 'Any event — delivered, failed, or dead-lettered — can be replayed from the dashboard. Filter by provider, source, status, or time window. Replay individually or in bulk.',
  },
  {
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
  return (
    <section aria-labelledby="heading-features" className="border-b border-border">
      <div className="mx-auto max-w-[1080px] px-6 py-[72px]">
        <SectionHeading
          id="heading-features"
          eyebrow="Features"
          title="Everything your webhook pipeline needs"
          sub="Built for reliability from day one."
        />

        <div className="mt-8 overflow-hidden">
          <div className="-ml-px -mt-px grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            {FEATURES.map(f => (
              <div key={f.title} className="border-l border-t border-border px-6 pb-6 pt-[22px]">
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-[9px] text-[13.5px] leading-[21px] text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 rounded-[7px] border border-border bg-panel px-[22px] py-5">
          <p className="break-words font-mono text-sm leading-[22px] text-muted-foreground">
            {HEADER_NAMES.join(' · ')}
          </p>
          <p className="mt-[11px] max-w-[64ch] text-[13.5px] leading-[21px] text-muted-foreground">
            Every forwarded request carries these headers so your endpoint always knows exactly
            what it&apos;s receiving and why.
          </p>
        </div>
      </div>
    </section>
  )
}
