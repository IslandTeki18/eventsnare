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
import type * as alerts from "../alerts.js";
import type * as alerts_dispatch from "../alerts/dispatch.js";
import type * as analytics from "../analytics.js";
import type * as auth_users from "../auth/users.js";
import type * as auth_webhooks from "../auth/webhooks.js";
import type * as blog from "../blog.js";
import type * as cliDelivery from "../cliDelivery.js";
import type * as cliSessions from "../cliSessions.js";
import type * as cliTokens from "../cliTokens.js";
import type * as crons from "../crons.js";
import type * as delivery from "../delivery.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as ingress from "../ingress.js";
import type * as ingressHttp from "../ingressHttp.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_cliAuth from "../lib/cliAuth.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_deliveryStats from "../lib/deliveryStats.js";
import type * as lib_email from "../lib/email.js";
import type * as lib_encoding from "../lib/encoding.js";
import type * as lib_forwardHeaders from "../lib/forwardHeaders.js";
import type * as lib_plans from "../lib/plans.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_searchText from "../lib/searchText.js";
import type * as notifications from "../notifications.js";
import type * as profiles from "../profiles.js";
import type * as providers_github from "../providers/github.js";
import type * as providers_hmac from "../providers/hmac.js";
import type * as providers_index from "../providers/index.js";
import type * as providers_shopify from "../providers/shopify.js";
import type * as providers_stripe from "../providers/stripe.js";
import type * as providers_svixBase from "../providers/svixBase.js";
import type * as providers_types from "../providers/types.js";
import type * as push from "../push.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as rbac from "../rbac.js";
import type * as secretsMigration from "../secretsMigration.js";
import type * as settings from "../settings.js";
import type * as sources from "../sources.js";
import type * as stripe from "../stripe.js";
import type * as stripe_webhooks from "../stripe/webhooks.js";
import type * as stripeActions from "../stripeActions.js";
import type * as usage from "../usage.js";
import type * as waitlist from "../waitlist.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  alerts: typeof alerts;
  "alerts/dispatch": typeof alerts_dispatch;
  analytics: typeof analytics;
  "auth/users": typeof auth_users;
  "auth/webhooks": typeof auth_webhooks;
  blog: typeof blog;
  cliDelivery: typeof cliDelivery;
  cliSessions: typeof cliSessions;
  cliTokens: typeof cliTokens;
  crons: typeof crons;
  delivery: typeof delivery;
  events: typeof events;
  http: typeof http;
  ingress: typeof ingress;
  ingressHttp: typeof ingressHttp;
  "lib/auth": typeof lib_auth;
  "lib/cliAuth": typeof lib_cliAuth;
  "lib/crypto": typeof lib_crypto;
  "lib/deliveryStats": typeof lib_deliveryStats;
  "lib/email": typeof lib_email;
  "lib/encoding": typeof lib_encoding;
  "lib/forwardHeaders": typeof lib_forwardHeaders;
  "lib/plans": typeof lib_plans;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/searchText": typeof lib_searchText;
  notifications: typeof notifications;
  profiles: typeof profiles;
  "providers/github": typeof providers_github;
  "providers/hmac": typeof providers_hmac;
  "providers/index": typeof providers_index;
  "providers/shopify": typeof providers_shopify;
  "providers/stripe": typeof providers_stripe;
  "providers/svixBase": typeof providers_svixBase;
  "providers/types": typeof providers_types;
  push: typeof push;
  pushSubscriptions: typeof pushSubscriptions;
  rbac: typeof rbac;
  secretsMigration: typeof secretsMigration;
  settings: typeof settings;
  sources: typeof sources;
  stripe: typeof stripe;
  "stripe/webhooks": typeof stripe_webhooks;
  stripeActions: typeof stripeActions;
  usage: typeof usage;
  waitlist: typeof waitlist;
  workspaces: typeof workspaces;
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
