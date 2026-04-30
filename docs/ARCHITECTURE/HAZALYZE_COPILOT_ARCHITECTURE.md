# Hazalyze Copilot Architecture (BlueDXP Platform)

This document explains **how Hazalyze Copilot is meant to work end-to-end** in a multi-module, multi-tenant BlueDXP platform.

It is written to be practical (what runs where) and enterprise-safe (RBAC, tenant isolation, auditability, integration-first).

---

## What “Copilot Connected” Means (Definition of Done)

Copilot is considered **fully connected** when:

- **UI** can send a chat message and receive a real model response (OpenAI/Anthropic).
- **API proxy** handles provider calls server-side (no CORS failures, no direct browser-to-LLM calls required).
- **Tenant context** is enforced on every request (multi-tenant from day 1).
- **RBAC** is enforced (only authorized users can execute AI actions).
- **Observability** is present (events for AI usage, rate limits, errors).

---

## Layered Architecture (Deep Architecture)

### Presentation Layer (UI)

- **Copilot UI**: `components/HazalyzeCopilot.tsx`
  - Context suggestions based on route (`/asn`, `/warehouse`, etc.)
  - Calls `utils/aiClient.ts` (not the mock service) for real AI
  - Optional screen control via:
    - `lib/services/copilot/screenControl.ts`
    - `lib/services/copilot/actionExecutor.ts`

### Business Logic Layer (Service / Orchestration)

- **Core Copilot Service**: `lib/services/copilot/copilotService.ts`
  - Maintains conversation history (bounded)
  - Builds system prompt via `buildSystemPrompt()`
  - Calls `callAI()` (provider auto)
  - Redacts obvious key patterns from history (defense-in-depth)

This service is used by other modules (example):
- `lib/services/wms/copilotIntegration.ts` (WMS integration)

### Infrastructure Layer (API / Gateway)

- **AI Chat Proxy API**: `app/api/ai/chat/route.ts`
  - Enforces tenant context + RBAC via `withAPIGateway()`
  - Validates payload (messages, sizes, bounds)
  - Applies lightweight rate limiting (tenant+user/ip)
  - Calls OpenAI/Anthropic server-side
  - Publishes event `ai.chat.completed` to the Event Bus (privacy-conscious payload)

### External Integration Layer (Providers)

Providers supported today via `utils/aiClient.ts` + `/api/ai/chat`:

- **OpenAI** (Chat Completions API)
- **Anthropic** (Messages API)

Provider selection is **auto** by default:
- If OpenAI key exists → uses OpenAI
- Else if Anthropic key exists → uses Anthropic
- Else → mock/demo response (client utilities), or API returns “No provider configured”

---

## Multi-Tenant & RBAC Enforcement

### Tenant Context

Tenant context is enforced at the API layer (gateway middleware). The client must include `x-tenant-id`.

We standardize this through:
- `utils/apiFetch.ts` which automatically attaches:
  - `x-tenant-id`
  - `x-user-id`

### Permissions

The AI API route uses:
- `moduleId: 'ai'`
- `featureId: 'ai.intelligent_orchestration'`
- `action: 'execute'`

So the permission system can centrally decide who can run Copilot.

---

## Auditability & Event-Driven Integration

### Event Bus

The AI route publishes:
- `ai.chat.completed`

Use cases:
- Cross-module analytics (AI adoption per tenant)
- Governance and compliance workflows
- Alerting on unusual usage (security)

### Evidence & Lineage (Recommended Next Enhancement)

For high-compliance workflows, consider persisting “AI decisions” as **evidence packets**:
- Evidence Service: `lib/services/evidence/`
- Store only redacted prompts + key metadata + model outputs where safe

---

## Security Model (Practical Defaults)

### API Keys

Recommended:
- Use server-side environment variables:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`

Supported for development convenience:
- Client-supplied keys (from Settings UI) are sent as headers:
  - `x-openai-key`
  - `x-anthropic-key`

Production safety:
- Client-supplied keys are blocked unless:
  - `ALLOW_CLIENT_SUPPLIED_AI_KEYS=true`

---

## Step-by-Step Setup (No Coding Experience)

### 1) Start the app

- Run:
  - `npm install`
  - `npm run dev`

The dev server runs on port **3002** (see `package.json`).

### 2) Add your AI key

Option A (recommended): environment variables
- Copy `env.example` → `.env.local`
- Put your `OPENAI_API_KEY=` (or `ANTHROPIC_API_KEY=`) into `.env.local`
- Restart `npm run dev`

Option B (easy dev): Settings UI
- Open: `/settings/ai`
- Paste your key and click **Save API Keys**

### 3) Verify connection

On `/settings/ai`:
- Use **Test AI Connection**
- If it returns a real response, Copilot is connected.

### 4) Use Copilot

Open any module page and click the floating Copilot button.

---

## Current Known Gaps / Next Work

- **Streaming**: UI supports simulated streaming; true SSE streaming can be added to `/api/ai/chat`.
- **Long-term memory**: connect Copilot to `knowledge-base` service (retrieval-augmented generation).
- **Action approvals**: destructive screen-control actions should require explicit approvals (policy + UI).
- **Provider adapters**: formalize adapters under `lib/adapters/ai/` for more providers (Gemini, Azure OpenAI, local models).


