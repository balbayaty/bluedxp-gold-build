# Copilot “Most Advanced in the World” Roadmap (BlueDXP / Hazalyze)

This is the next-step plan to evolve Hazalyze Copilot into a **platform-native, governed, agentic intelligence layer**—not just chat.

It builds on what now exists in this repo:
- Multi-tenant + RBAC API Gateway
- Event Bus / CQRS primitives
- Evidence Packets + chain of custody
- Knowledge Base (vector search + domain KBs)
- OCR service + MSDS extraction adapters
- Integration adapters (customs, transportation, etc.)

---

## What’s Implemented Now (Foundation)

### 1) Copilot Runtime (Tooling Layer)

Copilot now has a “tool layer” that is:
- **Server-governed** (tools live server-side)
- **RBAC-controlled** per tool (moduleId/featureId/action)
- **Tenant-safe** by design
- **Auditable** (tools can create evidence + publish events)

Key files:
- Tool registry + built-ins:
  - `lib/services/copilot/tools/toolRegistry.ts`
  - `lib/services/copilot/tools/builtins.ts`
  - `lib/services/copilot/tools/toolExecutionService.ts`
- Tool APIs:
  - `GET /api/copilot/tools` → list
  - `POST /api/copilot/tools/execute` → execute (RBAC + confirmation gate)

### 2) First-class Tools Added (Examples)

- `kb.search` (RAG building block)
- `ocr.extract_pdf_text` (OCR pipeline entry)
- `msds.ingest_from_text` (extract + store + emit msds.* events)
- `evidence.generate_packet` (court-ready evidence)

### 3) UI wiring (safe, explicit mode)

The Copilot UI supports an explicit tool command:

`/tool <toolId> <json>`

Example:

`/tool kb.search {"query":"tenant isolation","limit":5}`

This keeps behavior safe while we move toward full “LLM tool calling”.

---

## Next: Make it “World-Class”

### A) True Tool Calling (LLM function calling)

Upgrade the prompt + parser so the model can propose structured tool calls like:
- `tool_call` blocks with `toolId` and JSON arguments
- Server validates, requests approval when needed
- Executes and returns tool output back into the conversation automatically

Why this matters:
- Eliminates brittle text parsing
- Enables multi-step workflows (“agents”)
- Allows deterministic safety gates

### B) Guard Rails / Policy Engine (Enterprise)

Add a central Policy Engine that controls:
- **Allow/deny tool usage** per role, tenant, module, feature
- **Scopes** (OWN / ASSIGNED_WAREHOUSES / TENANT)
- **Risk policy** by tool:
  - Read-only (auto)
  - Sensitive (confirm)
  - Destructive (confirm + 2-person rule + evidence packet)
- **Rate limits** per tool and per tenant
- **Data redaction** for PII/secrets

### C) Evidence-First Agentic Actions

For any non-trivial action:
- Create evidence record before/after
- Link events + inputs/outputs
- Generate packet automatically for compliance-sensitive actions

### D) Deep Module Tool Coverage (Phase plan)

Start with the highest ROI modules:
1. **MSDS/OCR**: upload → OCR → extract → compliance check → store → notify
2. **Transportation**: route planning, compliance, documents, incidents
3. **Integrations**: test connection, sync jobs, webhooks, EDI transforms
4. **Warehouse**: receiving workflows, cycle counting, picks, exceptions

Each tool must be integration-first:
- Typed inputs/outputs
- Audit + events
- Tenant safe
- RBAC checked

### E) Memory / RAG Everywhere

Use Knowledge Base domains to provide context:
- KB_WMS, KB_TMS, KB_MSDS, KB_COMP, KB_ARCH

Add:
- Automatic retrieval on each prompt
- Citations (entry IDs) in responses
- Feedback loop into KB

---

## What You Can Do Right Now (Non-coder checklist)

1. Open `/settings/ai` and set an API key.
2. Open any page and open Copilot.
3. Try:
   - `/tool kb.search {"query":"MSDS lifecycle stages","limit":5}`
   - `/tool evidence.generate_packet {"entityType":"MSDS","entityId":"msds-123","claimType":"compliance"}`

---

## Recommended Next Decision (1 question)

Which module should Copilot become “best in the world” at first?
- MSDS/OCR
- Transportation/Customs
- Warehouse Operations
- Integrations (ERP/EDI/Webhooks)

Pick one and we’ll build the full agentic workflow end-to-end.


