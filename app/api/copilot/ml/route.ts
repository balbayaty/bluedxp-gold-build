/**
 * Copilot ML API
 * Endpoints for ML model predictions and training data
 * 4IR & 5IR Aligned • Continuous Learning • Predictive Intelligence
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { copilotMLRegistry } from "@/lib/services/copilot/integrations/mlRegistryIntegration";
import { copilotMLFeedback } from "@/lib/services/copilot/mlFeedbackService";

interface PredictionRequest {
  query: string;
  moduleContext?: string;
  conversationHistory?: string[];
}

interface TrainingDataRequest {
  query: string;
  intent: string;
  toolsUsed: string[];
  confidence: number;
  isPositive: boolean;
  rating?: number;
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "stats";

    switch (action) {
      case "stats": {
        const feedbackStats = copilotMLFeedback.getStats(context.tenantId);
        const patterns = copilotMLFeedback.getPatterns(context.tenantId);
        
        return NextResponse.json({
          success: true,
          stats: feedbackStats,
          patterns: patterns.slice(0, 20),
          learningStatus: {
            isActive: feedbackStats.totalFeedback >= 10,
            samplesCollected: feedbackStats.totalFeedback,
            patternsIdentified: patterns.length,
            topPatterns: patterns.slice(0, 5).map(p => ({
              intent: p.patternKey,
              occurrences: p.totalOccurrences,
              successRate: Math.round(p.successRate * 100),
            })),
          },
        });
      }

      case "training-data": {
        const trainingData = copilotMLFeedback.getTrainingData(context.tenantId);
        return NextResponse.json({
          success: true,
          data: trainingData.slice(-100), // Last 100 items
          totalCount: trainingData.length,
          exportUrl: `/api/copilot/ml/export?tenantId=${context.tenantId}`,
        });
      }

      case "export": {
        const exportData = copilotMLFeedback.exportTrainingData(context.tenantId);
        return new NextResponse(exportData, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="copilot-training-data-${Date.now()}.json"`,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("[ML API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error?.message },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || "predict";

    switch (action) {
      case "predict": {
        const predictionRequest = body as PredictionRequest;
        
        if (!predictionRequest.query) {
          return NextResponse.json(
            { error: "query is required for predictions" },
            { status: 400 }
          );
        }

        const recommendations = await copilotMLRegistry.getRecommendations(
          context.tenantId,
          predictionRequest.query,
          {
            moduleId: predictionRequest.moduleContext,
            conversationHistory: predictionRequest.conversationHistory,
          }
        );

        // Also get feedback-based recommendations
        const feedbackRecs = copilotMLFeedback.getRecommendations(
          context.tenantId,
          predictionRequest.query
        );

        return NextResponse.json({
          success: true,
          query: predictionRequest.query,
          recommendations: recommendations.map(r => ({
            type: r.type,
            value: r.value,
            confidence: Math.round(r.confidence * 100),
            source: r.source,
          })),
          feedbackLearning: {
            suggestedTools: feedbackRecs.suggestedTools,
            confidenceBoost: feedbackRecs.confidenceBoost,
            hasSuccessfulPatterns: feedbackRecs.similarSuccessfulResponses.length > 0,
          },
        });
      }

      case "train": {
        const trainingRequest = body as TrainingDataRequest;
        
        if (!trainingRequest.query || !trainingRequest.intent) {
          return NextResponse.json(
            { error: "query and intent are required for training" },
            { status: 400 }
          );
        }

        await copilotMLRegistry.sendTrainingData(context.tenantId, {
          query: trainingRequest.query,
          intent: trainingRequest.intent,
          toolsUsed: trainingRequest.toolsUsed || [],
          confidence: trainingRequest.confidence || 0.5,
          isPositive: trainingRequest.isPositive,
          rating: trainingRequest.rating,
        });

        return NextResponse.json({
          success: true,
          message: "Training data submitted successfully",
        });
      }

      case "register-models": {
        await copilotMLRegistry.registerCopilotModels();
        return NextResponse.json({
          success: true,
          message: "Copilot ML models registered",
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("[ML API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error?.message },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
