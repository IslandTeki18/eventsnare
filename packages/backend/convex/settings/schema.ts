import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const settingsTables = {
  userSettings: defineTable({
    userId: v.id('users'),
    key: v.string(),
    value: v.string(),
  })
    .index('byUserId', ['userId'])
    .index('byUserAndKey', ['userId', 'key']),
};

export default settingsTables;
