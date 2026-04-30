/**
 * Truth Engine KPIs API
 */

import { NextRequest, NextResponse } from "next/server";
import { truthEngineService } from "@/lib/services/truth-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, kpi, kpiId, filters } = body;

    if (action === "register") {
      if (!kpi) {
        return NextResponse.json(
          { success: false, error: "kpi definition is required" },
          { status: 400 },
        );
      }
      const registered = await truthEngineService.registerKPI(kpi);
      return NextResponse.json({
        success: true,
        kpi: registered,
      });
    } else if (action === "calculate") {
      if (!kpiId) {
        return NextResponse.json(
          { success: false, error: "kpiId is required" },
          { status: 400 },
        );
      }
      const calculated = await truthEngineService.calculateKPI(kpiId, filters);
      return NextResponse.json({
        success: true,
        kpi: calculated,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use "register" or "calculate"',
        },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error("Error with KPI operation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to perform KPI operation",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kpiId = searchParams.get("kpiId");
    const tenantId = searchParams.get("tenantId");
    const category = searchParams.get("category");
    const moduleId = searchParams.get("module");

    if (kpiId) {
      // Get evidence for KPI
      const evidence = await truthEngineService.getKPIEvidence(kpiId);
      return NextResponse.json({
        success: true,
        evidence,
      });
    } else {
      // Get all KPIs
      const kpis = await truthEngineService.getAllKPIs({
        tenantId: tenantId || undefined,
        category: category as any,
        module: moduleId || undefined,
      });
      return NextResponse.json({
        success: true,
        kpis,
      });
    }
  } catch (error: any) {
    console.error("Error fetching KPIs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch KPIs" },
      { status: 500 },
    );
  }
}
