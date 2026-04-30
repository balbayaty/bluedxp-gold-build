/**
 * Production Gate (Strict Production Mode)
 *
 * Target-2 requirement: refuse to start (and refuse requests) unless:
 * - DATABASE_URL is set and database is reachable
 * - JWT verification is configured
 * - Event store persistence is enabled (no in-memory ledgers in prod)
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { redisService } from "@/lib/services/cache/redisService";
import { objectStorageService } from "@/lib/services/storage/objectStorageService";

export type ProductionGateResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      errors: string[];
    };

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function requireEnv(name: string): string | null {
  const v = (process.env[name] || "").trim();
  return v.length > 0 ? v : null;
}

export function checkProductionReadiness(): ProductionGateResult {
  if (!isProd()) return { ok: true };

  const errors: string[] = [];

  // 1) Database config
  if (!requireEnv("DATABASE_URL")) {
    errors.push(
      "DATABASE_URL is required in production (no silent in-memory fallback).",
    );
  }

  // Rate limiting must be production-grade (Redis)
  if (!requireEnv("REDIS_URL")) {
    errors.push(
      "REDIS_URL is required in production (rate limiting + caching must be durable/shared).",
    );
  }

  // Object storage (MinIO) must be configured for durable exports/documents
  const minioEndpoint = requireEnv("MINIO_ENDPOINT");
  const minioUser = requireEnv("MINIO_ROOT_USER");
  const minioPass = requireEnv("MINIO_ROOT_PASSWORD");
  if (!minioEndpoint) {
    errors.push(
      "MINIO_ENDPOINT is required in production (durable object storage).",
    );
  }
  if (!minioUser || minioUser === "minioadmin") {
    errors.push(
      'MINIO_ROOT_USER must be set in production and must not be "minioadmin".',
    );
  }
  if (!minioPass || minioPass === "minioadmin") {
    errors.push(
      'MINIO_ROOT_PASSWORD must be set in production and must not be "minioadmin".',
    );
  }

  // Bulletproof means: do not allow simulated Transportation behavior in production.
  if (
    (process.env.ALLOW_TRANSPORT_SIMULATIONS_IN_PROD || "").toLowerCase() ===
    "true"
  ) {
    errors.push(
      "ALLOW_TRANSPORT_SIMULATIONS_IN_PROD=true is forbidden in production (bulletproof mode).",
    );
  }

  // 2) JWT verification config
  const hasJwtSecret = !!requireEnv("JWT_SECRET");
  const hasJwks = !!requireEnv("JWT_JWKS_URL");
  if (!hasJwtSecret && !hasJwks) {
    errors.push(
      "JWT verification must be configured in production: set JWT_SECRET (HS256) or JWT_JWKS_URL (RS256/JWKS).",
    );
  }

  // 3) Event store persistence config
  const backend = (process.env.EVENT_STORE_BACKEND || "").trim().toLowerCase();
  if (!backend) {
    errors.push(
      "EVENT_STORE_BACKEND is required in production (must not be in-memory). Set EVENT_STORE_BACKEND=prisma.",
    );
  } else if (
    backend === "memory" ||
    backend === "inmemory" ||
    backend === "in-memory"
  ) {
    errors.push(
      "EVENT_STORE_BACKEND cannot be in-memory in production. Set EVENT_STORE_BACKEND=prisma.",
    );
  } else if (backend !== "prisma") {
    errors.push(
      `Unsupported EVENT_STORE_BACKEND="${backend}" in strict production mode. Supported: prisma.`,
    );
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true };
}

async function assertEventStoreTablesExist(): Promise<void> {
  // If migrations were not applied, Prisma will throw (table missing).
  // Use a cheap query against the generated Prisma models.
  await prisma.event.findFirst({ select: { id: true } }).catch((e) => {
    throw new Error(
      [
        "Event store tables are not available in the database.",
        "Run migrations before starting production:",
        "- `npm run prisma:migrate` (dev) OR `prisma migrate deploy` (prod)",
        `Underlying error: ${e instanceof Error ? e.message : String(e)}`,
      ].join("\n"),
    );
  });

  await prisma.snapshot.findFirst({ select: { id: true } }).catch((e) => {
    throw new Error(
      [
        "Snapshot tables are not available in the database.",
        "Run migrations before starting production.",
        `Underlying error: ${e instanceof Error ? e.message : String(e)}`,
      ].join("\n"),
    );
  });
}

async function assertEvidenceTablesExist(): Promise<void> {
  await prisma.evidenceItem.findFirst({ select: { id: true } }).catch((e) => {
    throw new Error(
      [
        "Evidence tables are not available in the database (evidence_items).",
        "Run Prisma migrations before starting production.",
        `Underlying error: ${e instanceof Error ? e.message : String(e)}`,
      ].join("\n"),
    );
  });

  await prisma.evidenceChainRecord
    .findFirst({ select: { id: true } })
    .catch((e) => {
      throw new Error(
        [
          "Evidence chain tables are not available in the database (evidence_chains).",
          "Run Prisma migrations before starting production.",
          `Underlying error: ${e instanceof Error ? e.message : String(e)}`,
        ].join("\n"),
      );
    });
}

async function assertNotificationTablesExist(): Promise<void> {
  await prisma.notificationRecord
    .findFirst({ select: { id: true } })
    .catch((e) => {
      throw new Error(
        [
          "Notification tables are not available in the database (notifications).",
          "Run Prisma migrations before starting production.",
          `Underlying error: ${e instanceof Error ? e.message : String(e)}`,
        ].join("\n"),
      );
    });
}

async function assertDatabaseReachable(): Promise<void> {
  // Lightweight connectivity check.
  await prisma.$queryRaw`SELECT 1`;
}

async function assertRedisReachable(): Promise<void> {
  await redisService.initialize(undefined, { strict: true });
  // Ping is already done in initialize, but keep an extra guard.
  const client = redisService.getClient();
  if (!client) {
    throw new Error(
      "Redis strict mode: client not available after initialization.",
    );
  }
  await client.ping();
}

async function assertObjectStorageReachable(): Promise<void> {
  await objectStorageService.initialize();
  if (!objectStorageService.isEnabled()) {
    throw new Error(
      "Object storage (MinIO) is not enabled after initialization.",
    );
  }
}

/**
 * Throws a single, user-friendly error if production is misconfigured.
 * Call this at server startup and (optionally) per-request for defense-in-depth.
 */
export async function assertProductionReady(): Promise<void> {
  const result = checkProductionReadiness();
  if (result.ok) {
    // Still validate DB connectivity + event tables in strict prod.
    if (isProd()) {
      await assertDatabaseReachable();
      await assertRedisReachable();
      await assertObjectStorageReachable();
      await assertEventStoreTablesExist();
      await assertEvidenceTablesExist();
      await assertNotificationTablesExist();
    }
    return;
  }

  const message =
    "❌ Strict production mode blocked startup.\n" +
    "Fix the following configuration issues:\n" +
    result.errors.map((e) => `- ${e}`).join("\n");

  throw new Error(message);
}
