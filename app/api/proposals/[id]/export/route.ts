/**
 * Enhanced Proposal Export API
 * Export proposals with advanced formatting, charts, branding, etc.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { enhancedProposalService } from "@/lib/services/proposals/enhancedProposalService";
import { enhancedExportService } from "@/lib/services/proposals/enhancedExportService";
import type { ExportFormat } from "@/types/proposals";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function POSTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const { id } = nextContext?.params || { id: "" };
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const body = await request.json();
    const {
      format = "PDF",
      includeBenchmark = false,
      includeLearning = false,
      enhancedBranding = true,
      options = {},
    } = body;

    // Get proposal
    const proposal = await enhancedProposalService.getProposal(id);
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    // Verify tenant access
    if (proposal.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Export with enhanced service
    const result = await enhancedExportService.export({
      proposal,
      format: format as "PDF" | "DOCX" | "XLSX" | "HTML",
      options: {
        includeCharts: options.includeCharts !== false,
        includeInteractiveElements:
          options.includeInteractiveElements !== false,
        branding: options.branding || {
          companyName: "BlueDXP",
          primaryColor: "#3B82F6",
          secondaryColor: "#10B981",
          footerText: "Confidential - For Internal Use Only",
        },
        watermark: options.watermark,
        password: options.password,
        pageNumbers: options.pageNumbers !== false,
        tableOfContents: options.tableOfContents !== false,
        customSections: options.customSections,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Export failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName: result.fileName,
        fileSize: result.fileSize,
        fileUrl: result.fileUrl,
        format: result.format,
        generatedAt: result.generatedAt,
      },
    });
  } catch (error) {
    console.error("Error exporting proposal:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to export proposal",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(POSTHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.proposals",
  action: "export",
  requireAuth: true,
});
