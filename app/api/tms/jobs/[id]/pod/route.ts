/**
 * TMS POD API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { podService } from "@/lib/services/tms/podService";

/**
 * GET /api/tms/jobs/:id/pod - Get POD records for job
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

    const pods = await podService.getPODRecords(params.id, tenantId);

    return NextResponse.json(pods);
  } catch (error) {
    console.error("Error fetching POD records:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tms/jobs/:id/pod - Create POD record
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { tenantId, createdBy, ...podData } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    if (!createdBy) {
      return NextResponse.json(
        { error: "Created by is required" },
        { status: 400 },
      );
    }

    const pod = await podService.createPOD({
      ...podData,
      jobId: params.id,
      tenantId,
      createdBy,
    });

    return NextResponse.json(pod, { status: 201 });
  } catch (error) {
    console.error("Error creating POD:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
