/**
 * Food Safety API Route
 * HACCP, ISO 22000, FSMA compliance
 * Comprehensive validation and error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { foodSafetyService } from "@/lib/services/qhse/foodSafetyService";
import { QHSEValidator } from "@/lib/services/qhse/utils/validation";
import { QHSEErrorHandler } from "@/lib/services/qhse/utils/errorHandler";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const tenantId = searchParams.get("tenantId");
    const customerId = searchParams.get("customerId");
    const facilityId = searchParams.get("facilityId");

    // Validate tenant ID
    if (tenantId) {
      const tenantValidation = QHSEValidator.validateTenantId(tenantId);
      if (!tenantValidation.valid) {
        const error = QHSEErrorHandler.createValidationError(
          tenantValidation.errors,
        );
        return NextResponse.json(QHSEErrorHandler.formatErrorResponse(error), {
          status: error.statusCode,
        });
      }
    }

    if (action === "haccp-plans") {
      const plans = await foodSafetyService.listHACCPPlans({
        tenantId,
        customerId,
        facilityId,
      });
      return NextResponse.json({ success: true, data: plans });
    }

    if (action === "temperature-monitoring") {
      const monitoring = await foodSafetyService.getAllTemperatureMonitoring({
        tenantId,
        facilityId,
      });
      return NextResponse.json({ success: true, data: monitoring });
    }

    if (action === "incidents") {
      const incidents = await foodSafetyService.listFoodSafetyIncidents({
        tenantId,
      });
      return NextResponse.json({ success: true, data: incidents });
    }

    if (action === "compliance") {
      const standard = searchParams.get("standard") || "HACCP";
      let compliance;
      if (standard === "HACCP") {
        const planId = searchParams.get("planId");
        if (!planId) {
          return NextResponse.json(
            { success: false, error: "planId required for HACCP compliance" },
            { status: 400 },
          );
        }
        compliance = await foodSafetyService.checkHACCPCompliance(planId);
      } else if (standard === "FSMA") {
        compliance = await foodSafetyService.checkFSMACompliance(
          tenantId || undefined,
        );
      } else if (standard === "ISO22000") {
        compliance = await foodSafetyService.checkISO22000Compliance(
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
    const qhseError = QHSEErrorHandler.handleError(error, "Food Safety API");
    return NextResponse.json(QHSEErrorHandler.formatErrorResponse(qhseError), {
      status: qhseError.statusCode,
    });
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const action = body.action;

    if (!action) {
      const error = QHSEErrorHandler.createValidationError([
        "action is required",
      ]);
      return NextResponse.json(QHSEErrorHandler.formatErrorResponse(error), {
        status: error.statusCode,
      });
    }

    if (action === "create-haccp-plan") {
      // Validate HACCP plan
      const validation = QHSEValidator.validateHACCPPlan(body.plan);
      if (!validation.valid) {
        const error = QHSEErrorHandler.createValidationError(validation.errors);
        return NextResponse.json(QHSEErrorHandler.formatErrorResponse(error), {
          status: error.statusCode,
        });
      }

      const plan = await foodSafetyService.createHACCPPlan(body.plan);
      return NextResponse.json({ success: true, data: plan });
    }

    if (action === "report-incident") {
      const incident = await foodSafetyService.reportFoodSafetyIncident(
        body.incident,
      );
      return NextResponse.json({ success: true, data: incident });
    }

    if (action === "temperature-reading") {
      // Validate temperature reading
      const validation = QHSEValidator.validateTemperatureReading({
        sensorId: body.sensorId,
        temperature: body.temperature,
        timestamp: body.timestamp,
      });
      if (!validation.valid) {
        const error = QHSEErrorHandler.createValidationError(validation.errors);
        return NextResponse.json(QHSEErrorHandler.formatErrorResponse(error), {
          status: error.statusCode,
        });
      }

      await foodSafetyService.processTemperatureReading(
        body.sensorId,
        body.temperature,
        new Date(body.timestamp),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "ai-detect-hazards") {
      const hazards = await foodSafetyService.aiDetectHazards(
        body.processStepId,
      );
      return NextResponse.json({ success: true, data: hazards });
    }

    if (action === "predict-contamination") {
      const prediction = await foodSafetyService.predictContaminationRisk(
        body.productId,
        body.processStepId,
      );
      return NextResponse.json({ success: true, data: prediction });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    const qhseError = QHSEErrorHandler.handleError(error, "Food Safety API");
    return NextResponse.json(QHSEErrorHandler.formatErrorResponse(qhseError), {
      status: qhseError.statusCode,
    });
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.food-safety",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.food-safety",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
