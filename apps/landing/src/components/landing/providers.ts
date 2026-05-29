import {
  StripeIcon,
  GitHubIcon,
  ShopifyIcon,
  ClerkIcon,
  ResendIcon,
} from './ProviderIcons'
import type { ComponentType } from 'react'

export interface ProviderDef {
  name: string
  descriptor: string
  Icon: ComponentType<{ className?: string; size?: number }>
}

export const PROVIDERS: ProviderDef[] = [
  { name: 'Stripe', descriptor: 'Payments & billing events', Icon: StripeIcon },
  { name: 'GitHub', descriptor: 'Repository & CI/CD events', Icon: GitHubIcon },
  { name: 'Shopify', descriptor: 'Orders & fulfillment events', Icon: ShopifyIcon },
  { name: 'Clerk', descriptor: 'Auth & user lifecycle events', Icon: ClerkIcon },
  { name: 'Resend', descriptor: 'Email delivery status events', Icon: ResendIcon },
]
