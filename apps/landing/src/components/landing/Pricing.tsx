import { cn } from '@/lib/utils'
import { SectionHeading } from './SectionHeading'

interface PricingTier {
  name: string
  price: string
  featured: boolean
  features: string[]
}

const TIERS: PricingTier[] = [
  {
    name: 'Starter',
    price: '$0/mo',
    featured: false,
    features: [
      '10,000 events/month',
      '7-day event history',
      '3 sources',
      '3-attempt retry max',
      'Community support',
    ],
  },
  {
    name: 'Growth',
    price: '$29/mo',
    featured: true,
    features: [
      '100,000 events/month',
      '30-day event history',
      'Unlimited sources',
      '7-attempt retry max',
      'Email support',
      'Bulk replay',
    ],
  },
  {
    name: 'Pro',
    price: '$99/mo',
    featured: false,
    features: [
      '1,000,000 events/month',
      '90-day event history',
      'Unlimited sources',
      '7-attempt retry max',
      'Priority support',
      '365-day history add-on available',
    ],
  },
]

function scrollToSignup() {
  document.getElementById('email-signup')?.scrollIntoView({ behavior: 'smooth' })
}

export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="heading-pricing" className="border-b border-border">
      <div className="mx-auto max-w-[1080px] px-6 py-[72px]">
        <SectionHeading
          id="heading-pricing"
          eyebrow="Pricing"
          title="Simple, predictable pricing"
          sub="No per-event fees. No surprise bills."
        />

        <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
          {TIERS.map(tier => (
            <div
              key={tier.name}
              className={cn(
                'flex flex-col gap-[18px] rounded-lg border p-6',
                tier.featured ? 'border-foreground bg-panel' : 'border-border'
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-semibold">{tier.name}</p>
                  {tier.featured && (
                    <span className="rounded-[20px] border border-foreground px-2.5 py-px text-3xs font-medium">
                      Most popular
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[28px] font-semibold tabular-nums tracking-[-0.03em]">
                  {tier.price}
                </p>
              </div>

              <ul className="flex flex-1 flex-col gap-[9px]">
                {tier.features.map(feature => (
                  <li
                    key={feature}
                    className="flex items-start gap-[9px] text-base leading-[19px] text-muted-foreground"
                  >
                    <span className="mt-[7px] h-[5px] w-[5px] shrink-0 bg-subtle" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={scrollToSignup}
                className={cn(
                  'w-full rounded-[5px] border py-2 text-sm font-medium transition-opacity hover:opacity-90',
                  tier.featured
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-foreground'
                )}
              >
                Get early access
              </button>
            </div>
          ))}
        </div>

        <p className="mt-[22px] max-w-[70ch] text-base leading-5 text-subtle">
          All plans include signature verification, deduplication, dead-letter queue, and real-time
          dashboard. Overage pricing available on Growth and Pro.
        </p>
      </div>
    </section>
  )
}
