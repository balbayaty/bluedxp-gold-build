/**
 * Data Warehouse API
 * GET /api/business-intelligence/data-warehouse
 */

import { NextRequest, NextResponse } from "next/server";
import { dataWarehouseService } from "@/lib/services/business-intelligence/dataWarehouseService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const moduleId = searchParams.get("module") || undefined;
    const status = searchParams.get("status") as any;

    const [tables, jobs] = await Promise.all([
      dataWarehouseService.getTables(),
      dataWarehouseService.getETLJobs({ module: moduleId, status }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tables,
        etlJobs: jobs,
      },
    });
  } catch (error: any) {
    console.error("Error fetching data warehouse:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch data warehouse",
      },
      { status: 500 },
    );
  }
}
