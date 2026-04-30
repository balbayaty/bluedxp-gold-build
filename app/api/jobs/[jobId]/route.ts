/**
 * Individual Job API Routes
 *
 * Handles operations on specific jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { jobQueue } from "@/lib/services/job-queue";

// Get tenant and user from request
function getAuthContext(request: NextRequest): {
  tenantId: string;
  userId: string;
} {
  const tenantId = request.headers.get("x-tenant-id") || "default-tenant";
  const userId = request.headers.get("x-user-id") || "default-user";
  return { tenantId, userId };
}

/**
 * GET /api/jobs/[jobId] - Get job by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const { tenantId } = getAuthContext(request);
    const job = await jobQueue.getJob(params.jobId, tenantId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Error getting job:", error);
    return NextResponse.json({ error: "Failed to get job" }, { status: 500 });
  }
}

/**
 * DELETE /api/jobs/[jobId] - Cancel job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const { tenantId } = getAuthContext(request);
    const result = await jobQueue.cancelJob(params.jobId, tenantId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error cancelling job:", error);
    return NextResponse.json(
      { error: "Failed to cancel job" },
      { status: 500 },
    );
  }
}
