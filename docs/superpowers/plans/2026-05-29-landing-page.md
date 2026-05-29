# Eventsnare Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Eventsnare marketing landing page with nine content sections and email newsletter signup piped to Resend Audience.

**Architecture:** Single `Home` page component at `apps/landing/src/pages/Home.tsx` that composes nine focused section components. Email capture is a shared `EmailSignupForm` component that POSTs to a new `POST /waitlist` Convex HTTP action in `packages/backend/convex/waitlist.ts`, which forwards to the Resend Audiences API. App.tsx is updated to render `Home` directly without the AppShell wrapper.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, Vite 6, lucide-react, Convex HTTP Actions, Resend Audiences API, Vitest 2 + React Testing Library.

---

## File Map

### New files

| File | Responsibility |
|---|---|
| `apps/landing/src/pages/Home.tsx` | Assembles all landing sections in order |
| `apps/landing/src/components/ui/EmailSignupForm.tsx` | Controlled email input + submit, shared between Hero and FooterCta |
| `apps/landing/src/components/landing/Navbar.tsx` | Sticky nav: wordmark, Pricing link, CTA button, mobile drawer |
| `apps/landing/src/components/landing/Hero.tsx` | Headline, subheadline, EmailSignupForm, provider strip, gradient BG |
| `apps/landing/src/components/landing/ProblemStatement.tsx` | Three problem cards with lucide icons |
| `apps/landing/src/components/landing/HowItWorks.tsx` | Four numbered steps with dashed connector |
| `apps/landing/src/components/landing/Features.tsx` | Six feature cards + header-names callout banner |
| `apps/landing/src/components/landing/ProviderIcons.tsx` | Inline SVG components for five providers |
| `apps/landing/src/components/landing/ProviderGrid.tsx` | Five provider cards using ProviderIcons |
| `apps/landing/src/components/landing/Pricing.tsx` | Three tier cards, Growth highlighted |
| `apps/landing/src/components/landing/FooterCta.tsx` | CTA band reusing EmailSignupForm |
| `apps/landing/src/components/landing/Footer.tsx` | Copyright + placeholder links |
| `apps/landing/src/lib/useReveal.ts` | IntersectionObserver hook for scroll fade-in |
| `apps/landing/src/test/setup.ts` | Vitest + jest-dom setup |
| `packages/backend/convex/waitlist.ts` | Convex HTTP action: validate email, call Resend Audiences API |

### Modified files

| File | Change |
|---|---|
| `apps/landing/src/App.tsx` | Replace Welcome route with Home |
| `apps/landing/vite.config.ts` | Add vitest test config block |
| `apps/landing/tsconfig.json` | Add `"types": ["vitest/globals"]` to compilerOptions |
| `apps/landing/package.json` | Add vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom as devDependencies; add `"test"` script |
| `apps/landing/src/index.css` | Add `@keyframes fadeInUp` and `.animate-fade-in-up` / `.reveal-hidden` utility classes |
| `packages/backend/convex/http.ts` | Add OPTIONS + POST routes for `/waitlist` |

---

## Environment Variables Required

Before testing the waitlist action, set these in the Convex dashboard (Settings → Environment Variables):

- `RESEND_API_KEY` — your Resend API key (starts with `re_`)
- `RESEND_AUDIENCE_ID` — the UUID of the Resend Audience to add contacts to

---

## Task 1: Test Infrastructure

**Files:**
- Modify: `apps/landing/package.json`
- Modify: `apps/landing/vite.config.ts`
- Modify: `apps/landing/tsconfig.json`
- Create: `apps/landing/src/test/setup.ts`

- [ ] **Step 1: Install test dependencies**

Run from the repo root:
```bash
cd apps/landing && pnpm add -D vitest@^2.1.0 @testing-library/react@^16.0.0 @testing-library/user-event@^14.5.0 @testing-library/jest-dom@^6.6.0 jsdom@^25.0.0
```

- [ ] **Step 2: Create test setup file**

Create `apps/landing/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Update vite.config.ts to add vitest config**

Replace the contents of `apps/landing/vite.config.ts` with:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@convex': path.resolve(__dirname, '../../packages/backend/convex'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: Update tsconfig.json to include vitest globals**

In `apps/landing/tsconfig.json`, add `"types": ["vitest/globals"]` to `compilerOptions`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["vitest/globals"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@convex/*": ["../../packages/backend/convex/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: Add test script to package.json**

Add `"test": "vitest run"` and `"test:watch": "vitest"` to the `scripts` block in `apps/landing/package.json`.

- [ ] **Step 6: Verify test infrastructure runs**

```bash
cd apps/landing && pnpm test
```
Expected: `No test files found, exiting with code 0` (or similar — no errors).

- [ ] **Step 7: Commit**

```bash
git add apps/landing/package.json apps/landing/vite.config.ts apps/landing/tsconfig.json apps/landing/src/test/setup.ts apps/landing/pnpm-lock.yaml
git commit -m "chore(landing): add vitest test infrastructure"
```

---

## Task 2: EmailSignupForm Component (TDD)

**Files:**
- Create: `apps/landing/src/components/ui/EmailSignupForm.test.tsx`
- Create: `apps/landing/src/components/ui/EmailSignupForm.tsx`

- [ ] **Step 1: Write failing tests**

Create `apps/landing/src/components/ui/EmailSignupForm.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach } from 'vitest'
import { EmailSignupForm } from './EmailSignupForm'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

test('renders email input and submit button', () => {
  render(<EmailSignupForm />)
  expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /get early access/i })).toBeInTheDocument()
})

test('shows loading state while submitting', async () => {
  mockFetch.mockImplementation(() => new Promise(() => {}))
  const user = userEvent.setup()
  render(<EmailSignupForm />)
  await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /get early access/i }))
  expect(screen.getByRole('button')).toBeDisabled()
})

test('shows success message after successful submission', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true }),
  } as Response)
  const user = userEvent.setup()
  render(<EmailSignupForm />)
  await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /get early access/i }))
  await waitFor(() => {
    expect(screen.getByText("You're on the list.")).toBeInTheDocument()
  })
})

test('shows inline error for invalid email without calling fetch', async () => {
  const user = userEvent.setup()
  render(<EmailSignupForm />)
  await user.type(screen.getByPlaceholderText('your@email.com'), 'notanemail')
  await user.click(screen.getByRole('button', { name: /get early access/i }))
  expect(screen.getByText(/valid email/i)).toBeInTheDocument()
  expect(mockFetch).not.toHaveBeenCalled()
})

test('shows error message on API failure', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: 'Failed to subscribe' }),
  } as Response)
  const user = userEvent.setup()
  render(<EmailSignupForm />)
  await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /get early access/i }))
  await waitFor(() => {
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/landing && pnpm test
```
Expected: 5 failing tests with "Cannot find module './EmailSignupForm'".

- [ ] **Step 3: Implement EmailSignupForm**

Create `apps/landing/src/components/ui/EmailSignupForm.tsx`:
```tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'loading' | 'success' | 'error'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function EmailSignupForm({ className }: { className?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [fieldError, setFieldError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError('')

    if (!isValidEmail(email)) {
      setFieldError('Please enter a valid email address.')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch(`${import.meta.env.VITE_CONVEX_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className={cn('py-4 text-center', className)}>
        <p className="font-medium text-primary">You're on the list.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll email you when Eventsnare launches.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-3', className)}>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={status === 'loading'}
          className="flex-1 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === 'loading' ? 'Joining...' : 'Get early access'}
        </button>
      </div>
      {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
      {status === 'error' && (
        <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
      )}
      <p className="text-center text-xs text-muted-foreground">No spam. Launch updates only.</p>
    </form>
  )
}
```

Note: `text-destructive` requires adding `destructive` to `tailwind.config.ts`. Add this to the `colors` block:
```ts
destructive: {
  DEFAULT: 'hsl(0 84% 60%)',
},
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/landing && pnpm test
```
Expected: 5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add apps/landing/src/components/ui/ apps/landing/tailwind.config.ts
git commit -m "feat(landing): add EmailSignupForm component with tests"
```

---

## Task 3: POST /waitlist Convex HTTP Action

**Files:**
- Create: `packages/backend/convex/waitlist.ts`
- Modify: `packages/backend/convex/http.ts`

This action is tested manually with curl after Convex deployment. Unit testing Convex HTTP actions requires the Convex test harness which is not yet set up.

- [ ] **Step 1: Create the waitlist action file**

Create `packages/backend/convex/waitlist.ts`:
```ts
'use node';

import { httpAction } from './_generated/server';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const waitlistOptions = httpAction(async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
});

export const waitlistSignup = httpAction(async (_ctx, request) => {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  const email = typeof body === 'object' && body !== null && 'email' in body
    ? (body as Record<string, unknown>).email
    : undefined;

  if (typeof email !== 'string' || !isValidEmail(email)) {
    return new Response(
      JSON.stringify({ error: 'Invalid email' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  const resendRes = await fetch(
    `https://api.resend.com/audiences/${audienceId}/contacts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    }
  );

  if (!resendRes.ok) {
    return new Response(
      JSON.stringify({ error: 'Failed to subscribe' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  return new Response(
    JSON.stringify({ ok: true }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
  );
});
```

- [ ] **Step 2: Register the routes in http.ts**

Add to `packages/backend/convex/http.ts` (after the stripe-webhook route, before `export default http`):
```ts
import { waitlistOptions, waitlistSignup } from './waitlist';

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
```

- [ ] **Step 3: Set environment variables in Convex dashboard**

Go to your Convex project dashboard → Settings → Environment Variables. Add:
- `RESEND_API_KEY` — your Resend API key
- `RESEND_AUDIENCE_ID` — the UUID of your Resend Audience

- [ ] **Step 4: Deploy and smoke-test**

After deploying (`npx convex deploy` from `packages/backend/`), test with curl (replace the URL with your actual Convex deployment URL from the dashboard):

```bash
# Should return {"ok":true}
curl -X POST https://<your-deployment>.convex.cloud/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Should return {"error":"Invalid email"}
curl -X POST https://<your-deployment>.convex.cloud/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail"}'
```

- [ ] **Step 5: Commit**

```bash
git add packages/backend/convex/waitlist.ts packages/backend/convex/http.ts
git commit -m "feat(backend): add POST /waitlist Convex HTTP action for Resend Audience"
```

---

## Task 4: Provider SVG Icons

**Files:**
- Create: `apps/landing/src/components/landing/ProviderIcons.tsx`

Each provider icon is an inline SVG React component. SVG `d` paths are sourced from [simpleicons.org](https://simpleicons.org) (MIT-licensed). Search for each brand name and copy the `<path d="...">` value.

- [ ] **Step 1: Create ProviderIcons.tsx**

Create `apps/landing/src/components/landing/ProviderIcons.tsx`:
```tsx
interface IconProps {
  className?: string
  size?: number
}

// Source: https://simpleicons.org/?q=stripe
export function StripeIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
    </svg>
  )
}

// Source: https://simpleicons.org/?q=github
export function GitHubIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

// Source: https://simpleicons.org/?q=shopify  — copy the `d` attribute from the SVG on that page
export function ShopifyIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      {/* TODO: paste the path d="..." from https://simpleicons.org/?q=shopify */}
      <path d="M15.337 23.979l7.453-1.724S19.865 7.47 19.848 7.358a.227.227 0 0 0-.191-.192c-.077-.016-1.692-.128-1.692-.128s-1.373-1.436-1.516-1.581v-.032L15.337 23.98zM13.354 5.205s-.954-.31-2.193-.155c-1.629.208-3.365 1.932-3.908 4.89-.37 1.965-.623 3.156-.623 3.156l-2.42.624S2.02 21.174 1.796 28.6c0 0 3.063 1.35 6.31.6l7.248-24zm-2.242 4.225-.416 2.03c-.016 0-1.406.43-1.406.43.016-.063.352-1.324.816-1.868.192-.208.608-.416 1.006-.592zm1.645-5.036c.35.08.64.224.894.432-.607.048-1.583.224-1.887.464-.256-.895.24-1.367.993-.896z" />
    </svg>
  )
}

// Source: https://simpleicons.org/?q=clerk  — copy the `d` attribute from the SVG on that page
export function ClerkIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      {/* TODO: paste the path d="..." from https://simpleicons.org/?q=clerk */}
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  )
}

// Source: https://simpleicons.org/?q=resend  — copy the `d` attribute from the SVG on that page
export function ResendIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      {/* TODO: paste the path d="..." from https://simpleicons.org/?q=resend */}
      <path d="M19.857 0H4.143C1.854 0 0 1.854 0 4.143v15.714C0 22.146 1.854 24 4.143 24h15.714C22.146 24 24 22.146 24 19.857V4.143C24 1.854 22.146 0 19.857 0z" />
    </svg>
  )
}
```

The Stripe and GitHub paths above are accurate. For Shopify, Clerk, and Resend: open simpleicons.org, search each brand name, click the icon, copy the SVG source, and replace the `<path d="...">` placeholder above with the actual path. The placeholder shapes are circles/rectangles that will render visibly so the page is not broken before you update them.

- [ ] **Step 2: Commit**

```bash
git add apps/landing/src/components/landing/ProviderIcons.tsx
git commit -m "feat(landing): add provider SVG icon components"
```

---

## Task 5: Navbar Component

**Files:**
- Create: `apps/landing/src/components/landing/Navbar.tsx`

- [ ] **Step 1: Create Navbar**

Create `apps/landing/src/components/landing/Navbar.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function scrollToSignup() {
    document.getElementById('email-signup')?.scrollIntoView({ behavior: 'smooth' })
    setOpen(false)
  }

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 top-0 z-50 transition-all duration-200',
        scrolled && 'border-b border-border bg-background/80 backdrop-blur-sm'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <span className="text-lg font-semibold text-foreground">Eventsnare</span>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </a>
          <button
            onClick={scrollToSignup}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get early access
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden flex flex-col gap-4">
          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Pricing
          </a>
          <button
            onClick={scrollToSignup}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 text-left"
          >
            Get early access
          </button>
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/landing/src/components/landing/Navbar.tsx
git commit -m "feat(landing): add Navbar component"
```

---

## Task 6: Hero Section

**Files:**
- Create: `apps/landing/src/components/landing/Hero.tsx`

- [ ] **Step 1: Create Hero**

Create `apps/landing/src/components/landing/Hero.tsx`:
```tsx
import { EmailSignupForm } from '@/components/ui/EmailSignupForm'
import {
  StripeIcon,
  GitHubIcon,
  ShopifyIcon,
  ClerkIcon,
  ResendIcon,
} from './ProviderIcons'

const PROVIDERS = [
  { name: 'Stripe', Icon: StripeIcon },
  { name: 'GitHub', Icon: GitHubIcon },
  { name: 'Shopify', Icon: ShopifyIcon },
  { name: 'Clerk', Icon: ClerkIcon },
  { name: 'Resend', Icon: ResendIcon },
] as const

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
      {/* Radial gradient background accent */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(343 76% 68% / 0.07), transparent)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
          Webhooks break.
          <br />
          Your events shouldn&apos;t.
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
          Eventsnare sits between your webhook providers and your app. It verifies every
          signature, durably stores every event, and delivers it to your endpoint — with
          retries, deduplication, and one-click replay. So a missed Stripe payment never
          silently vanishes again.
        </p>

        <EmailSignupForm id="email-signup" className="w-full max-w-md" />

        {/* Provider strip */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Works with the tools you already use</p>
          <div className="flex items-center gap-8 opacity-50">
            {PROVIDERS.map(({ name, Icon }) => (
              <div key={name} className="flex flex-col items-center gap-1.5">
                <Icon size={28} className="text-foreground" />
                <span className="text-xs text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

Note: `EmailSignupForm` needs to accept an `id` prop. Update `apps/landing/src/components/ui/EmailSignupForm.tsx` to forward `id` to the `<form>` element:

```tsx
// Add id to the props interface and the form element
export function EmailSignupForm({ className, id }: { className?: string; id?: string }) {
  // ...
  return (
    <form id={id} onSubmit={handleSubmit} className={cn('flex flex-col gap-3', className)}>
```

- [ ] **Step 2: Update EmailSignupForm test — ensure it still passes after adding id prop**

```bash
cd apps/landing && pnpm test
```
Expected: 5 passing tests.

- [ ] **Step 3: Commit**

```bash
git add apps/landing/src/components/landing/Hero.tsx apps/landing/src/components/ui/EmailSignupForm.tsx
git commit -m "feat(landing): add Hero section"
```

---

## Task 7: Problem Statement Section

**Files:**
- Create: `apps/landing/src/components/landing/ProblemStatement.tsx`

- [ ] **Step 1: Create ProblemStatement**

Create `apps/landing/src/components/landing/ProblemStatement.tsx`:
```tsx
import { Zap, ShieldX, RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface ProblemCardProps {
  Icon: LucideIcon
  title: string
  body: string
}

function ProblemCard({ Icon, title, body }: ProblemCardProps) {
  return (
    <div className="rounded-xl border border-border bg-muted p-6 flex flex-col gap-3">
      <Icon className="text-primary" size={24} />
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

const PROBLEMS = [
  {
    Icon: ShieldX,
    title: 'Signature verification is error-prone',
    body: 'Every provider signs payloads differently. One missed header check or wrong secret and you\'re processing forged events — or silently dropping real ones.',
  },
  {
    Icon: Zap,
    title: "Providers don't retry reliably",
    body: 'Stripe retries for 3 days. GitHub gives you 3 attempts. Shopify retries 19 times over 48 hours. When your endpoint is down for 10 minutes at the wrong moment, you lose events permanently.',
  },
  {
    Icon: RotateCcw,
    title: 'Debugging failures is painful',
    body: "Which event failed? Was it a timeout or a 500? Can you replay it? Without structured delivery history, every incident is a grep through logs.",
  },
] as const

export function ProblemStatement() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="mb-10 text-3xl font-bold text-foreground">
        The problem with webhooks
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PROBLEMS.map(p => (
          <ProblemCard key={p.title} {...p} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/landing/src/components/landing/ProblemStatement.tsx
git commit -m "feat(landing): add ProblemStatement section"
```

---

## Task 8: How It Works Section

**Files:**
- Create: `apps/landing/src/components/landing/HowItWorks.tsx`

- [ ] **Step 1: Create HowItWorks**

Create `apps/landing/src/components/landing/HowItWorks.tsx`:
```tsx
const STEPS = [
  {
    number: 1,
    title: 'Point your provider at Eventsnare',
    body: 'Replace your endpoint URL in Stripe, GitHub, or any other provider with your Eventsnare ingress URL (/in/{workspace}/{source}). Takes 30 seconds.',
  },
  {
    number: 2,
    title: 'Eventsnare verifies and stores',
    body: 'Every incoming request is signature-verified against your stored secret. The raw payload is persisted durably before we return 2xx to the provider.',
  },
  {
    number: 3,
    title: 'We deliver to your endpoint',
    body: 'The byte-for-byte original payload is forwarded to your real endpoint with a configurable retry schedule: 10s → 30s → 2m → 10m → 1h → 6h → 24h.',
  },
  {
    number: 4,
    title: 'You replay from the dashboard',
    body: 'Any failed or missing event is one click away. Filter by provider, status, or time range and replay individually or in bulk.',
  },
] as const

export function HowItWorks() {
  return (
    <section className="bg-muted/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-14 text-center text-3xl font-bold text-foreground">
          How Eventsnare works
        </h2>

        {/* Desktop: horizontal with dashed connector; Mobile: vertical stack */}
        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-6">
          {/* Dashed connector line (desktop only) */}
          <div className="absolute left-0 right-0 top-5 hidden border-t border-dashed border-border md:block" />

          {STEPS.map(step => (
            <div key={step.number} className="relative flex flex-col gap-4">
              {/* Step number circle */}
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-primary">
                {step.number}
              </div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/landing/src/components/landing/HowItWorks.tsx
git commit -m "feat(landing): add HowItWorks section"
```

---

## Task 9: Features Section

**Files:**
- Create: `apps/landing/src/components/landing/Features.tsx`

- [ ] **Step 1: Create Features**

Create `apps/landing/src/components/landing/Features.tsx`:
```tsx
import {
  ShieldCheck,
  Database,
  RefreshCw,
  Fingerprint,
  PlayCircle,
  Activity,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  Icon: LucideIcon
  title: string
  body: string
}

function FeatureCard({ Icon, title, body }: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-border bg-muted p-6 flex flex-col gap-3">
      <Icon className="text-primary" size={22} />
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

const FEATURES = [
  {
    Icon: ShieldCheck,
    title: 'Provider-native signature verification',
    body: 'Every adapter is built against real captured payloads. Signatures are verified before any storage or delivery occurs. Forged or malformed requests are rejected immediately.',
  },
  {
    Icon: Database,
    title: 'Durable event persistence',
    body: 'The raw payload is stored before we return 2xx — no event is lost due to a downstream failure. Payloads ≤100KB stored inline; larger payloads go to file storage automatically.',
  },
  {
    Icon: RefreshCw,
    title: 'Automatic retries with backoff',
    body: 'Seven-attempt schedule: 10s, 30s, 2m, 10m, 1h, 6h, 24h. Per-source max configurable 1–7. Events that exhaust all attempts move to dead-letter, not the void.',
  },
  {
    Icon: Fingerprint,
    title: 'Deduplication built in',
    body: 'Duplicate events from the same provider are detected and suppressed. First write wins — your endpoint receives each logical event exactly once.',
  },
  {
    Icon: PlayCircle,
    title: 'One-click replay',
    body: 'Any event — delivered, failed, or dead-lettered — can be replayed from the dashboard. Filter by provider, source, status, or time window. Replay individually or in bulk.',
  },
  {
    Icon: Activity,
    title: 'Real-time delivery dashboard',
    body: 'Live delivery status, per-attempt response codes and latency, event payload inspection, and full attempt history. Updates reactively — no polling.',
  },
] as const

const HEADER_NAMES = [
  'X-Eventsnare-Event-Id',
  'X-Eventsnare-Attempt',
  'X-Eventsnare-Source',
  'X-Eventsnare-Original-Signature',
]

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-foreground">
          Everything your webhook pipeline needs
        </h2>
        <p className="mt-3 text-muted-foreground">Built for reliability from day one.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {FEATURES.map(f => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>

      {/* Header names callout */}
      <div className="mt-10 rounded-xl border border-border bg-muted px-8 py-6">
        <p className="font-mono text-sm text-muted-foreground">
          {HEADER_NAMES.join(' · ')}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Every forwarded request carries these headers so your endpoint always knows exactly
          what it&apos;s receiving and why.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/landing/src/components/landing/Features.tsx
git commit -m "feat(landing): add Features section"
```

---

## Task 10: Provider Grid Section

**Files:**
- Create: `apps/landing/src/components/landing/ProviderGrid.tsx`

- [ ] **Step 1: Create ProviderGrid**

Create `apps/landing/src/components/landing/ProviderGrid.tsx`:
```tsx
import {
  StripeIcon,
  GitHubIcon,
  ShopifyIcon,
  ClerkIcon,
  ResendIcon,
} from './ProviderIcons'
import type { ComponentType } from 'react'

interface Provider {
  name: string
  descriptor: string
  Icon: ComponentType<{ className?: string; size?: number }>
}

const PROVIDERS: Provider[] = [
  { name: 'Stripe', descriptor: 'Payments & billing events', Icon: StripeIcon },
  { name: 'GitHub', descriptor: 'Repository & CI/CD events', Icon: GitHubIcon },
  { name: 'Shopify', descriptor: 'Orders & fulfillment events', Icon: ShopifyIcon },
  { name: 'Clerk', descriptor: 'Auth & user lifecycle events', Icon: ClerkIcon },
  { name: 'Resend', descriptor: 'Email delivery status events', Icon: ResendIcon },
]

export function ProviderGrid() {
  return (
    <section className="bg-muted/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Works with the providers you already use
          </h2>
          <p className="mt-3 text-muted-foreground">
            More providers added before and after launch.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {PROVIDERS.map(({ name, descriptor, Icon }) => (
            <div
              key={name}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted p-6"
            >
              <Icon size={32} className="text-foreground" />
              <div className="text-center">
                <p className="font-semibold text-foreground text-sm">{name}</p>
                <p className="text-xs text-muted-foreground mt-1">{descriptor}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Using a provider not listed? Custom adapters are on the roadmap.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/landing/src/components/landing/ProviderGrid.tsx
git commit -m "feat(landing): add ProviderGrid section"
```

---

## Task 11: Pricing Section

**Files:**
- Create: `apps/landing/src/components/landing/Pricing.tsx`

- [ ] **Step 1: Create Pricing**

Create `apps/landing/src/components/landing/Pricing.tsx`:
```tsx
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingTier {
  name: string
  price: string
  featured: boolean
  features: string[]
}

const TIERS: PricingTier[] = [
  {
    name: 'Starter',
    price: '$0/mo',
    featured: false,
    features: [
      '10,000 events/month',
      '7-day event history',
      '3 sources',
      '3-attempt retry max',
      'Community support',
    ],
  },
  {
    name: 'Growth',
    price: '$29/mo',
    featured: true,
    features: [
      '100,000 events/month',
      '30-day event history',
      'Unlimited sources',
      '7-attempt retry max',
      'Email support',
      'Bulk replay',
    ],
  },
  {
    name: 'Pro',
    price: '$99/mo',
    featured: false,
    features: [
      '1,000,000 events/month',
      '90-day event history',
      'Unlimited sources',
      '7-attempt retry max',
      'Priority support',
      '365-day history add-on available',
    ],
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-foreground">
          Simple, predictable pricing
        </h2>
        <p className="mt-3 text-muted-foreground">No per-event fees. No surprise bills.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {TIERS.map(tier => (
          <div
            key={tier.name}
            className={cn(
              'relative rounded-xl border bg-muted p-8 flex flex-col gap-6',
              tier.featured ? 'border-primary' : 'border-border'
            )}
          >
            {tier.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Most popular
              </span>
            )}
            <div>
              <p className="font-semibold text-foreground">{tier.name}</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{tier.price}</p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {tier.features.map(feature => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        All plans include signature verification, deduplication, dead-letter queue, and real-time
        dashboard. Overage pricing available on Growth and Pro.
      </p>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/landing/src/components/landing/Pricing.tsx
git commit -m "feat(landing): add Pricing section"
```

---

## Task 12: FooterCta + Footer

**Files:**
- Create: `apps/landing/src/components/landing/FooterCta.tsx`
- Create: `apps/landing/src/components/landing/Footer.tsx`

- [ ] **Step 1: Create FooterCta**

Create `apps/landing/src/components/landing/FooterCta.tsx`:
```tsx
import { EmailSignupForm } from '@/components/ui/EmailSignupForm'

export function FooterCta() {
  return (
    <section className="border-t border-border bg-muted/40 px-6 py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        <h2 className="text-4xl font-bold text-foreground">
          Don&apos;t lose another webhook event.
        </h2>
        <p className="max-w-xl text-xl text-muted-foreground">
          Join the early access list. We&apos;ll email you when Eventsnare launches — and only then.
        </p>
        <EmailSignupForm className="w-full max-w-md" />
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create Footer**

Create `apps/landing/src/components/landing/Footer.tsx`:
```tsx
export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <p className="text-sm text-muted-foreground">© 2026 Eventsnare</p>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Terms
          </a>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/landing/src/components/landing/FooterCta.tsx apps/landing/src/components/landing/Footer.tsx
git commit -m "feat(landing): add FooterCta and Footer components"
```

---

## Task 13: Scroll Reveal Hook + CSS

**Files:**
- Create: `apps/landing/src/lib/useReveal.ts`
- Modify: `apps/landing/src/index.css`

- [ ] **Step 1: Add CSS animation keyframes**

Append to `apps/landing/src/index.css` (after the existing `@layer base` blocks):
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.45s ease-out forwards;
}

.reveal-hidden {
  opacity: 0;
}
```

- [ ] **Step 2: Create useReveal hook**

Create `apps/landing/src/lib/useReveal.ts`:
```ts
import { useEffect, useRef, useState } from 'react'

export function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, className: visible ? 'animate-fade-in-up' : 'reveal-hidden' }
}
```

- [ ] **Step 3: Apply useReveal to section headings and card grids**

In each section component, wrap the heading and grid with the reveal hook. Example for `ProblemStatement.tsx`:

```tsx
import { useReveal } from '@/lib/useReveal'

export function ProblemStatement() {
  const heading = useReveal()
  const grid = useReveal()

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div ref={heading.ref} className={heading.className}>
        <h2 className="mb-10 text-3xl font-bold text-foreground">
          The problem with webhooks
        </h2>
      </div>
      <div ref={grid.ref} className={grid.className}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PROBLEMS.map(p => (
            <ProblemCard key={p.title} {...p} />
          ))}
        </div>
      </div>
    </section>
  )
}
```

Apply the same pattern to: `HowItWorks.tsx`, `Features.tsx`, `ProviderGrid.tsx`, `Pricing.tsx`.

Hero and FooterCta do not need scroll reveal (Hero is above the fold, FooterCta is simple).

- [ ] **Step 4: Commit**

```bash
git add apps/landing/src/lib/useReveal.ts apps/landing/src/index.css apps/landing/src/components/landing/
git commit -m "feat(landing): add scroll reveal animations"
```

---

## Task 14: Home Assembly + App Routing

**Files:**
- Create: `apps/landing/src/pages/Home.tsx`
- Modify: `apps/landing/src/App.tsx`

- [ ] **Step 1: Create Home page**

Create `apps/landing/src/pages/Home.tsx`:
```tsx
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { ProblemStatement } from '@/components/landing/ProblemStatement'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Features } from '@/components/landing/Features'
import { ProviderGrid } from '@/components/landing/ProviderGrid'
import { Pricing } from '@/components/landing/Pricing'
import { FooterCta } from '@/components/landing/FooterCta'
import { Footer } from '@/components/landing/Footer'

export function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProblemStatement />
        <HowItWorks />
        <Features />
        <ProviderGrid />
        <Pricing />
        <FooterCta />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Update App.tsx to use Home**

Replace the contents of `apps/landing/src/App.tsx` with:
```tsx
import { Route, Routes } from 'react-router'
import { Home } from '@/pages/Home'

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  )
}
```

- [ ] **Step 3: Run typecheck to catch any import issues**

```bash
cd apps/landing && pnpm typecheck
```
Expected: no errors. Fix any import path mistakes before continuing.

- [ ] **Step 4: Run tests to confirm nothing regressed**

```bash
cd apps/landing && pnpm test
```
Expected: 5 passing tests.

- [ ] **Step 5: Start dev server and verify the page renders**

```bash
cd apps/landing && pnpm dev
```

Open `http://localhost:3000` and verify:
- Navbar appears with wordmark and CTA button
- Hero renders with headline and email form
- All nine sections are visible on scroll
- `#pricing` anchor scrolls to Pricing section
- `Get early access` button in Navbar scrolls to email form
- No console errors

- [ ] **Step 6: Commit**

```bash
git add apps/landing/src/pages/Home.tsx apps/landing/src/App.tsx
git commit -m "feat(landing): assemble Home page and wire App routing"
```

---

## Task 15: Final Checks

- [ ] **Step 1: Mobile layout check**

With dev server running, open browser DevTools → toggle mobile viewport (375px width). Verify:
- Navbar collapses to hamburger that opens a drawer
- Hero headline does not overflow
- Problem cards stack to single column
- How It Works steps stack vertically
- Feature cards stack to single column
- Provider grid shows 2 columns
- Pricing cards stack to single column
- Email form inputs are full-width and tappable

- [ ] **Step 2: TypeScript strict check**

```bash
cd apps/landing && pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Lint**

```bash
cd apps/landing && pnpm lint
```
Expected: 0 errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(landing): complete Eventsnare landing page"
```

---

## Spec Coverage Checklist

| Spec requirement | Covered by |
|---|---|
| Problem-led narrative structure | Task 7, 8 |
| Hero with pain headline + CTA | Task 6 |
| EmailSignupForm with success/error states | Task 2 |
| Resend Audience integration via Convex HTTP action | Task 3 |
| Provider strip (all five) in hero | Task 6 |
| ProblemStatement (3 cards) | Task 7 |
| HowItWorks (4 steps + connector) | Task 8 |
| Features (6 cards + header callout) | Task 9 |
| ProviderGrid (5 cards, all equal weight) | Task 10 |
| Pricing (3 tiers, Growth highlighted, fine print) | Task 11 |
| FooterCta (reuses EmailSignupForm) | Task 12 |
| Footer (copyright + placeholder links) | Task 12 |
| Sticky Navbar with mobile drawer | Task 5 |
| Scroll reveal animations (CSS only) | Task 13 |
| Rose Pine dark theme preserved | index.css untouched |
| `#pricing` anchor link | Task 5 (Navbar), Task 11 (section id) |
| `#email-signup` anchor scroll | Task 5 (Navbar button), Task 6 (form id) |
