/**
 * Auto-Suggest CAPA from NCR Created from Vision Analysis
 * Automatically suggests CAPA when NCR is created from vision analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";

interface NCRData {
  ncrId: string;
  subject: string;
  description: string;
  rootCause?: string;
  immediateAction?: string;
  visionAnalysisId?: string;
  visionAnalysisUrl?: string;
  complianceScore?: number;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const {
      ncrData,
      assignedTo,
      targetDate,
      linkedCustomer,
      linkedSupplier,
    }: {
      ncrData: NCRData;
      assignedTo?: string;
      targetDate?: string;
      linkedCustomer?: string;
      linkedSupplier?: string;
    } = body;

    if (!ncrData || !ncrData.ncrId) {
      return NextResponse.json(
        { success: false, error: "NCR data is required" },
        { status: 400 },
      );
    }

    // Build CAPA subject
    const subject = `CAPA for Vision Analysis NCR: ${ncrData.subject}`;

    // Build CAPA description
    let description = `Corrective and Preventive Action created from NCR ${ncrData.ncrId}\n\n`;
    description += `Related NCR: ${ncrData.subject}\n`;

    if (ncrData.visionAnalysisId) {
      description += `Vision Analysis ID: ${ncrData.visionAnalysisId}\n`;
    }

    if (ncrData.complianceScore !== undefined) {
      description += `Original Compliance Score: ${ncrData.complianceScore}/100\n`;
    }

    description += `\nNCR Description:\n${ncrData.description}\n\n`;

    if (ncrData.immediateAction) {
      description += `Immediate Action Taken:\n${ncrData.immediateAction}\n\n`;
    }

    // Build action plan from root cause or recommendations
    let actionPlan = "Action Plan:\n";
    if (ncrData.rootCause) {
      actionPlan += `1. Address root cause: ${ncrData.rootCause}\n`;
    } else {
      actionPlan += `1. Investigate root cause of non-conformance\n`;
    }

    if (ncrData.visionAnalysisId) {
      actionPlan += `2. Review vision analysis findings and implement corrective measures\n`;
      actionPlan += `3. Re-analyze area after corrective actions to verify compliance\n`;
    } else {
      actionPlan += `2. Implement corrective actions based on NCR findings\n`;
      actionPlan += `3. Verify effectiveness of corrective actions\n`;
    }

    actionPlan += `4. Update procedures and training as needed\n`;
    actionPlan += `5. Monitor for recurrence`;

    // Determine priority based on NCR
    const priority =
      ncrData.complianceScore !== undefined && ncrData.complianceScore < 50
        ? "High"
        : "Medium";

    // Calculate target date (default: 30 days from now)
    const defaultTargetDate = new Date();
    defaultTargetDate.setDate(defaultTargetDate.getDate() + 30);
    const capaTargetDate =
      targetDate || defaultTargetDate.toISOString().split("T")[0];

    // Create CAPA via ERPNext API
    try {
      const capaResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}/api/erpnext/capas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject,
            description: `${description}\n\n${actionPlan}`,
            capa_type: "Corrective Action",
            capa_source: "NCR",
            priority,
            exp_end_date: capaTargetDate,
            assigned_to: assignedTo || undefined,
            root_cause:
              ncrData.rootCause || "To be determined through investigation",
            linkedNCR: ncrData.ncrId,
            linked_customer: linkedCustomer || undefined,
            linked_supplier: linkedSupplier || undefined,
            // Link to vision analysis
            customVisionAnalysisId: ncrData.visionAnalysisId,
            customVisionAnalysisUrl: ncrData.visionAnalysisUrl,
          }),
        },
      );

      const capaData = await capaResponse.json();

      if (capaResponse.ok && capaData.success) {
        return NextResponse.json({
          success: true,
          message: "CAPA suggested successfully from NCR",
          capa: capaData.data || capaData.capa,
          ncrId: ncrData.ncrId,
          capaId: capaData.data?.name || capaData.capa?.name,
        });
      } else {
        throw new Error(capaData.error || "Failed to create CAPA");
      }
    } catch (capaError) {
      console.error("Error creating CAPA:", capaError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create CAPA in ERPNext",
          details:
            capaError instanceof Error ? capaError.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Auto-CAPA creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
