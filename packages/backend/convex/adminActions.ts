'use node';

import { createClerkClient } from '@clerk/backend';
import { v } from 'convex/values';
import { action } from './_generated/server';
import { api, internal } from './_generated/api';

export const setUserBanned = action({
  args: { userId: v.id('users'), banned: v.boolean() },
  handler: async (ctx, { userId, banned }) => {
    const target = await ctx.runQuery(api.admin.getUserClerkId, { userId });
    if (!target) throw new Error('Forbidden or user not found');
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) throw new Error('Missing CLERK_SECRET_KEY');
    const clerk = createClerkClient({ secretKey });
    if (banned) {
      await clerk.users.banUser(target.clerkId);
      await ctx.runMutation(internal.admin.markBanned, {
        userId,
        bannedBy: target.adminUserId,
      });
      await ctx.runMutation(internal.admin.recordActivity, {
        actorUserId: target.adminUserId,
        action: 'user.ban',
        targetType: 'user',
        targetId: userId,
      });
    } else {
      await clerk.users.unbanUser(target.clerkId);
      await ctx.runMutation(internal.admin.markUnbanned, { userId });
      await ctx.runMutation(internal.admin.recordActivity, {
        actorUserId: target.adminUserId,
        action: 'user.unban',
        targetType: 'user',
        targetId: userId,
      });
    }
  },
});
