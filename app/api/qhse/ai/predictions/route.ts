/**
 * AI/ML Predictive Analytics API Route
 * 5IR/6IR Aligned Predictive Analytics
 * Comprehensive validation and error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { predictiveAnalyticsService } from "@/lib/services/qhse/ai/predictiveAnalyticsService";
import { QHSEErrorHandler } from "@/lib/services/qhse/utils/errorHandler";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (action === "models") {
      const models = await predictiveAnalyticsService.listModels();
      return NextResponse.json({ success: true, data: models });
    }

    if (action === "anomalies") {
      const entityType = searchParams.get("entityType");
      const severity = searchParams.get("severity");
      const acknowledged = searchParams.get("acknowledged");

      const anomalies = await predictiveAnalyticsService.getAnomalies({
        entityType: entityType || undefined,
        severity: severity as any,
        acknowledged:
          acknowledged === "true"
            ? true
            : acknowledged === "false"
              ? false
              : undefined,
      });
      return NextResponse.json({ success: true, data: anomalies });
    }

    if (action === "risk-prediction") {
      const entityType = searchParams.get("entityType");
      const entityId = searchParams.get("entityId");
      const riskType = searchParams.get("riskType");

      if (!entityType || !entityId || !riskType) {
        return NextResponse.json(
          {
            success: false,
            error: "entityType, entityId, and riskType required",
          },
          { status: 400 },
        );
      }

      const prediction = await predictiveAnalyticsService.predictRisk(
        entityType,
        entityId,
        riskType as any,
      );
      return NextResponse.json({ success: true, data: prediction });
    }

    if (action === "failure-prediction") {
      const equipmentId = searchParams.get("equipmentId");
      if (!equipmentId) {
        return NextResponse.json(
          { success: false, error: "equipmentId required" },
          { status: 400 },
        );
      }

      const failureType = searchParams.get("failureType");
      const prediction = await predictiveAnalyticsService.predictFailure(
        equipmentId,
        failureType as any,
      );
      return NextResponse.json({ success: true, data: prediction });
    }

    if (action === "quality-prediction") {
      const productId = searchParams.get("productId");
      const processId = searchParams.get("processId");
      const metric = searchParams.get("metric");

      if (!productId || !processId || !metric) {
        return NextResponse.json(
          {
            success: false,
            error: "productId, processId, and metric required",
          },
          { status: 400 },
        );
      }

      const prediction = await predictiveAnalyticsService.predictQuality(
        productId,
        processId,
        metric,
      );
      return NextResponse.json({ success: true, data: prediction });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    const qhseError = QHSEErrorHandler.handleError(error, "AI Predictions API");
    return NextResponse.json(QHSEErrorHandler.formatErrorResponse(qhseError), {
      status: qhseError.statusCode,
    });
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "register-model") {
      const model = await predictiveAnalyticsService.registerModel(body.model);
      return NextResponse.json({ success: true, data: model });
    }

    if (action === "detect-anomalies") {
      const { entityType, entityId, data } = body;
      const anomalies = await predictiveAnalyticsService.detectAnomalies(
        entityType,
        entityId,
        data,
      );
      return NextResponse.json({ success: true, data: anomalies });
    }

    if (action === "batch-predict-risk") {
      const predictions = await predictiveAnalyticsService.batchPredictRisk(
        body.entities,
      );
      return NextResponse.json({ success: true, data: predictions });
    }

    if (action === "batch-predict-failure") {
      const predictions = await predictiveAnalyticsService.batchPredictFailure(
        body.equipmentIds,
      );
      return NextResponse.json({ success: true, data: predictions });
    }

    if (action === "train-model") {
      const { modelId, trainingData } = body;
      const results = await predictiveAnalyticsService.trainModel(
        modelId,
        trainingData,
      );
      return NextResponse.json({ success: true, data: results });
    }

    if (action === "evaluate-model") {
      const { modelId, testData } = body;
      const results = await predictiveAnalyticsService.evaluateModel(
        modelId,
        testData,
      );
      return NextResponse.json({ success: true, data: results });
    }

    if (action === "recognize-patterns") {
      const { data, patternType } = body;
      const results = await predictiveAnalyticsService.recognizePatterns(
        data,
        patternType,
      );
      return NextResponse.json({ success: true, data: results });
    }

    if (action === "optimize-process") {
      const { processId, objectives } = body;
      const results = await predictiveAnalyticsService.optimizeProcess(
        processId,
        objectives,
      );
      return NextResponse.json({ success: true, data: results });
    }

    if (action === "acknowledge-anomaly") {
      const { anomalyId, userId } = body;
      const anomaly = await predictiveAnalyticsService.acknowledgeAnomaly(
        anomalyId,
        userId,
      );
      return NextResponse.json({ success: true, data: anomaly });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    const qhseError = QHSEErrorHandler.handleError(error, "AI Predictions API");
    return NextResponse.json(QHSEErrorHandler.formatErrorResponse(qhseError), {
      status: qhseError.statusCode,
    });
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.ai.predictions",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.ai.predictions",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
