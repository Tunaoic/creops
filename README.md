# Cowork — Creative Workflow Platform

Real working app với SQLite persistence. Mọi action **save thật** — refresh trang, restart server, data còn nguyên.

## Run

```bash
pnpm install        # install deps
pnpm db:reset       # create local.db + seed sample data
pnpm dev            # start http://localhost:3000
```

Khi seed lại bất cứ lúc nào: `pnpm db:reset`.

## What's Real (works end-to-end)

| Feature | Persists? | Notes |
|---------|-----------|-------|
| Create topic + brief + assets | ✅ DB | Click + New Topic, fill form, submit → row in `topics` |
| Pick deliverables multi-channel | ✅ DB | Auto-spawns tasks per template, auto-assigns default role |
| AI generate (title, description, cuts, post copy, thread) | ✅ DB (mock outputs) | Click Generate → 600-1200ms delay → outputs save to task |
| AI Cut Suggestion regen rate limit | ✅ DB | 3/day/deliverable enforced via `ai_cut_regen_log` table |
| Submit task with content | ✅ DB | Task status: todo → in_progress → submitted, output_value persisted |
| Approve / Reject (mobile swipe flow) | ✅ DB | Decisions saved per task, deliverable rolls up to approved/in_progress |
| Mark aired with link | ✅ DB | Per-channel link saved, deliverable rolls up to aired when all channels done |
| Topic status auto-roll-up | ✅ DB | partially_aired → fully_aired based on deliverable states |
| Settings: default assignees, block reason, AI limit | ✅ DB | Saved to `workspace_settings` |
| Channel Style Guide (samples + custom prompt) | ✅ DB | Per-channel × per-content-type, saved to `channel_style_guides` |
| Search topics + aired links | ✅ Real | Fuzzy match across DB |

## What's Mocked (would need API keys for real)

| Feature | Why mocked | Production fix |
|---------|------------|----------------|
| Auth | No Clerk keys | Sign up Clerk, add CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY |
| File upload | No R2 bucket | Cloudflare R2 + signed URLs + tus.io resumable |
| AI calls (Claude API + Whisper) | No API keys | Replace `generateAI*` mock returns with real `@anthropic-ai/sdk` calls |
| Notifications (email) | No Resend key | Add RESEND_API_KEY, send via `resend.emails.send()` |
| Stripe billing | No Stripe account | Stripe Subscriptions per-workspace |
| Production deployment | Local-only | Vercel + Neon Postgres (swap better-sqlite3 → @neondatabase/serverless + drizzle-orm/neon-http) |

## Try the Full Loop (proves persistence)

1. **Create:** `+ New Topic` → "Test 1" + brief + select 1-2 sample assets
2. Step 2 → tick **Short Video** + **TikTok**
3. Submit → redirects to topic page, you see new deliverable + 3-4 auto-spawned tasks
4. **Generate AI:** Click task "Master video" → "Generate Cut Suggestions" → 1.2s delay → 3 mock cuts appear with timestamps
5. Click "Mock upload" then "Submit for Review" → task saved as submitted
6. **Approve flow:** Back to dashboard → "Test 1" appears in "Needs Review" → click "Review" → mobile card stack
7. Approve / reject each card → "Save decisions"
8. **Mark aired:** Topic detail → if deliverable approved, MarkAiredButton appears → paste link → save → status flips to aired
9. **Refresh entire browser** → everything persists
10. **Restart `pnpm dev`** → data still there in `local.db`

## DB schema (SQLite, 14 tables)

`src/db/schema.ts` — Drizzle TypeScript schema matching `../db-schema.sql`:
- `workspaces`, `users`, `workspace_settings`
- `channels`, `channel_style_guides`
- `topics`, `source_assets`
- `deliverables`, `deliverable_channels` (many-to-many for multi-channel)
- `tasks`
- `ai_cut_suggestions`, `ai_cut_regen_log`
- `comments`, `activity_log`

Foreign keys, cascades, JSON columns all enforced.

## Routes

| Route | Server / Client | Purpose |
|-------|-----------------|---------|
| `/` | Server | Dashboard 3 zones — fetched from DB |
| `/topics` | Server + Client | All topics list with search/filter |
| `/topics/new` | Server + Client | 2-step create flow → `createTopic()` action |
| `/topics/[id]` | Server | Topic detail with deliverables + Add Deliverable + Mark Aired |
| `/topics/[id]/tasks/[taskId]` | Server + Client | Task detail with AI generate + submit |
| `/topics/[id]/approve/[deliverableId]` | Server + Client | Mobile approve card stack → `approveDeliverable()` action |
| `/settings` | Server + Client | Workspace settings → `updateWorkspaceSettings()` action |
| `/settings/channels/[id]` | Server + Client | Channel Style Guide → `updateChannelStyleGuide()` action |
| `/search` | Server + Client | Full-text search topics + aired links |

## File Structure

```
src/
├── app/                                   # Next.js routes
│   ├── layout.tsx                         # Root + sidebar
│   ├── page.tsx                           # Dashboard
│   ├── topics/...                         # Topic routes
│   ├── settings/...                       # Settings routes
│   └── search/page.tsx
├── components/
│   ├── sidebar.tsx + sidebar-client.tsx   # Server-fetches user, client renders nav
│   ├── status-badge.tsx                   # Reusable status pills + progress dots
│   ├── add-deliverable-button.tsx         # Modal with confirm step
│   ├── mark-aired-button.tsx              # Inline link input
│   ├── approve-flow-client.tsx            # Mobile card stack
│   ├── new-topic-form.tsx                 # 2-step create form
│   ├── topics-list-client.tsx
│   ├── search-client.tsx
│   ├── settings-client.tsx
│   ├── channel-style-guide-client.tsx
│   └── task-views/                        # 4 task type variants
│       ├── master-video.tsx               # AI Cut Suggestion
│       ├── title.tsx                      # AI title suggestions
│       ├── description.tsx                # AI description draft
│       └── generic.tsx                    # Fallback (post copy, thread, file, datetime, chips)
├── db/
│   ├── schema.ts                          # Drizzle schema
│   ├── client.ts                          # better-sqlite3 + Drizzle init
│   ├── queries.ts                         # Read functions (server-only)
│   └── actions.ts                         # Server Actions for mutations
├── lib/
│   ├── ai-mock.ts                         # Mock AI outputs returned by actions
│   └── utils.ts
└── types/
    └── index.ts                           # App types matching DB
```

## Tech Stack

- Next.js 16.2 + React 19.2 (Turbopack default, async params, server actions)
- TypeScript 5.9
- Tailwind CSS 4 (`@import "tailwindcss"`)
- Drizzle ORM 0.45 + better-sqlite3 12
- lucide-react icons

## DB Commands

```bash
pnpm db:generate    # generate migration from schema changes
pnpm db:migrate     # apply pending migrations
pnpm db:seed        # reseed (clears + reinserts sample data)
pnpm db:reset       # rm local.db + migrate + seed (full reset)
```

## To go to Production (~5-6 weeks solo dev)

| Step | Effort | Required keys/accounts |
|------|--------|------------------------|
| Swap SQLite → Neon Postgres | 1 day | Neon URL |
| Add Clerk auth, multi-user | 2-3 days | Clerk keys |
| File upload → Cloudflare R2 | 2-3 days | R2 bucket + keys |
| Replace mock AI → Claude API | 4-5 days | ANTHROPIC_API_KEY |
| Whisper transcription via Inngest | 1-2 days | OPENAI_API_KEY + Inngest |
| Notifications via Resend | 2 days | RESEND_API_KEY |
| Stripe billing | 2 days | Stripe account |
| Vercel deploy + env config | 1 day | Vercel account |

Specs sẵn sàng để brief dev:
- [creative-workflow-platform-spec.md](../creative-workflow-platform-spec.md)
- [db-schema.sql](../db-schema.sql) (Postgres equivalent of Drizzle schema)
- [ai-prompt-spec.md](../ai-prompt-spec.md)
