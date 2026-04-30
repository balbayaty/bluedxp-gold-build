/**
 * Batch Vision Analysis API Route
 * Process multiple images in batch
 */

import { NextRequest, NextResponse } from "next/server";
import visionService from "@/lib/services/ai/visionService";
import { storageService } from "@/lib/services/firebase/storage";
import { dbService } from "@/lib/services/firebase/database";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `vision-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const formData = await request.formData();
    const files = formData.getAll("images") as File[];
    const mode =
      (formData.get("mode") as "general" | "chemical" | "ppe" | "storage") ||
      "general";
    const provider =
      (formData.get("provider") as "openai" | "anthropic" | "auto") || "auto";
    const enableRootCause = formData.get("enableRootCause") === "true";
    const saveToFirebase = formData.get("saveToFirebase") !== "false";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No image files provided" },
        { status: 400 },
      );
    }

    // Build context based on mode
    let analysisContext: string;
    switch (mode) {
      case "chemical":
        analysisContext =
          "Chemical storage compatibility and safety analysis. Check for incompatible chemicals, proper labeling, and storage compliance.";
        break;
      case "ppe":
        analysisContext =
          "PPE compliance check. Verify appropriate personal protective equipment is being worn for the task and chemicals being handled.";
        break;
      case "storage":
        analysisContext =
          "Storage area safety and compliance. Check for proper chemical segregation, housekeeping, emergency equipment, and compliance with storage guidelines.";
        break;
      default:
        analysisContext =
          "General warehouse operations quality and safety check. Identify any safety hazards, quality issues, or compliance concerns.";
    }

    const results: any[] = [];
    const failedFiles: string[] = [];

    // Process each file
    for (const file of files) {
      try {
        // Analyze image
        const visionResult = await visionService.analyzeImage(
          file,
          analysisContext,
          {
            provider,
            enableRootCauseAnalysis: enableRootCause,
            enableThumbnailGeneration: true,
          },
        );

        // Upload to Firebase Storage if enabled
        let fileUrl: string | undefined;
        let thumbnailUrl: string | undefined;

        if (saveToFirebase) {
          try {
            const fileId = generateUUID();
            const ext = file.name.split(".").pop() || "jpg";
            const storagePath = `vision_analysis/${fileId}.${ext}`;

            fileUrl = await storageService.uploadFile(file, storagePath);

            if (visionResult.thumbnailUrl) {
              try {
                if (visionResult.thumbnailUrl.startsWith("data:")) {
                  const response = await fetch(visionResult.thumbnailUrl);
                  const blob = await response.blob();
                  const thumbnailPath = `vision_analysis/thumbnails/${fileId}.${ext}`;
                  thumbnailUrl = await storageService.uploadFile(
                    blob,
                    thumbnailPath,
                  );
                } else {
                  thumbnailUrl = visionResult.thumbnailUrl;
                }
              } catch (thumbError) {
                console.warn("Thumbnail upload failed:", thumbError);
              }
            }
          } catch (storageError) {
            console.error("Firebase Storage upload error:", storageError);
          }
        }

        // Calculate comprehensive analysis (simplified version)
        const safetyIssues = visionResult.analysis?.safetyIssues || [];
        const qualityIssues = visionResult.analysis?.qualityIssues || [];
        const complianceIssues = visionResult.analysis?.complianceIssues || [];
        const totalIssues =
          safetyIssues.length + qualityIssues.length + complianceIssues.length;
        const criticalIssues = safetyIssues.filter(
          (i: any) => i.severity === "critical",
        ).length;
        const highIssues = safetyIssues.filter(
          (i: any) => i.severity === "high",
        ).length;

        let complianceScore = 100;
        complianceScore -= totalIssues * 5;
        complianceScore -= criticalIssues * 15;
        complianceScore -= highIssues * 10;
        complianceScore = Math.max(0, Math.min(100, complianceScore));

        const result = {
          success: true,
          fileName: file.name,
          analysisId: visionResult.id || generateUUID(),
          timestamp: visionResult.timestamp || new Date().toISOString(),
          isCompliant: complianceScore >= 70,
          complianceScore,
          totalIssues,
          criticalIssues,
          fileUrl,
          thumbnailUrl,
          visionResult,
        };

        results.push(result);

        // Save to Firestore if enabled
        if (saveToFirebase) {
          try {
            await dbService.addDocument("vision_analyses", {
              ...result,
              analysisMode: mode,
              provider: visionResult.metadata?.provider || provider,
              model: visionResult.metadata?.model || "unknown",
              processingTime: visionResult.metadata?.processingTime || 0,
              createdAt: new Date().toISOString(),
            });
          } catch (dbError) {
            console.error("Firestore save error:", dbError);
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        failedFiles.push(file.name);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      failedFiles: failedFiles.length > 0 ? failedFiles : undefined,
      totalProcessed: results.length,
      totalFailed: failedFiles.length,
    });
  } catch (error) {
    console.error("Batch vision analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
