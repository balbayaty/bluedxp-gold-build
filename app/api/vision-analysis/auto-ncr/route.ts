/**
 * Auto-Create NCR from Critical Vision Findings
 * Automatically creates NCR when compliance score < 70 or critical issues detected
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";

interface VisionAnalysisResult {
  analysisId: string;
  isCompliant: boolean;
  complianceScore: number;
  hazards: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
    recommendations?: string;
  }>;
  summary: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  mode: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const {
      analysisResult,
      assignedTo,
      reportedBy,
      location,
      linkedSO,
      linkedPO,
      linkedMaterial,
    }: {
      analysisResult: VisionAnalysisResult;
      assignedTo?: string;
      reportedBy?: string;
      location?: string;
      linkedSO?: string;
      linkedPO?: string;
      linkedMaterial?: string;
    } = body;

    if (!analysisResult) {
      return NextResponse.json(
        { success: false, error: "Analysis result is required" },
        { status: 400 },
      );
    }

    // Determine if NCR should be created
    const shouldCreateNCR =
      !analysisResult.isCompliant ||
      analysisResult.complianceScore < 70 ||
      analysisResult.hazards.some((h) => h.severity === "high");

    if (!shouldCreateNCR) {
      return NextResponse.json({
        success: false,
        message: "Analysis does not meet criteria for automatic NCR creation",
        reason:
          "Compliance score is acceptable and no critical issues detected",
      });
    }

    // Determine priority and severity
    const criticalHazards = analysisResult.hazards.filter(
      (h) => h.severity === "high",
    );
    const priority =
      criticalHazards.length > 0
        ? "High"
        : analysisResult.complianceScore < 50
          ? "High"
          : "Medium";
    const severity =
      criticalHazards.length > 0
        ? "Critical"
        : analysisResult.complianceScore < 50
          ? "Major"
          : "Minor";

    // Build NCR subject
    const subject = `Vision Analysis Non-Conformance - ${analysisResult.mode.charAt(0).toUpperCase() + analysisResult.mode.slice(1)} Mode`;

    // Build description with analysis details
    let description = `Automatically created from AI Vision Analysis (ID: ${analysisResult.analysisId})\n\n`;
    description += `Compliance Score: ${analysisResult.complianceScore}/100\n`;
    description += `Analysis Mode: ${analysisResult.mode}\n`;
    description += `Analysis Date: ${new Date(analysisResult.timestamp).toLocaleString()}\n\n`;

    if (location) {
      description += `Location: ${location}\n\n`;
    }

    description += `Summary: ${analysisResult.summary}\n\n`;

    if (analysisResult.hazards.length > 0) {
      description += `Detected Hazards:\n`;
      analysisResult.hazards.forEach((hazard, idx) => {
        description += `${idx + 1}. [${hazard.severity.toUpperCase()}] ${hazard.type}: ${hazard.description}\n`;
        if (hazard.recommendations) {
          description += `   Recommendation: ${hazard.recommendations}\n`;
        }
      });
    }

    // Build immediate action
    const immediateAction =
      criticalHazards.length > 0
        ? `Immediate action required due to critical hazards detected. Review analysis image and take corrective measures.`
        : `Review vision analysis findings and implement corrective actions. Compliance score below acceptable threshold.`;

    // Create NCR via ERPNext API
    try {
      const ncrResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}/api/erpnext/ncrs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject,
            description,
            ncType: "Process",
            priority,
            severity,
            immediateAction,
            rootCause: "To be determined through investigation",
            reportedBy: reportedBy || "System",
            assignedTo: assignedTo || undefined,
            linkedSO: linkedSO || undefined,
            linkedPO: linkedPO || undefined,
            linkedMaterial: linkedMaterial || undefined,
            // Link to vision analysis
            customVisionAnalysisId: analysisResult.analysisId,
            customVisionAnalysisUrl: analysisResult.fileUrl,
            customComplianceScore: analysisResult.complianceScore,
          }),
        },
      );

      const ncrData = await ncrResponse.json();

      if (ncrResponse.ok && ncrData.success) {
        return NextResponse.json({
          success: true,
          message: "NCR created successfully from vision analysis",
          ncr: ncrData.ncr || ncrData.data,
          analysisId: analysisResult.analysisId,
          ncrId: ncrData.ncr?.name || ncrData.data?.name,
        });
      } else {
        throw new Error(ncrData.error || "Failed to create NCR");
      }
    } catch (ncrError) {
      console.error("Error creating NCR:", ncrError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create NCR in ERPNext",
          details:
            ncrError instanceof Error ? ncrError.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Auto-NCR creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
