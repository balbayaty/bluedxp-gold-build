/**
 * AI Chat Proxy API
 *
 * Why this exists:
 * - Browser calls to OpenAI/Anthropic are typically blocked by CORS and leak API keys.
 * - We proxy requests server-side to keep the platform "integration-first" and secure-by-default.
 *
 * Security notes:
 * - Prefer server-side keys via env (OPENAI_API_KEY / ANTHROPIC_API_KEY).
 * - In development we allow client-supplied keys (x-openai-key / x-anthropic-key) to make setup easy.
 * - In production, client-supplied keys are blocked unless ALLOW_CLIENT_SUPPLIED_AI_KEYS=true.
 *
 * Platform concerns:
 * - Enforces tenant context (multi-tenant from day 1)
 * - Enforces RBAC via API Gateway middleware
 * - Adds basic input validation + lightweight rate limiting
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { checkRateLimit } from "@/lib/services/api/rateLimiter";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

type Provider = "openai" | "anthropic" | "auto";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  provider?: Provider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  messages: ChatMessage[];
};

function jsonError(message: string, status = 400, details?: unknown) {
  const payload: Record<string, unknown> = { error: message };
  if (process.env.NODE_ENV !== "production" && details !== undefined) {
    payload.details = details;
  }
  return NextResponse.json(payload, { status });
}

function getClientIP(request: NextRequest): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function isClientSuppliedKeysAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return (
    (process.env.ALLOW_CLIENT_SUPPLIED_AI_KEYS || "").toLowerCase() === "true"
  );
}

function isValidAPIKey(
  key: string | null | undefined,
  prefix: string,
): boolean {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  // Reject placeholder/template keys
  if (
    trimmed.includes("your-") ||
    trimmed.includes("your-key") ||
    trimmed.includes("placeholder") ||
    trimmed.includes("example")
  ) {
    return false;
  }
  // Must start with prefix and be at least 20 chars
  return trimmed.startsWith(prefix) && trimmed.length >= 20;
}

function getProviderKey(
  request: NextRequest,
  provider: Exclude<Provider, "auto">,
): string | null {
  // ALWAYS prefer server-side keys from .env.local (most secure)
  if (provider === "openai") {
    // 1. Server-side env var (preferred - not exposed to browser)
    const serverKey = process.env.OPENAI_API_KEY;
    if (isValidAPIKey(serverKey, "sk-")) {
      console.log("[AI Chat] ✅ Using OPENAI_API_KEY from server environment");
      return serverKey!.trim();
    } else if (serverKey) {
      console.error(
        '[AI Chat] ❌ OPENAI_API_KEY in .env.local is a placeholder! Replace "sk-your-openai-api-key-here" with your real key.',
      );
      return null;
    }
    // 2. Public env var (less secure but works)
    const publicKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (isValidAPIKey(publicKey, "sk-")) {
      console.log(
        "[AI Chat] ✅ Using NEXT_PUBLIC_OPENAI_API_KEY from environment",
      );
      return publicKey!.trim();
    } else if (publicKey) {
      console.error(
        "[AI Chat] ❌ NEXT_PUBLIC_OPENAI_API_KEY is a placeholder! Replace with your real key.",
      );
      return null;
    }
    // 3. Client-supplied key (only if allowed in dev)
    if (isClientSuppliedKeysAllowed()) {
      const clientKey = request.headers.get("x-openai-key");
      if (isValidAPIKey(clientKey, "sk-")) {
        console.log("[AI Chat] ⚠️ Using client-supplied OpenAI key (dev mode)");
        return clientKey!.trim();
      }
    }
    console.warn(
      "[AI Chat] ❌ No valid OpenAI API key found. Check .env.local file has OPENAI_API_KEY=sk-proj-... (not sk-your-...)",
    );
    return null;
  }

  if (provider === "anthropic") {
    // 1. Server-side env var (preferred - not exposed to browser)
    const serverKey = process.env.ANTHROPIC_API_KEY;
    if (isValidAPIKey(serverKey, "sk-ant-")) {
      console.log(
        "[AI Chat] ✅ Using ANTHROPIC_API_KEY from server environment",
      );
      return serverKey!.trim();
    } else if (serverKey) {
      console.error(
        '[AI Chat] ❌ ANTHROPIC_API_KEY in .env.local is a placeholder! Replace "sk-ant-your-..." with your real key.',
      );
      return null;
    }
    // 2. Public env var (less secure but works)
    const publicKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    if (isValidAPIKey(publicKey, "sk-ant-")) {
      console.log(
        "[AI Chat] ✅ Using NEXT_PUBLIC_ANTHROPIC_API_KEY from environment",
      );
      return publicKey!.trim();
    } else if (publicKey) {
      console.error(
        "[AI Chat] ❌ NEXT_PUBLIC_ANTHROPIC_API_KEY is a placeholder! Replace with your real key.",
      );
      return null;
    }
    // 3. Client-supplied key (only if allowed in dev)
    if (isClientSuppliedKeysAllowed()) {
      const clientKey = request.headers.get("x-anthropic-key");
      if (isValidAPIKey(clientKey, "sk-ant-")) {
        console.log(
          "[AI Chat] ⚠️ Using client-supplied Anthropic key (dev mode)",
        );
        return clientKey!.trim();
      }
    }
    console.warn(
      "[AI Chat] ❌ No valid Anthropic API key found. Check .env.local file has ANTHROPIC_API_KEY=sk-ant-... (not sk-ant-your-...)",
    );
    return null;
  }

  return null;
}

function normalizeOpenAIModel(model?: string): string {
  // The repo currently defaults to an older preview model name; map to a safe modern default.
  if (!model) return "gpt-4o-mini";
  if (model === "gpt-4-turbo-preview") return "gpt-4o-mini";
  return model;
}

function redactSecrets(text: string): string {
  if (!text) return text;
  const openaiRedacted = text.replace(
    /\bsk-[A-Za-z0-9_-]{20,}\b/g,
    "sk-***REDACTED***",
  );
  const anthropicRedacted = openaiRedacted.replace(
    /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
    "sk-ant-***REDACTED***",
  );
  return anthropicRedacted;
}

function validateBody(
  body: any,
): { ok: true; value: ChatRequestBody } | { ok: false; error: NextResponse } {
  if (!body || typeof body !== "object")
    return { ok: false, error: jsonError("Invalid JSON body") };
  if (!Array.isArray(body.messages) || body.messages.length === 0)
    return { ok: false, error: jsonError("messages is required") };

  if (body.messages.length > 50)
    return { ok: false, error: jsonError("messages too long (max 50)") };

  const messages: ChatMessage[] = [];
  for (const m of body.messages) {
    if (!m || typeof m !== "object")
      return { ok: false, error: jsonError("Invalid message") };
    if (!["system", "user", "assistant"].includes(m.role))
      return { ok: false, error: jsonError("Invalid message.role") };
    if (typeof m.content !== "string")
      return { ok: false, error: jsonError("Invalid message.content") };
    if (m.content.length > 50_000)
      return {
        ok: false,
        error: jsonError("Message too large (max 50k chars)"),
      };
    messages.push({ role: m.role, content: m.content });
  }

  const provider: Provider = ["openai", "anthropic", "auto"].includes(
    body.provider,
  )
    ? body.provider
    : "auto";
  const temperature =
    typeof body.temperature === "number"
      ? Math.min(2, Math.max(0, body.temperature))
      : 0.7;
  const maxTokens =
    typeof body.maxTokens === "number"
      ? Math.min(4000, Math.max(1, Math.floor(body.maxTokens)))
      : 2000;
  const model = typeof body.model === "string" ? body.model : undefined;

  return {
    ok: true,
    value: { provider, model, temperature, maxTokens, messages },
  };
}

async function callOpenAI(input: {
  apiKey: string;
  model?: string;
  temperature: number;
  maxTokens: number;
  messages: ChatMessage[];
}): Promise<{
  content: string;
  tokensUsed?: number;
  model?: string;
  finishReason?: string;
}> {
  const model = normalizeOpenAIModel(input.model);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: input.messages,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg =
      err?.error?.message || err?.message || `HTTP ${response.status}`;
    throw new Error(`OpenAI API error: ${msg}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    tokensUsed: data.usage?.total_tokens,
    model: data.model,
    finishReason: data.choices?.[0]?.finish_reason,
  };
}

async function callAnthropic(input: {
  apiKey: string;
  model?: string;
  temperature: number;
  maxTokens: number;
  messages: ChatMessage[];
}): Promise<{
  content: string;
  tokensUsed?: number;
  model?: string;
  finishReason?: string;
}> {
  const model = input.model || "claude-3-5-sonnet-20241022";
  const system = input.messages.find((m) => m.role === "system")?.content;
  const conversation = input.messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: input.maxTokens,
      temperature: input.temperature,
      system,
      messages: conversation.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg =
      err?.error?.message || err?.message || `HTTP ${response.status}`;
    throw new Error(`Anthropic API error: ${msg}`);
  }

  const data = await response.json();
  return {
    content: data.content?.[0]?.text || "",
    tokensUsed:
      typeof data.usage?.input_tokens === "number" &&
      typeof data.usage?.output_tokens === "number"
        ? data.usage.input_tokens + data.usage.output_tokens
        : undefined,
    model: data.model,
    finishReason: data.stop_reason,
  };
}

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    // Tenant context is enforced by apiAuthMiddleware inside API gateway, but keep a defensive check.
    if (!context.tenantId) return jsonError("Tenant context required", 400);

    // Diagnostic: Log available env vars on first request (helps debug .env.local loading)
    if (!(global as any).__aiEnvChecked) {
      const openaiKey =
        process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      const anthropicKey =
        process.env.ANTHROPIC_API_KEY ||
        process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
      const hasOpenAI = !!openaiKey;
      const hasAnthropic = !!anthropicKey;
      const isOpenAIPlaceholder = openaiKey
        ? openaiKey.includes("your-") ||
          openaiKey.includes("placeholder") ||
          openaiKey.includes("example")
        : false;
      const isAnthropicPlaceholder = anthropicKey
        ? anthropicKey.includes("your-") ||
          anthropicKey.includes("placeholder") ||
          anthropicKey.includes("example")
        : false;

      console.log("[AI Chat] Environment check:");
      if (hasOpenAI) {
        if (isOpenAIPlaceholder) {
          console.warn(
            `  - OPENAI_API_KEY: ⚠️ PLACEHOLDER DETECTED (sk-your-...) - Replace with real key in .env.local`,
          );
        } else {
          console.log(
            `  - OPENAI_API_KEY: ✅ Found (${openaiKey.substring(0, 10)}...)`,
          );
        }
      } else {
        console.warn(`  - OPENAI_API_KEY: ❌ Missing`);
      }
      if (hasAnthropic) {
        if (isAnthropicPlaceholder) {
          console.warn(
            `  - ANTHROPIC_API_KEY: ⚠️ PLACEHOLDER DETECTED (sk-ant-your-...) - Replace with real key in .env.local`,
          );
        } else {
          console.log(
            `  - ANTHROPIC_API_KEY: ✅ Found (${anthropicKey.substring(0, 15)}...)`,
          );
        }
      } else {
        console.warn(`  - ANTHROPIC_API_KEY: ❌ Missing`);
      }
      if (!hasOpenAI && !hasAnthropic) {
        console.warn(
          "[AI Chat] ⚠️ No AI keys found in environment. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env.local and restart dev server.",
        );
      } else if (isOpenAIPlaceholder || isAnthropicPlaceholder) {
        console.warn(
          "[AI Chat] ⚠️ Placeholder keys detected! Replace them with real API keys in .env.local and restart dev server.",
        );
      }
      (global as any).__aiEnvChecked = true;
    }

    // Lightweight rate limit by tenant+user/ip (helps even when not using API keys)
    const identifier = `${context.tenantId}:${context.userId || getClientIP(request)}:ai-chat`;
    const rl = checkRateLimit(identifier, { requestsPerMinute: 30 }, "minute");
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          reason: rl.reason,
          resetAt: rl.resetAt?.toISOString(),
        },
        { status: 429 },
      );
    }

    const raw = await request.json().catch(() => null);
    const parsed = validateBody(raw);
    if (!parsed.ok) return parsed.error;

    const {
      provider: requestedProvider,
      model,
      temperature,
      maxTokens,
      messages,
    } = parsed.value;

    // Decide provider
    let provider: Exclude<Provider, "auto"> = "openai";
    if (requestedProvider === "anthropic") provider = "anthropic";
    if (requestedProvider === "auto") {
      // Check server-side env vars FIRST (preferred)
      const openaiEnvKey =
        process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      const anthropicEnvKey =
        process.env.ANTHROPIC_API_KEY ||
        process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

      if (openaiEnvKey) {
        provider = "openai";
      } else if (anthropicEnvKey) {
        provider = "anthropic";
      } else {
        // Fallback to checking client-supplied keys (if allowed)
        const openaiKey = getProviderKey(request, "openai");
        const anthropicKey = getProviderKey(request, "anthropic");
        if (openaiKey) provider = "openai";
        else if (anthropicKey) provider = "anthropic";
        else
          return jsonError(
            "No AI provider configured. Add API keys to .env.local file (OPENAI_API_KEY or ANTHROPIC_API_KEY) or in Settings > AI & Agents.",
            400,
          );
      }
    }

    // Get API key - prefer server-side env vars
    const apiKey = getProviderKey(request, provider);
    if (!apiKey) {
      const envVarName =
        provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
      const keyPrefix = provider === "openai" ? "sk-proj-" : "sk-ant-";
      return jsonError(
        `Missing or invalid ${provider} API key.\n\n` +
          `Your .env.local file has a PLACEHOLDER key (sk-your-...).\n\n` +
          `Fix it:\n` +
          `1. Open .env.local in your project root\n` +
          `2. Find: ${envVarName}=sk-your-...\n` +
          `3. Replace with your REAL key: ${envVarName}=${keyPrefix}your-actual-key-here\n` +
          `4. Get your key from: ${provider === "openai" ? "https://platform.openai.com/account/api-keys" : "https://console.anthropic.com/settings/keys"}\n` +
          `5. Restart the dev server (npm run dev)`,
        401,
      );
    }

    const result =
      provider === "openai"
        ? await callOpenAI({ apiKey, model, temperature, maxTokens, messages })
        : await callAnthropic({
            apiKey,
            model,
            temperature,
            maxTokens,
            messages,
          });

    // Publish a lightweight, privacy-conscious event for observability / cross-module awareness.
    // We do NOT store API keys; we also avoid storing full prompts in event payloads.
    try {
      const lastUser =
        [...messages].reverse().find((m) => m.role === "user")?.content || "";
      await eventBus.publish(
        createEvent(
          "ai.chat.completed",
          context.tenantId,
          "Tenant",
          {
            provider,
            model: result.model || model,
            tokensUsed: result.tokensUsed,
            finishReason: result.finishReason,
            promptPreview: redactSecrets(lastUser).slice(0, 500),
          },
          1,
          { tenantId: context.tenantId, userId: context.userId },
        ),
      );
    } catch (e) {
      // Never block AI response on telemetry
      console.warn("Failed to publish ai.chat.completed event:", e);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("AI chat proxy error:", error);
    return jsonError(
      "Failed to process AI request",
      500,
      error instanceof Error ? error.message : error,
    );
  }
}

export const POST = withAPIGateway(handler, {
  moduleId: "ai",
  featureId: "ai.intelligent_orchestration",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
