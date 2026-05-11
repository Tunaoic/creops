## What changed

<!-- 1-2 lines: what does this PR do? -->

## Why

<!-- 1-2 lines: what problem does it solve / which user pain? -->

## Pre-merge checklist

- [ ] `pnpm typecheck` clean
- [ ] `pnpm test` passes
- [ ] `pnpm build` clean
- [ ] Manual smoke test of the affected flow
- [ ] If schema changed: ran `pnpm db:generate` + committed migration
- [ ] If env vars changed: updated `.env.example` + `DEPLOY.md`
