# eventsnare-admin

Internal admin console for Eventsnare. Hard-gated to users with the `admin` role — non-admin Clerk users see an access-denied screen.

## Development

```bash
pnpm --filter eventsnare-admin run dev
```

Vite serves on `http://localhost:5174`.

## Environment variables

Create `apps/admin/.env.local`:

```
VITE_CONVEX_URL=https://<deployment>.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Use the same Clerk instance and Convex deployment as `apps/web`.

## Architecture

- React 18 + React Router 7 + Vite 6
- Convex client wired via `ConvexProviderWithClerk`; backend lives in `packages/backend/convex/`
- Role gating at the route level via `src/features/admin-gate/AdminGate.tsx`, which calls `api.rbac.getMyRoles` and renders `AccessDenied` for non-admin users
- Server-side admin queries in `packages/backend/convex/admin.ts` enforce the role check independently — `AdminGate` is defense in depth, not the only barrier
