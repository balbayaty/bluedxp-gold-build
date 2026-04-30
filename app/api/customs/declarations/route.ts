/**
 * Customs Declarations API
 * GET: List declarations
 * POST: Create declaration
 */

import { NextRequest, NextResponse } from "next/server";
import { customsOrchestrator } from "@/lib/services/customs/customsOrchestrator";
import { complianceService } from "@/lib/services/customs/complianceService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");
    const country = searchParams.get("country");

    // Get declarations from store
    const declarations = declarationStore.query({
      status: status || undefined,
      country: country || undefined,
      limit,
      offset,
    });

    // Get counts
    const counts = declarationStore.getCounts();

    return NextResponse.json({
      success: true,
      declarations,
      total: counts.total,
      pending: counts.pending,
      approved: counts.approved,
      rejected: counts.rejected,
      cleared: counts.cleared,
      held: counts.held,
      pagination: {
        limit,
        offset,
        total: counts.total,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate declaration
    const compliance = await complianceService.checkCompliance(body);

    if (!compliance.compliant) {
      return NextResponse.json(
        {
          success: false,
          error: "Declaration is not compliant",
          compliance,
        },
        { status: 400 },
      );
    }

    // Submit declaration via orchestrator
    const result = await customsOrchestrator.submitDeclaration(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to submit declaration",
          errors: result.errors,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      declaration: result.declaration,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
