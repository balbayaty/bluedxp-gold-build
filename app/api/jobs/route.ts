/**
 * Jobs API Routes
 *
 * Handles job creation and listing
 */

import { NextRequest, NextResponse } from "next/server";
import { jobQueue } from "@/lib/services/job-queue";
import { CreateJobRequest, JobQuery } from "@/types/job";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

// Get tenant and user from request using authentication middleware
async function getAuthContext(request: NextRequest): Promise<{
  tenantId: string;
  userId: string;
} | null> {
  const auth = await apiAuthMiddleware(request);
  if (!auth.authorized || !auth.context) {
    return null;
  }
  return {
    tenantId: auth.context.tenantId,
    userId: auth.context.userId,
  };
}

/**
 * POST /api/jobs - Create a new job
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { tenantId, userId } = authContext;
    const body: CreateJobRequest = await request.json();

    const result = await jobQueue.createJob(body, tenantId, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/jobs - List jobs
 */
export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { tenantId } = authContext;
    const searchParams = request.nextUrl.searchParams;

    const query: JobQuery = {
      status: searchParams.get("status")
        ? (searchParams.get("status")?.split(",") as any)
        : undefined,
      type: searchParams.get("type")
        ? (searchParams.get("type")?.split(",") as any)
        : undefined,
      moduleId: searchParams.get("moduleId") || undefined,
      userId: searchParams.get("userId") || undefined,
      createdAfter: searchParams.get("createdAfter")
        ? new Date(searchParams.get("createdAfter")!)
        : undefined,
      createdBefore: searchParams.get("createdBefore")
        ? new Date(searchParams.get("createdBefore")!)
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 50,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : 0,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
    };

    const result = await jobQueue.listJobs(query, tenantId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing jobs:", error);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}
