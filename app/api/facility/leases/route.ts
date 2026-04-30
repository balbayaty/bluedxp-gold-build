/**
 * Facility Leases API
 * GET /api/facility/leases - Get all leases
 * POST /api/facility/leases - Create a new lease
 */

import { NextRequest, NextResponse } from "next/server";

// Mock data store
const mockLeases: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const propertyType = searchParams.get("propertyType");

    let leases = [...mockLeases];

    if (status) {
      leases = leases.filter((l) => l.status === status);
    }
    if (propertyType) {
      leases = leases.filter((l) => l.propertyType === propertyType);
    }

    return NextResponse.json({
      success: true,
      data: leases,
    });
  } catch (error: any) {
    console.error("Error fetching leases:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch leases" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const lease = {
      id: `lease-${Date.now()}`,
      leaseNumber: `LSE-${Date.now().toString().slice(-6)}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockLeases.push(lease);

    return NextResponse.json({
      success: true,
      data: lease,
    });
  } catch (error: any) {
    console.error("Error creating lease:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create lease" },
      { status: 500 },
    );
  }
}
