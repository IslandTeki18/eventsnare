// Provider catalog for the dashboard. Keys match the backend provider registry
// (packages/backend/convex/providers). All five launch providers are supported; Stripe is
// flagged Most Popular per SPEC §10. `secretLabel` and `guide` drive the onboarding screens.

export interface ProviderMeta {
  key: string;
  name: string;
  glyph: string;
  popular?: boolean;
  secretLabel: string;
  guide: string;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    key: 'stripe',
    name: 'Stripe',
    glyph: 'S',
    popular: true,
    secretLabel: 'Signing secret (whsec_…)',
    guide:
      'In the Stripe Dashboard go to Developers → Webhooks → Add endpoint. Paste the Eventsnare ingress URL as the endpoint URL, then copy the "Signing secret" (starts with whsec_) here.',
  },
  {
    key: 'github',
    name: 'GitHub',
    glyph: 'GH',
    secretLabel: 'Webhook secret',
    guide:
      'In your GitHub repo or org go to Settings → Webhooks → Add webhook. Set the Payload URL to the Eventsnare ingress URL, content type application/json, and enter the same secret here.',
  },
  {
    key: 'shopify',
    name: 'Shopify',
    glyph: 'SH',
    secretLabel: 'App webhook secret',
    guide:
      'In your Shopify app settings configure the webhook subscription to point at the Eventsnare ingress URL, and paste the app’s webhook signing secret here.',
  },
  {
    key: 'clerk',
    name: 'Clerk',
    glyph: 'CL',
    secretLabel: 'Signing secret (whsec_…)',
    guide:
      'In the Clerk Dashboard go to Webhooks → Add Endpoint. Set the Endpoint URL to the Eventsnare ingress URL and copy the Signing Secret here.',
  },
  {
    key: 'resend',
    name: 'Resend',
    glyph: 'R',
    secretLabel: 'Webhook signing secret',
    guide:
      'In the Resend Dashboard go to Webhooks → Add Webhook. Use the Eventsnare ingress URL as the endpoint and paste the signing secret here.',
  },
];

export function getProviderMeta(key: string): ProviderMeta | undefined {
  return PROVIDERS.find((p) => p.key === key);
}
