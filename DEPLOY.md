# CreOps — Public Deployment Guide

Take CreOps from local prototype to public SaaS that anyone can sign up
for and use. Each round is independent — ship round 1, validate with real
users, then ship round 2 etc.

## Round status

| Round | What it ships | Code status | Your action needed |
|---|---|---|---|
| **1a** | Clerk auth, sign-in/up pages, onboarding, webhook | ✅ done | Provision Clerk + paste keys |
| **1b** | Cloud DB (Turso), async query refactor | ✅ done | Provision Turso + paste DATABASE_URL |
| **1c** | Vercel scaffold, CI, route group | ✅ done | Push GitHub, connect Vercel |
| **1d** | Public landing, /api/health, deploy:check, error pages | ✅ done | None |
| **2** | Email invites (Resend) | ✅ done | Provision Resend, paste key |
| **2b** | R2 file upload | — | Provision R2 |
| **3** | Stripe Subscriptions, tier limits | — | Provision Stripe, define tiers |

## Quick verify before any deploy

```bash
pnpm typecheck    # TypeScript clean
pnpm test         # 16 tests pass
pnpm build        # Production build clean
pnpm deploy:check # Verifies env vars + DB connectivity
```

If `pnpm deploy:check` returns "Ready to deploy" → push.

## Post-deploy verification

```bash
# After Vercel deploy completes, hit the health endpoint
curl https://<your-deploy-url>/api/health | jq

# Expect:
#   "status": "ok"
#   "auth.clerkConfigured": true
#   "database.mode": "turso"
#   "database.reachable": true
#   "database.latencyMs": <50ms from sin1
```

If any check is `false` or `unhealthy` → that env var didn't make it into Vercel.

---

## Round 1a — Clerk auth (this commit)

What ships: Sign-up form, sign-in form, onboarding rename, webhook
auto-provisioning each new user's workspace. The app **gracefully degrades**
to dev impersonation mode when Clerk keys are missing — so local dev still
works exactly like before until you flip the switch.

### Step 1. Provision Clerk (5 minutes)

1. Go to https://dashboard.clerk.com and create an account
2. **Create application** → name it "CreOps" → pick auth methods:
   - ✅ Email + password (required)
   - ✅ Google OAuth (recommended — most users)
   - ✅ Facebook OAuth (recommended — VN users)
3. After creation, **API Keys** tab → copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_...`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_...`)

### Step 2. Set up the webhook (one-time)

The webhook auto-creates a workspace + user row when someone signs up.

1. Clerk dashboard → **Webhooks** → **Add Endpoint**
2. URL: `https://<your-domain>/api/webhooks/clerk`
   - For local testing: use [ngrok](https://ngrok.com) or [Cloudflare Tunnel]
     to expose `http://localhost:3000` to a public URL temporarily
   - For production: use your real domain after deploy
3. **Subscribe to events:** `user.created`, `user.updated`, `user.deleted`
4. **Save** → copy the "Signing Secret" (starts with `whsec_...`)
5. Add to `.env.local`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Step 3. Paste keys + test locally

Add to `.env.local` at project root:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Restart dev server:

```bash
pnpm dev
```

Visit `http://localhost:3000`. You should be redirected to `/sign-in`.
After signing up, the webhook fires (only works via public URL — use ngrok
or wait until production), you land on `/onboarding`, name your workspace,
and arrive at the dashboard with a fresh empty workspace.

**Without ngrok during local testing:** the user signs up but the webhook
fails so no user row exists. Workaround: manually insert a user via
`scripts/seed.ts` or skip local Clerk testing and verify in production
directly.

**Verify it's in production mode:**
- Top bar should NOT show "As ▾" impersonation switcher
- Sidebar avatar shows your real Clerk user name
- Sign out via the user menu

### Step 4. Removing dev mode after launch

When `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is unset, the app reverts to
cookie impersonation. Once you're confident the Clerk flow works, you
can delete the dev fallback by removing the `isClerkEnabled()` branches
in `src/lib/current-user.ts` and `src/middleware.ts`. But there's no
rush — keeping the fallback is what lets new contributors clone + run
without setting up Clerk.

---

## Round 1b — Cloud Database (next commit)

What ships: swap `better-sqlite3` (local file) → `@libsql/client` (Turso
cloud). This is async-only, so it requires refactoring every `db.X().get()`
call site (~150 sites) to `await db.X().get()`.

**Why this is its own commit:** the change is mechanical but invasive.
Shipping in isolation lets us bisect cleanly if a query regression sneaks
in.

### Your action for round 1b

1. Sign up Turso: https://turso.tech (free tier: 500 DBs, 1B reads/mo)
2. Create a database in your nearest region (Singapore for VN)
3. Get the connection details:
   ```bash
   turso db show creops-prod
   turso db tokens create creops-prod
   ```
4. Paste into `.env.local`:
   ```
   DATABASE_URL=libsql://creops-prod-<account>.turso.io
   DATABASE_AUTH_TOKEN=eyJ...
   ```
5. Run migrations against the cloud DB:
   ```bash
   pnpm db:migrate
   ```
6. (Optional) seed default channels:
   ```bash
   pnpm db:seed
   ```

---

## Round 1c — Vercel deploy

1. Push the repo to GitHub
2. Vercel → **New Project** → Import the repo
3. **Build & Output Settings:**
   - Framework: Next.js (auto-detected)
   - Build command: `pnpm build`
   - Install command: `pnpm install`
4. **Environment Variables:** paste all from `.env.local`
5. Deploy → get a `<project>.vercel.app` URL
6. **Update Clerk webhook URL** to the new domain:
   - Clerk dashboard → Webhooks → edit endpoint URL
7. **Custom domain (optional):**
   - Vercel → Domains → Add → `creops.app` (or yours)
   - DNS A record points to Vercel
   - Clerk dashboard → Domains → add the same custom domain

**Test the full loop in production:**
1. Sign up with a new email → land on `/onboarding`
2. Name the workspace → arrive at dashboard
3. Settings → Team members → invite a teammate (paste a 2nd account
   you control)
4. Sign in as the 2nd account on a different browser → create a topic
5. Submit a task → 1st account's bell rings → review

---

## Round 2 — Email invites (this commit)

What ships: **Real email invite flow**. The Settings → Team members page
now has an "Invite member" button that sends an email via Resend with a
join link. Recipient clicks → /join/[token] → Clerk sign-up → lands in
the inviter's workspace automatically. Pending invites list with Resend
+ Cancel buttons. Graceful dev fallback: without `RESEND_API_KEY`, the
join URL is logged to the server console so you can hand-test the flow.

### Step 1. Provision Resend (3 minutes)

1. Go to https://resend.com → Sign up (Google OAuth = fastest)
2. Free tier: **100 emails/day, 3000/month** — enough for early launch
3. **API Keys** → Create API Key → name it "CreOps prod" → copy
   `re_xxxxxxxxxxxxx`

### Step 2. Add to Vercel

Project → Settings → Environment Variables → add:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://creops-ruddy.vercel.app
```

(`NEXT_PUBLIC_APP_URL` is what gets stamped into the email's join link.
Without it, falls back to `VERCEL_PROJECT_PRODUCTION_URL` which Vercel
auto-injects — that works too, this override is for once you wire a
custom domain.)

Redeploy → invites are now live.

### Step 3. (Optional) Verify your domain

By default emails come from `CreOps <onboarding@resend.dev>` — works,
but lands in Promotions/Spam more often. To send from your own domain:

1. Resend → Domains → Add `yourdomain.com`
2. Add the SPF + DKIM DNS records Resend provides (5 min in your DNS
   provider)
3. Wait for verification (~10 minutes)
4. Add to Vercel:
   ```
   RESEND_FROM_EMAIL=CreOps <invites@yourdomain.com>
   ```

### Step 4. Test the loop

1. Sign in to production → Settings → Team members → Invite member
2. Enter a real email (a 2nd account you control)
3. Check inbox → click "Accept invite"
4. If you have an account at that email → lands at /dashboard, joined
5. If new email → bounces through /sign-up → webhook detects pending
   invite → drops you in the inviter's workspace (skips the default
   "{Name}'s Workspace" provisioning)

Estimated remaining round 2b effort: ~20h (R2 file upload).

---

## Round 2b — File upload (Cloudflare R2)

What ships:
- **Cloudflare R2** for file uploads — replace "paste link" model with
  real upload + signed URL playback

Estimated effort: ~20h human / ~4h AI-compressed.

---

## Round 3 — Stripe billing

What ships:
- Stripe Subscriptions per workspace
- Tier limits:
  - Free: 5 topics, 3 team members, 100 tasks/mo
  - Pro ($29/mo): unlimited everything
- Billing page in Settings
- Webhook for subscription lifecycle
- Free-tier enforcement on `createTopic`, `addMember`, etc.

Estimated effort: ~40h human / ~8h AI-compressed.

**Vietnam note:** Stripe doesn't directly support VN merchant accounts.
Options:
- Use Stripe via Stripe Atlas (US Delaware C-corp, ~$500 one-time + $100/yr)
- Use [Pay.JP](https://pay.jp) or [VNPay](https://vnpay.vn) for VN-only billing
- Or skip billing for v1 and monetize later

---

## Cost estimate

| Service | Free tier | Paid (at scale) |
|---|---|---|
| Vercel | 100 GB bandwidth, hobby projects | $20/mo Pro |
| Clerk | 10,000 MAU | $25/mo + $0.02/MAU |
| Turso | 500 DBs, 1B row reads | $29/mo Scaler |
| Resend | 100 emails/day | $20/mo |
| Cloudflare R2 | 10 GB storage + ZERO egress | $0.015/GB/mo after |
| Stripe | Free | 2.9% + $0.30 per charge |
| **Total launch** | **$0** | — |
| **At 100 paying users** | — | **~$50-100/mo** |

---

## Operational checklist

Before launching publicly:
- [ ] All env vars set in Vercel (Clerk + Turso + future Resend/R2/Stripe)
- [ ] Clerk webhook URL points to production domain
- [ ] Run `pnpm typecheck && pnpm test && pnpm build` clean
- [ ] Test full signup → onboarding → topic creation → task flow
- [ ] Smoke test with a real friend's email (not yours)
- [ ] Privacy policy + ToS pages (legally required)
- [ ] `creops.app` domain purchased + DNS verified
- [ ] Slack / Discord / email alerting on Clerk webhook failures
- [ ] DB backup strategy (Turso has point-in-time recovery on paid tier)

---

## Architectural decisions captured

**Why Clerk (not NextAuth, Better-Auth):**
- Easiest Next.js setup (1 file middleware vs N adapters)
- Generous free tier matches launch budget
- Pre-built UIs cover FB / Google for VN users out of the box
- Hosted = no need to manage password hashes, sessions, MFA flows

**Why Turso (not Neon Postgres, Supabase):**
- libSQL is SQLite-compatible — schema unchanged, no `sqliteTable` →
  `pgTable` rewrite
- Drizzle has first-class libsql adapter
- Edge-deployed, low latency from VN region
- Free tier sufficient for 6-12 months of growth

**Why Vercel (not Railway, Fly):**
- Next.js's home team — fewest integration surprises
- Edge functions + ISR work out of the box
- Free tier + auto-deploy from GitHub
- Easy custom domain + cert

**Why graceful dev fallback:**
- Cloning the repo + running `pnpm dev` should Just Work without 4
  external service signups
- Existing prototype dev experience (impersonation) is genuinely useful
  for testing multi-user flows pre-Clerk
- Switching to production mode is one env var flip
