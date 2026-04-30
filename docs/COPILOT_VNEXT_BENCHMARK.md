# BlueDXP Copilot vNext — “Best-in-class” Benchmark + Build Plan

This document defines how we benchmark BlueDXP Copilot against the most capable copilots (coding + enterprise + workflow copilots) and how we build a unified system that matches or exceeds them **inside BlueDXP**.

## What “best” means for BlueDXP

For BlueDXP, “most intelligent copilot” is not only the model. It is the product system:
- **Tooling**: deep platform tools + safe execution
- **Governance**: RBAC + tenant isolation + approvals
- **Evidence**: audit trail, lineage, explainability
- **Reliability**: resilience under partial modules / offline / DB issues
- **UX**: minimal friction, clear “what works now”

## Current vNext upgrades implemented

1. **Session persistence** (tenant+user scoped) for Copilot chat.
2. **Tool discovery** (server-governed tool catalog).
3. **Guided Create workbench** for real workflows.
4. **Planner → Approval → Execute**:
   - AI proposes tool calls using `[TOOL_CALL: ...] { ... }` or ` ```tool_call ...``` `
   - UI shows approval cards, user clicks **Run**
   - Tool execution is governed server-side and generates evidence/events

## Benchmark Framework (practical)

### A) Workflow Completion Benchmark (primary)
Pick the top workflows for your business and measure:
- **End-to-end success rate**
- **Time to completion**
- **Number of user interactions**
- **Error recovery rate**

Recommended starting workflows (DB-integrated today):
- Transportation/Customs: declaration → required docs → attach doc → submit (event queue) → evidence packet
- MSDS: OCR → extract → ingest → evidence + events
- Proposals/RFQ: generate/modify proposal → store → track → evidence

### B) Governance Benchmark
Validate:
- RBAC enforcement (role-based allow/deny)
- Tenant isolation (no cross-tenant data)
- Approval gates for sensitive operations
- Audit completeness (every action produces evidence/event)

### C) Intelligence Benchmark
Measure:
- Hallucination rate (claims without evidence)
- Correct tool selection (tool choice accuracy)
- Explanation quality (why it did something)

### D) UX Benchmark
Measure:
- “Can I do it without knowing the system?” (guided create)
- “Can I recover from mistakes?” (undo/rollback patterns where supported)
- “Does it show me what’s real vs coming soon?”

## Next build milestones (to reach “world-class”)

1. **Workflow Packs** (Mission layer)
   - each workflow is a state machine
   - step-by-step UI + success criteria + evidence checkpoints

2. **Agent Orchestration**
   - multiple specialized agents (Customs, MSDS, WMS, Finance)
   - planner selects agent + tools

3. **Server-side session + evidence timeline**
   - store conversation + tool runs in DB
   - timeline view per tenant/user

4. **Integration adapters**
   - event subscribers for submission events
   - adapter registry for external systems (customs portals, ERP, carriers)


