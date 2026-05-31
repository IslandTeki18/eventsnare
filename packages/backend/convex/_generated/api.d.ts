/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminActions from "../adminActions.js";
import type * as auth_users from "../auth/users.js";
import type * as auth_webhooks from "../auth/webhooks.js";
import type * as blog from "../blog.js";
import type * as http from "../http.js";
import type * as ingress from "../ingress.js";
import type * as notifications from "../notifications.js";
import type * as profiles from "../profiles.js";
import type * as push from "../push.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as rbac from "../rbac.js";
import type * as settings from "../settings.js";
import type * as stressTest from "../stressTest.js";
import type * as stripe from "../stripe.js";
import type * as stripe_webhooks from "../stripe/webhooks.js";
import type * as stripeActions from "../stripeActions.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminActions: typeof adminActions;
  "auth/users": typeof auth_users;
  "auth/webhooks": typeof auth_webhooks;
  blog: typeof blog;
  http: typeof http;
  ingress: typeof ingress;
  notifications: typeof notifications;
  profiles: typeof profiles;
  push: typeof push;
  pushSubscriptions: typeof pushSubscriptions;
  rbac: typeof rbac;
  settings: typeof settings;
  stressTest: typeof stressTest;
  stripe: typeof stripe;
  "stripe/webhooks": typeof stripe_webhooks;
  stripeActions: typeof stripeActions;
  waitlist: typeof waitlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
