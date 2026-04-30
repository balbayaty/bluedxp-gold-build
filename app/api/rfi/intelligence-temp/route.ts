/**
 * Temporary RFI Intelligence API
 * Get intelligent recommendations for RFI data without creating a record
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { rfiService } from "@/lib/services/proposals/RFIService";
import { rfiIntelligenceService } from "@/lib/services/proposals/rfiIntelligenceService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    // Analyze RFI data
    const analysis = rfiService.analyzeRFIDataDirect(body);

    // Convert to RFI format for intelligence service
    const tempRFI = {
      id: "temp",
      rfiNumber: "TEMP",
      tenantId: body.tenantId || "default",
      companyName: body.companyName || "",
      contactPerson: body.contactPerson || "",
      email: body.email || "",
      phone: body.phone,
      address: body.address,
      flexRepresentative: body.flexRepresentative,
      date: body.date,
      storage: body.storage,
      inbound: body.inbound,
      outbound: body.outbound,
      returns: body.returns,
      vas: body.vas,
      systems: body.systems,
      kpis: body.kpis,
      additional: body.additional,
      attachments: body.attachments,
      certify: body.certify,
      dataCompleteness: analysis.completeness,
      pricingReadiness: analysis.readiness,
      pricingConfidence: analysis.confidence,
      assumptions: analysis.assumptions,
      keyDrivers: analysis.keyDrivers,
      readinessBadge: analysis.badge,
      status: "DRAFT" as const,
      autoGenerateRFQ: false,
      autoGenerateProposal: false,
      createdBy: body.createdBy || "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Get intelligence
    const intelligence = await rfiIntelligenceService.getIntelligence(
      tempRFI,
      analysis,
    );

    return NextResponse.json({
      success: true,
      data: intelligence,
    });
  } catch (error) {
    console.error("Error getting RFI intelligence:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(POSTHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.rfi",
  action: "read",
  requireAuth: true,
});
