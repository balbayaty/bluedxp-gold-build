/**
 * Load Plans API
 *
 * Endpoint for fetching load plans from database
 */

import { NextRequest, NextResponse } from "next/server";
import { loadPlanDatabaseAdapter } from "@/lib/services/load-design/database/loadPlanDatabaseAdapter";
import type { LoadPlan } from "@/types/load-design";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const filters: any = {};

    const startDate = searchParams.get("startDate");
    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    const endDate = searchParams.get("endDate");
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    const status = searchParams.get("status");
    if (status) {
      filters.status = status;
    }

    const transportMode = searchParams.get("transportMode");
    if (transportMode) {
      filters.transportMode = transportMode;
    }

    const vehicleType = searchParams.get("vehicleType");
    if (vehicleType) {
      filters.vehicleType = vehicleType;
    }

    const carrierId = searchParams.get("carrierId");
    if (carrierId) {
      filters.carrierId = carrierId;
    }

    const tenantId = searchParams.get("tenantId");
    if (tenantId) {
      filters.tenantId = tenantId;
    }

    const limit = searchParams.get("limit");
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get("offset");
    if (offset) {
      filters.offset = parseInt(offset, 10);
    }

    // Fetch load plans from database
    const loadPlans = await loadPlanDatabaseAdapter.getAllLoadPlans(filters);

    return NextResponse.json({
      success: true,
      data: loadPlans,
      count: loadPlans.length,
    });
  } catch (error: any) {
    console.error("Failed to fetch load plans:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch load plans",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const loadPlan: LoadPlan = body.loadPlan;
    const tenantId = body.tenantId || process.env.TENANT_ID;

    if (!loadPlan || !loadPlan.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid load plan data",
        },
        { status: 400 },
      );
    }

    // Store load plan in database
    const id = await loadPlanDatabaseAdapter.storeLoadPlan(loadPlan, tenantId);

    return NextResponse.json({
      success: true,
      data: { id },
      message: "Load plan saved successfully",
    });
  } catch (error: any) {
    console.error("Failed to save load plan:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save load plan",
      },
      { status: 500 },
    );
  }
}
