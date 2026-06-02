import { defineSchema } from 'convex/server';
import authTables from './auth/schema';
import rbacTables from './rbac/schema';
import adminTables from './admin-dashboard/schema';
import notificationsTables from './notifications/schema';
import pushSubscriptionsTables from './pushSubscriptions/schema';
import stripeTables from './stripe-payments/schema';
import settingsTables from './settings/schema';
import userProfileTables from './user-profile/schema';
import ingressTables from './ingress/schema';
import workspacesTables from './workspaces/schema';
import blogTables from './blog/schema';
// @scaffold:imports

export default defineSchema({
  ...authTables,
  ...rbacTables,
  ...adminTables,
  ...notificationsTables,
  ...pushSubscriptionsTables,
  ...stripeTables,
  ...settingsTables,
  ...userProfileTables,
  ...ingressTables,
  ...workspacesTables,
  ...blogTables,
  // @scaffold:schema
});
