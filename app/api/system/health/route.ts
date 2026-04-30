import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { ocrService } from "@/lib/services/ocr/ocrService";
import { aiService } from "@/lib/services/ai/chemcheckService";
import { getDatabaseClient } from "@/lib/database/client";
import { createClient as createRedisClient } from "redis";

// Force Node.js runtime (this route uses Node-only deps like redis client).
export const runtime = "nodejs";

type HealthStatus = "ok" | "degraded" | "down";

function boolEnv(name: string): boolean {
  return !!process.env[name] && String(process.env[name]).trim().length > 0;
}

async function checkRedis(): Promise<{
  status: HealthStatus;
  details?: string;
}> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return { status: "degraded", details: "REDIS_URL not set" };

  const client = createRedisClient({ url: redisUrl });
  try {
    await client.connect();
    await client.ping();
    return { status: "ok" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: "down", details: msg };
  } finally {
    try {
      await client.disconnect();
    } catch {
      // ignore
    }
  }
}

async function checkDatabase(): Promise<{
  status: HealthStatus;
  details?: string;
}> {
  // We treat "not configured" as degraded (app can run with in-memory fallback)
  const configured = boolEnv("DATABASE_URL") || boolEnv("DATABASE_TYPE");
  if (!configured)
    return {
      status: "degraded",
      details: "DATABASE_URL/DATABASE_TYPE not set",
    };

  try {
    const db = getDatabaseClient();
    await db.connect();
    const ok = await db.healthCheck();
    return ok
      ? { status: "ok" }
      : { status: "down", details: "healthCheck returned false" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: "down", details: msg };
  }
}

export async function GET(req: NextRequest) {
  // Security posture:
  // - Production: require auth/tenant context (avoid exposing operational details).
  // - Development: allow unauthenticated calls for quick local troubleshooting.
  const auth = await apiAuthMiddleware(req);
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && (!auth.authorized || !auth.context)) {
    return (
      auth.response ||
      NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    );
  }

  const activeProvider = aiService.getActiveProvider();
  const openaiConfigured =
    boolEnv("OPENAI_API_KEY") || boolEnv("NEXT_PUBLIC_OPENAI_API_KEY");
  const anthropicConfigured =
    boolEnv("ANTHROPIC_API_KEY") || boolEnv("NEXT_PUBLIC_ANTHROPIC_API_KEY");
  const isMock = activeProvider.name.toLowerCase().includes("mock");

  const ai = {
    openaiConfigured,
    anthropicConfigured,
    activeProvider: activeProvider.name,
    providerAvailable: activeProvider.isAvailable(),
    mode: isMock ? ("mock" as const) : ("real" as const),
    realProviderConfigured: openaiConfigured || anthropicConfigured,
  };

  const ocr = {
    tesseractAvailable: ocrService.isAvailable(),
    pdfOcrAvailable: await ocrService.isPDFAvailable(),
  };

  let pdfParseAvailable = false;
  try {
    await import("pdf-parse");
    pdfParseAvailable = true;
  } catch {
    pdfParseAvailable = false;
  }

  const dependencies = {
    pdfParseAvailable,
  };

  const [db, redis] = await Promise.all([checkDatabase(), checkRedis()]);

  const overall: HealthStatus =
    db.status === "down" || redis.status === "down"
      ? "down"
      : db.status === "degraded" ||
          redis.status === "degraded" ||
          ai.mode === "mock"
        ? "degraded"
        : "ok";

  return NextResponse.json({
    ok: overall !== "down",
    status: overall,
    authorized: !!auth.authorized,
    ai,
    ocr,
    db,
    redis,
    dependencies,
    tenant: {
      id: auth.context?.tenantId || null,
    },
  });
}
