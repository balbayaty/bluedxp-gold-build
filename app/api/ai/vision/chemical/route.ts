/**
 * Enhanced Chemical Vision Analysis API Route
 * Specialized AI vision for chemical safety, labels, MSDS, and storage
 * Uses chemicalVisionService for comprehensive chemical analysis
 */

import { NextRequest, NextResponse } from "next/server";
import chemicalVisionService from "@/lib/services/ai/chemicalVisionService";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const extractLabels = formData.get("extractLabels") !== "false";
    const checkCompatibility = formData.get("checkCompatibility") !== "false";
    const analyzePPE = formData.get("analyzePPE") !== "false";
    const analyzeStorage = formData.get("analyzeStorage") !== "false";

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 },
      );
    }

    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 },
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Analyze with chemical vision service
    const result = await chemicalVisionService.analyzeChemicalImage(
      buffer,
      imageFile.type,
      {
        extractLabels,
        checkCompatibility,
        analyzePPE,
        analyzeStorage,
      },
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Chemical vision analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze chemical image",
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
    available: true,
    message: "Chemical vision analysis service is available",
    capabilities: [
      "Chemical label extraction",
      "GHS symbol recognition",
      "NFPA diamond detection",
      "Chemical compatibility checking",
      "PPE requirement analysis",
      "Storage condition analysis",
    ],
  });
}
