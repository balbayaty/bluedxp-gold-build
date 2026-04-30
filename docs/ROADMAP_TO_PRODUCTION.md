# Roadmap to Production (Fast + Full + Enterprise)

This project has **513 pages** and an automated scorecard in `reports/APP_PAGE_SCORECARD.*`.
To move to production **ASAP** while still building the “full” platform, we use a **two-speed delivery model**:

- **Operate-first (production usable quickly)**: ship the minimum set of workflows employees need daily.
- **Full-platform (billion-dollar quality)**: keep expanding coverage without breaking architecture.

## The 2-track execution model (best way to go fast safely)

### Track A — Platform foundations (do once, helps every page)

These items unblock production and reduce rework:

- **Auth guard standard**: every `requiresAuth: true` route must enforce auth consistently (UI + API).
- **Tenant context standard**: every data call must carry tenant/customer/warehouse context and enforce it server-side.
- **RBAC standard**: roles/permissions must be enforced at API boundaries, and UI should only show allowed actions.
- **Error handling standard**: consistent user-friendly errors + safe logs.
- **Audit trail standard**: critical write actions emit audit events.

### Track B — Page hardening (repeatable per page)

For each page in the operate-first slice:

- **UI**: required fields exist, validation exists, empty/loading/error states exist.
- **Data contract**: define request/response types for that page’s APIs.
- **Service layer**: move business logic into `lib/services/**` (not inside the page).
- **API layer**: `app/api/**` routes validate input + enforce auth/tenant + call services.
- **Replace mock data last**: only after UI + contracts are ready.

## Your scorecard tells us the fastest order

From `reports/APP_PAGE_SCORECARD.md` the biggest blockers are:

- Pages using mock data
- Pages that should be protected but do not enforce auth
- APIs called by protected pages that do not enforce `apiAuthMiddleware` (best-effort detection)

## The “Page Definition of Done” (DoD) for production

A page is “production-ready” when:

- **Auth**: users who are not logged in cannot use it.
- **RBAC**: users can only see/execute what their role allows.
- **Tenant isolation**: tenant/customer/warehouse scoping is enforced server-side.
- **Data**: no mock data used in production path.
- **Validation**: inputs validated client + server.
- **Errors**: safe error handling, no secrets leaked, clear user messaging.
- **Audit**: critical writes logged.

## What I need from you (so we can finalize the plan)

Reply with:

1) The **top 10 pages employees must use first** (operate-first slice)
2) Your **target go-live date**
3) Your **production environment style**:
   - Single-tenant first, then multi-tenant
   - Multi-tenant from day 1

Then we’ll generate a week-by-week plan and start fixing the highest-impact pages first.

---

## Default “bulletproof rollout” (if you want me to drive without waiting)

If you don’t want to decide pages yet, the fastest safe default is:

### Phase 0 (48–72 hours): Security + Stability Gate (platform-wide)

- **Fix the 94 auth gaps**: any module route with `requiresAuth: true` must enforce auth consistently in UI and APIs.
- **Fix the 15 API auth gaps**: endpoints called by protected pages must use `apiAuthMiddleware`.
- **Standardize tenant context**: require tenantId extraction and server-side enforcement for any data mutation/read that is tenant-scoped.
- **Lock observability**: ensure errors are captured and logs are structured for critical flows.

Deliverable: employees can log in and cannot access protected pages without being authenticated.

### Phase 1 (Week 1): Operate-first WMS slice (production usable)

Harden these core daily flows end-to-end (UI → API → services → audit trail):

- `/dashboard` (role routing)
- `/my-tasks` + `/tasks`
- `/inventory` + `/skus`
- `/putaway`
- `/picking`
- `/shipments` + `/pod`

Deliverable: warehouse team can run day-to-day operations (even if advanced modules stay “build next”).

### Phase 2 (Week 2–3): Replace mock data in operate-first pages

- Replace mock datasets with real services + persistence
- Add exports/print labels where ops needs them

### Phase 3 (Week 3–6): Bulletproof core ledgers + inter-module intelligence

- Persist L1 event store + L0 evidence ledger (DB-backed; in-memory only for dev)
- Align event schemas + correlation IDs for tracing
- Connect AI outputs to evidence + workflows where it adds immediate value

---

## What changed recently (so you can trust the plan)

- Generated scorecard + backlog from real code: `reports/APP_PAGE_SCORECARD.*`, `reports/APP_PAGE_BACKLOG.md`
- Ecosystem map + gap report: `docs/ECOSYSTEM_MAP.md`, `docs/MODULE_GAP_REPORT.md`


