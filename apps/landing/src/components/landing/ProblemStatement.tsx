import { SectionHeading } from './SectionHeading'

const PROBLEMS = [
  {
    title: 'Signature verification is error-prone',
    body: "Every provider signs payloads differently. One missed header check or wrong secret and you're processing forged events — or silently dropping real ones.",
  },
  {
    title: "Providers don't retry reliably",
    body: 'Stripe retries for 3 days. GitHub gives you 3 attempts. Shopify retries 19 times over 48 hours. When your endpoint is down for 10 minutes at the wrong moment, you lose events permanently.',
  },
  {
    title: 'Debugging failures is painful',
    body: 'Which event failed? Was it a timeout or a 500? Can you replay it? Without structured delivery history, every incident is a grep through logs.',
  },
] as const

export function ProblemStatement() {
  return (
    <section aria-labelledby="heading-problems" className="border-b border-border">
      <div className="mx-auto max-w-[1080px] px-6 py-[72px]">
        <SectionHeading id="heading-problems" eyebrow="The problem" title="The problem with webhooks" />
        <div className="mt-8 overflow-hidden">
          <div className="-ml-px -mt-px grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {PROBLEMS.map(p => (
              <div key={p.title} className="border-l border-t border-border px-6 pb-6 pt-[22px]">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-[9px] text-[13.5px] leading-[21px] text-muted-foreground">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
