# Eventsnare

Hosted webhook reliability service. Customers point third-party webhook providers (Stripe, GitHub, Shopify, Clerk, Resend, etc.) at an Eventsnare ingress URL. Eventsnare verifies the signature, durably persists the event, and reliably delivers it to the customer's own endpoint with retries, deduplication, and a one-click replay dashboard.

## Apps

| App | Port | Description |
|---|---|---|
| `apps/landing` | 3000 | Marketing site |
| `apps/web` | 5173 | Customer dashboard (Clerk + Convex) |
| `apps/admin` | 5174 | Internal admin console (Clerk + Convex, admin-role gated) |

## Tech stack

- TypeScript
- Turborepo (monorepo, pnpm workspaces)
- Convex (database, functions, scheduler, file storage, real-time)
- Clerk (authentication)
- React + Vite + Tailwind CSS

## Project structure

```
eventsnare/
├── apps/
│   ├── landing/              # Marketing site
│   ├── web/                  # Customer dashboard
│   └── admin/                # Internal admin console
├── packages/
│   ├── backend/
│   │   └── convex/           # @eventsnare/convex — all backend functions, schema, HTTP actions
│   ├── ui/                   # Shared UI components
│   └── types/                # Shared TypeScript types
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Environment variables

Each app reads a `.env.local` file in its own directory. The Convex backend reads environment variables set on the deployment via `npx convex env set`.

### Frontend apps (`apps/web/.env.local`, `apps/admin/.env.local`)

| Variable | Description |
|---|---|
| `VITE_CONVEX_URL` | Convex deployment client URL (`https://<deployment>.convex.cloud`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_test_...`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (web only) |
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key for web push |

### Convex deployment environment variables

Set each with `npx convex env set <KEY> <VALUE>` from `packages/backend/convex/`.

| Variable | Description |
|---|---|
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer URL (`https://<app>.clerk.accounts.dev`) — used by `auth.config.ts` |
| `CLERK_SECRET_KEY` | Clerk secret key — used by webhook handler to verify user identity |
| `CLERK_WEBHOOK_SECRET` | Signing secret for the Clerk webhook that syncs users into Convex |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the Stripe webhook endpoint |
| `STRIPE_PRICE_ID_PRO` | Stripe Price ID for the Pro plan |
| `STRIPE_PRICE_ID_TEAM` | Stripe Price ID for the Team plan |
| `VAPID_PUBLIC_KEY` | VAPID public key (same value as `VITE_VAPID_PUBLIC_KEY`) |
| `VAPID_PRIVATE_KEY` | VAPID private key — generate with `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | VAPID subject — a `mailto:` address, e.g. `mailto:you@example.com` |

## Local development

### One-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start the Convex dev server (first run links a deployment and writes .env.local)
cd packages/backend/convex
npx convex dev
# Ctrl-C once it prints "Convex functions ready"

# 3. Set Convex backend secrets
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
npx convex env set CLERK_SECRET_KEY sk_test_...
# ...repeat for remaining vars above

# 4. Copy env templates and fill in values
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/landing/.env.example apps/landing/.env.local
# Set VITE_CONVEX_URL and VITE_CLERK_PUBLISHABLE_KEY in each file
```

### Running

```bash
# All apps + Convex backend in parallel
pnpm run dev

# One frontend + Convex backend
pnpm run dev:web
pnpm run dev:admin
pnpm run dev:landing
```

The Convex dev server must be running for queries and mutations to resolve in `apps/web` and `apps/admin`.

### Other commands

```bash
pnpm run typecheck   # Type-check all packages
pnpm run lint        # Lint all packages
pnpm run build       # Build all packages
pnpm run clean       # Remove all build artifacts and node_modules
```

> **Note:** `typecheck` and `build` require `packages/backend/convex/_generated/` to exist. Run `npx convex dev` at least once before running these.

## Requirements

- Node >= 20
- pnpm >= 9 (via Corepack: `corepack enable`)
