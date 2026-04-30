/**
 * Unified SLA Compliance API
 *
 * GET /api/sla-kpi/unified/compliance - Get compliance results
 * POST /api/sla-kpi/unified/compliance/check - Check compliance for transaction
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedSlaKpiService } from "@/lib/services/sla-kpi/unifiedSlaKpiService";
import type { TransactionContext } from "@/types/supplyChainSLA";

// ============================================================================
// GET - Get Compliance Results
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";
    const slaId = searchParams.get("slaId");
    const transactionId = searchParams.get("transactionId");
    const partyType = searchParams.get("partyType");
    const partyId = searchParams.get("partyId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Initialize service
    await unifiedSlaKpiService.initialize(tenantId);

    // Get compliance history
    const allResults = Array.from(
      (unifiedSlaKpiService as any).complianceHistory?.values() || [],
    ).flat();
    let results = allResults;

    if (slaId) {
      results = results.filter((r) => r.slaId === slaId);
    }

    if (transactionId) {
      results = results.filter((r) => r.transactionId === transactionId);
    }

    if (partyType && partyId) {
      results = results.filter(
        (r) => r.partyType === partyType && r.partyId === partyId,
      );
    }

    if (status) {
      results = results.filter((r) => r.status === status);
    }

    if (startDate) {
      const start = new Date(startDate);
      results = results.filter((r) => r.calculatedAt >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      results = results.filter((r) => r.calculatedAt <= end);
    }

    // Sort by calculatedAt descending
    results.sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime());

    return NextResponse.json({
      success: true,
      data: {
        results,
        count: results.length,
      },
    });
  } catch (error) {
    console.error("Error getting compliance results:", error);
    return NextResponse.json(
      {
        error: "Failed to get compliance results",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST - Check Compliance
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, context, transaction } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 },
      );
    }

    if (!context || !transaction) {
      return NextResponse.json(
        { error: "context and transaction are required" },
        { status: 400 },
      );
    }

    // Initialize service
    await unifiedSlaKpiService.initialize(tenantId);

    // Detect applicable SLAs
    const applicableSLAs = await unifiedSlaKpiService.detectApplicableSLAs(
      context,
      tenantId,
    );

    if (applicableSLAs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          applicableSLAs: [],
          complianceResults: [],
          message: "No applicable SLAs found",
        },
      });
    }

    // Calculate compliance for each SLA
    const complianceResults = [];
    for (const sla of applicableSLAs) {
      const result = await unifiedSlaKpiService.calculateSLACompliance(
        sla,
        transaction,
        tenantId,
      );
      complianceResults.push(result);
    }

    return NextResponse.json({
      success: true,
      data: {
        applicableSLAs,
        complianceResults,
      },
    });
  } catch (error) {
    console.error("Error checking compliance:", error);
    return NextResponse.json(
      {
        error: "Failed to check compliance",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
