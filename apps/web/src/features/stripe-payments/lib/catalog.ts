// Static plan catalog: source of truth for billing display (SPEC §5 / §4.7).
// Stripe price IDs are NOT here; checkout resolves them from api.stripe.listPlans
// by matching tier name + interval, so this stays a pure display constant.

export type PlanInterval = 'month' | 'year';

export interface PlanTier {
  tier: 'free' | 'indie' | 'startup' | 'growth' | 'pro';
  name: string;
  monthlyCents: number;
  eventsPerMonth: number;
  sources: number | null; // null = unlimited
  retentionDays: number;
  features: string[];
  overageEligible: boolean; // §4.7 FR-BILL-4: overages on indie/startup/growth only
  popular?: boolean;
}

export const ANNUAL_MONTHS_FREE = 2; // §4.7 FR-BILL-5

// Per-month price for display, billed annually (2 months free spread over 12).
export function annualMonthlyCents(monthlyCents: number): number {
  return Math.round((monthlyCents * (12 - ANNUAL_MONTHS_FREE)) / 12);
}

export const PLAN_CATALOG: PlanTier[] = [
  {
    tier: 'free',
    name: 'Free',
    monthlyCents: 0,
    eventsPerMonth: 10_000,
    sources: 2,
    retentionDays: 7,
    features: ['All providers', 'Basic dashboard', 'Email alerts'],
    overageEligible: false,
  },
  {
    tier: 'indie',
    name: 'Indie',
    monthlyCents: 2900,
    eventsPerMonth: 250_000,
    sources: 10,
    retentionDays: 30,
    features: ['Slack alerts', 'Replay', 'Bulk operations'],
    overageEligible: true,
    popular: true,
  },
  {
    tier: 'startup',
    name: 'Startup',
    monthlyCents: 9900,
    eventsPerMonth: 2_000_000,
    sources: 50,
    retentionDays: 60,
    features: ['Anomaly detection', 'API access (v2)', '99.95% SLA'],
    overageEligible: true,
  },
  {
    tier: 'growth',
    name: 'Growth',
    monthlyCents: 29900,
    eventsPerMonth: 10_000_000,
    sources: null,
    retentionDays: 90,
    features: ['Audit log', 'Team seats (up to 5)', 'Priority support'],
    overageEligible: true,
  },
  {
    tier: 'pro',
    name: 'Pro',
    monthlyCents: 99900,
    eventsPerMonth: 50_000_000,
    sources: null,
    retentionDays: 365,
    features: ['SSO/SAML', 'EU data residency', 'Custom retention', 'SLA-backed'],
    overageEligible: false,
  },
];

export function formatEvents(count: number): string {
  if (count >= 1_000_000) return `${count / 1_000_000}M`;
  if (count >= 1_000) return `${count / 1_000}K`;
  return String(count);
}

export function formatPrice(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
