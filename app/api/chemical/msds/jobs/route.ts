import { NextRequest, NextResponse } from "next/server";
import { msdsJobService } from "@/lib/services/chemical/msdsJobService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

export const runtime = "nodejs";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  // AI keys - prioritize client-supplied keys (from localStorage) for real-time usage
  // Allow client-supplied keys in development OR if explicitly enabled
  const allowClientSuppliedKeys =
    process.env.NODE_ENV !== "production" ||
    (process.env.ALLOW_CLIENT_SUPPLIED_AI_KEYS || "").toLowerCase() === "true";

  const headerOpenAIKey = allowClientSuppliedKeys
    ? request.headers.get("x-openai-key")
    : null;
  const headerAnthropicKey = allowClientSuppliedKeys
    ? request.headers.get("x-anthropic-key")
    : null;

  // Priority: Client headers (from localStorage) > Environment variables
  const openaiKey =
    headerOpenAIKey &&
    headerOpenAIKey.length > 20 &&
    headerOpenAIKey.startsWith("sk-")
      ? headerOpenAIKey
      : process.env.OPENAI_API_KEY ||
        process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
        null;

  const anthropicKey =
    headerAnthropicKey &&
    headerAnthropicKey.length > 20 &&
    headerAnthropicKey.startsWith("sk-ant-")
      ? headerAnthropicKey
      : process.env.ANTHROPIC_API_KEY ||
        process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
        null;

  const hasValidKeys =
    (!!openaiKey && openaiKey.length > 20) ||
    (!!anthropicKey && anthropicKey.length > 20);

  console.log("[msds-jobs] 🔑 API keys status:", {
    openai:
      !!openaiKey && openaiKey.length > 20
        ? `✅ Valid (${openaiKey.substring(0, 7)}...)`
        : "❌ Missing/Invalid",
    anthropic:
      !!anthropicKey && anthropicKey.length > 20
        ? `✅ Valid (${anthropicKey.substring(0, 10)}...)`
        : "❌ Missing/Invalid",
    source:
      headerOpenAIKey || headerAnthropicKey
        ? "client-headers (localStorage)"
        : process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
          ? "environment"
          : "none",
    allowClientSuppliedKeys,
    willUseRealAI: hasValidKeys,
  });

  if (!hasValidKeys) {
    console.warn(
      "[msds-jobs] ⚠️ WARNING: No valid AI API keys found! PDFs will use local OCR only (lower accuracy for scanned PDFs).",
    );
    console.warn(
      "[msds-jobs] ⚠️ To enable cloud OCR: Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local, or configure in AI Settings page.",
    );
  }

  const form = await request.formData();
  const files = form.getAll("files") as File[];
  const file = form.get("file") as File | null;
  const allFiles: File[] = files.length > 0 ? files : file ? [file] : [];

  if (allFiles.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'No files provided (use form-data key "files")',
      },
      { status: 400 },
    );
  }

  const blobs = await Promise.all(
    allFiles.map(async (f) => ({
      filename: f.name,
      mimeType: f.type,
      size: f.size,
      buffer: Buffer.from(await f.arrayBuffer()),
    })),
  );

  const job = await msdsJobService.createJob({
    tenantId: context.tenantId,
    createdBy: context.userId,
    files: blobs,
  });

  // Fire-and-forget run (local/dev friendly). In serverless/prod, use a real queue/worker.
  setTimeout(() => {
    msdsJobService
      .runJob({
        tenantId: context.tenantId,
        jobId: job.id,
        actor: { userId: context.userId, roles: context.permissions || [] },
        keys: { openaiKey, anthropicKey },
      })
      .catch(() => {
        // job will reflect failures per-item; ignore here
      });
  }, 0);

  return NextResponse.json({ success: true, job });
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  const jobs = await msdsJobService.list(context.tenantId);
  return NextResponse.json({ success: true, jobs });
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.jobs",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.jobs",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});