/**
 * Business Continuity API Route
 * ISO 22301, NFPA 1600 compliance
 * Comprehensive validation and error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { businessContinuityService } from "@/lib/services/qhse/businessContinuityService";
import { QHSEValidator } from "@/lib/services/qhse/utils/validation";
import { QHSEErrorHandler } from "@/lib/services/qhse/utils/errorHandler";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const tenantId = searchParams.get("tenantId");

    if (action === "bias") {
      const bias = await businessContinuityService.listBIAs({ tenantId });
      return NextResponse.json({ success: true, data: bias });
    }

    if (action === "bcps") {
      const bcps = await businessContinuityService.listBCPs({ tenantId });
      return NextResponse.json({ success: true, data: bcps });
    }

    if (action === "crises") {
      const crises = await businessContinuityService.listCrises({ tenantId });
      return NextResponse.json({ success: true, data: crises });
    }

    if (action === "drps") {
      const drps = await businessContinuityService.listDRPs({ tenantId });
      return NextResponse.json({ success: true, data: drps });
    }

    if (action === "compliance") {
      const standard = searchParams.get("standard") || "ISO22301";
      let compliance;
      if (standard === "ISO22301") {
        compliance = await businessContinuityService.checkISO22301Compliance(
          tenantId || undefined,
        );
      } else if (standard === "NFPA1600") {
        compliance = await businessContinuityService.checkNFPA1600Compliance(
          tenantId || undefined,
        );
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid standard" },
          { status: 400 },
        );
      }
      return NextResponse.json({ success: true, data: compliance });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    const qhseError = QHSEErrorHandler.handleError(
      error,
      "Business Continuity API",
    );
    return NextResponse.json(QHSEErrorHandler.formatErrorResponse(qhseError), {
      status: qhseError.statusCode,
    });
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "create-bia") {
      const bia = await businessContinuityService.createBIA(body.bia);
      return NextResponse.json({ success: true, data: bia });
    }

    if (action === "create-bcp") {
      // Validate BCP
      const validation = QHSEValidator.validateBCP(body.bcp);
      if (!validation.valid) {
        const error = QHSEErrorHandler.createValidationError(validation.errors);
        return NextResponse.json(QHSEErrorHandler.formatErrorResponse(error), {
          status: error.statusCode,
        });
      }

      const bcp = await businessContinuityService.createBCP(body.bcp);
      return NextResponse.json({ success: true, data: bcp });
    }

    if (action === "activate-bcp") {
      const { bcpId, activatedBy, reason } = body;
      const bcp = await businessContinuityService.activateBCP(
        bcpId,
        activatedBy,
        reason,
      );
      return NextResponse.json({ success: true, data: bcp });
    }

    if (action === "declare-crisis") {
      const crisis = await businessContinuityService.declareCrisis(body.crisis);
      return NextResponse.json({ success: true, data: crisis });
    }

    if (action === "activate-crisis-response") {
      const { crisisId, bcpId, activatedBy } = body;
      const crisis = await businessContinuityService.activateCrisisResponse(
        crisisId,
        bcpId,
        activatedBy,
      );
      return NextResponse.json({ success: true, data: crisis });
    }

    if (action === "create-drp") {
      const drp = await businessContinuityService.createDRP(body.drp);
      return NextResponse.json({ success: true, data: drp });
    }

    if (action === "ai-assess-risk") {
      const { processId } = body;
      const assessment =
        await businessContinuityService.aiAssessRisk(processId);
      return NextResponse.json({ success: true, data: assessment });
    }

    if (action === "predict-disruption") {
      const { processId, timeHorizon } = body;
      const prediction = await businessContinuityService.predictDisruption(
        processId,
        timeHorizon,
      );
      return NextResponse.json({ success: true, data: prediction });
    }

    if (action === "simulate-scenario") {
      const { bcpId, scenario } = body;
      const simulation = await businessContinuityService.simulateScenario(
        bcpId,
        scenario,
      );
      return NextResponse.json({ success: true, data: simulation });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    const qhseError = QHSEErrorHandler.handleError(
      error,
      "Business Continuity API",
    );
    return NextResponse.json(QHSEErrorHandler.formatErrorResponse(qhseError), {
      status: qhseError.statusCode,
    });
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.business-continuity",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.business-continuity",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
