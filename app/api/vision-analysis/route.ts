/**
 * Enhanced Vision Analysis API Route
 * Comprehensive image analysis with Firebase Storage, Firestore, and full response structure
 * Adapted from chemcheck-ai for Hazalyze Platform
 */

import { NextRequest, NextResponse } from "next/server";
import visionService from "@/lib/services/ai/visionService";
import { storageService } from "@/lib/services/firebase/storage";
import { dbService } from "@/lib/services/firebase/database";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";
// Use crypto.randomUUID() if available, otherwise fallback
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `vision-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Comprehensive analysis result structure
export interface ComprehensiveAnalysisResult {
  isCompliant: boolean;
  complianceScore: number;
  hazards: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
    recommendations?: string;
  }>;
  compatibility?: {
    isPotentialIssue: boolean;
    description: string;
    recommendations?: string;
  };
  detectedItems: Array<{
    type: string;
    name?: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  summary: string;
  // Include full vision service result
  visionResult: any;
  // Metadata
  fileUrl?: string;
  thumbnailUrl?: string;
  analysisId: string;
  timestamp: string;
  mode: string;
}

// Calculate comprehensive analysis from vision service result
function calculateComprehensiveAnalysis(
  visionResult: any,
  mode: string,
): ComprehensiveAnalysisResult {
  const safetyIssues = visionResult.analysis?.safetyIssues || [];
  const qualityIssues = visionResult.analysis?.qualityIssues || [];
  const complianceIssues = visionResult.analysis?.complianceIssues || [];
  const detectedObjects = visionResult.analysis?.detectedObjects || [];

  // Calculate compliance score
  const totalIssues =
    safetyIssues.length + qualityIssues.length + complianceIssues.length;
  const criticalIssues = safetyIssues.filter(
    (i: any) => i.severity === "critical",
  ).length;
  const highIssues = safetyIssues.filter(
    (i: any) => i.severity === "high",
  ).length;

  let complianceScore = 100;
  complianceScore -= totalIssues * 5; // -5 points per issue
  complianceScore -= criticalIssues * 15; // Additional -15 for critical
  complianceScore -= highIssues * 10; // Additional -10 for high
  complianceScore = Math.max(0, Math.min(100, complianceScore));

  const isCompliant = complianceScore >= 70;

  // Convert safety issues to hazards
  const hazards = safetyIssues.map((issue: any) => ({
    type: issue.issue || "Safety Issue",
    severity:
      issue.severity === "critical"
        ? "high"
        : issue.severity === "high"
          ? "high"
          : issue.severity === "medium"
            ? "medium"
            : ("low" as "low" | "medium" | "high"),
    description: issue.issue || "",
    recommendations: issue.location
      ? `Address issue at ${issue.location}`
      : "Review and address safety concern",
  }));

  // Add quality issues as hazards if they're safety-related
  qualityIssues.forEach((issue: any) => {
    if (
      issue.severity === "critical" ||
      issue.type === "damage" ||
      issue.type === "contamination"
    ) {
      hazards.push({
        type: `Quality: ${issue.type}`,
        severity:
          issue.severity === "critical"
            ? "high"
            : issue.severity === "major"
              ? "medium"
              : ("low" as "low" | "medium" | "high"),
        description: issue.issue || "",
        recommendations: "Address quality issue immediately",
      });
    }
  });

  // Add compliance issues as hazards
  complianceIssues.forEach((issue: any) => {
    hazards.push({
      type: `Compliance: ${issue.standard}`,
      severity:
        issue.confidence > 80
          ? "high"
          : issue.confidence > 60
            ? "medium"
            : ("low" as "low" | "medium" | "high"),
      description: issue.violation || "",
      recommendations: issue.recommendation || "Review compliance requirements",
    });
  });

  // Convert detected objects to detected items
  const detectedItems = detectedObjects.map((obj: any) => ({
    type: obj.object?.toLowerCase().includes("chemical")
      ? "chemical"
      : obj.object?.toLowerCase().includes("ppe") ||
          obj.object?.toLowerCase().includes("glove") ||
          obj.object?.toLowerCase().includes("goggle")
        ? "ppe"
        : obj.object?.toLowerCase().includes("cabinet") ||
            obj.object?.toLowerCase().includes("storage")
          ? "equipment"
          : "other",
    name: obj.object,
    confidence: obj.confidence || 0.5,
    boundingBox: obj.boundingBox,
  }));

  // Generate compatibility analysis (for chemical mode)
  let compatibility:
    | {
        isPotentialIssue: boolean;
        description: string;
        recommendations?: string;
      }
    | undefined;
  if (mode === "chemical") {
    const chemicalItems = detectedItems.filter(
      (item: any) => item.type === "chemical",
    );
    if (chemicalItems.length > 1) {
      compatibility = {
        isPotentialIssue: true,
        description: `Multiple chemicals detected (${chemicalItems.length}). Verify compatibility before storage.`,
        recommendations:
          "Check chemical compatibility matrix before storing together",
      };
    } else {
      compatibility = {
        isPotentialIssue: false,
        description: "Single chemical or compatible storage detected",
      };
    }
  }

  // Generate summary
  let summary = visionResult.analysis?.description || "Analysis completed";
  if (totalIssues > 0) {
    summary += `. ${totalIssues} issue(s) detected. `;
    if (criticalIssues > 0) {
      summary += `${criticalIssues} critical issue(s) requiring immediate attention. `;
    }
    if (!isCompliant) {
      summary += "Compliance score below threshold. Action required.";
    }
  } else {
    summary += ". No issues detected. Area appears compliant.";
  }

  return {
    isCompliant,
    complianceScore,
    hazards,
    compatibility,
    detectedItems,
    summary,
    visionResult,
    analysisId: visionResult.id || generateUUID(),
    timestamp: visionResult.timestamp || new Date().toISOString(),
    mode,
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const context = formData.get("context") as string | null;
    const mode =
      (formData.get("mode") as "general" | "chemical" | "ppe" | "storage") ||
      "general";
    const provider =
      (formData.get("provider") as "openai" | "anthropic" | "auto") || "auto";
    const enableRootCause = formData.get("enableRootCause") === "true";
    const saveToFirebase = formData.get("saveToFirebase") !== "false"; // Default to true

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 },
      );
    }

    // Build context based on mode if not provided
    let analysisContext = context;
    if (!analysisContext) {
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
    }

    // Analyze image using vision service
    const visionResult = await visionService.analyzeImage(
      imageFile,
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
        const ext = imageFile.name.split(".").pop() || "jpg";
        const storagePath = `vision_analysis/${fileId}.${ext}`;

        fileUrl = await storageService.uploadFile(imageFile, storagePath);

        // If thumbnail exists, upload it too
        if (visionResult.thumbnailUrl) {
          try {
            // Convert thumbnail URL to blob if needed
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
        // Continue without Firebase storage
      }
    }

    // Calculate comprehensive analysis
    const comprehensiveResult = calculateComprehensiveAnalysis(
      visionResult,
      mode,
    );

    // Add Firebase URLs
    if (fileUrl) comprehensiveResult.fileUrl = fileUrl;
    if (thumbnailUrl) comprehensiveResult.thumbnailUrl = thumbnailUrl;

    // Save to Firestore if enabled
    if (saveToFirebase) {
      try {
        const analysisData = {
          ...comprehensiveResult,
          fileUrl: fileUrl || null,
          thumbnailUrl: thumbnailUrl || null,
          analysisMode: mode,
          provider: visionResult.metadata?.provider || provider,
          model: visionResult.metadata?.model || "unknown",
          processingTime: visionResult.metadata?.processingTime || 0,
          createdAt: new Date().toISOString(),
        };

        await dbService.addDocument("vision_analyses", analysisData);
        console.log(
          "Analysis saved to Firestore:",
          comprehensiveResult.analysisId,
        );
      } catch (dbError) {
        console.error("Firestore save error:", dbError);
        // Continue without Firestore save
      }
    }

    return NextResponse.json({
      success: true,
      ...comprehensiveResult,
    });
  } catch (error) {
    console.error("Vision analysis API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const mode = searchParams.get("mode");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Fetch from Firestore
    try {
      let analyses = await dbService.getDocuments("vision_analyses");

      // Filter by mode if provided
      if (mode) {
        analyses = analyses.filter((a: any) => a.analysisMode === mode);
      }

      // Filter by date range if provided
      if (startDate || endDate) {
        analyses = analyses.filter((a: any) => {
          const createdAt = new Date(a.createdAt || a.timestamp);
          if (startDate && createdAt < new Date(startDate)) return false;
          if (endDate && createdAt > new Date(endDate)) return false;
          return true;
        });
      }

      // Sort by date (newest first) and limit
      analyses.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.timestamp || 0);
        const dateB = new Date(b.createdAt || b.timestamp || 0);
        return dateB.getTime() - dateA.getTime();
      });

      analyses = analyses.slice(0, limit);

      return NextResponse.json({
        success: true,
        analyses,
        count: analyses.length,
      });
    } catch (dbError) {
      console.error("Firestore fetch error:", dbError);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch analysis history",
        analyses: [],
      });
    }
  } catch (error) {
    console.error("Vision analysis GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
