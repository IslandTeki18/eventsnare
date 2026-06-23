// Plan limits and billing-period helpers (SPEC §5).
//
// Monthly event quotas per plan tier. `workspaces.plan` is a free-form string; unknown plans
// fall back to the free limit so an unrecognized value can never grant unbounded quota.

const PLAN_LIMITS: Record<string, number> = {
  free: 10_000,
  indie: 250_000,
  startup: 2_000_000,
  growth: 10_000_000,
  pro: 50_000_000,
};

const FREE_LIMIT = PLAN_LIMITS.free!;

export function planLimit(plan: string): number {
  return PLAN_LIMITS[plan] ?? FREE_LIMIT;
}

// UTC YYYY-MM billing period. Usage counters roll up per calendar month in UTC so the
// increment is deterministic regardless of the caller's timezone.
export function billingPeriodUTC(epochMs: number): string {
  const d = new Date(epochMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Quota thresholds that fire an alert, as fractions of the plan limit (SPEC FR-ALERT-3).
export const QUOTA_THRESHOLDS = [0.8, 1.0, 1.1] as const;
