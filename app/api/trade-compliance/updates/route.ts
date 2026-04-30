/**
 * Real-Time Updates API Route
 * Provides real-time updates for trade compliance records
 */

import { NextRequest, NextResponse } from "next/server";
import { tradeComplianceService } from "@/lib/services/trade-compliance/tradeComplianceService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const since = parseInt(searchParams.get("since") || "0");

    // Get records updated since timestamp
    const records = tradeComplianceService.getRecordsByTenant(tenantId);
    const updates = records
      .filter((r) => new Date(r.updatedAt).getTime() > since)
      .map((r) => ({
        type: "record_updated" as const,
        entityId: r.id,
        entityType: "trade_compliance_record",
        data: {
          id: r.id,
          status: r.complianceStatus,
          complianceScore: r.complianceScore,
          riskLevel: r.riskLevel,
        },
        timestamp: r.updatedAt,
        priority:
          r.riskLevel === "HIGH" ? ("high" as const) : ("medium" as const),
      }));

    return NextResponse.json({
      success: true,
      updates,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch updates",
      },
      { status: 500 },
    );
  }
}
