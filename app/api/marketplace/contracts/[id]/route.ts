/**
 * Marketplace Contract API
 * GET - Get contract
 * PUT - Update contract
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceContractService } from "@/lib/services/marketplace/contracts/marketplaceContractService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const contract = await marketplaceContractService.getContract(params.id);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: "Contract not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error: any) {
    console.error("Failed to get contract:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get contract" },
      { status: 500 },
    );
  }
}

async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const contract = await marketplaceContractService.updateContract(
      params.id,
      body,
    );

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error: any) {
    console.error("Failed to update contract:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update contract" },
      { status: 500 },
    );
  }
}
