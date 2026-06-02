import { httpRouter } from 'convex/server';
import { clerkWebhook } from './auth/webhooks';
import { stripeWebhook } from './stripe/webhooks';
import { waitlistOptions, waitlistSignup } from './waitlist';
import { ingress, healthz, status } from './ingressHttp';

const http = httpRouter();

// Public webhook ingress: POST /in/{workspaceSlug}/{sourceId} (SPEC §9).
http.route({
  pathPrefix: '/in/',
  method: 'POST',
  handler: ingress,
});

http.route({ path: '/healthz', method: 'GET', handler: healthz });
http.route({ path: '/v1/status', method: 'GET', handler: status });

http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: clerkWebhook,
});

http.route({
  path: '/stripe-webhook',
  method: 'POST',
  handler: stripeWebhook,
});

http.route({
  path: '/waitlist',
  method: 'OPTIONS',
  handler: waitlistOptions,
});

http.route({
  path: '/waitlist',
  method: 'POST',
  handler: waitlistSignup,
});

export default http;
