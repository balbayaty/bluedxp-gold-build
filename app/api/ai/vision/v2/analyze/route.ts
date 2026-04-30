/**
 * Enhanced Vision Analysis API V2
 * Non-breaking: New route, doesn't affect existing /api/ai/vision
 */

import { NextRequest, NextResponse } from "next/server";
import { selfLearningVisionService } from "@/lib/services/ai/vision/v2/selfLearningVisionService";
import { crossModuleOrchestrator } from "@/lib/services/vision-integration/crossModuleOrchestrator";
import { liabilityEngine } from "@/lib/services/liability/liabilityEngine";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const moduleId = (formData.get("module") as string) || "wms";
    const entityType = (formData.get("entityType") as string) || "damage";
    const entityId = formData.get("entityId") as string;
    const metadata = formData.get("metadata")
      ? JSON.parse(formData.get("metadata") as string)
      : {};
    // Enforce tenant from authenticated context if caller didn't pass it
    if (!metadata.tenantId) metadata.tenantId = auth.context!.tenantId;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    // Step 1: Analyze with self-learning vision service
    const visionAnalysis = await selfLearningVisionService.analyzeDamagePhoto(
      imageFile,
      {
        damageRecordId: entityId,
        area: metadata.area,
        equipment: metadata.equipment,
        carrier: metadata.carrier,
        supplier: metadata.supplier,
        tenantId: metadata.tenantId,
      },
    );

    // Step 2: Cross-module integration
    const integrationResult =
      await crossModuleOrchestrator.processVisionIntegration({
        module: moduleId as any,
        entityType,
        entityId,
        photo: imageFile,
        metadata,
        tenantId: metadata.tenantId,
      });

    // Step 3: Liability assessment (if damage)
    let liabilityAssessment = null;
    if (entityType === "damage" && metadata.totalValue) {
      liabilityAssessment = await liabilityEngine.assessLiability(entityId, {
        damagePhoto: imageFile,
        damageType: metadata.damageType,
        severity: metadata.severity,
        area: metadata.area,
        equipment: metadata.equipment,
        carrier: metadata.carrier,
        supplier: metadata.supplier,
        totalValue: metadata.totalValue,
        reportedAt: new Date(),
        tenantId: metadata.tenantId,
      });
    }

    return NextResponse.json({
      success: true,
      visionAnalysis: {
        analysis: visionAnalysis.analysis,
        patternMatches: visionAnalysis.patternMatches,
        suggestedRules: visionAnalysis.suggestedRules,
        preventionSuggestions: visionAnalysis.preventionSuggestions,
        learningMetadata: visionAnalysis.learningMetadata,
      },
      integration: {
        integrationId: integrationResult.integrationId,
        actions: integrationResult.actions,
        executedActions: integrationResult.executedActions,
        recommendations: integrationResult.recommendations,
      },
      liability: liabilityAssessment
        ? {
            assessmentId: liabilityAssessment.id,
            primaryFault: liabilityAssessment.primaryFault,
            faultPercentage: liabilityAssessment.faultPercentage,
            financialImpact: liabilityAssessment.financialImpact,
            insurance: liabilityAssessment.insurance,
            compliance: liabilityAssessment.compliance,
          }
        : null,
    });
  } catch (error) {
    console.error("Vision analysis error:", error);
    return NextResponse.json(
      {
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
