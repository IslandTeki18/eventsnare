import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-foreground">
          Simple, predictable pricing
        </h2>
        <p className="mt-3 text-muted-foreground">No per-event fees. No surprise bills.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {TIERS.map(tier => (
          <div
            key={tier.name}
            className={cn(
              'relative flex flex-col gap-6 rounded-xl border bg-muted p-8',
              tier.featured ? 'border-primary' : 'border-border'
            )}
          >
            {tier.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Most popular
              </span>
            )}
            <div>
              <p className="font-semibold text-foreground">{tier.name}</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{tier.price}</p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {tier.features.map(feature => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        All plans include signature verification, deduplication, dead-letter queue, and
        real-time dashboard. Overage pricing available on Growth and Pro.
      </p>
    </section>
  )
}
