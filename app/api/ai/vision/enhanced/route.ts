/**
 * Enhanced Vision API Route
 * RAG-enhanced AI vision analysis with knowledge base integration
 */

import { NextRequest, NextResponse } from "next/server";
import enhancedVisionService, {
  EnhancedVisionConfig,
} from "@/lib/services/ai/enhancedVisionService";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const context = formData.get("context") as string | null;
    const industryContext =
      (formData.get("industryContext") as
        | "manufacturing"
        | "logistics"
        | "healthcare"
        | "chemical"
        | "general") || "general";
    const enableRAG = formData.get("enableRAG") !== "false";
    const enableLearning = formData.get("enableLearning") !== "false";
    const extractText = formData.get("extractText") !== "false";
    const searchSimilarCases = formData.get("searchSimilarCases") !== "false";
    const provider =
      (formData.get("provider") as "openai" | "anthropic" | "auto") || "auto";

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 },
      );
    }

    const config: EnhancedVisionConfig = {
      enableRAG,
      enableLearning,
      enableIndustryAnalysis: true,
      industryContext,
      extractText,
      searchSimilarCases,
      provider,
      enableRootCauseAnalysis: true,
      enableThumbnailGeneration: true,
      maxKnowledgeResults: 5,
      learningThreshold: 0.7,
    };

    // Analyze with enhanced vision service
    const result = await enhancedVisionService.analyzeWithRAG(
      imageFile,
      context || undefined,
      config,
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Enhanced vision analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Enhanced vision analysis failed",
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
    service: "Enhanced Vision Service",
    capabilities: [
      "RAG-enhanced analysis",
      "Knowledge base integration",
      "Text extraction from images",
      "Similar case search",
      "Industry-specific analysis",
      "Continuous learning",
      "Multimodal intelligence",
    ],
    status: "available",
  });
}
