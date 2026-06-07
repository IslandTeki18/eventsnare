// Usage surface for the dashboard (SPEC FR-DASH-7). Reports the current billing period's
// event count against the workspace plan limit so the Usage page can render consumption and
// overage warnings. Reactive and workspace-scoped.

import { query } from './_generated/server';
import { requireWorkspace } from './workspaces';
import { billingPeriodUTC, planLimit } from './lib/plans';

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const workspace = await requireWorkspace(ctx);
    const billingPeriod = billingPeriodUTC(Date.now());
    const counter = await ctx.db
      .query('usageCounters')
      .withIndex('by_workspace_period', (q) =>
        q.eq('workspaceId', workspace._id).eq('billingPeriod', billingPeriod),
      )
      .first();
    const eventCount = counter?.eventCount ?? 0;
    const limit = planLimit(workspace.plan);
    return {
      plan: workspace.plan,
      billingPeriod,
      eventCount,
      planLimit: limit,
      pct: limit > 0 ? eventCount / limit : 0,
    };
  },
});
