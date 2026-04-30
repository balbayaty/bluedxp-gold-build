/**
 * Export Proposal API
 */

import { NextRequest, NextResponse } from "next/server";
import { ProposalGenerator } from "@/lib/services/proposals/ProposalGenerator";
import type { ExportFormat } from "@/types/proposals";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";

const proposalGenerator = new ProposalGenerator();

async function handler(
  request: NextRequest,
  context: { tenantId?: string },
  id: string,
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = await request.json();
    const format: ExportFormat = body.format || "PDF";

    // Find proposal
    const proposal = await transportationDatabaseAdapterInstance.getProposal(
      tenantId,
      id,
    );
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 },
      );
    }

    // Export proposal
    const result = await proposalGenerator.exportProposal(
      proposal as any,
      format,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Export failed" },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error exporting proposal:", error);
    return NextResponse.json(
      { error: "Failed to export proposal" },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(
  async (req: NextRequest, ctx: any) => {
    const id = req.nextUrl.pathname.split("/").slice(-2)[0] || "";
    return handler(req, ctx, id);
  },
  {
    featureId: "proposals",
    action: "export",
    requireAuth: true,
    rateLimit: true,
  },
);
