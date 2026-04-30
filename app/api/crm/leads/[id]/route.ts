/**
 * CRM Lead Detail API
 * GET /api/crm/leads/[id] - Get lead by ID
 * PATCH /api/crm/leads/[id] - Update lead
 * DELETE /api/crm/leads/[id] - Delete lead
 */

import { NextRequest, NextResponse } from "next/server";
import { leadService } from "@/lib/services/crm/leadService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const lead = await leadService.getLeadById(params.id);

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error: any) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lead" },
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
    const lead = await leadService.updateLead(params.id, body);

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error: any) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lead" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await leadService.deleteLead(params.id);

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete lead" },
      { status: 500 },
    );
  }
}
