/**
 * Unified SLA/KPI API
 *
 * GET /api/sla-kpi/unified - Get unified dashboard
 * POST /api/sla-kpi/unified/sla - Create SLA
 * POST /api/sla-kpi/unified/kpi - Create KPI
 * GET /api/sla-kpi/unified/compliance - Get compliance results
 *
 * @module api/sla-kpi
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedSlaKpiService } from "@/lib/services/sla-kpi/unifiedSlaKpiService";
import { eventBus } from "@/lib/services/event-store";
import { Action } from "@/types/user";
import type { SupplyChainSLA, SupplyChainKPI } from "@/types/supplyChainSLA";

// ============================================================================
// GET - Unified Dashboard
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";
    const dashboardType = searchParams.get("type") || "both"; // 'sla', 'kpi', 'both'

    // Initialize service if needed
    await unifiedSlaKpiService.initialize(tenantId);

    // Reload cache if empty (in case service initialized before seeding)
    const cacheStatus = unifiedSlaKpiService.hasCachedData();

    if (
      (dashboardType === "sla" || dashboardType === "both") &&
      !cacheStatus.hasSLAs
    ) {
      console.log("⚠️ SLA cache is empty, attempting to reload...");
      await unifiedSlaKpiService.reloadCache(tenantId);
    }

    if (
      (dashboardType === "kpi" || dashboardType === "both") &&
      !cacheStatus.hasKPIs
    ) {
      console.log("⚠️ KPI cache is empty, attempting to reload...");
      await unifiedSlaKpiService.reloadCache(tenantId);
    }

    if (dashboardType === "sla" || dashboardType === "both") {
      const slaDashboard = await unifiedSlaKpiService.getSLADashboard(tenantId);
      if (dashboardType === "sla") {
        return NextResponse.json({
          success: true,
          data: { sla: slaDashboard },
        });
      }
    }

    if (dashboardType === "kpi" || dashboardType === "both") {
      const kpiDashboard = await unifiedSlaKpiService.getKPIDashboard(tenantId);
      if (dashboardType === "kpi") {
        return NextResponse.json({
          success: true,
          data: { kpi: kpiDashboard },
        });
      }
    }

    // Both dashboards
    const slaDashboard = await unifiedSlaKpiService.getSLADashboard(tenantId);
    const kpiDashboard = await unifiedSlaKpiService.getKPIDashboard(tenantId);

    return NextResponse.json({
      success: true,
      data: {
        sla: slaDashboard,
        kpi: kpiDashboard,
      },
    });
  } catch (error) {
    console.error("Error getting unified dashboard:", error);
    return NextResponse.json(
      {
        error: "Failed to get unified dashboard",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST - Create SLA
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, sla } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 },
      );
    }

    if (!sla) {
      return NextResponse.json({ error: "sla is required" }, { status: 400 });
    }

    // Initialize service
    await unifiedSlaKpiService.initialize(tenantId);

    // Create SLA
    const createdSLA = await unifiedSlaKpiService.createSLA(sla, tenantId);

    return NextResponse.json({
      success: true,
      data: createdSLA,
      message: "SLA created successfully",
    });
  } catch (error) {
    console.error("Error creating SLA:", error);
    return NextResponse.json(
      {
        error: "Failed to create SLA",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
