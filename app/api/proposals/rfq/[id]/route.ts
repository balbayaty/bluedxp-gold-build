/**
 * RFQ Detail API
 * GET /api/proposals/rfq/[id] - Get RFQ by ID
 * PATCH /api/proposals/rfq/[id] - Update RFQ
 * DELETE /api/proposals/rfq/[id] - Delete RFQ
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // In production, fetch from database
    // For now, return mock data
    const rfq = {
      id: params.id,
      rfqNumber: `RFQ-${params.id.slice(0, 6).toUpperCase()}`,
      title: "3PL Warehousing & Distribution Services",
      description:
        "Request for quotation for comprehensive third-party logistics services including warehousing, distribution, and value-added services.",
      status: "UNDER_REVIEW",
      priority: "HIGH",
      customer: {
        companyName: "Saudi Industrial Manufacturing Co.",
        contactPerson: "Ahmed Al-Rashid",
        email: "ahmed@simc.com.sa",
        phone: "+966 11 234 5678",
      },
      serviceCategories: [
        "WAREHOUSING",
        "ROAD_TRANSPORT",
        "VALUE_ADDED_SERVICES",
      ],
      timeline: {
        requestedStartDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        responseDeadline: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      estimatedValue: 2500000,
      currency: "SAR",
      shipmentDetails: {
        cargoType: "General",
        estimatedVolume: 500,
        volumeUnit: "CBM",
        estimatedWeight: 150000,
        weightUnit: "KG",
      },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: rfq,
    });
  } catch (error: any) {
    console.error("Error fetching RFQ:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch RFQ" },
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
    console.error("Error updating RFQ:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update RFQ" },
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
      message: "RFQ deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting RFQ:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete RFQ" },
      { status: 500 },
    );
  }
}
