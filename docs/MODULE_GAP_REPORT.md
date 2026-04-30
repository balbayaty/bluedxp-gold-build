# Module + Page Gap Report (Bulletproof Production)

This is the “what’s missing” map. It is intentionally **blunt** so we can get to production fast *without* shipping a fragile system.

Inputs used:

- `docs/ARCHITECTURE/LAYER_INTERACTION_ARCHITECTURE.md` (reference architecture)
- `reports/APP_PAGE_SCORECARD.*` + `reports/APP_PAGE_BACKLOG.md` (current reality)
- Core backbone code:
  - L1/L2: `lib/services/event-store`, `lib/services/event-bus`, `lib/services/workflows`, `lib/services/saga`
  - L0: `lib/services/evidence`
  - Lx: `middleware/apiAuth.ts`, `contexts/AuthContext.tsx`, `lib/services/observability`

---

## Platform-wide “bulletproof” gaps (must fix early)

### 1) Auth/RBAC enforcement is inconsistent between “definition” and “runtime”

Evidence:
- Many module routes declare `requiresAuth: true` (see `lib/modules/*.ts`)
- Scorecard shows **94 pages** where the route says requiresAuth but the page does not appear to enforce auth/redirect.

Impact:
- Security risk + production blocker (employees can hit pages by URL).

Fix pattern:
- Establish a **single standard guard** for L5 pages (client) and enforce `apiAuthMiddleware` for L5 → L3 API boundaries (server).

### 2) Tenant isolation is not universally enforced

Evidence:
- Many APIs take `tenantId` from query/body with fallbacks like `'default'`
- UI context exists, but enforcement varies by endpoint.

Impact:
- Multi-tenant correctness + data leakage risk.

Fix pattern:
- Standardize tenant extraction and require tenant scoping at service/repository layer.

**Multi-tenant day-1 rule (implemented baseline):**
- `middleware/apiAuth.ts` now requires an explicit tenant context for authenticated API calls.
- Preferred sources (in order): token context → `x-tenant-id` header → `?tenantId=` query param (legacy support).
- In production, `tenantId="default"` is treated as invalid.

### MSDS-SKU Linking RBAC is config-driven (flexible)
You can change who can read/write/approve MSDS↔SKU links without code changes:
- Module config key: `msds.msdsSkuLinkingRbac`
- Fields:
  - `readerRoles: string[]`
  - `writerRoles: string[]`
  - `approverRoles: string[]`

### 3) Core “ledger” systems are still in-memory (not production durable)

Evidence:
- Event store is in-memory: `lib/services/event-store/index.ts`
- Evidence store is in-memory: `lib/services/evidence/evidenceService.ts`

Impact:
- Restart loses history; audit/evidence is not durable.

Fix pattern:
- Move L0/L1 persistence to database (Postgres/Prisma) or a proper event store backend.
- Keep in-memory as dev fallback only.

### 4) Event bus concept is split (in-process vs express/RabbitMQ)

Evidence:
- `lib/services/event-store/index.ts` exports an in-process `eventBus`
- `lib/services/event-bus/index.ts` is an express/RabbitMQ service

Impact:
- Confusion + inconsistent event delivery semantics.

Fix pattern:
- Define canonical event publishing contract:
  - In-process bus for local/dev
  - Transport-backed bus (RabbitMQ/Kafka) for production
  - Same interface, same event schema registry

### 5) Workflow service uses event bus imports that may not be safe client-side

Evidence:
- `lib/services/workflows/enhancedWorkflowService.ts` imports `eventBus` from `lib/services/event-bus` (server-only).

Impact:
- Bundling/runtime risks if workflow code runs client-side.

Fix:
- Ensure workflow orchestration runs server-side only or uses event-store in-process bus for client-safe paths.

---

## Page-level gaps (what blocks employees using the system)

From `reports/APP_PAGE_SCORECARD.md`:

- **99** pages using mock data
- **94** pages with requiresAuth mismatch (security)
- **15** pages calling APIs that appear to lack auth middleware while the route requires auth

The actionable execution list is: `reports/APP_PAGE_BACKLOG.md`.

---

## What “bulletproof interconnection” means (Definition of Done per capability)

For a page/feature to be “bulletproof” in BlueDXP terms, it must satisfy:

- **L5** UI: validated inputs, correct empty/loading/error states, accessible, no dead controls.
- **Lx** Security: authenticated + RBAC enforced, tenant scoping enforced.
- **L3** Service: business logic in services (not in the page), typed contracts in `types/**`.
- **L2** Orchestration: workflows/sagas used for multi-step business processes.
- **L1** Events: publish domain events for state changes (correlationId included).
- **L0** Evidence: immutable audit/evidence for critical actions (lineage tracked).
- **Integration**: adapters used for external systems, retries/circuit breakers for calls.
- **Observability**: structured logs + error capture + metrics on key paths.

---

## Next actions (what we do next, in order)

1) **Lock down security foundation**
   - Clear “Queue A” in `reports/APP_PAGE_BACKLOG.md` (auth gaps)
   - Ensure the APIs those pages use enforce `apiAuthMiddleware`

2) **Pick the operate-first slice**
   - Your top ~10 pages employees need daily
   - Harden these fully end-to-end

3) **Replace mock data last**
   - Only after UI + API contract + service layer are ready

4) **Persist the ledgers**
   - Add database-backed persistence for event store + evidence store

---

## Requested next input from you

To tailor the mapping to the real business-critical flows, tell me:

- The **top 10 pages** employees must use first
- Whether go-live is **single tenant first** or **multi-tenant from day 1**

Then we will produce the module-by-module and flow-by-flow “interconnection checklist”.


