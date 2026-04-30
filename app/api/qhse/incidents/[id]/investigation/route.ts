/**
 * QHSE Incident Investigation API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseIncidentService } from "@/lib/services/qhse";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// POST - Start investigation
async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    if (!body.investigatorId) {
      return NextResponse.json(
        { success: false, error: "investigatorId is required" },
        { status: 400 },
      );
    }

    const investigation = await qhseIncidentService.startInvestigation(
      params.id,
      body.investigatorId,
    );

    return NextResponse.json(
      {
        success: true,
        data: investigation,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error starting investigation:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to start investigation",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.incidents.investigation",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
