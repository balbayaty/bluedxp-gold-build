/**
 * Privacy-Preserving Vision API
 * GDPR-compliant vision analysis with privacy filters
 */

import { NextRequest, NextResponse } from "next/server";
import { privacyPreservingVisionService } from "@/lib/services/ai/vision/privacyPreservingVisionService";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { logger } from "@/lib/services/observability/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const context = (formData.get("context") as string) || "General analysis";
    const configType = (formData.get("configType") as string) || "warehouse";

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "Image file is required" },
        { status: 400 },
      );
    }

    // Get privacy config based on type
    let privacyConfig;
    switch (configType) {
      case "bodycam":
        privacyConfig =
          privacyPreservingVisionService.createBodyCamPrivacyFilter();
        break;
      case "warehouse":
        privacyConfig =
          privacyPreservingVisionService.createWarehousePrivacyFilter();
        break;
      case "public":
        privacyConfig =
          privacyPreservingVisionService.createPublicAreaPrivacyFilter();
        break;
      default:
        privacyConfig =
          privacyPreservingVisionService.createWarehousePrivacyFilter();
    }

    // Check if privacy protection is needed
    const requiresProtection =
      privacyPreservingVisionService.requiresPrivacyProtection(context);

    if (!requiresProtection && configType === "auto") {
      // If auto mode and no protection needed, return standard analysis
      return NextResponse.json({
        success: true,
        privacyProtected: false,
        message: "Privacy protection not required for this context",
      });
    }

    // Perform privacy-preserved analysis
    const result = await privacyPreservingVisionService.analyzeWithPrivacy(
      imageFile,
      context,
      privacyConfig,
    );

    // Get compliance report
    const complianceReport =
      privacyPreservingVisionService.getPrivacyComplianceReport(result);

    return NextResponse.json({
      success: true,
      result,
      complianceReport,
      privacyProtected: result.privacyFiltered,
    });
  } catch (error) {
    logger.error(
      "Privacy-preserving vision API error",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "ai-vision",
        service: "privacy-preserving",
      },
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
