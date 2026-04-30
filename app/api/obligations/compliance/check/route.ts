/**
 * Obligation Compliance Check API
 * POST /api/obligations/compliance/check
 */

import { NextRequest, NextResponse } from "next/server";
import { obligationMappingEngine } from "@/lib/services/obligations/obligationMappingEngine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { obligationId, tenantId } = body;

    if (obligationId) {
      // Check single obligation
      const status = await obligationMappingEngine.checkObligationCompliance(
        obligationId,
        tenantId || "default",
      );

      return NextResponse.json({
        success: true,
        data: status,
      });
    } else if (tenantId) {
      // Check all obligations for tenant
      const statuses =
        await obligationMappingEngine.checkAllObligationsCompliance(tenantId);

      return NextResponse.json({
        success: true,
        data: statuses,
        count: statuses.length,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Either obligationId or tenantId is required",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error checking compliance:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
