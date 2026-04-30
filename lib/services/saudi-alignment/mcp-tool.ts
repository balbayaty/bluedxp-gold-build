/**
 * MCP Tool Integration for Saudi Alignment
 *
 * Makes Saudi alignment accessible via MCP
 * Allows AI agents to check compliance and Vision 2030 alignment
 *
 * @module saudi-alignment
 */

import { saudiAlignmentService } from "./service";
import type { MCPTool } from "@/lib/mcp/server";

/**
 * Get Saudi alignment - MCP Tool
 */
export const getSaudiAlignmentTool: MCPTool = {
  name: "get_saudi_alignment",
  description:
    "Get comprehensive Saudi alignment including Vision 2030 alignment, regulatory compliance, and compliance score for an entity.",
  inputSchema: {
    type: "object",
    properties: {
      entityId: {
        type: "string",
        description: "The entity ID to check alignment for",
      },
      entityType: {
        type: "string",
        description:
          'The entity type (e.g., "Shipment", "Company", "Facility")',
      },
    },
    required: ["entityId", "entityType"],
  },
  handler: async (params: { entityId: string; entityType: string }) => {
    try {
      const alignment = await saudiAlignmentService.getComprehensiveAlignment(
        params.entityId,
        params.entityType,
      );

      return {
        success: true,
        data: {
          vision2030Score: alignment.vision2030.overallScore,
          complianceScore: alignment.compliance.overallCompliance,
          riskLevel: alignment.score.riskLevel,
          violationsCount: alignment.score.violations.length,
          recommendations: [
            ...alignment.vision2030.recommendations,
            ...alignment.score.recommendations,
          ].slice(0, 5),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

/**
 * Generate compliance report - MCP Tool
 */
export const generateComplianceReportTool: MCPTool = {
  name: "generate_compliance_report",
  description:
    "Generate a compliance report (Vision 2030, Regulatory, Compliance Score, or Comprehensive).",
  inputSchema: {
    type: "object",
    properties: {
      reportType: {
        type: "string",
        enum: [
          "VISION_2030",
          "REGULATORY",
          "COMPLIANCE_SCORE",
          "COMPREHENSIVE",
        ],
        description: "Type of report to generate",
      },
      entityId: {
        type: "string",
        description: "Optional entity ID",
      },
      entityType: {
        type: "string",
        description: "Optional entity type",
      },
      format: {
        type: "string",
        enum: ["PDF", "JSON", "HTML"],
        description: "Report format (default: JSON)",
      },
    },
    required: ["reportType"],
  },
  handler: async (params: {
    reportType: string;
    entityId?: string;
    entityType?: string;
    format?: string;
  }) => {
    try {
      const report = await saudiAlignmentService.reportGenerator.generateReport(
        {
          reportType: params.reportType as any,
          entityId: params.entityId,
          entityType: params.entityType,
          format: params.format as any,
        },
      );

      return {
        success: true,
        data: {
          reportId: report.id,
          reportType: report.reportType,
          generatedAt: report.generatedAt,
          executiveSummary: report.content.executiveSummary,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

/**
 * Register MCP tools
 */
export function registerMCPTools(mcpServer: any): void {
  if (mcpServer && typeof mcpServer.registerTool === "function") {
    mcpServer.registerTool(getSaudiAlignmentTool);
    mcpServer.registerTool(generateComplianceReportTool);
    console.log("✅ Saudi Alignment MCP tools registered");
  }
}
