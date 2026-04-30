import { NextRequest, NextResponse } from "next/server";
import { msdsJobService } from "@/lib/services/chemical/msdsJobService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

export const runtime = "nodejs";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext: { params: { id: string } },
) {
  const jobId = nextContext.params.id;
  const job = await msdsJobService.get(context.tenantId, jobId);
  if (!job)
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 },
    );

  // Get detailed error logs if available
  let errorLogs: any[] = [];
  try {
    // In a real implementation, you'd query the LogEntry table from Prisma
    // For now, we'll include error details from the job items
    errorLogs = (job.items || [])
      .filter((item: any) => item.status === "failed" && item.error)
      .map((item: any) => ({
        fileName: item.filename,
        error: item.error,
        timestamp: job.updatedAt || job.createdAt,
        details: item.result?.issues || [],
      }));
  } catch {
    // Non-blocking
  }

  return NextResponse.json({
    success: true,
    job,
    errorLogs: errorLogs.length > 0 ? errorLogs : undefined,
  });
}

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext: { params: { id: string } },
) {
  // Manual trigger/resume
  const allowClientSuppliedKeys =
    process.env.NODE_ENV !== "production" ||
    (process.env.ALLOW_CLIENT_SUPPLIED_AI_KEYS || "").toLowerCase() === "true";

  const openaiKey =
    process.env.OPENAI_API_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
    (allowClientSuppliedKeys ? request.headers.get("x-openai-key") : null);

  const anthropicKey =
    process.env.ANTHROPIC_API_KEY ||
    process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
    (allowClientSuppliedKeys ? request.headers.get("x-anthropic-key") : null);

  const job = await msdsJobService.runJob({
    tenantId: context.tenantId,
    jobId: nextContext.params.id,
    actor: { userId: context.userId, roles: context.permissions || [] },
    keys: { openaiKey, anthropicKey },
  });

  return NextResponse.json({ success: true, job });
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.jobs",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.jobs",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
