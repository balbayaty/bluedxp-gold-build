/**
 * Obligations API Routes
 *
 * GET /api/obligations - Get obligations with filters
 * POST /api/obligations - Create new obligation
 */

import { NextRequest, NextResponse } from "next/server";
import { obligationMappingEngine } from "@/lib/services/obligations/obligationMappingEngine";
import type { ObligationQueryFilter } from "@/types/obligation";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract filter parameters
    const filter: ObligationQueryFilter = {
      tenantId: searchParams.get("tenantId") || "default",
      status: searchParams.get("status") as any,
      type: searchParams.get("type") as any,
      sourceType: searchParams.get("sourceType") as any,
      responsiblePartyId: searchParams.get("responsiblePartyId") || undefined,
      responsiblePartyType: searchParams.get("responsiblePartyType") as any,
      jurisdiction: searchParams.get("jurisdiction") || undefined,
      authority: searchParams.get("authority") || undefined,
      severity: searchParams.get("severity") as any,
      searchText: searchParams.get("search") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 100,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : 0,
      sortBy: searchParams.get("sortBy") as any,
      sortOrder: searchParams.get("sortOrder") as any,
    };

    const obligations = await obligationMappingEngine.getObligations(filter);

    return NextResponse.json({
      success: true,
      data: obligations,
      count: obligations.length,
    });
  } catch (error) {
    console.error("Error fetching obligations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const obligation = await obligationMappingEngine.createObligation(body);

    return NextResponse.json({
      success: true,
      data: obligation,
    });
  } catch (error) {
    console.error("Error creating obligation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
