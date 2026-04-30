/**
 * 🇸🇦 ENHANCED COMPLIANCE REPORTING SERVICE
 * Advanced compliance reporting with Saudi-specific features
 *
 * Features:
 * - Advanced report generation
 * - Automated action item tracking
 * - Deadline management
 * - Multi-authority compliance reports
 * - Trend analysis and forecasting
 *
 * Source: Adapted from chemcheck-analysis/lib/compliance/SaudiComplianceEngine.ts
 * Architecture: Deep layer integration with Event Bus and Saudi Compliance Engine
 */

import { eventBus } from "@/lib/services/event-bus";
import { saudiComplianceEngine } from "./saudiEngine";
import type {
  ComplianceReport as BaseComplianceReport,
  ComplianceActionItem,
} from "./saudiEngine";
import type {
  ComplianceReport as ReportingComplianceReport,
  ReportType,
  ReportSummary,
  ReportDetails,
} from "./complianceReportingService";

// ============================================================================
// ENHANCED REPORT TYPES
// ============================================================================

export interface EnhancedComplianceReport extends ReportingComplianceReport {
  // Saudi-specific sections
  zatcaSection?: {
    score: number;
    status: string;
    actionItems: ComplianceActionItem[];
    nextReviewDate: Date;
  };
  sfdaSection?: {
    score: number;
    status: string;
    facilityLicenseStatus: string;
    gmpStatus: string;
    actionItems: ComplianceActionItem[];
  };
  civilDefenseSection?: {
    score: number;
    status: string;
    fireSafetyStatus: string;
    emergencyPlanStatus: string;
    actionItems: ComplianceActionItem[];
  };
  vision2030Section?: {
    score: number;
    status: string;
    alignmentAreas: string[];
    actionItems: ComplianceActionItem[];
  };

  // Enhanced features
  actionItemsSummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    overdue: number;
    dueSoon: number;
  };
  deadlineTracking: {
    upcoming: Array<{ item: ComplianceActionItem; daysUntilDue: number }>;
    overdue: ComplianceActionItem[];
  };
  recommendations: string[];
  forecast: {
    next30Days: { predictedScore: number; riskLevel: string };
    next90Days: { predictedScore: number; riskLevel: string };
  };
}

export interface ComplianceReportRequest {
  tenantId: string;
  reportType: ReportType | "SAUDI_COMPREHENSIVE";
  period: {
    start: Date;
    end: Date;
  };
  includeActionItems?: boolean;
  includeForecast?: boolean;
  authorities?: ("ZATCA" | "SFDA" | "CIVIL_DEFENSE" | "VISION_2030")[];
}

// ============================================================================
// ENHANCED COMPLIANCE REPORTING SERVICE
// ============================================================================

export class EnhancedComplianceReportingService {
  private static instance: EnhancedComplianceReportingService;
  private reports: Map<string, EnhancedComplianceReport> = new Map();

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): EnhancedComplianceReportingService {
    if (!EnhancedComplianceReportingService.instance) {
      EnhancedComplianceReportingService.instance =
        new EnhancedComplianceReportingService();
    }
    return EnhancedComplianceReportingService.instance;
  }

  private async initializeService(): Promise<void> {
    console.log("📊 Initializing Enhanced Compliance Reporting Service...");

    await eventBus.publish({
      type: "compliance.reporting.initialized",
      data: {
        timestamp: new Date(),
        service: "EnhancedComplianceReportingService",
      },
    });
  }

  /**
   * Generate enhanced compliance report
   */
  async generateEnhancedReport(
    request: ComplianceReportRequest,
  ): Promise<EnhancedComplianceReport> {
    console.log(
      `📊 Generating enhanced compliance report for tenant: ${request.tenantId}`,
    );

    // Get Saudi compliance check if comprehensive report requested
    let saudiCheck: BaseComplianceReport | null = null;
    if (
      request.reportType === "SAUDI_COMPREHENSIVE" ||
      request.authorities?.length
    ) {
      // Get latest compliance check
      const checks = await saudiComplianceEngine.getComplianceChecks(
        request.tenantId,
      );
      if (checks.length > 0) {
        saudiCheck = await saudiComplianceEngine.generateComplianceReport(
          request.tenantId,
          request.period,
        );
      }
    }

    // Get action items
    const actionItems = request.includeActionItems
      ? await saudiComplianceEngine.getActionItems(request.tenantId)
      : [];

    // Calculate action items summary
    const actionItemsSummary = this.calculateActionItemsSummary(actionItems);

    // Track deadlines
    const deadlineTracking = this.trackDeadlines(actionItems);

    // Generate recommendations
    const recommendations = saudiCheck?.recommendations || [];

    // Generate forecast if requested
    const forecast = request.includeForecast
      ? await this.generateForecast(request.tenantId, saudiCheck)
      : undefined;

    // Build enhanced report
    const report: EnhancedComplianceReport = {
      id: `enhanced-report-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type:
        request.reportType === "SAUDI_COMPREHENSIVE"
          ? "OVERALL_COMPLIANCE"
          : request.reportType,
      tenantId: request.tenantId,
      generatedAt: new Date(),
      period: {
        startDate: request.period.start,
        endDate: request.period.end,
      },
      summary: this.buildSummary(saudiCheck, actionItems),
      details: this.buildDetails(saudiCheck, actionItems),
      recommendations,
      metadata: {
        reportVersion: "2.0",
        dataSource: "Saudi Compliance Engine + Enhanced Reporting",
        filters: {
          authorities: request.authorities,
          includeActionItems: request.includeActionItems,
          includeForecast: request.includeForecast,
        },
      },
      // Saudi-specific sections
      zatcaSection: saudiCheck
        ? {
            score: saudiCheck.zatcaScore,
            status: this.determineStatus(saudiCheck.zatcaScore),
            actionItems: actionItems.filter(
              (item) => item.category === "ZATCA",
            ),
            nextReviewDate: saudiCheck.nextReviewDate,
          }
        : undefined,
      sfdaSection: saudiCheck
        ? {
            score: saudiCheck.sfdaScore,
            status: this.determineStatus(saudiCheck.sfdaScore),
            facilityLicenseStatus: "active", // Would come from actual check
            gmpStatus: "certified", // Would come from actual check
            actionItems: actionItems.filter((item) => item.category === "SFDA"),
          }
        : undefined,
      civilDefenseSection: saudiCheck
        ? {
            score: saudiCheck.civilDefenseScore,
            status: this.determineStatus(saudiCheck.civilDefenseScore),
            fireSafetyStatus: "compliant", // Would come from actual check
            emergencyPlanStatus: "active", // Would come from actual check
            actionItems: actionItems.filter(
              (item) => item.category === "CIVIL_DEFENSE",
            ),
          }
        : undefined,
      vision2030Section: saudiCheck
        ? {
            score: saudiCheck.vision2030Score,
            status: this.determineStatus(saudiCheck.vision2030Score),
            alignmentAreas: [
              "Digital Transformation",
              "Saudi Green Initiative",
            ],
            actionItems: actionItems.filter(
              (item) => item.category === "VISION_2030",
            ),
          }
        : undefined,
      actionItemsSummary,
      deadlineTracking,
      forecast,
    };

    // Store report
    this.reports.set(report.id, report);

    // Publish report generated event
    await eventBus.publish({
      type: "compliance.report.enhanced.generated",
      data: {
        reportId: report.id,
        tenantId: request.tenantId,
        reportType: request.reportType,
        overallScore: report.summary.overallComplianceScore,
        actionItemsCount: actionItems.length,
        timestamp: new Date(),
      },
    });

    console.log(`✅ Enhanced compliance report generated: ${report.id}`);
    return report;
  }

  /**
   * Calculate action items summary
   */
  private calculateActionItemsSummary(
    actionItems: ComplianceActionItem[],
  ): EnhancedComplianceReport["actionItemsSummary"] {
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    return {
      total: actionItems.length,
      critical: actionItems.filter((item) => item.priority === "CRITICAL")
        .length,
      high: actionItems.filter((item) => item.priority === "HIGH").length,
      medium: actionItems.filter((item) => item.priority === "MEDIUM").length,
      low: actionItems.filter((item) => item.priority === "LOW").length,
      overdue: actionItems.filter(
        (item) =>
          item.status !== "completed" && new Date(item.dueDate).getTime() < now,
      ).length,
      dueSoon: actionItems.filter(
        (item) =>
          item.status !== "completed" &&
          new Date(item.dueDate).getTime() >= now &&
          new Date(item.dueDate).getTime() <= sevenDaysFromNow,
      ).length,
    };
  }

  /**
   * Track deadlines
   */
  private trackDeadlines(
    actionItems: ComplianceActionItem[],
  ): EnhancedComplianceReport["deadlineTracking"] {
    const now = Date.now();
    const upcoming: Array<{
      item: ComplianceActionItem;
      daysUntilDue: number;
    }> = [];
    const overdue: ComplianceActionItem[] = [];

    for (const item of actionItems) {
      if (item.status === "completed") continue;

      const dueDate = new Date(item.dueDate).getTime();
      const daysUntilDue = Math.ceil((dueDate - now) / (24 * 60 * 60 * 1000));

      if (dueDate < now) {
        overdue.push(item);
      } else if (daysUntilDue <= 30) {
        upcoming.push({ item, daysUntilDue });
      }
    }

    // Sort upcoming by days until due
    upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    return { upcoming, overdue };
  }

  /**
   * Generate forecast
   */
  private async generateForecast(
    tenantId: string,
    currentCheck: BaseComplianceReport | null,
  ): Promise<EnhancedComplianceReport["forecast"]> {
    if (!currentCheck) {
      return {
        next30Days: { predictedScore: 0, riskLevel: "UNKNOWN" },
        next90Days: { predictedScore: 0, riskLevel: "UNKNOWN" },
      };
    }

    const currentScore = currentCheck.overallScore;
    const actionItems = await saudiComplianceEngine.getActionItems(
      tenantId,
      "pending",
    );

    // Simple forecast based on current score and pending action items
    const criticalItems = actionItems.filter(
      (item) => item.priority === "CRITICAL",
    ).length;
    const highItems = actionItems.filter(
      (item) => item.priority === "HIGH",
    ).length;

    // Predict score improvement if action items are completed
    const potentialImprovement = Math.min(
      criticalItems * 5 + highItems * 3,
      20,
    ); // Max 20 point improvement

    const predicted30Days = Math.min(
      currentScore + potentialImprovement * 0.5,
      100,
    );
    const predicted90Days = Math.min(currentScore + potentialImprovement, 100);

    return {
      next30Days: {
        predictedScore: Math.round(predicted30Days),
        riskLevel: this.determineRiskLevel(predicted30Days),
      },
      next90Days: {
        predictedScore: Math.round(predicted90Days),
        riskLevel: this.determineRiskLevel(predicted90Days),
      },
    };
  }

  /**
   * Build summary
   */
  private buildSummary(
    saudiCheck: BaseComplianceReport | null,
    actionItems: ComplianceActionItem[],
  ): ReportSummary {
    if (!saudiCheck) {
      return {
        overallComplianceScore: 0,
        totalRequirements: 0,
        compliantCount: 0,
        nonCompliantCount: 0,
        atRiskCount: 0,
        totalViolations: 0,
        criticalViolations: 0,
        openViolations: actionItems.filter(
          (item) => item.status !== "completed",
        ).length,
        resolvedViolations: actionItems.filter(
          (item) => item.status === "completed",
        ).length,
        riskLevel: "UNKNOWN",
      };
    }

    const criticalItems = actionItems.filter(
      (item) => item.priority === "CRITICAL",
    ).length;

    return {
      overallComplianceScore: saudiCheck.overallScore,
      totalRequirements: 100, // Would come from actual requirements count
      compliantCount: saudiCheck.status === "COMPLIANT" ? 1 : 0,
      nonCompliantCount: saudiCheck.status === "NON_COMPLIANT" ? 1 : 0,
      atRiskCount: saudiCheck.status === "AT_RISK" ? 1 : 0,
      totalViolations: actionItems.length,
      criticalViolations: criticalItems,
      openViolations: actionItems.filter((item) => item.status !== "completed")
        .length,
      resolvedViolations: actionItems.filter(
        (item) => item.status === "completed",
      ).length,
      riskLevel: this.determineRiskLevel(saudiCheck.overallScore),
    };
  }

  /**
   * Build details
   */
  private buildDetails(
    saudiCheck: BaseComplianceReport | null,
    actionItems: ComplianceActionItem[],
  ): ReportDetails {
    const complianceByAuthority: Record<string, number> = {};
    const complianceByCategory: Record<string, number> = {};

    if (saudiCheck) {
      complianceByAuthority["ZATCA"] = saudiCheck.zatcaScore;
      complianceByAuthority["SFDA"] = saudiCheck.sfdaScore;
      complianceByAuthority["Civil Defense"] = saudiCheck.civilDefenseScore;
      complianceByAuthority["Vision 2030"] = saudiCheck.vision2030Score;
    }

    // Group action items by category
    for (const item of actionItems) {
      complianceByCategory[item.category] =
        (complianceByCategory[item.category] || 0) + 1;
    }

    const violationBreakdown: ReportDetails["violationBreakdown"] =
      actionItems.map((item) => ({
        authority: item.authority,
        category: item.category,
        severity: item.priority,
        count: 1,
        description: item.description,
      }));

    return {
      complianceByAuthority,
      complianceByCategory,
      violationBreakdown,
      topRisks: actionItems
        .filter(
          (item) => item.priority === "CRITICAL" || item.priority === "HIGH",
        )
        .slice(0, 10)
        .map((item) => ({
          id: item.id,
          title: item.title,
          severity: item.priority,
          description: item.description,
          impact: "Compliance risk",
          recommendation: `Complete action item: ${item.title}`,
        })),
    };
  }

  /**
   * Determine status from score
   */
  private determineStatus(score: number): string {
    if (score >= 90) return "COMPLIANT";
    if (score >= 70) return "AT_RISK";
    if (score >= 50) return "PENDING_REVIEW";
    return "NON_COMPLIANT";
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(
    score: number,
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    if (score >= 90) return "LOW";
    if (score >= 70) return "MEDIUM";
    if (score >= 50) return "HIGH";
    return "CRITICAL";
  }

  /**
   * Get enhanced report by ID
   */
  async getReport(reportId: string): Promise<EnhancedComplianceReport | null> {
    return this.reports.get(reportId) || null;
  }

  /**
   * Get all reports for tenant
   */
  async getReports(tenantId: string): Promise<EnhancedComplianceReport[]> {
    return Array.from(this.reports.values())
      .filter((report) => report.tenantId === tenantId)
      .sort(
        (a, b) =>
          new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
      );
  }
}

// Singleton instance
export const enhancedComplianceReporting =
  EnhancedComplianceReportingService.getInstance();
