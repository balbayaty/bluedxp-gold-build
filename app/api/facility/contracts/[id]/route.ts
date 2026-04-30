/**
 * Facility Contract Detail API
 * GET /api/facility/contracts/[id] - Get contract by ID
 * PATCH /api/facility/contracts/[id] - Update contract
 * DELETE /api/facility/contracts/[id] - Delete/terminate contract
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Return mock data for now
    const contract = {
      id: params.id,
      contractNumber: `CTR-${params.id.slice(0, 6).toUpperCase()}`,
      title: "Annual HVAC Maintenance Agreement",
      description:
        "Comprehensive heating, ventilation, and air conditioning maintenance for all warehouse facilities.",
      vendorId: "vendor-hvac-001",
      vendorName: "Saudi Climate Solutions Co.",
      vendorContact: "+966 11 456 7890",
      vendorEmail: "contracts@saudiclimate.com",
      contractType: "MAINTENANCE",
      status: "ACTIVE",
      startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      renewalNotificationDays: 60,
      totalValue: 240000,
      currency: "SAR",
      paymentTerms: "Net 30",
      paymentFrequency: "MONTHLY",
      scope: [
        "Monthly preventive maintenance inspections",
        "Quarterly filter replacement for all units",
        "24/7 emergency repair service",
        "Annual comprehensive system audit",
      ],
      slaMetrics: [
        {
          metric: "Response Time (Emergency)",
          target: "< 2 hours",
          penalty: "5% of monthly fee",
        },
        {
          metric: "Response Time (Standard)",
          target: "< 24 hours",
          penalty: "2% of monthly fee",
        },
        {
          metric: "System Uptime",
          target: "> 99%",
          penalty: "10% of monthly fee per 1% below target",
        },
      ],
      documents: [],
      contacts: [
        {
          name: "Ahmed Al-Hassan",
          role: "Account Manager",
          email: "ahmed@saudiclimate.com",
          phone: "+966 50 123 4567",
        },
      ],
      createdBy: "facilities@company.com",
      approvedBy: "director@company.com",
      createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error: any) {
    console.error("Error fetching contract:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch contract" },
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

    return NextResponse.json({
      success: true,
      data: { id: params.id, ...body, updatedAt: new Date().toISOString() },
    });
  } catch (error: any) {
    console.error("Error updating contract:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update contract" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    return NextResponse.json({
      success: true,
      message: "Contract terminated successfully",
    });
  } catch (error: any) {
    console.error("Error terminating contract:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to terminate contract",
      },
      { status: 500 },
    );
  }
}
