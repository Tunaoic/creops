# CreOps Launch Checklist

Everything to do — in order — to go from "deployed at `creops-ruddy.vercel.app`" to "publicly live, marketable, and able to email anyone." None of these require more code from me. Each item is a thing **you** click or paste.

Estimated total time: **~90 minutes spread over 2-3 sittings** (DNS waits are passive).

---

## Phase A — Domain (15 minutes active, then wait)

The domain unlocks 3 things at once: a real URL for marketing, a verified email sender for Resend, and a clean DKIM/SPF setup for inbox deliverability.

### A.1 — Buy a domain

1. Open **https://dash.cloudflare.com/?to=/:account/registrar** (cheapest, no markup)
2. Search: try `creops.app`, `creops.io`, `creops.co`, `creops.studio` — whichever feels right and is available
3. Add to cart → checkout (~$10/year)
4. After purchase, the domain auto-appears in Cloudflare DNS dashboard

Alternative: Porkbun or Namecheap if you already have an account.

### A.2 — Point domain at Vercel

1. **https://vercel.com/dashboard** → click `creops` project → **Settings** → **Domains**
2. **Add** → type your domain (`creops.app`) → **Add**
3. Vercel shows you **2 DNS records** to add (A record + sometimes a CNAME for `www`)
4. Open Cloudflare → your domain → **DNS** → **Records** → **Add record** for each
5. Wait 2-5 minutes. Vercel will show ✅ green next to the domain
6. While there: also add `www.creops.app` → Vercel auto-redirects to apex

### A.3 — Update env vars

In Vercel project → **Settings** → **Environment Variables**, add (or update):

```
NEXT_PUBLIC_APP_URL=https://creops.app
```

Replace `creops.app` with whatever you bought. Tick all 3 environments (Production / Preview / Development). Save.

### A.4 — Redeploy

Vercel → **Deployments** → most recent → **⋯** → **Redeploy** (keep build cache).

After ~60 seconds your app lives at `https://creops.app`.

---

## Phase B — Verify Resend domain (15 minutes active, then wait ~10 min for DNS)

This unlocks emailing **anyone** (not just `tuannguyensi192@gmail.com`).

### B.1 — Add domain in Resend

1. **https://resend.com** → login → **Domains** → **Add Domain**
2. Type `creops.app` → **Add**
3. Resend shows **3-4 DNS records** to add (SPF TXT, DKIM CNAME, optional DMARC TXT, optional MX for reply tracking)

### B.2 — Add records to Cloudflare

For each record Resend shows:
1. Cloudflare → your domain → **DNS** → **Add record**
2. **Type** = the type Resend shows (TXT or CNAME)
3. **Name** = paste the name Resend shows (e.g. `resend._domainkey` or `send`)
4. **Content** / **Target** = paste the value Resend shows
5. **TTL** = Auto
6. **Proxy status** = **DNS only** (gray cloud, NOT orange) — important for email records
7. **Save**

Repeat for each record.

### B.3 — Trigger Resend re-verification

Resend → Domains → click your domain → **Verify DNS records**. Should go ✅ green within 5-10 minutes (sometimes faster).

### B.4 — Update env var

Vercel → **Settings** → **Environment Variables**:

```
RESEND_FROM_EMAIL=CreOps <invites@creops.app>
```

(or whatever inbox alias you want — `hello@`, `team@`, `noreply@`. The inbox doesn't need to exist for sending, but reply will bounce.)

Save → Redeploy.

### B.5 — Test

Go to https://creops.app/settings/members → **Invite member** → enter a Gmail you control → **Send invite**. Check inbox + Spam. Should arrive from your own domain.

---

## Phase C — Analytics (5 minutes)

### C.1 — Sign up Plausible

1. **https://plausible.io** → Sign up (Google login fastest)
2. **Add a site** → enter `creops.app` → timezone = your timezone
3. Skip the script-install step — we already wired it

### C.2 — Add env var

Vercel → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=creops.app
```

Save → Redeploy → load `https://creops.app` once → check Plausible dashboard → 1 pageview should appear within a minute.

Free up to 10k pageviews/month, $9/mo after.

---

## Phase D — Clerk production keys (10 minutes)

Clerk has dev keys (`pk_test_...`) and production keys (`pk_live_...`). For real users you need to flip.

### D.1 — Move Clerk app to production

1. **https://dashboard.clerk.com** → your CreOps app
2. Top-right environment switcher → **Production** (creates a separate prod instance)
3. Configure same auth methods as dev (Email, Google, Facebook)
4. **API Keys** → copy `pk_live_...` and `sk_live_...`

### D.2 — Production webhook

Clerk prod → **Webhooks** → **Add Endpoint**:
- URL: `https://creops.app/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`
- Save → copy the **Signing Secret** (`whsec_...`)

### D.3 — Update Vercel env vars

Replace the dev keys with prod ones:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```

Save → Redeploy.

### D.4 — Add domain to Clerk

Clerk prod → **Domains** → **Add domain** → `creops.app`. This makes sign-in cookies first-party (better security + no cross-site warnings).

---

## Phase E — Pre-launch sanity (10 minutes)

Hit each of these URLs in an **incognito window** (not signed in) and verify:

- [ ] `https://creops.app` — landing renders, no console errors, all links work
- [ ] `https://creops.app/privacy` — opens, "Back to home" link works
- [ ] `https://creops.app/terms` — opens, footer renders
- [ ] `https://creops.app/sign-up` — Clerk form loads, you can sign up with a fresh email
- [ ] After signup → bounces through webhook → lands on `/dashboard` with a fresh workspace
- [ ] `https://creops.app/api/health` — JSON with `status: ok`, clerkConfigured: true, database.reachable: true
- [ ] Send a real invite from `/settings/members` → recipient gets email from `creops.app` domain
- [ ] Click invite link → sign up → lands inside YOUR workspace (not their own)

If any fail: check Vercel runtime logs (`/_logs` page) for the error.

---

## Phase F — Going public (variable time)

You have a working, legally-compliant, analytics-instrumented product live at a real domain. Now find users.

### Soft launch (week 1)

- [ ] Show 5 creator friends → watch them sign up → take notes
- [ ] Fix the top 3 things they get confused by
- [ ] Personal Twitter/X post: "Built X because Y. Here's the link."
- [ ] Post in 1-2 niche communities (e.g. Vietnam content creator Facebook groups, Indie Hackers)

### Public launch (week 2-3)

- [ ] Product Hunt launch (Tuesday or Wednesday is best)
- [ ] LinkedIn post explaining the problem and your solution
- [ ] DM 10 creators who publish weekly across formats
- [ ] Reach out to 3 newsletters in the creator-tools space

### What to monitor in Plausible

- **Bounce rate on `/`** — if >70%, the hero copy isn't landing
- **Sign-up conversion** — pageviews on `/sign-up` ÷ pageviews on `/` — aim for ≥8% in first month
- **Activation** — sign-ups that create a topic within 24h — aim for ≥40%

---

## Things NOT to do at launch

- **Don't add Stripe** until you have ≥10 active users asking for paid features. Free tier is enough to validate.
- **Don't add TikTok / IG / FB integrations** until you have a user telling you they aired something and want to see metrics. The approval queues take 2-4 weeks anyway.
- **Don't optimize the dashboard** until you watch a real user fumble through it once. Their friction is more informative than your taste.
- **Don't write a blog** until you have 50 users. Until then, you don't have anything to say that they don't already know.

---

## When you finish each phase, ping me

Phase A done → I'll verify the domain swap and check for stray hardcoded URLs.

Phase B done → I'll send a test invite and confirm DKIM passes.

Phase C done → I'll verify the Plausible event fires + add custom event tracking for sign-up.

Phase D done → I'll smoke-test the production Clerk flow end-to-end.

Phase E all green → ship Phase F + I'll prep onboarding analytics + a "first-run" tour.
