/**
 * Marketplace Contracts API
 * POST - Create contract
 * GET - List contracts
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceContractService } from "@/lib/services/marketplace/contracts/marketplaceContractService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { bookingId, ...contractData } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Booking ID is required" },
        { status: 400 },
      );
    }

    const contract = await marketplaceContractService.createContract(
      bookingId,
      contractData,
    );

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error: any) {
    console.error("Failed to create contract:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create contract" },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (bookingId) {
      const contracts =
        await marketplaceContractService.getContractsByBooking(bookingId);
      return NextResponse.json({
        success: true,
        data: contracts,
      });
    }

    return NextResponse.json({
      success: true,
      data: [],
      message: "Use bookingId query parameter to filter contracts",
    });
  } catch (error: any) {
    console.error("Failed to get contracts:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get contracts" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.contracts",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.contracts",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
