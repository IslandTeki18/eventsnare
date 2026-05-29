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
    <section aria-labelledby="heading-how" className="bg-muted/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 id="heading-how" className="mb-14 text-center text-3xl font-bold text-foreground">
          How Eventsnare works
        </h2>

        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-6">
          {/* Dashed connector line (desktop only) */}
          <div className="absolute left-0 right-0 top-5 hidden border-t border-dashed border-border md:block" />

          {STEPS.map(step => (
            <div key={step.number} className="relative flex flex-col gap-4">
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-primary">
                {step.number}
              </div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
