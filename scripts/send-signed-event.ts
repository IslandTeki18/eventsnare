// Send a correctly-signed sample webhook to an Eventsnare ingress URL for any of the five
// launch providers. Mirrors the signature schemes implemented in
// packages/backend/convex/providers/* so a delivered event lands as signatureValid=true.
//
// Uses only Node builtins (node:crypto, global fetch) — no Convex or external deps.
//
// Usage:
//   pnpm tsx scripts/send-signed-event.ts \
//     --provider stripe \
//     --secret <signing secret you set on the source> \
//     --url "<ingress URL from the source detail page>" \
//     [--type <event type>] [--id <provider event id>]
//
// Notes:
//   - stripe/github/shopify: --secret can be any string (it's the HMAC key).
//   - clerk/resend (Svix): --secret must be a Svix secret, e.g.
//     whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw (the part after whsec_ must be valid base64).

import { createHmac, randomUUID } from 'node:crypto';

type Provider = 'stripe' | 'github' | 'shopify' | 'clerk' | 'resend';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const value = argv[i + 1];
    if (key && value !== undefined) out[key] = value;
  }
  return out;
}

function hmacHex(secret: string, message: string): string {
  return createHmac('sha256', secret).update(message).digest('hex');
}

function hmacBase64(secret: string, message: string): string {
  return createHmac('sha256', secret).update(message).digest('base64');
}

// Svix signs with the raw bytes of the base64 secret body (after the whsec_ prefix).
function svixSign(secret: string, signedContent: string): string {
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const sig = createHmac('sha256', key).update(signedContent).digest('base64');
  return `v1,${sig}`;
}

interface Built {
  body: string;
  headers: Record<string, string>;
}

function build(provider: Provider, secret: string, type?: string, id?: string): Built {
  const now = Math.floor(Date.now() / 1000);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  switch (provider) {
    case 'stripe': {
      const eventType = type ?? 'payment_intent.succeeded';
      const eventId = id ?? `evt_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
      const body = JSON.stringify({
        id: eventId,
        type: eventType,
        data: { object: { id: 'pi_test', amount: 1000 } },
      });
      headers['Stripe-Signature'] = `t=${now},v1=${hmacHex(secret, `${now}.${body}`)}`;
      return { body, headers };
    }
    case 'github': {
      const eventType = type ?? 'push';
      const body = JSON.stringify({ zen: 'Keep it simple.', hook_id: 1 });
      headers['X-Hub-Signature-256'] = `sha256=${hmacHex(secret, body)}`;
      headers['X-GitHub-Delivery'] = id ?? randomUUID();
      headers['X-GitHub-Event'] = eventType;
      return { body, headers };
    }
    case 'shopify': {
      const eventType = type ?? 'orders/create';
      const body = JSON.stringify({ id: 820982911946154508, financial_status: 'paid' });
      headers['X-Shopify-Hmac-Sha256'] = hmacBase64(secret, body);
      headers['X-Shopify-Webhook-Id'] = id ?? randomUUID();
      headers['X-Shopify-Topic'] = eventType;
      return { body, headers };
    }
    case 'clerk':
    case 'resend': {
      const eventType = type ?? (provider === 'clerk' ? 'user.created' : 'email.sent');
      const msgId = id ?? `msg_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
      const body = JSON.stringify({ type: eventType, data: { id: 'obj_test' } });
      headers['svix-id'] = msgId;
      headers['svix-timestamp'] = String(now);
      headers['svix-signature'] = svixSign(secret, `${msgId}.${now}.${body}`);
      return { body, headers };
    }
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const provider = args.provider as Provider | undefined;
  const { secret, url, type, id } = args;

  if (!provider || !secret || !url) {
    console.error('Required: --provider <p> --secret <s> --url <ingress url>');
    console.error('Providers: stripe | github | shopify | clerk | resend');
    process.exit(1);
  }

  const { body, headers } = build(provider, secret, type, id);
  const res = await fetch(url, { method: 'POST', headers, body });
  const text = await res.text();
  console.log(`[${provider}] -> ${res.status} ${res.statusText} ${text}`);
}

void main();
