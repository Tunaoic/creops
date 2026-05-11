# CreOps — Content Workflow Platform

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FOWNER%2FREPO&env=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,CLERK_WEBHOOK_SECRET,DATABASE_URL,DATABASE_AUTH_TOKEN&envDescription=See%20DEPLOY.md%20for%20how%20to%20provision%20each%20service&envLink=https%3A%2F%2Fgithub.com%2FOWNER%2FREPO%2Fblob%2Fmain%2FDEPLOY.md)

Real working app with SQLite persistence locally + libsql/Turso for production.
Every action **saves for real** — refresh, restart, the data stays.

> Replace `OWNER/REPO` in the badges above after pushing to GitHub.

## Requirements

- Node 20 or 22 (tested on 22)
- pnpm 9 or 11

## Run

```bash
pnpm install        # install deps
pnpm db:reset       # create local.db + seed default channels (no test users)
pnpm dev            # start http://localhost:3000
```

To start fresh at any time: `pnpm db:reset`.

## Development scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server with Turbopack on :3000 |
| `pnpm build` | Production build (also runs TypeScript check) |
| `pnpm typecheck` | Run TypeScript checker without emitting (fast) |
| `pnpm test` | Run vitest suites |
| `pnpm db:generate` | Generate a new Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations to `local.db` |
| `pnpm db:seed` | Seed the empty workspace (channels only, no users) |
| `pnpm db:reset` | Wipe `local.db` + re-migrate + re-seed |

## What's real (works end to end)

| Feature | Persists? | Notes |
|---|---|---|
| Create topic + brief + material links | ✅ DB | + URL validation on links |
| Pick deliverables × multi-channel | ✅ DB | Auto-spawns tasks per template |
| Per-task multi-assignee + watchers | ✅ DB | Watchers get notified on every progress event |
| Task workflow (todo → submitted → approved/rejected) | ✅ DB | State-machine guards on every transition |
| Per-task approve / request changes (creator) | ✅ DB | With reason capture, fan-out notify |
| Resubmit after rejection | ✅ DB | Old reject reason auto-cleared |
| Mark aired with link | ✅ DB | Per-channel; deliverable rolls up to "aired" when all done |
| Topic status auto-rollup | ✅ DB | partially_aired → fully_aired |
| Notifications + bell + per-task fan-out | ✅ DB | Real names ("Trang submitted") not "Someone" |
| Activity log per task | ✅ DB | with `{from, to, via}` metadata |
| Comments on topic + task | ✅ DB | with mentions |
| Settings (display preferences, channels) | ✅ DB | |
| Theme (light / dark) | ✅ localStorage | with FOUC-prevention bootstrap |
| Language toggle (en / vi) | ✅ cookie | covers sidebar / topbar / dashboard / inbox |
| User impersonation (test as different members) | ✅ cookie | top-bar "As X" switcher |
| Search across topics + briefs + aired links | ✅ Real | fuzzy match |
| Calendar (publish + production modes) | ✅ Real | per-task due dates + per-channel air dates |
| Toast feedback on every action | ✅ UI | success / error / pending states via sonner |
| Draft autosave on task forms | ✅ localStorage | survives tab close / refresh |

## What's mocked (would need API keys for real)

| Feature | Why mocked | Production fix |
|---|---|---|
| Auth | No Clerk keys | Sign up Clerk, add `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` |
| File upload | No R2 bucket | Cloudflare R2 + signed URLs + tus.io resumable |
| AI calls (Claude API + Whisper) | No API keys | Replace `generateAI*` mocks with real `@anthropic-ai/sdk` calls |
| Notifications (email) | No Resend key | Add `RESEND_API_KEY`, send via `resend.emails.send()` |
| Stripe billing | No Stripe account | Stripe Subscriptions per-workspace |
| Production deploy | Local SQLite only | Vercel + Neon Postgres (swap `better-sqlite3` → `@neondatabase/serverless` + `drizzle-orm/neon-http`) |

See `SETUP.md` for the full production-ready setup guide.

## Try the full loop (proves persistence + workflow)

1. **Set up team:** Settings → Team members → add 2-3 (e.g., Alex, Trang, Nga)
2. **Create:** `+ New topic` → "Test 1" + brief + paste 1-2 material links (Drive
   folder URLs)
3. **Step 2:** tick **Short Video** + **TikTok**
4. Submit → land on topic detail with auto-spawned tasks
5. **Assign:** Click first task → AssigneePicker → pick Trang
6. **Impersonate Trang:** Top bar `As ▾` → Trang
7. Inbox → MY TASKS → click task → fill output → **Submit for review**
8. **Switch back to Alex:** Bell rings → click notification → see read-only output
9. **Approve:** click Approve (or Request changes with reason)
10. Trang's bell rings on rejection; she edits + resubmits

Notifications work cross-impersonation thanks to layout revalidation. State-machine
guards prevent invalid transitions (you can't approve a task that's not submitted,
etc.) — the action returns `{ ok: false, reason }` and the UI surfaces it as a
toast.

## Architecture quick map

- `src/app/` — Next 16 App Router pages (server components by default)
- `src/components/` — Client components (interactivity, transitions)
- `src/db/schema.ts` — Drizzle schema (single source of truth)
- `src/db/queries.ts` — Read-only DB queries (`server-only`)
- `src/db/actions.ts` — Server actions (mutations, return `ActionResult`)
- `src/lib/` — Helpers (i18n, current-user cookie, URL validation, drafts)
- `drizzle/` — Generated SQL migrations
- `scripts/seed.ts` — Idempotent seed (clears + reseeds)
- `tests/` — Vitest unit tests for state machine + helpers

## Stack

Next 16 (Turbopack) · React 19 · TypeScript 5 · Tailwind 4 · Drizzle ORM ·
better-sqlite3 · Sonner toasts · Apple system font stack
