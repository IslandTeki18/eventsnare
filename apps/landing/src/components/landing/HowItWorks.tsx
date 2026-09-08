import { SectionHeading } from './SectionHeading'

const STEPS = [
  {
    number: 1,
    title: 'Point your provider at Eventsnare',
    body: 'Replace your endpoint URL in Stripe, GitHub, or any other provider with your Eventsnare ingress URL (/in/{workspace}/{source}). Takes 30 seconds.',
  },
  {
    number: 2,
    title: 'Eventsnare verifies and stores',
    body: 'Every incoming request is signature-verified against your stored secret. The raw payload is persisted durably before we return 2xx to the provider.',
  },
  {
    number: 3,
    title: 'We deliver to your endpoint',
    body: 'The byte-for-byte original payload is forwarded to your real endpoint with a configurable retry schedule: 10s → 30s → 2m → 10m → 1h → 6h → 24h.',
  },
  {
    number: 4,
    title: 'You replay from the dashboard',
    body: 'Any failed or missing event is one click away. Filter by provider, status, or time range and replay individually or in bulk.',
  },
] as const

export function HowItWorks() {
  return (
    <section aria-labelledby="heading-how" className="border-b border-border bg-panel">
      <div className="mx-auto max-w-[1080px] px-6 py-[72px]">
        <SectionHeading id="heading-how" eyebrow="How it works" title="How Eventsnare works" />
        <div className="mt-[34px] grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-8 gap-y-7">
          {STEPS.map(step => (
            <div key={step.number}>
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-sm tabular-nums text-muted-foreground">
                {step.number}
              </div>
              <h3 className="mt-3.5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-[13.5px] leading-[21px] text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
