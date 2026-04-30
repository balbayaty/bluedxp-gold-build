/**
 * Transportation Proposal (by id) API
 *
 * Tenant-safe and RBAC-protected via withTransportationAPI.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";

async function getHandler(
  _req: NextRequest,
  context: { tenantId?: string },
  id: string,
) {
  const tenantId = context.tenantId;
  if (!tenantId)
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );

  const proposal = await transportationDatabaseAdapterInstance.getProposal(
    tenantId,
    id,
  );
  if (!proposal)
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  return NextResponse.json(proposal);
}

export const GET = withTransportationAPI(
  async (req: NextRequest, ctx: any) => {
    const id = req.nextUrl.pathname.split("/").pop() || "";
    return getHandler(req, ctx, id);
  },
  {
    featureId: "proposals",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);
