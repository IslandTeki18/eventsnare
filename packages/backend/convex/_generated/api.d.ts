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
import type * as delivery from "../delivery.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as ingress from "../ingress.js";
import type * as ingressHttp from "../ingressHttp.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as notifications from "../notifications.js";
import type * as profiles from "../profiles.js";
import type * as providers_clerk from "../providers/clerk.js";
import type * as providers_github from "../providers/github.js";
import type * as providers_hmac from "../providers/hmac.js";
import type * as providers_index from "../providers/index.js";
import type * as providers_resend from "../providers/resend.js";
import type * as providers_shopify from "../providers/shopify.js";
import type * as providers_stripe from "../providers/stripe.js";
import type * as providers_svixBase from "../providers/svixBase.js";
import type * as providers_types from "../providers/types.js";
import type * as push from "../push.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as rbac from "../rbac.js";
import type * as settings from "../settings.js";
import type * as sources from "../sources.js";
import type * as stressTest from "../stressTest.js";
import type * as stripe from "../stripe.js";
import type * as stripe_webhooks from "../stripe/webhooks.js";
import type * as stripeActions from "../stripeActions.js";
import type * as waitlist from "../waitlist.js";
import type * as workspaces from "../workspaces.js";

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
  delivery: typeof delivery;
  events: typeof events;
  http: typeof http;
  ingress: typeof ingress;
  ingressHttp: typeof ingressHttp;
  "lib/auth": typeof lib_auth;
  "lib/crypto": typeof lib_crypto;
  notifications: typeof notifications;
  profiles: typeof profiles;
  "providers/clerk": typeof providers_clerk;
  "providers/github": typeof providers_github;
  "providers/hmac": typeof providers_hmac;
  "providers/index": typeof providers_index;
  "providers/resend": typeof providers_resend;
  "providers/shopify": typeof providers_shopify;
  "providers/stripe": typeof providers_stripe;
  "providers/svixBase": typeof providers_svixBase;
  "providers/types": typeof providers_types;
  push: typeof push;
  pushSubscriptions: typeof pushSubscriptions;
  rbac: typeof rbac;
  settings: typeof settings;
  sources: typeof sources;
  stressTest: typeof stressTest;
  stripe: typeof stripe;
  "stripe/webhooks": typeof stripe_webhooks;
  stripeActions: typeof stripeActions;
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
