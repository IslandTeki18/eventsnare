# EventSnare — Project Roadmap (v0.2)

**Last updated:** 2026-05-30
**Status:** Pre-launch, validation phase
**Codename:** EventSnare (working title)

---

## Where we are right now

**Done:**
- Product concept locked: inbound webhook reliability service for indie SaaS / vibe-coder audience
- Specification document written and revised to v0.2 (Convex-primary architecture)
- Landing page built and connected to Resend (not yet deployed)
- Convex integrated into the project
- Architecture decision made: Cloudflare Workers ingress front door + Convex backend
- First SEO post drafted (Stripe/Vercel silent failures, ~1,350 words)
- 50-post SEO content roadmap mapped across 7 clusters

**In progress / immediate next steps:**
- Deploy landing page
- Run Convex stress test to validate the architecture before full build
- Ship first SEO post on `/blog` route
- Begin validation outreach (DMs to indie founders)

**Not yet started:**
- Production ingress endpoint (Cloudflare Worker)
- Provider library (Stripe signature verification first)
- Dashboard
- Billing integration
- Public launch

---

## Phase 0 — Validation (Weeks 1–2, current)

**Goal:** Spend ~15 hours and find out if Sarah-the-indie-founder actually exists before committing further.

### Week 1 (this week)

- [x] Buy domain (pending — leaning Latch.dev or Hookrail.dev)
- [x] Build landing page
- [x] Connect Resend for waitlist
- [ ] Deploy landing page to production
- [ ] Ship blog post #1 to `/blog/stripe-webhooks-silently-failing-vercel`
- [ ] Run Convex stress test (smoke @ 10/sec, then decision-point @ 100/sec for 5 min)
- [ ] Set up Twitter/X account for the product, pinned tweet linking to landing page

### Week 2

- [ ] DM 30 indie founders publicly complaining about Stripe/webhook issues
- [ ] Track responses in spreadsheet: name, situation, would they pay
- [ ] Publish blog post #1 to Hacker News (Tuesday 8am Pacific)
- [ ] Cross-post a summary thread to X
- [ ] Submit to r/SaaS or r/indiehackers (one subreddit, not both)
- [ ] Aim for 50 waitlist signups by end of week 2

### Decision gate (end of Week 2)

| Signal | Action |
|--------|--------|
| 50+ waitlist signups, 5+ "I'd pay" DM responses, Convex stress test passes | Proceed to Phase 1 |
| 20–50 signups, 2–4 maybes | Iterate positioning, repeat Phase 0 once |
| <20 signups, no yes responses | Reframe or move to alternative idea |
| Convex stress test fails p95/p99 targets | Diagnose first; if unfixable, fall back to Postgres stack from v0.1 spec |

**Cash invested through Phase 0:** ~$50 (domain).

---

## Phase 1 — MVP Build (Weeks 3–8)

**Goal:** Ship a working product that handles 5 providers end-to-end with the Convex-primary architecture.

### Week 3 — Foundation
- [ ] Cloudflare Workers ingress endpoint scaffolded
- [ ] Workers KV for source config caching
- [ ] Convex schema finalized (extend the stress test schema with real sources/workspaces/users)
- [ ] Clerk wired up for auth (Convex has first-class integration)
- [ ] Stripe Billing test mode integrated

### Week 4 — Stripe end-to-end
- [ ] Stripe signature verification at the edge (Cloudflare Worker)
- [ ] `ingestEvent` Convex mutation hardened (transactional event + usage + schedule)
- [ ] `simulatedDelivery` replaced with `realDelivery` action that POSTs to the customer's forward URL
- [ ] Exponential backoff via `ctx.scheduler.runAfter`: 10s, 30s, 2m, 10m, 1h, 6h, 24h
- [ ] Dead-letter at 7 attempts

### Week 5 — Dashboard
- [ ] Next.js dashboard scaffolded on the landing page domain (`/app` or subdomain decision)
- [ ] Convex live queries powering the event list (real-time updates for free)
- [ ] Event detail view with all delivery attempts
- [ ] One-click replay button (the hero interaction)
- [ ] Source management: add, edit, pause, delete

### Week 6 — Four more providers + onboarding polish
- [ ] GitHub signature verification (HMAC SHA-256)
- [ ] Shopify signature verification (HMAC SHA-256, base64)
- [ ] Clerk signature verification (Svix-style)
- [ ] Resend signature verification (HMAC)
- [ ] Provider-specific docs pages with screenshots ("paste this URL into Stripe here")
- [ ] Onboarding flow: signup → pick provider → guided setup → test event → first real event

### Week 7 — Reliability and polish
- [ ] Email alerts via Resend (10 failures in 5 min, dead-letter hit, quota thresholds)
- [ ] Slack alerts via customer-provided webhook URL
- [ ] Usage page with quota meter and overage warnings
- [ ] Pricing page (Free / $29 / $99 / $299 / $999)
- [ ] Terms of service, privacy policy, security.txt

### Week 8 — Internal beta
- [ ] Point your own production webhooks (invo-platform Stripe, AFI Trailer Rentals) at EventSnare as the first real customer
- [ ] Invite 5 indie founders from Phase 0 outreach for private beta — 6 months free in exchange for feedback
- [ ] Fix the embarrassing bugs they find
- [ ] Sentry integration for error tracking
- [ ] Public status page (Instatus free tier)

### Decision gate (end of Week 8)
- Beta users have run the service for 2+ weeks with no critical failures
- You trust your own production Stripe webhooks pointing at it
- Signup-to-first-event path is <10 minutes
- All five launch providers are stable

If yes → Phase 2. If no → keep iterating, don't launch until yes.

**Cash invested through Phase 1:** ~$50–150 cumulative (domain + maybe Convex Pro if stress test indicates it's needed).

---

## Phase 2 — Public Launch (Weeks 9–10)

**Goal:** 200 signups, 10 paying customers, $300 MRR.

### Week 9 — Launch prep
- [ ] Write Show HN post: "Show HN: [Name] – Webhook handler that survives your AI-generated code"
- [ ] Write 7-tweet X launch thread with demo gif
- [ ] Write Indie Hackers launch post
- [ ] Prep Product Hunt page (secondary channel)
- [ ] Email waitlist with 50%-off-first-3-months code (first 50 signups only), 24 hours before public launch
- [ ] Final QA pass on signup → first event → billing flow
- [ ] Ship blog posts #2 and #3 in the week leading up to launch (Stripe idempotency, Stripe signatures)

### Week 10 — Launch day (Tuesday or Wednesday, 8am Pacific)
- [ ] 8:00am Pacific: Show HN goes live
- [ ] 8:15am: X thread posted and pinned
- [ ] 9:00am: Indie Hackers launch post
- [ ] 10:00am: Email the waitlist
- [ ] Respond to every HN comment within 30 minutes
- [ ] Onboard signups personally via X DM where possible
- [ ] Track: signups, activations (first event sent), paid conversions

### Decision gate (end of Week 10)

| Outcome | Action |
|---------|--------|
| ≥10 paying customers, ≥150 signups | Strong PMF signal — proceed to Phase 3 |
| 3–9 paying, 50–150 signups | Real but weak — iterate landing page, relaunch in 4 weeks |
| 0–2 paying, <50 signups | Reframe — back to validation |

**Cash invested through Phase 2:** ~$300 cumulative (add ~$150 for launch-week ads / newsletter test buys if you want).

---

## Phase 3 — Compounding (Months 3–9)

**Goal:** $5K MRR by month 6, $10K MRR by month 9. Sustainable acquisition engine.

### The weekly rhythm

| Day | Activity | Time |
|-----|----------|------|
| Mon | Customer support, bug fixes | 3h |
| Tue | One new SEO post (1,500–2,500 words) | 4h |
| Wed | Provider integration #N+1 (one new provider every 2 weeks) | 4h |
| Thu | X/build-in-public posting, community engagement | 1h ongoing |
| Fri | Dashboard improvements, feature requests | 3h |
| Weekend | Off, mostly | — |

### Month-by-month targets

| Month | Customers | MRR | Providers | Posts published |
|-------|-----------|-----|-----------|-----------------|
| 3 | 30 | $900 | 7 | 8 |
| 4 | 50 | $1,800 | 8 | 12 |
| 5 | 80 | $3,000 | 10 | 16 |
| 6 | 120 | $4,500 | 12 | 20 |
| 7 | 170 | $6,500 | 14 | 24 |
| 8 | 220 | $8,500 | 16 | 28 |
| 9 | 280 | $11,000 | 18 | 32 |

### Key milestones in Phase 3

- **Month 3:** First $99-tier customer (small startup, not solo indie). Validates that the pricing curve works.
- **Month 4:** Ship the audit log feature gated to $99+ tier.
- **Month 5:** First newsletter sponsorship ($500 — Console.dev or Bytes.dev). Track signups carefully.
- **Month 6:** Write the "6-month retrospective" blog post (#43 in the SEO roadmap). This goes viral on Indie Hackers if done honestly.
- **Month 6:** Apply for Stripe Partner Directory listing.
- **Month 7:** Start cold outbound to companies you see in your logs sending high volume. 5 personal emails per week.
- **Month 8:** Launch SSO/SAML for Pro tier ($999). First enterprise lead discovered via outbound.
- **Month 9:** Decision point — is this replacing income or staying side project?

### Things that will go wrong (be ready)

- Provider changes signature scheme without notice → maintain fixture test suite, monitor signature error rates
- Bad deploy drops events → write a transparent post-mortem; devs respect honesty
- Convex outage → edge worker buffer absorbs short outages; document SLA carefully for longer ones
- Want to quit around month 5 → push through, this is where most founders fail
- Hookdeck or Svix announces an indie tier → don't panic, don't pivot, stay focused on the vibe-coder segment

**Cash invested through Phase 3:** ~$4K cumulative. Infrastructure scales to ~$200/mo by month 9. Newsletter sponsorships maybe $500/mo by month 7.

---

## Phase 4 — Scale or Stabilize (Months 10–18)

**Goal:** $25K MRR by month 18. Make the path decision.

### Path A — Stay solo, optimize for income
- Cap at ~$30K MRR (realistic for one person with strong systems)
- Raise prices for new signups: $39 / $129 / $399 / $1299 tiers
- Automate support via Notion knowledge base + Crisp/Intercom AI chatbot trained on docs
- Cut work hours back to 25–30/week
- This is the Bannerbear / ScreenshotOne path: $300K+ annual income, no boss, no investors

### Path B — Hire and grow
- Hire #1 (month 11): part-time engineer for provider integrations and on-call (~$3K/mo)
- Hire #2 (month 14): customer success / DevRel (~$4K/mo)
- Target $80K MRR by month 18
- Optionally raise pre-seed or stay bootstrapped
- This is the Hunter.io path

### Acquisition signal
Around $20–30K MRR with growing enterprise demand, cold inbound from strategics begins. Realistic valuation: 4–8x ARR. For your scale, $5–25M exit to a strategic (Stripe, Cloudflare, Zapier, Resend) is plausible.

### Month 12 reflection questions
- Are you still enjoying the work?
- Is MRR growing 8–15% monthly?
- Do you have 3+ enterprise leads in pipeline?

Three yeses → Path B. Otherwise → Path A. Both are great outcomes.

---

## Architecture decisions locked

| Layer | Choice | Why |
|-------|--------|-----|
| Ingress | Cloudflare Workers | Edge latency, cheap absorbing layer, allows Durable Object buffering during Convex hiccups |
| Backend | Convex | Founder already proficient; collapses 4 services into 1; transactional event-write-plus-schedule; reactive dashboard free |
| Dashboard | Next.js + Vercel + Convex client | Same domain as landing page; SEO compounds at root |
| Auth | Clerk | First-class Convex integration; founder already familiar from invo-platform |
| Email | Resend | Already integrated for landing page |
| Payments | Stripe Billing | Industry default; we dogfood our own product |
| Error tracking | Sentry | Free tier sufficient |
| Status page | Instatus | Free tier |
| Analytics | Plausible | Privacy-friendly, no consent banner |
| DNS | Cloudflare | Free, fast, integrates with Workers |

**Explicitly NOT in stack (decision log):**
- Neon Postgres → replaced by Convex tables
- Cloudflare R2 → replaced by Convex file storage
- Fly.io / Railway worker → replaced by Convex actions
- Cloudflare Queues → replaced by Convex scheduled functions

---

## SEO and content commitments

- 50-post roadmap in `SEO_ROADMAP.md`, sequenced across 7 clusters
- One post per week minimum starting in Phase 0
- All posts hosted on `[domain]/blog/[slug]`, never on Medium/Dev.to as primary
- Each post distributes to: HN (Tue/Wed 8am Pacific), X thread, one Reddit sub, Indie Hackers summary
- First 6 months of titles locked; later months sequenced by what converts

---

## Pricing locked (v1)

| Plan | Price | Events/mo | Sources | Retention |
|------|-------|-----------|---------|-----------|
| Free | $0 | 10,000 | 2 | 7 days |
| Indie | $29/mo | 250,000 | 10 | 30 days |
| Startup | $99/mo | 2,000,000 | 50 | 60 days |
| Growth | $299/mo | 10,000,000 | Unlimited | 90 days |
| Pro | $999/mo | 50,000,000 | Unlimited | 1 year |

- Annual: 2 months free on paid tiers
- Overages: $0.50 per 1,000 events, opt-in only
- Free tier: hard-capped, no surprise bills

---

## Open questions still to resolve

1. **Final product name** — Latch.dev, Hookrail, or alternate. Decision needed before launch prep starts.
2. **Pre-MVP queue choice** — confirmed Convex scheduler in spec, but stress test results may force a re-evaluation.
3. **Free-tier abuse prevention** — credit card required, signup rate limit, or accept the risk?
4. **Dashboard URL structure** — `[domain]/app`, `app.[domain]`, or `[domain]/dashboard`? Affects SEO setup.
5. **EU data residency** — architect for it day one (more cost) or punt to v1.1?
6. **First 10 providers post-launch** — already mapped, but exact order depends on which the Phase 0 DMs surface as most-wanted.

---

## Success metrics — month 9 target

| Metric | Target |
|--------|--------|
| Paying customers | 280+ |
| MRR | $11,000+ |
| Monthly logo churn | <5% |
| NPS | >40 |
| p95 ingress latency | <200ms |
| Ingress availability | >99.9% |
| Customer-reported lost events | <5/month |
| Providers supported | 18+ |
| SEO posts published | 32+ |
| Page-1 ranking posts | 6+ |

---

## What I'm doing this week (in order)

1. **Tonight or tomorrow:** finalize domain choice, push the trigger.
2. **This week:** deploy landing page; ship blog post #1 to `/blog`; run smoke + 100/sec Convex stress test.
3. **End of week:** kick off 30 DMs to indie founders. Just research conversations.
4. **By end of Week 2:** hit the Phase 0 decision gate honestly — proceed, iterate, or pivot.

The compounding starts the moment the landing page and the first blog post are live. Every week after that is more compounding. The goal is to be running an SEO + community acquisition engine by month 3 that doesn't depend on launches to grow.
