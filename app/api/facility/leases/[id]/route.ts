/**
 * Facility Lease Detail API
 * GET /api/facility/leases/[id] - Get lease by ID
 * PATCH /api/facility/leases/[id] - Update lease
 * DELETE /api/facility/leases/[id] - Delete/terminate lease
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Return mock data for now
    const lease = {
      id: params.id,
      leaseNumber: `LSE-${params.id.slice(0, 6).toUpperCase()}`,
      propertyName: "Riyadh Industrial Warehouse Complex",
      propertyAddress: "Industrial City, Area 3, Building 15, Riyadh 12345",
      propertyType: "WAREHOUSE",
      landlordName: "Al-Rajhi Real Estate Holdings",
      landlordContact: "+966 11 234 5678",
      landlordEmail: "properties@alrajhi-re.com",
      status: "ACTIVE",
      leaseType: "TRIPLE_NET",
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
      monthlyRent: 150000,
      annualRent: 1800000,
      securityDeposit: 300000,
      currency: "SAR",
      paymentDueDay: 1,
      escalationRate: 3,
      escalationFrequency: "ANNUAL",
      area: 5000,
      areaUnit: "SQM",
      costPerUnit: 360,
      terms: "Standard commercial lease terms apply.",
      specialClauses: [
        "Option to renew for additional 3 years",
        "First right of refusal for adjacent units",
        "Landlord to maintain structural elements",
      ],
      documents: [],
      createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: lease,
    });
  } catch (error: any) {
    console.error("Error fetching lease:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lease" },
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
    console.error("Error updating lease:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lease" },
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
      message: "Lease terminated successfully",
    });
  } catch (error: any) {
    console.error("Error terminating lease:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to terminate lease" },
      { status: 500 },
    );
  }
}
