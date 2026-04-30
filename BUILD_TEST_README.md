# BlueDXP Gold Base - Production Build Test

This repo is a clean snapshot of the bluedxp-platform codebase at its
last-healthy "gold" commit (Jan 9, 2026 - internally f906a373), plus a
small set of production-build prep fixes.

## Sole purpose

Prove (or disprove) that this codebase can complete `next build` in a
clean CI environment, without touching the original BlueDXPv1 repo.

## Why this exists

The original codebase accumulated ~9 months of features that worked in
`next dev` but never finished `next build`. Local builds on a 16 GB
Windows laptop hit memory ceilings (95% RAM, pagefile thrashing).
This repo runs the build in GitHub Actions to get a definitive answer.

## What has been done to the gold base

- Fixed two leftover merge-conflict duplicates that broke webpack parse:
  - app/inspection-lots/page.tsx (duplicate useEffect import)
  - app/valuation/page.tsx (duplicate selectedMethod state)
- Lazy-init heavy services in app/layout.tsx (drops dev cold-start from
  30s+ to ~2s when INIT_SERVICES=0).
- Raised webpack chunkLoadTimeout to 5 min in next.config.js.
- Fixed bare `audit/` rule in .gitignore that silently excluded
  lib/services/audit/ (broke prod at b1dc888b).

## Build pipeline

.github/workflows/build-test.yml runs on push to main and on manual
trigger. It runs npm ci, npx prisma generate, then npx next build, and
uploads the full build log as an artifact regardless of outcome.

## Required repo secrets

| Secret        | Purpose                                                    |
|---------------|------------------------------------------------------------|
| DATABASE_URL  | Neon Postgres connection (pooled, with ?sslmode=require)   |
| DIRECT_URL    | Same Neon DB but unpooled, for Prisma migrations           |

All other env vars in .env.example are inlined as build placeholders.

## What success looks like

- next build exits 0
- .next/ directory created with route manifests + chunks
- Build log shows `Compiled successfully` and a route table

## What likely failure looks like

- Out-of-memory: runner has 7 GB RAM, codebase may need more
- DYNAMIC_SERVER_USAGE: routes that read headers/cookies at build
  time without `export const dynamic = 'force-dynamic'`
- Casing mismatch: InventoryService.ts vs inventoryService.ts
  (Windows is case-insensitive, Linux is not)