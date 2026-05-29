import { httpRouter } from 'convex/server';
import { clerkWebhook } from './auth/webhooks';
import { stripeWebhook } from './stripe/webhooks';

const http = httpRouter();

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

export default http;
