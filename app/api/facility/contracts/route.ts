/**
 * Facility Contracts API
 * GET /api/facility/contracts - Get all contracts
 * POST /api/facility/contracts - Create a new contract
 */

import { NextRequest, NextResponse } from "next/server";

// Mock data store
const mockContracts: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const contractType = searchParams.get("contractType");

    let contracts = [...mockContracts];

    if (status) {
      contracts = contracts.filter((c) => c.status === status);
    }
    if (contractType) {
      contracts = contracts.filter((c) => c.contractType === contractType);
    }

    return NextResponse.json({
      success: true,
      data: contracts,
    });
  } catch (error: any) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch contracts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const contract = {
      id: `contract-${Date.now()}`,
      contractNumber: `CTR-${Date.now().toString().slice(-6)}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockContracts.push(contract);

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error: any) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create contract" },
      { status: 500 },
    );
  }
}
