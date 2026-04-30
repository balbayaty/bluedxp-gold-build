/**
 * Resume Job API Route
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
 * POST /api/jobs/[jobId]/resume - Resume a paused job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const { tenantId } = getAuthContext(request);
    const result = await jobQueue.resumeJob(params.jobId, tenantId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error resuming job:", error);
    return NextResponse.json(
      { error: "Failed to resume job" },
      { status: 500 },
    );
  }
}
