// Provider registry. Maps a source's `provider` key to its adapter. Launch set (SPEC §7.3):
// Stripe, GitHub, Shopify, Clerk, Resend. Adding a provider later is a one-line entry plus a
// new adapter file and fixture suite.

import type { ProviderAdapter } from './types';
import { stripeAdapter } from './stripe';
import { githubAdapter } from './github';
import { shopifyAdapter } from './shopify';
import { clerkAdapter } from './clerk';
import { resendAdapter } from './resend';

export const PROVIDERS = {
  stripe: stripeAdapter,
  github: githubAdapter,
  shopify: shopifyAdapter,
  clerk: clerkAdapter,
  resend: resendAdapter,
} satisfies Record<string, ProviderAdapter>;

export type ProviderKey = keyof typeof PROVIDERS;

export function getAdapter(provider: string): ProviderAdapter | null {
  return (PROVIDERS as Record<string, ProviderAdapter>)[provider] ?? null;
}

export function isSupportedProvider(provider: string): provider is ProviderKey {
  return provider in PROVIDERS;
}

export { type ProviderAdapter, type IncomingRequest, type VerificationResult } from './types';
