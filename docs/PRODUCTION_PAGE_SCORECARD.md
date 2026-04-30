# Production Page Scorecard (How we get to production fast without losing “billion‑dollar” quality)

This repo now generates a **page-by-page readiness scorecard** so you can see:

- What pages exist
- Which ones are “real” vs “mock”
- Which ones are registered/owned by modules
- Which ones look protected by auth vs not
- Which APIs are called by pages and whether those APIs enforce auth (best-effort)

## How to generate the scorecard

From the project root, run:

```bash
npm run audit:pages
```

It will create:

- `reports/APP_PAGE_SCORECARD.md` (easy to read)
- `reports/APP_PAGE_SCORECARD.json` (full detail for every page)

## How to read the scorecard

### The score (0–100)

This is a **heuristic** score meant to guide execution speed, not “marketing”.
It penalizes high-risk production gaps:

- Mock data instead of real data/services
- No database/service integration signals
- Route requires auth (per module definition) but page doesn’t appear to enforce it
- Page calls APIs that appear to lack `apiAuthMiddleware` while the route requires auth
- Too many TODO/FIXME/placeholder indicators

### “Registered” vs “Unregistered”

- **Registered pages**: referenced by `lib/modules/*` route definitions. These are “owned” by a module.
- **Unregistered pages**: exist in `app/` but no module declares them. These are risky because they often:
  - bypass navigation rules
  - bypass intended RBAC/roles expectations
  - become “forgotten” or “dead” pages

## What to do with the results (recommended execution method)

### 1) Lock in a Production Definition of Done (DoD) for a page

For any page that employees will use, it must meet:

- **Auth**: protected correctly (UI + API). No “implicit access”.
- **Tenant isolation**: tenant/customer/warehouse scope enforced consistently.
- **Data**: no mock data in production paths; service layer used for business logic.
- **Errors**: user-friendly errors + safe logs (no secrets), retries where needed.
- **Auditability**: critical actions produce audit trail events.
- **Performance**: acceptable load time; paginated lists; no giant renders.
- **Observability**: logs + tracing around key operations.

### 2) Pick an “Operate-First” slice (what employees need this month)

Pick the smallest set of pages that lets people operate daily (typical WMS example):

- Inbound / receiving
- Inventory / SKU lookup
- Putaway
- Picking
- Shipping / POD
- Tasks / My Tasks

Everything else stays in “build next” mode, but doesn’t block production.

### 3) Execute in 2 tracks (to move fast without losing sophistication)

- **Track A — Platform foundations (shared across pages)**:
  - Standard auth/guard pattern
  - API auth enforcement standard
  - Tenant context + scoping helpers
  - Audit trail + event bus hooks for critical actions

- **Track B — Page-by-page hardening (only the Operate-First slice at first)**:
  - Replace mock data with services
  - Validate inputs
  - Add empty/loading/error states
  - Add exports/prints where ops needs them

### 4) Use the scorecard to prioritize

Work from:

1. **Routes missing pages** (breaks navigation/404)
2. **Auth gaps on required routes** (security + “production not possible”)
3. **Mock data on operate-first pages**
4. **APIs without `apiAuthMiddleware` that are called by protected pages**

## Next step

Open `reports/APP_PAGE_SCORECARD.md` and choose:

- The **top 10 pages employees must use first**, and
- The **top 3 modules that must be production-ready first**.

Then we convert the scorecard issues into a week-by-week production roadmap.


