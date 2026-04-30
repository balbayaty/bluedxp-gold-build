/**
 * Process Flows API
 * GET: List all process flows
 */

import { NextRequest, NextResponse } from "next/server";
import { tradeComplianceService } from "@/lib/services/trade-compliance/tradeComplianceService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const recordId = searchParams.get("recordId");

    // Get all records for tenant
    const records = tradeComplianceService.getRecordsByTenant(tenantId);

    // Extract process flows from records
    let flows: any[] = [];

    for (const record of records) {
      if (recordId && record.id !== recordId) continue;

      if (record.processFlow) {
        const flow = {
          id: record.processFlow.id,
          recordId: record.id,
          recordNumber: `REC-${record.id}`,
          name: record.processFlow.name || `Process Flow for REC-${record.id}`,
          status: (record.processFlow as any).status || "ACTIVE",
          steps: record.processFlow.steps || [],
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };

        flows.push(flow);
      }
    }

    return NextResponse.json({
      success: true,
      flows,
      count: flows.length,
    });
  } catch (error) {
    console.error("Error fetching process flows:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch process flows" },
      { status: 500 },
    );
  }
}
