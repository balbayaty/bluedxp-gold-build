/**
 * TMS Detention API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { detentionService } from "@/lib/services/tms/detentionService";
import { tmsCoreService } from "@/lib/services/tms/tmsCoreService";

/**
 * GET /api/tms/jobs/:id/detention - Get detention records for job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    const detentions = await detentionService.getDetentionRecords(
      params.id,
      tenantId,
    );

    return NextResponse.json(detentions);
  } catch (error) {
    console.error("Error fetching detention records:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tms/jobs/:id/detention/calculate - Calculate detention for job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    const job = await tmsCoreService.getJob(params.id, tenantId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const detentions = await detentionService.calculateJobDetention(job);

    return NextResponse.json(detentions);
  } catch (error) {
    console.error("Error calculating detention:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
