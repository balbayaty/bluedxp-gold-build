/**
 * Contracts API
 * GET /api/procurement/contracts - List contracts
 * POST /api/procurement/contracts - Create contract
 */

import { NextRequest, NextResponse } from "next/server";
import { contractService } from "@/lib/services/procurement/contractService";
import type { ContractCreateInput } from "@/types/contract";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const status = searchParams.get("status")?.split(",") as any;
    const type = searchParams.get("type")?.split(",") as any;
    const vendorId = searchParams.get("vendorId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const search = searchParams.get("search") || undefined;

    const contracts = await contractService.listContracts({
      tenantId,
      status,
      type,
      vendorId,
      projectId,
      search,
    });

    return NextResponse.json({
      success: true,
      data: contracts,
      count: contracts.length,
    });
  } catch (error: any) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch contracts",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, userId, ...input } = body;

    const contract = await contractService.createContract(
      input as ContractCreateInput,
      userId || "system",
    );

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error: any) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create contract",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.contracts",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.contracts",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
