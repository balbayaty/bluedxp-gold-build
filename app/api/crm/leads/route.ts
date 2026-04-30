/**
 * CRM Leads API
 * GET /api/crm/leads - Get leads
 * POST /api/crm/leads - Create lead
 */

import { NextRequest, NextResponse } from "next/server";
import { leadService } from "@/lib/services/crm/leadService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const status = searchParams.get("status") as any;
    const source = searchParams.get("source") as any;
    const assignedTo = searchParams.get("assignedTo") || undefined;
    const minScore = searchParams.get("minScore")
      ? Number(searchParams.get("minScore"))
      : undefined;

    const leads = await leadService.getLeads({
      tenantId,
      status,
      source,
      assignedTo,
      minScore,
    });

    return NextResponse.json({
      success: true,
      data: leads,
    });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch leads",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lead = await leadService.createLead(body);

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create lead",
      },
      { status: 500 },
    );
  }
}
