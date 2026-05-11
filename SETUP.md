# CreOps — Production Setup Guide

App chạy được ngay không cần gì cả (mock mode). Mỗi key mày paste vào `.env.local` → 1 phần becomes real. **Dual-mode:** real API call nếu key set, fallback mock nếu không.

## Quick start (mock mode — 0 keys needed)

```bash
pnpm install
pnpm db:reset      # creates local.db + seeds sample data
pnpm dev           # http://localhost:3000
```

Mọi thứ chạy với mock. Tạo topic → DB save thật. Click "Generate AI" → mock outputs sau 600-1200ms.

## Production mode — 4 services (theo priority)

### Priority 1: Real AI (Anthropic) — **most impactful**

**Why:** Mock outputs giống nhau mọi topic. Real Claude đọc transcript thật, tạo title/description/cuts theo voice channel.

**Setup (10 phút):**
1. Vào [console.anthropic.com](https://console.anthropic.com) → Sign up (cần email + credit card cho usage-based billing)
2. **Settings → API Keys** → Create Key → copy `sk-ant-...`
3. Tạo file `.env.local` ở `cowork-app/`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
   ```
4. Restart `pnpm dev` → console hiển thị `[env] Features enabled: { claudeAPI: true }`
5. Test: mở task "Title" → click Generate → giờ là **real Claude** (lần đầu ~3-5s, cached lần sau ~1-2s)

**Cost expectations:**
- Title generation (Haiku): ~$0.001/call
- Description draft (Sonnet 4.6 + adaptive thinking): ~$0.03/call
- AI Cut Suggestion (Sonnet 4.6 high effort): ~$0.04/call
- Total per topic with all features: ~$0.20-0.30

**Built-in cost optimizations:**
- Prompt caching (Layer 1+2 cached → 90% cheaper repeat calls)
- Sonnet 4.6 cho long output, Haiku 4.5 cho short
- Rate limit 3 cuts regen/day/deliverable (configurable in Settings)

**What works without this:** Everything except real AI quality. UI flows still demo-able.

---

### Priority 2: Real Transcription (OpenAI Whisper) — needed for AI quality

**Why:** AI generation needs transcript của video. Without Whisper, app uses mock transcript = AI outputs sẽ generic.

**Setup (5 phút):**
1. [platform.openai.com](https://platform.openai.com) → Sign up
2. Settings → API Keys → Create → copy `sk-...`
3. Add vào `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-xxxxxxxxxxxxx
   ```
4. Add credit ($5-10 đủ test)

**Cost:** $0.006/phút. 100 topics × 15 phút = $9/tháng.

**How it works:** Khi user upload video → background job transcribe → save segments với timestamps → AI Cut Suggestion dùng timestamps để suggest cuts thật.

**What works without this:** Mock transcript ("(Mock transcript for filename)"). AI sẽ dùng brief + topic name nhưng không có nội dung video.

---

### Priority 3: Real File Upload (Cloudflare R2) — needed cho production

**Why:** Mock mode chỉ "click sample" (4 fake files). Real production cần upload video thật.

**Setup (15 phút):**
1. [dash.cloudflare.com](https://dash.cloudflare.com) → Sign up free
2. **R2 Object Storage** (sidebar) → enable
3. **Create bucket** → name `cowork-media` (hoặc gì cũng được) → location automatic → Create
4. **Manage R2 API Tokens** → Create API token:
   - Permissions: **Object Read & Write**
   - Bucket: select `cowork-media`
   - Click Create
5. Copy **Access Key ID** + **Secret Access Key** (hiển thị 1 lần)
6. **Account ID** lấy ở Dashboard sidebar (under "R2")
7. Add vào `.env.local`:
   ```bash
   R2_ACCOUNT_ID=abc123def456
   R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxx
   R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   R2_BUCKET=cowork-media
   ```
8. (Optional) Custom domain: R2 → bucket → Settings → Custom Domains → add `media.yourdomain.com` → set `R2_PUBLIC_URL=https://media.yourdomain.com`

**Cost:** Free 10GB + 0 egress. Sau: $0.015/GB/tháng.

**Note:** Upload UI hiện tại là mock (click sample assets). Real upload flow đã code sẵn ở [src/db/upload-actions.ts](src/db/upload-actions.ts) và [src/lib/storage/r2.ts](src/lib/storage/r2.ts) — gồm signed URL generation + asset registration. Để hook lên New Topic form, replace mock asset picker bằng `<input type="file">` + `getUploadUrl()` action. ~30 phút work.

**What works without this:** Local file system (`./local-uploads/`). OK cho dev, không scale lên production.

---

### Priority 4 (lower) — chưa wire trong session này

#### Postgres (Neon) — production database

Hiện tại dùng SQLite (`./local.db`). Production cần Postgres để chạy serverless trên Vercel.

**Setup:**
1. [neon.tech](https://neon.tech) → free tier
2. Create project → copy connection string
3. Migration steps:
   ```bash
   pnpm add @neondatabase/serverless drizzle-orm/neon-http
   pnpm remove better-sqlite3 @types/better-sqlite3
   ```
4. Edit [src/db/schema.ts](src/db/schema.ts) — replace `sqliteTable` → `pgTable`:
   - `integer({mode: "timestamp"})` → `timestamp("name", { mode: "date" })`
   - `integer({mode: "boolean"})` → `boolean("name")`
   - `text({mode: "json"})` → `jsonb("name")`
   - `real(...)` → `doublePrecision(...)`
5. Edit [src/db/client.ts](src/db/client.ts):
   ```typescript
   import { neon } from "@neondatabase/serverless";
   import { drizzle } from "drizzle-orm/neon-http";
   const sql = neon(process.env.DATABASE_URL!);
   export const db = drizzle(sql, { schema });
   ```
6. Edit [drizzle.config.ts](drizzle.config.ts) → `dialect: "postgresql"`
7. `pnpm db:generate && pnpm db:migrate`
8. Re-run seed (modify scripts/seed.ts to use new client)

**Cost:** Free tier 0.5GB DB + 100h compute. Pro $19/mo nếu cần.

#### Auth (Clerk) — multi-user

Hiện tại single mock user (Alex). Multi-user cần Clerk.

**Setup:**
1. [clerk.com](https://clerk.com) → free tier (10k MAU)
2. Create app → copy 2 keys
3. `pnpm add @clerk/nextjs`
4. Add vào `.env.local`:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   ```
5. Wrap `app/layout.tsx` với `<ClerkProvider>`
6. Add `middleware.ts` cho protected routes
7. Replace `getCurrentUser()` ở [src/db/queries.ts](src/db/queries.ts) với Clerk user lookup
8. Add sign-in/sign-up pages

#### Email (Resend), Billing (Stripe), Deploy (Vercel)

See spec [creative-workflow-platform-spec.md](../creative-workflow-platform-spec.md) Section 13 + 17 cho roadmap.

---

## Verify Features Active

Khi `pnpm dev` start, console log:
```
[env] Features enabled: { claudeAPI: true, whisper: true, r2: false }
```

Mỗi `true` = real, mỗi `false` = mock fallback.

Trên app, có visual indicators:
- Generate button → spinner "Generating..." (real takes 2-5s, mock 600-1200ms)
- Console error log nếu real call fail (auto-fallback to mock — never breaks UX)

---

## Test Real AI Quality (5 phút)

Sau khi paste `ANTHROPIC_API_KEY`:

1. Tạo topic mới với brief thật của mày (vd: "Phỏng vấn KOL X về Y")
2. Click sample assets (mock) — sẽ có mock transcript
3. Mở task "Title" → Generate → so sánh với mock
4. Mở task "Description" → Generate → match channel style guide?
5. Mở task "Final video" (Short Video) → Generate Cut Suggestions → cuts có hợp lý không?

**Quality gate:** 4/5 outputs usable với edit nhẹ → ready for beta. <2/5 → cần tune prompts ở [src/lib/ai/claude.ts](src/lib/ai/claude.ts).

---

## Architecture Notes

**Dual-mode pattern** (xem [src/lib/env.ts](src/lib/env.ts)):
```typescript
export const features = {
  hasClaudeAPI: Boolean(env.ANTHROPIC_API_KEY),
  hasWhisper: Boolean(env.OPENAI_API_KEY),
  hasR2: Boolean(env.R2_ACCOUNT_ID && ...),
};
```

Mỗi server action check `features.hasX` → branch real vs mock. Nếu real fail (rate limit, network) → console.error + fallback mock. **App never breaks vì missing key.**

**Prompt caching** (xem [src/lib/ai/claude.ts](src/lib/ai/claude.ts)):
- Layer 1 (system role): `cache_control: ephemeral`
- Layer 2 (channel style guide): `cache_control: ephemeral`
- Layer 3 (topic context): per-request
- Layer 4 (task instruction): per-request

Cache hit rate ~80% → real cost ~$0.20/topic thay vì $0.50.

**Adaptive thinking** dùng Sonnet 4.6 cho complex tasks (Cut Suggestion, Description) — Claude tự decide thinking depth, không phải set `budget_tokens` cứng.
