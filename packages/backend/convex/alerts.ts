// Dashboard-facing alert configuration (SPEC FR-DASH-6, FR-ALERT-5). Workspace-scoped: a
// customer enables/disables each alert type per channel (email, Slack) and sets the target
// address or webhook URL. One row per (workspace, type, channel); setConfig upserts.

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireWorkspace } from './workspaces';
import { ALERT_TYPE } from './alerts/dispatch';

const CHANNEL = v.union(v.literal('email'), v.literal('slack'));

export const listConfig = query({
  args: {},
  handler: async (ctx) => {
    const workspace = await requireWorkspace(ctx);
    const rows = await ctx.db
      .query('alerts')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    return rows.map((r) => ({
      type: r.type,
      channel: r.channel,
      enabled: r.enabled,
      target: r.target,
    }));
  },
});

export const setConfig = mutation({
  args: {
    type: ALERT_TYPE,
    channel: CHANNEL,
    enabled: v.boolean(),
    target: v.string(),
  },
  handler: async (ctx, { type, channel, enabled, target }): Promise<void> => {
    const workspace = await requireWorkspace(ctx);
    const existing = await ctx.db
      .query('alerts')
      .withIndex('by_workspace_type', (q) =>
        q.eq('workspaceId', workspace._id).eq('type', type),
      )
      .collect();
    const row = existing.find((r) => r.channel === channel);
    if (row) {
      await ctx.db.patch(row._id, { enabled, target });
      return;
    }
    await ctx.db.insert('alerts', {
      workspaceId: workspace._id,
      type,
      channel,
      enabled,
      target,
    });
  },
});
