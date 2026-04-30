/**
 * Pause Job API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { jobQueue } from "@/lib/services/job-queue";

function getAuthContext(request: NextRequest): {
  tenantId: string;
  userId: string;
} {
  const tenantId = request.headers.get("x-tenant-id") || "default-tenant";
  const userId = request.headers.get("x-user-id") || "default-user";
  return { tenantId, userId };
}

/**
 * POST /api/jobs/[jobId]/pause - Pause a running job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const { tenantId } = getAuthContext(request);
    const result = await jobQueue.pauseJob(params.jobId, tenantId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error pausing job:", error);
    return NextResponse.json({ error: "Failed to pause job" }, { status: 500 });
  }
}
