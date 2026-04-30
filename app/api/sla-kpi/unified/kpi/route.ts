/**
 * Unified KPI API
 *
 * POST /api/sla-kpi/unified/kpi - Create KPI
 * GET /api/sla-kpi/unified/kpi - Get KPIs
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedSlaKpiService } from "@/lib/services/sla-kpi/unifiedSlaKpiService";
import type { SupplyChainKPI } from "@/types/supplyChainSLA";

// ============================================================================
// POST - Create KPI
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, kpi } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 },
      );
    }

    if (!kpi) {
      return NextResponse.json({ error: "kpi is required" }, { status: 400 });
    }

    // Initialize service
    await unifiedSlaKpiService.initialize(tenantId);

    // Create KPI
    const createdKPI = await unifiedSlaKpiService.createKPI(kpi, tenantId);

    return NextResponse.json({
      success: true,
      data: createdKPI,
      message: "KPI created successfully",
    });
  } catch (error) {
    console.error("Error creating KPI:", error);
    return NextResponse.json(
      {
        error: "Failed to create KPI",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// GET - Get KPIs
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";
    const partyType = searchParams.get("partyType");
    const partyId = searchParams.get("partyId");
    const category = searchParams.get("category");

    // Initialize service
    await unifiedSlaKpiService.initialize(tenantId);

    // Get KPIs
    const allKPIs = Array.from(
      (unifiedSlaKpiService as any).kpiCache?.values() || [],
    );
    let kpis = allKPIs.filter((kpi) => kpi.isActive);

    if (partyType && partyId) {
      kpis = kpis.filter(
        (kpi) => kpi.partyType === partyType && kpi.partyId === partyId,
      );
    } else if (partyType) {
      kpis = kpis.filter((kpi) => kpi.partyType === partyType);
    }

    if (category) {
      kpis = kpis.filter((kpi) => kpi.category === category);
    }

    return NextResponse.json({
      success: true,
      data: {
        kpis,
        count: kpis.length,
      },
    });
  } catch (error) {
    console.error("Error getting KPIs:", error);
    return NextResponse.json(
      {
        error: "Failed to get KPIs",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
