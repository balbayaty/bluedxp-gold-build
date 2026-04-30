/**
 * Unified Vision API Route
 * Single endpoint for all vision capabilities across all modules
 */

import { NextRequest, NextResponse } from "next/server";
import unifiedVisionService, {
  UnifiedVisionConfig,
} from "@/lib/services/ai/unifiedVisionService";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const formData = await request.formData();
    const mediaFile = formData.get("media") as File;
    const context = formData.get("context") as string | null;
    const moduleId =
      (formData.get("module") as
        | "wms"
        | "qhse"
        | "iso-ims"
        | "tms"
        | "general") || "general";
    const moduleContext = formData.get("moduleContext") as string | null;

    // Feature flags
    const enableObjectTracking =
      formData.get("enableObjectTracking") !== "false";
    const enableAnomalyDetection =
      formData.get("enableAnomalyDetection") !== "false";
    const enableVideoAnalysis = formData.get("enableVideoAnalysis") !== "false";
    const enableRAG = formData.get("enableRAG") !== "false";
    const enableLearning = formData.get("enableLearning") !== "false";

    if (!mediaFile) {
      return NextResponse.json(
        { success: false, error: "No media file provided" },
        { status: 400 },
      );
    }

    const config: UnifiedVisionConfig = {
      module: moduleId,
      moduleContext: moduleContext || context || undefined,
      enableObjectTracking,
      enableAnomalyDetection,
      enableVideoAnalysis,
      enhanced: {
        enableRAG,
        enableLearning,
        enableIndustryAnalysis: true,
        extractText: true,
        searchSimilarCases: true,
        industryContext:
          moduleId === "wms"
            ? "logistics"
            : moduleId === "qhse"
              ? "healthcare"
              : moduleId === "iso-ims"
                ? "manufacturing"
                : "general",
      },
    };

    // Analyze with unified service
    const result = await unifiedVisionService.analyze(
      mediaFile,
      context || undefined,
      config,
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Unified vision analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unified vision analysis failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await apiAuthMiddleware(request);
  if (!auth.authorized) return auth.response!;

  return NextResponse.json({
    success: true,
    service: "Unified Vision Service",
    description:
      "Comprehensive AI vision platform with RAG, object tracking, anomaly detection, and module integration",
    capabilities: [
      "Enhanced vision analysis with RAG",
      "Object detection and tracking",
      "Anomaly detection",
      "Video analysis",
      "Industry-specific analysis",
      "Module integration (WMS, QHSE, ISO-IMS, TMS)",
      "Continuous learning",
      "Multimodal intelligence",
    ],
    modules: ["wms", "qhse", "iso-ims", "tms", "general"],
    status: "available",
  });
}
