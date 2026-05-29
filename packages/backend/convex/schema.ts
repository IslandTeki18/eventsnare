import { defineSchema } from 'convex/server';
import authTables from './auth/schema';
import rbacTables from './rbac/schema';
import adminTables from './admin-dashboard/schema';
import notificationsTables from './notifications/schema';
import pushSubscriptionsTables from './pushSubscriptions/schema';
import stripeTables from './stripe-payments/schema';
import settingsTables from './settings/schema';
import userProfileTables from './user-profile/schema';
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
  // @scaffold:schema
});
