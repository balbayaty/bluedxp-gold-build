/**
 * CRM Pipeline API
 * GET /api/crm/pipeline - Get sales pipeline
 */

import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/services/crm/opportunityService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";

    const pipeline = await opportunityService.getSalesPipeline(tenantId);

    return NextResponse.json({
      success: true,
      data: pipeline,
    });
  } catch (error: any) {
    console.error("Error fetching sales pipeline:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch sales pipeline",
      },
      { status: 500 },
    );
  }
}
