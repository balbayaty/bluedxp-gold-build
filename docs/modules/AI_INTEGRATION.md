# AI Integration (Copilot + Providers) — BlueDXP / Hazalyze

This is the practical integration guide for enabling AI across the platform.

---

## What’s Implemented

- **Copilot UI**: `components/HazalyzeCopilot.tsx`
- **AI client utilities**: `utils/aiClient.ts`
- **Tenant-safe fetch helper**: `utils/apiFetch.ts`
- **Server-side proxy route**: `app/api/ai/chat/route.ts`
- **Service abstraction**: `lib/services/copilot/copilotService.ts`

---

## Supported Providers

- **OpenAI**
- **Anthropic**

Provider selection is `auto` by default: OpenAI if key exists, otherwise Anthropic.

---

## Configuration

### Recommended (server-side)

Use `.env.local`:

- `OPENAI_API_KEY=...`
or
- `ANTHROPIC_API_KEY=...`

### Dev convenience (client-supplied keys)

You can save keys via UI:
- Go to `/settings/ai`
- Save key(s)

In production, client-supplied keys are blocked unless you explicitly set:
- `ALLOW_CLIENT_SUPPLIED_AI_KEYS=true`

---

## Multi-Tenant Requirements

All AI API calls require a tenant context.

Client requests should go through:
- `utils/apiFetch.ts`

It attaches:
- `x-tenant-id`
- `x-user-id`

---

## Troubleshooting (Quick)

- **CORS / Failed to fetch**
  - This is usually caused by calling the provider directly from the browser.
  - Ensure `/api/ai/chat` is being used (it’s the default path in `utils/aiClient.ts`).

- **Tenant context required**
  - Ensure your requests use `apiFetch()`, or you’ve set a tenant in localStorage (`current-tenant`), or you’re in dev mode (fallback tenant).

- **API key not found**
  - Add key in `/settings/ai` (dev), or set `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` in `.env.local` and restart.


