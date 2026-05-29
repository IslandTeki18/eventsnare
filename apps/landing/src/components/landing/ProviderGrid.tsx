import {
  StripeIcon,
  GitHubIcon,
  ShopifyIcon,
  ClerkIcon,
  ResendIcon,
} from './ProviderIcons'
import type { ComponentType } from 'react'

interface Provider {
  name: string
  descriptor: string
  Icon: ComponentType<{ className?: string; size?: number }>
}

const PROVIDERS: Provider[] = [
  { name: 'Stripe', descriptor: 'Payments & billing events', Icon: StripeIcon },
  { name: 'GitHub', descriptor: 'Repository & CI/CD events', Icon: GitHubIcon },
  { name: 'Shopify', descriptor: 'Orders & fulfillment events', Icon: ShopifyIcon },
  { name: 'Clerk', descriptor: 'Auth & user lifecycle events', Icon: ClerkIcon },
  { name: 'Resend', descriptor: 'Email delivery status events', Icon: ResendIcon },
]

export function ProviderGrid() {
  return (
    <section className="bg-muted/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Works with the providers you already use
          </h2>
          <p className="mt-3 text-muted-foreground">
            More providers added before and after launch.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {PROVIDERS.map(({ name, descriptor, Icon }) => (
            <div
              key={name}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted p-6"
            >
              <Icon size={32} className="text-foreground" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{descriptor}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Using a provider not listed? Custom adapters are on the roadmap.
        </p>
      </div>
    </section>
  )
}
