/**
 * Report Generator
 *
 * Generates automated compliance reports
 * Vision 2030 alignment reports
 * Export functionality
 *
 * @module saudi-alignment
 */

import { vision2030Mapper } from "./vision-2030-mapper";
import { regulatoryTracker } from "./regulatory-tracker";
import { complianceScorer } from "./compliance-scorer";
import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import type {
  ReportGenerator,
  ComplianceReport,
  Vision2030Alignment,
  ComplianceStatus,
  ComplianceScore,
} from "./types";

// ============================================================================
// REPORT GENERATOR
// ============================================================================

export class ReportGeneratorImpl implements ReportGenerator {
  /**
   * Generate compliance report
   */
  async generateReport(request: {
    reportType: ComplianceReport["reportType"];
    entityId?: string;
    entityType?: string;
    dateRange?: { from: Date; to: Date };
    format?: ComplianceReport["format"];
  }): Promise<ComplianceReport> {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    let vision2030Alignment: Vision2030Alignment | undefined;
    let complianceStatus: ComplianceStatus | undefined;
    let complianceScore: ComplianceScore | undefined;
    let regulatoryTracking:
      | Array<{
          agency: string;
          requirements: any[];
          status: ComplianceStatus["requirements"];
        }>
      | undefined;

    // Generate based on report type
    if (request.entityId && request.entityType) {
      if (
        request.reportType === "VISION_2030" ||
        request.reportType === "COMPREHENSIVE"
      ) {
        vision2030Alignment = await vision2030Mapper.calculateAlignment(
          request.entityId,
          request.entityType,
        );
      }

      if (
        request.reportType === "REGULATORY" ||
        request.reportType === "COMPREHENSIVE"
      ) {
        complianceStatus = await regulatoryTracker.checkCompliance(
          request.entityId,
          request.entityType,
        );
      }

      if (
        request.reportType === "COMPLIANCE_SCORE" ||
        request.reportType === "COMPREHENSIVE"
      ) {
        complianceScore = await complianceScorer.calculateScore(
          request.entityId,
          request.entityType,
        );
      }

      if (request.reportType === "COMPREHENSIVE") {
        // Get regulatory tracking for all agencies
        const agencies: Array<{
          agency: string;
          requirements: any[];
          status: ComplianceStatus["requirements"];
        }> = [];
        const agencyList: string[] = [
          "TGA",
          "MOT",
          "ABSHER",
          "NAFATH",
          "SABER",
          "SFDA",
          "ZATCA",
          "SAMA",
          "NCSC",
          "SDAIA",
          "SASO",
          "MODON",
          "MOC",
          "MOI",
          "MOMRA",
          "MISA",
          "CITC",
        ];

        for (const agency of agencyList) {
          const requirements = await regulatoryTracker.getRequirements(
            request.entityType,
          );
          const agencyReqs = requirements.filter((r) => r.agency === agency);
          const status =
            complianceStatus?.requirements.filter((r) => r.agency === agency) ||
            [];

          agencies.push({
            agency,
            requirements: agencyReqs,
            status,
          });
        }

        regulatoryTracking = agencies;
      }
    }

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(
      vision2030Alignment,
      complianceStatus,
      complianceScore,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      vision2030Alignment,
      complianceStatus,
      complianceScore,
    );

    // Generate next steps
    const nextSteps = this.generateNextSteps(
      vision2030Alignment,
      complianceStatus,
      complianceScore,
    );

    const report: ComplianceReport = {
      id: reportId,
      tenantId: "default", // Would get from context
      reportType: request.reportType,
      entityId: request.entityId,
      entityType: request.entityType,
      dateRange: request.dateRange,
      generatedAt: new Date(),
      generatedBy: "system",
      content: {
        executiveSummary,
        vision2030Alignment,
        complianceStatus,
        complianceScore,
        regulatoryTracking,
        recommendations,
        nextSteps,
      },
      format: request.format || "JSON",
    };

    // Store report
    await this.storeReport(report);

    // Publish event
    await eventBus.publish(
      createEvent(
        "ComplianceReportGenerated",
        request.entityId || "system",
        request.entityType || "System",
        {
          reportId: report.id,
          reportType: report.reportType,
          entityId: request.entityId,
          entityType: request.entityType,
        },
        1,
        {
          correlationId: `report-${Date.now()}`,
          userId: "report-generator",
        },
      ),
    );

    return report;
  }

  /**
   * Export report
   */
  async exportReport(
    reportId: string,
    format: "PDF" | "JSON" | "HTML",
  ): Promise<Buffer | string> {
    const report = await this.getReport(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    switch (format) {
      case "JSON":
        return JSON.stringify(report, null, 2);

      case "HTML":
        return this.generateHTMLReport(report);

      case "PDF":
        // In production, would use PDF generation library
        return Buffer.from(JSON.stringify(report));

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    vision2030?: Vision2030Alignment,
    compliance?: ComplianceStatus,
    score?: ComplianceScore,
  ): string {
    const parts: string[] = [];

    if (vision2030) {
      parts.push(
        `Vision 2030 Alignment: ${vision2030.overallScore.toFixed(1)}% overall score.`,
      );
    }

    if (compliance) {
      parts.push(
        `Regulatory Compliance: ${compliance.overallCompliance.toFixed(1)}% compliant with ${compliance.requirements.length} requirements.`,
      );
    }

    if (score) {
      parts.push(
        `Compliance Score: ${score.overallScore.toFixed(1)}% with ${score.violations.length} violation(s). Risk Level: ${score.riskLevel}.`,
      );
    }

    return parts.join(" ");
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    vision2030?: Vision2030Alignment,
    compliance?: ComplianceStatus,
    score?: ComplianceScore,
  ): string[] {
    const recommendations: string[] = [];

    if (vision2030) {
      recommendations.push(...vision2030.recommendations);
    }

    if (score) {
      recommendations.push(...score.recommendations);
    }

    if (compliance) {
      const nonCompliant = compliance.requirements.filter(
        (r) => r.status !== "COMPLIANT",
      );
      if (nonCompliant.length > 0) {
        recommendations.push(
          `Address ${nonCompliant.length} non-compliant requirement(s)`,
        );
      }
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(
    vision2030?: Vision2030Alignment,
    compliance?: ComplianceStatus,
    score?: ComplianceScore,
  ): string[] {
    const steps: string[] = [];

    if (score && score.violations.length > 0) {
      const critical = score.violations.filter(
        (v) => v.severity === "CRITICAL",
      );
      if (critical.length > 0) {
        steps.push(
          `URGENT: Address ${critical.length} critical violation(s) immediately`,
        );
      }

      const expiring = score.violations.filter(
        (v) => v.deadline && v.deadline > new Date(),
      );
      if (expiring.length > 0) {
        steps.push(`Renew ${expiring.length} expiring requirement(s)`);
      }
    }

    if (vision2030 && vision2030.overallScore < 70) {
      steps.push(
        "Improve Vision 2030 alignment - focus on low-scoring pillars",
      );
    }

    if (compliance && compliance.overallCompliance < 70) {
      steps.push(
        "Improve regulatory compliance - address non-compliant requirements",
      );
    }

    if (steps.length === 0) {
      steps.push("Maintain current compliance practices");
      steps.push("Continue monitoring and regular reviews");
    }

    return steps;
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: ComplianceReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Compliance Report - ${report.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #1e40af; }
    h2 { color: #3b82f6; margin-top: 30px; }
    .score { font-size: 24px; font-weight: bold; color: #059669; }
    .violation { background: #fef2f2; padding: 10px; margin: 5px 0; border-left: 4px solid #ef4444; }
    .recommendation { background: #f0f9ff; padding: 10px; margin: 5px 0; border-left: 4px solid #3b82f6; }
  </style>
</head>
<body>
  <h1>Compliance Report</h1>
  <p><strong>Report ID:</strong> ${report.id}</p>
  <p><strong>Generated:</strong> ${report.generatedAt.toLocaleString()}</p>
  
  <h2>Executive Summary</h2>
  <p>${report.content.executiveSummary}</p>
  
  ${
    report.content.vision2030Alignment
      ? `
    <h2>Vision 2030 Alignment</h2>
    <div class="score">Overall Score: ${report.content.vision2030Alignment.overallScore.toFixed(1)}%</div>
    <ul>
      ${report.content.vision2030Alignment.goalAlignments
        .slice(0, 5)
        .map((g) => `<li>${g.goalName}: ${g.alignmentScore.toFixed(1)}%</li>`)
        .join("")}
    </ul>
  `
      : ""
  }
  
  ${
    report.content.complianceScore
      ? `
    <h2>Compliance Score</h2>
    <div class="score">Overall Score: ${report.content.complianceScore.overallScore.toFixed(1)}%</div>
    <p><strong>Risk Level:</strong> ${report.content.complianceScore.riskLevel}</p>
    <p><strong>Violations:</strong> ${report.content.complianceScore.violations.length}</p>
  `
      : ""
  }
  
  <h2>Recommendations</h2>
  ${report.content.recommendations.map((r) => `<div class="recommendation">${r}</div>`).join("")}
  
  <h2>Next Steps</h2>
  <ul>
    ${report.content.nextSteps.map((s) => `<li>${s}</li>`).join("")}
  </ul>
</body>
</html>
    `.trim();
  }

  /**
   * Store report
   */
  private async storeReport(report: ComplianceReport): Promise<void> {
    try {
      const { knowledgeBaseService } =
        await import("@/lib/services/knowledge-base");
      await knowledgeBaseService.create({
        tenantId: report.tenantId,
        agentId: "report-generator",
        type: "compliance_report",
        category: "compliance",
        content: JSON.stringify(report),
        summary: `Compliance report ${report.reportType} for ${report.entityType || "system"}`,
        metadata: {
          reportId: report.id,
          reportType: report.reportType,
          entityId: report.entityId,
          entityType: report.entityType,
        },
        keywords: ["compliance", "report", report.reportType],
        searchableText: `compliance report ${report.reportType} ${report.entityType}`,
        source: "report_generator",
        confidence: 1.0,
        verified: true,
        feedbackScore: 0,
        usageCount: 0,
        status: "active",
      });
    } catch (error) {
      console.warn("Error storing report:", error);
    }
  }

  /**
   * Get report
   */
  private async getReport(reportId: string): Promise<ComplianceReport | null> {
    try {
      const { knowledgeBaseService } =
        await import("@/lib/services/knowledge-base");
      const results = await knowledgeBaseService.search({
        query: `compliance report ${reportId}`,
        limit: 1,
      });

      if (
        results.length > 0 &&
        results[0].entry.metadata?.reportId === reportId
      ) {
        return JSON.parse(results[0].entry.content) as ComplianceReport;
      }
    } catch (error) {
      console.warn("Error getting report:", error);
    }
    return null;
  }
}

// Export singleton
export const reportGenerator: ReportGenerator = new ReportGeneratorImpl();
