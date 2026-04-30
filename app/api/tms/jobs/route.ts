/**
 * TMS Jobs API Routes
 * Handles CRUD operations for transport jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { tmsCoreService } from "@/lib/services/tms/tmsCoreService";
import { JobType, JobStatus } from "@/types/tms/transportJob";
import { getAllSampleJobs } from "@/data/tms/sampleJobs";

/**
 * Check if demo mode is enabled
 */
function isDemoModeEnabled(): boolean {
  return (
    process.env.ENABLE_DEMO_DATA === "true" ||
    process.env.NODE_ENV === "development"
  );
}

/**
 * GET /api/tms/jobs - List jobs with filters
 */
async function GETHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId =
      context.tenantId || searchParams.get("tenantId") || "default";

    const filters = {
      tenantId,
      jobType: searchParams.get("jobType") as JobType | undefined,
      jobStatus: searchParams.get("jobStatus") as JobStatus | undefined,
      customerId: searchParams.get("customerId") || undefined,
      transporterId: searchParams.get("transporterId") || undefined,
      laneId: searchParams.get("laneId") || undefined,
      dateFrom: searchParams.get("dateFrom")
        ? new Date(searchParams.get("dateFrom")!)
        : undefined,
      dateTo: searchParams.get("dateTo")
        ? new Date(searchParams.get("dateTo")!)
        : undefined,
      search: searchParams.get("search") || undefined,
    };

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const result = await tmsCoreService.getJobs(filters, { page, pageSize });

    // If no jobs found and demo mode is enabled, return sample jobs
    if (result.jobs.length === 0 && isDemoModeEnabled()) {
      const sampleJobs = getAllSampleJobs();

      // Apply filters to sample jobs
      let filteredSamples = [...sampleJobs];

      if (filters.jobType) {
        filteredSamples = filteredSamples.filter(
          (j) => j.jobType === filters.jobType,
        );
      }
      if (filters.jobStatus) {
        filteredSamples = filteredSamples.filter(
          (j) => j.jobStatus === filters.jobStatus,
        );
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredSamples = filteredSamples.filter(
          (j) =>
            j.jobName?.toLowerCase().includes(searchLower) ||
            j.jobNumber?.toLowerCase().includes(searchLower) ||
            j.customer?.toLowerCase().includes(searchLower),
        );
      }

      return NextResponse.json({
        jobs: filteredSamples.slice((page - 1) * pageSize, page * pageSize),
        total: filteredSamples.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredSamples.length / pageSize),
        isDemoData: true,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tms/jobs - Create new job
 */
async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { createdBy, ...jobData } = body;
    const tenantId = context.tenantId || "default";
    const userId = createdBy || context.userId || "system";

    const job = await tmsCoreService.createJob({
      ...jobData,
      tenantId,
      createdBy: userId,
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(GETHandler, {
  moduleId: "tms",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(POSTHandler, {
  moduleId: "tms",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
