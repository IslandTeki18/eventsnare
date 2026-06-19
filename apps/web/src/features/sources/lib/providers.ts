// Provider catalog for the dashboard. Keys match the backend provider registry
// (packages/backend/convex/providers). All five launch providers are supported; Stripe is
// flagged Most Popular per SPEC §10. `secretLabel` and `steps` drive the onboarding screens
// and the in-product connection guide (ProviderSetupGuide).

export interface GuideStep {
  title: string;
  detail: string;
  // When true, the live ingress URL is rendered as a copyable block under this step. Before a
  // source exists (e.g. the create form), the guide shows a placeholder instead.
  showIngressUrl?: boolean;
}

export interface ProviderMeta {
  key: string;
  name: string;
  glyph: string;
  popular?: boolean;
  secretLabel: string;
  docsUrl: string;
  steps: GuideStep[];
}

export const PROVIDERS: ProviderMeta[] = [
  {
    key: 'stripe',
    name: 'Stripe',
    glyph: 'S',
    popular: true,
    secretLabel: 'Signing secret (whsec_…)',
    docsUrl: 'https://docs.stripe.com/webhooks',
    steps: [
      {
        title: 'Open the Stripe Dashboard',
        detail: 'Go to Developers → Webhooks → Add endpoint.',
      },
      {
        title: 'Set the endpoint URL',
        detail: 'Paste your Eventsnare ingress URL as the endpoint URL.',
        showIngressUrl: true,
      },
      {
        title: 'Copy the signing secret',
        detail:
          'After creating the endpoint, reveal the Signing secret (starts with whsec_) and add it to your Eventsnare source.',
      },
      {
        title: 'Verify delivery',
        detail:
          'Use "Send test webhook" in Stripe, or the Send test event button here, then watch it land in the events list.',
      },
    ],
  },
  {
    key: 'github',
    name: 'GitHub',
    glyph: 'GH',
    secretLabel: 'Webhook secret',
    docsUrl: 'https://docs.github.com/en/webhooks',
    steps: [
      {
        title: 'Open webhook settings',
        detail: 'In your repo or org go to Settings → Webhooks → Add webhook.',
      },
      {
        title: 'Set the payload URL',
        detail: 'Set the Payload URL to your Eventsnare ingress URL and content type application/json.',
        showIngressUrl: true,
      },
      {
        title: 'Set the secret',
        detail: 'Enter a secret in GitHub and add the same value to your Eventsnare source.',
      },
      {
        title: 'Verify delivery',
        detail:
          'GitHub sends a ping on save, or use the Send test event button here, then watch it land in the events list.',
      },
    ],
  },
  {
    key: 'shopify',
    name: 'Shopify',
    glyph: 'SH',
    secretLabel: 'App webhook secret',
    docsUrl: 'https://shopify.dev/docs/apps/build/webhooks',
    steps: [
      {
        title: 'Open your app settings',
        detail: 'Configure a webhook subscription in your Shopify app or admin.',
      },
      {
        title: 'Set the endpoint URL',
        detail: 'Point the subscription at your Eventsnare ingress URL.',
        showIngressUrl: true,
      },
      {
        title: 'Copy the signing secret',
        detail: 'Add the app’s webhook signing secret to your Eventsnare source.',
      },
      {
        title: 'Verify delivery',
        detail:
          'Trigger the subscribed event, or use the Send test event button here, then watch it land in the events list.',
      },
    ],
  },
  {
    key: 'clerk',
    name: 'Clerk',
    glyph: 'CL',
    secretLabel: 'Signing secret (whsec_…)',
    docsUrl: 'https://clerk.com/docs/webhooks/overview',
    steps: [
      {
        title: 'Open the Clerk Dashboard',
        detail: 'Go to Webhooks → Add Endpoint.',
      },
      {
        title: 'Set the endpoint URL',
        detail: 'Set the Endpoint URL to your Eventsnare ingress URL.',
        showIngressUrl: true,
      },
      {
        title: 'Copy the signing secret',
        detail: 'Copy the Signing Secret and add it to your Eventsnare source.',
      },
      {
        title: 'Verify delivery',
        detail:
          'Use Clerk’s "Send example" in the endpoint, or the Send test event button here, then watch it land in the events list.',
      },
    ],
  },
  {
    key: 'resend',
    name: 'Resend',
    glyph: 'R',
    secretLabel: 'Webhook signing secret',
    docsUrl: 'https://resend.com/docs/dashboard/webhooks/introduction',
    steps: [
      {
        title: 'Open the Resend Dashboard',
        detail: 'Go to Webhooks → Add Webhook.',
      },
      {
        title: 'Set the endpoint URL',
        detail: 'Use your Eventsnare ingress URL as the endpoint.',
        showIngressUrl: true,
      },
      {
        title: 'Copy the signing secret',
        detail: 'Add the signing secret to your Eventsnare source.',
      },
      {
        title: 'Verify delivery',
        detail:
          'Trigger an email event, or use the Send test event button here, then watch it land in the events list.',
      },
    ],
  },
];

export function getProviderMeta(key: string): ProviderMeta | undefined {
  return PROVIDERS.find((p) => p.key === key);
}
