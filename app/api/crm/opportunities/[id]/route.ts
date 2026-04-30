/**
 * CRM Opportunity Detail API
 * GET /api/crm/opportunities/[id] - Get opportunity by ID
 * PATCH /api/crm/opportunities/[id] - Update opportunity
 * DELETE /api/crm/opportunities/[id] - Delete opportunity
 */

import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/services/crm/opportunityService";
import { logger } from "@/lib/services/observability/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const opportunity = await opportunityService.getOpportunityById(params.id);

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: "Opportunity not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: opportunity,
    });
  } catch (error: any) {
    logger.error("Error fetching opportunity", {
      error: error.message,
      id: params.id,
    });
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch opportunity" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const opportunity = await opportunityService.updateOpportunity(
      params.id,
      body,
    );

    return NextResponse.json({
      success: true,
      data: opportunity,
    });
  } catch (error: any) {
    logger.error("Error updating opportunity", {
      error: error.message,
      id: params.id,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update opportunity",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await opportunityService.deleteOpportunity(params.id);

    return NextResponse.json({
      success: true,
      message: "Opportunity deleted successfully",
    });
  } catch (error: any) {
    logger.error("Error deleting opportunity", {
      error: error.message,
      id: params.id,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete opportunity",
      },
      { status: 500 },
    );
  }
}
