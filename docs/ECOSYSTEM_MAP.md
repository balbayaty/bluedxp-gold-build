# BlueDXP Ecosystem Map (Deep, end-to-end)

This document maps the **real code** structure of the platform (not just the idea):

- **L5 Experience**: `app/**`, `components/**`, `mobile/**`
- **Lx Cross-cutting**: auth/RBAC/tenant, observability, config
- **L3 Domain Modules**: `lib/modules/**` + `lib/services/<domain>/**`
- **L2 Orchestration**: workflows + sagas + process lifecycle
- **L1 Event Mesh**: event bus + event store
- **L0 Evidence Ledger**: evidence service + packets + lineage/integrity
- **L4 AI & Intelligence**: agents + knowledge base + ML registry + copilot

## L5 → L0: The actual request flow (what should happen)

1) **User action** in UI page (`app/**/page.tsx`)
2) **Lx security** validates:
   - authenticated user
   - RBAC permissions
   - tenant/customer/warehouse scope
3) **Domain service** performs business logic (`lib/services/<domain>/**`)
4) **Orchestration** coordinates multi-step flows (workflow/saga)
5) **Event sourcing / event publishing** records state change to L1
6) **Evidence ledger** records immutable evidence chain to L0
7) **Async AI** analyses (agents/knowledge base) and publishes insights/events
8) **Real-time** pushes updates (websocket/webhooks/notifications)

The reference architecture doc is: `docs/ARCHITECTURE/LAYER_INTERACTION_ARCHITECTURE.md`.

## Lx Cross-cutting Layer (Security / Multi-tenancy / Observability)

### UI auth context (current)
- **Auth context/provider**: `contexts/AuthContext.tsx`
  - Current implementation is **localStorage + mock login** (development-friendly).

### API auth middleware (current)
- **API auth middleware**: `middleware/apiAuth.ts`
  - Supports dev-mode fallback + mock contexts.
  - Used by many API routes under `app/api/**`.

### Observability (logging/metrics/tracing/error tracking)
- **Central exports**: `lib/services/observability/index.ts`
- **Implementations**:
  - `lib/services/observability/logger.ts`
  - `lib/services/observability/metrics.ts`
  - `lib/services/observability/tracing.ts`
  - `lib/services/observability/errorTracking.ts`

## L1 Event Mesh (Event Bus + Event Store)

### Event Store (CQRS + in-memory projections)
- **Entry point**: `lib/services/event-store/index.ts`
  - In-memory append-only event store + snapshots
  - Command bus, query bus
  - In-memory projection store + projection manager
- **Schema registry**: `lib/services/event-store/schemaRegistry.ts`
  - Schema version registry (validation currently stubbed)

### Event Bus (server-only, RabbitMQ optional)
- **Server-only service**: `lib/services/event-bus/index.ts`
  - Express endpoint `/events` publishes to RabbitMQ exchange (if available)
  - Fallback behavior if RabbitMQ libs not present

> Important: there are **two “event bus” concepts**:
> - `lib/services/event-store` has an in-process `eventBus` tied to the event store
> - `lib/services/event-bus` is an express/RabbitMQ service

## L0 Evidence Ledger (Immutable audit/evidence, lineage, integrity)

- **Entry point**: `lib/services/evidence/index.ts`
- **Core service**: `lib/services/evidence/evidenceService.ts`
  - Evidence CRUD + lineage + integrity verification + custody chain
  - Current store is **in-memory** (explicitly marked to replace with DB)
- **Packets**:
  - `lib/services/evidence/packet-service.ts`
  - `lib/services/evidence/packet-generator.ts`
  - `lib/services/evidence/packet-types.ts`
- **Integrity structures**:
  - `lib/services/evidence/merkle-tree.ts`
  - `lib/services/evidence/contradiction-detector.ts`

## L2 Orchestration (Workflow + Saga + Process Lifecycle)

### Sagas (distributed transaction orchestration)
- **Saga orchestrator**: `lib/services/saga/sagaOrchestrator.ts`
  - Executes steps + compensation (rollback)
  - Retry/backoff support

### Workflows
- **Enhanced workflow service**: `lib/services/workflows/enhancedWorkflowService.ts`
  - Templates, instances, SLA tracking, benchmarks
  - Publishes workflow events
- **Workflow base**: `lib/services/process-lifecycle/workflow/workflowService` (re-exported via `lib/services/workflows/index.ts`)

## L4 AI & Intelligence (Agents / KB / Copilot)

### Agents
- **Agent orchestrator**: `lib/services/agents/agentOrchestrator.ts`
  - Capability routing + consensus + learning
  - Shares high-confidence learnings to the knowledge base
- **Agent memory**: `lib/services/agents/agentMemory.ts`
- **Agent registry**: `lib/services/agents/specializedAgents.ts` + `lib/services/agents/horizontal/**` + `lib/services/agents/vertical/**`

### Knowledge base
- Used by agent orchestrator through: `lib/services/knowledge-base` (imported via `../knowledge-base` in agent orchestrator)

## L3 Domain modules (Plugin architecture)

### Module registry + registration
- **Registry**: `lib/modules/registry.ts`
- **All modules registered here**: `lib/modules/index.ts`
- Individual module definitions: `lib/modules/*.ts`
  - routes (path → component)
  - services (service paths)
  - feature flags, settings, APIs (optional)

## Integrations & Adapters (External ecosystem connectivity)

Integration adapters are grouped under:

- `lib/adapters/customs`
- `lib/adapters/erpnext`
- `lib/adapters/facility`
- `lib/adapters/government`
- `lib/adapters/process-lifecycle`
- `lib/adapters/procurement`
- `lib/adapters/rabet`
- `lib/adapters/transportation`

## System startup / bootstrapping (what gets initialized)

- **Service initializer**: `lib/services/integration/serviceInitializer.ts`
  - Initializes database client (if available) and injects into services
  - Initializes cache/redis, i18n, reporting scheduler (server-side), integrations (Kafka/MinIO/OpenSearch) when enabled
  - Initializes truth engine + certain lifecycle integrations
- **Root layout** defers initialization: `app/layout.tsx`

## How this connects to “pages”

Your page-by-page audit reports are in:

- `reports/APP_PAGE_SCORECARD.md` (summary)
- `reports/APP_PAGE_SCORECARD.json` (full detail)
- `reports/APP_PAGE_BACKLOG.md` (execution backlog)

Those are the “L5 surface map”. The next step is to connect each page to:

- its module route definition (ownership)
- the API routes it calls
- the services those API routes call
- the events/evidence they should emit

That deeper mapping is tracked in `docs/MODULE_GAP_REPORT.md` and will be automated further.


