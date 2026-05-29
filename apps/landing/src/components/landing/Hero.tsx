import { EmailSignupForm } from '@/components/ui/EmailSignupForm'
import {
  StripeIcon,
  GitHubIcon,
  ShopifyIcon,
  ClerkIcon,
  ResendIcon,
} from './ProviderIcons'
import type { ComponentType } from 'react'

interface ProviderEntry {
  name: string
  Icon: ComponentType<{ className?: string; size?: number }>
}

const PROVIDERS: ProviderEntry[] = [
  { name: 'Stripe', Icon: StripeIcon },
  { name: 'GitHub', Icon: GitHubIcon },
  { name: 'Shopify', Icon: ShopifyIcon },
  { name: 'Clerk', Icon: ClerkIcon },
  { name: 'Resend', Icon: ResendIcon },
]

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pb-16 pt-24 text-center">
      {/* Radial gradient background accent */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(343 76% 68% / 0.07), transparent)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
          Webhooks break.
          <br />
          Your events shouldn&apos;t.
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
          Eventsnare sits between your webhook providers and your app. It verifies every
          signature, durably stores every event, and delivers it to your endpoint — with
          retries, deduplication, and one-click replay. So a missed Stripe payment never
          silently vanishes again.
        </p>

        <EmailSignupForm id="email-signup" className="w-full max-w-md" />

        {/* Provider strip */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Works with the tools you already use</p>
          <div className="flex items-center gap-8 opacity-50">
            {PROVIDERS.map(({ name, Icon }) => (
              <div key={name} className="flex flex-col items-center gap-1.5">
                <Icon size={28} className="text-foreground" />
                <span className="text-xs text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
