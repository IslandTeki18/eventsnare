import { httpRouter } from 'convex/server';
import { clerkWebhook } from './auth/webhooks';
import { stripeWebhook } from './stripe/webhooks';
import { waitlistOptions, waitlistSignup } from './waitlist';

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
