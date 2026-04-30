/**
 * Compliance Reporting Service
 * Generate comprehensive compliance reports and analytics
 */

import { ComplianceRecord, ComplianceViolation } from "@/types/compliance";
import { ComplianceDashboard } from "@/lib/services/compliance/complianceService";
import {
  RiskPrediction,
  IntelligentRecommendation,
} from "@/lib/services/compliance/intelligentComplianceEngine";

// ============================================================================
// REPORT TYPES
// ============================================================================

export type ReportType =
  | "OVERALL_COMPLIANCE"
  | "EXECUTIVE_SUMMARY"
  | "VIOLATION_ANALYSIS"
  | "AUDIT_READINESS"
  | "TREND_ANALYSIS"
  | "AUTHORITY_COMPLIANCE";

export interface ComplianceReport {
  id: string;
  type: ReportType;
  tenantId: string;
  generatedAt: Date | string;
  period: {
    startDate: Date | string;
    endDate: Date | string;
  };
  summary: ReportSummary;
  details: ReportDetails;
  recommendations?: string[];
  charts?: ChartData[];
  metadata: ReportMetadata;
}

export interface ReportSummary {
  overallComplianceScore: number;
  totalRequirements: number;
  compliantCount: number;
  nonCompliantCount: number;
  atRiskCount: number;
  totalViolations: number;
  criticalViolations: number;
  openViolations: number;
  resolvedViolations: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface ReportDetails {
  complianceByAuthority: Record<string, number>;
  complianceByCategory: Record<string, number>;
  violationBreakdown: ViolationBreakdown[];
  trendAnalysis?: TrendData[];
  topRisks?: RiskItem[];
}

export interface ViolationBreakdown {
  authority: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  count: number;
  description: string;
}

export interface TrendData {
  date: string;
  complianceScore: number;
  violations: number;
  resolved: number;
}

export interface RiskItem {
  id: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  impact: string;
  recommendation: string;
}

export interface ChartData {
  type: "BAR" | "LINE" | "PIE" | "AREA";
  title: string;
  data: any[];
  labels: string[];
}

export interface ReportMetadata {
  generatedBy?: string;
  reportVersion: string;
  dataSource: string;
  filters?: Record<string, any>;
}

export interface ExportOptions {
  format: "PDF" | "EXCEL" | "CSV" | "JSON";
  includeCharts?: boolean;
  includeDetails?: boolean;
  includeRecommendations?: boolean;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate overall compliance report
 */
export function generateOverallComplianceReport(
  tenantId: string,
  records: ComplianceRecord[],
): ComplianceReport {
  const compliant = records.filter((r) => r.status === "COMPLIANT").length;
  const nonCompliant = records.filter(
    (r) => r.status === "NON_COMPLIANT",
  ).length;
  const atRisk = records.filter((r) => r.status === "AT_RISK").length;
  const total = records.length;

  const allViolations = records.flatMap((r) => r.violations || []);
  const openViolations = allViolations.filter((v) => v.status === "OPEN");
  const criticalViolations = allViolations.filter(
    (v) => v.severity === "CRITICAL",
  );
  const resolvedViolations = allViolations.filter(
    (v) => v.status === "RESOLVED",
  );

  const complianceScore = total > 0 ? (compliant / total) * 100 : 100;

  const riskLevel =
    criticalViolations.length > 0
      ? "CRITICAL"
      : openViolations.length > 5
        ? "HIGH"
        : openViolations.length > 2
          ? "MEDIUM"
          : "LOW";

  // Compliance by authority
  const complianceByAuthority: Record<string, number> = {};
  records.forEach((record) => {
    const auth = record.authority;
    if (!complianceByAuthority[auth]) {
      complianceByAuthority[auth] = 0;
    }
    if (record.status === "COMPLIANT") {
      complianceByAuthority[auth]++;
    }
  });

  // Compliance by category
  const complianceByCategory: Record<string, number> = {};
  records.forEach((record) => {
    const cat = record.category;
    if (!complianceByCategory[cat]) {
      complianceByCategory[cat] = 0;
    }
    if (record.status === "COMPLIANT") {
      complianceByCategory[cat]++;
    }
  });

  // Violation breakdown
  const violationBreakdown: ViolationBreakdown[] = [];
  const violationMap = new Map<string, ViolationBreakdown>();

  allViolations.forEach((violation) => {
    const key = `${violation.authority}-${violation.category}-${violation.severity}`;
    if (!violationMap.has(key)) {
      violationMap.set(key, {
        authority: violation.authority,
        category: violation.category,
        severity: violation.severity,
        count: 0,
        description: violation.description,
      });
    }
    violationMap.get(key)!.count++;
  });

  violationBreakdown.push(...Array.from(violationMap.values()));

  return {
    id: `report-${Date.now()}`,
    type: "OVERALL_COMPLIANCE",
    tenantId,
    generatedAt: new Date().toISOString(),
    period: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    },
    summary: {
      overallComplianceScore: complianceScore,
      totalRequirements: total,
      compliantCount: compliant,
      nonCompliantCount: nonCompliant,
      atRiskCount: atRisk,
      totalViolations: allViolations.length,
      criticalViolations: criticalViolations.length,
      openViolations: openViolations.length,
      resolvedViolations: resolvedViolations.length,
      riskLevel,
    },
    details: {
      complianceByAuthority,
      complianceByCategory,
      violationBreakdown,
    },
    recommendations: [
      "Address all critical violations immediately",
      "Implement regular compliance audits",
      "Establish compliance monitoring dashboard",
      "Provide staff training on compliance requirements",
    ],
    metadata: {
      reportVersion: "1.0.0",
      dataSource: "Compliance Management System",
    },
  };
}

/**
 * Generate executive summary report
 */
export function generateExecutiveSummary(
  tenantId: string,
  dashboard: ComplianceDashboard,
  riskPrediction?: RiskPrediction,
  recommendations?: IntelligentRecommendation[],
): ComplianceReport {
  const baseReport = generateOverallComplianceReport(
    tenantId,
    dashboard.records || [],
  );

  const topRisks: RiskItem[] = [];
  if (riskPrediction) {
    riskPrediction.riskFactors.forEach((factor, index) => {
      if (index < 5) {
        topRisks.push({
          id: `risk-${index}`,
          title: factor.factor,
          severity:
            factor.impact === "HIGH"
              ? "HIGH"
              : factor.impact === "MEDIUM"
                ? "MEDIUM"
                : "LOW",
          description: factor.description || "",
          impact: factor.impact,
          recommendation:
            factor.recommendation || "Review and address this risk factor",
        });
      }
    });
  }

  const reportRecommendations = recommendations
    ? recommendations.map((r) => r.recommendation)
    : baseReport.recommendations || [];

  return {
    ...baseReport,
    type: "EXECUTIVE_SUMMARY",
    details: {
      ...baseReport.details,
      topRisks,
    },
    recommendations: reportRecommendations,
  };
}

/**
 * Generate violation analysis report
 */
export function generateViolationAnalysisReport(
  tenantId: string,
  violations: ComplianceViolation[],
): ComplianceReport {
  const openViolations = violations.filter((v) => v.status === "OPEN");
  const criticalViolations = violations.filter(
    (v) => v.severity === "CRITICAL",
  );
  const highViolations = violations.filter((v) => v.severity === "HIGH");
  const mediumViolations = violations.filter((v) => v.severity === "MEDIUM");
  const lowViolations = violations.filter((v) => v.severity === "LOW");

  const violationBreakdown: ViolationBreakdown[] = [
    {
      authority: "All",
      category: "All",
      severity: "CRITICAL",
      count: criticalViolations.length,
      description: "Critical violations requiring immediate attention",
    },
    {
      authority: "All",
      category: "All",
      severity: "HIGH",
      count: highViolations.length,
      description: "High severity violations",
    },
    {
      authority: "All",
      category: "All",
      severity: "MEDIUM",
      count: mediumViolations.length,
      description: "Medium severity violations",
    },
    {
      authority: "All",
      category: "All",
      severity: "LOW",
      count: lowViolations.length,
      description: "Low severity violations",
    },
  ];

  return {
    id: `report-violation-${Date.now()}`,
    type: "VIOLATION_ANALYSIS",
    tenantId,
    generatedAt: new Date().toISOString(),
    period: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    },
    summary: {
      overallComplianceScore:
        violations.length === 0
          ? 100
          : Math.max(0, 100 - openViolations.length * 5),
      totalRequirements: violations.length,
      compliantCount: 0,
      nonCompliantCount: openViolations.length,
      atRiskCount: 0,
      totalViolations: violations.length,
      criticalViolations: criticalViolations.length,
      openViolations: openViolations.length,
      resolvedViolations: violations.filter((v) => v.status === "RESOLVED")
        .length,
      riskLevel:
        criticalViolations.length > 0
          ? "CRITICAL"
          : openViolations.length > 5
            ? "HIGH"
            : "MEDIUM",
    },
    details: {
      complianceByAuthority: {},
      complianceByCategory: {},
      violationBreakdown,
    },
    recommendations: [
      "Prioritize critical violations for immediate resolution",
      "Establish violation tracking and resolution workflow",
      "Implement preventive measures to avoid future violations",
      "Regular monitoring and early detection of compliance issues",
    ],
    metadata: {
      reportVersion: "1.0.0",
      dataSource: "Compliance Management System",
    },
  };
}

/**
 * Export report
 */
export function exportReport(
  report: ComplianceReport,
  options: ExportOptions,
): {
  format: string;
  data: any;
  downloadUrl?: string;
} {
  const exportData = {
    report: {
      id: report.id,
      type: report.type,
      generatedAt: report.generatedAt,
      period: report.period,
      summary: report.summary,
      ...(options.includeDetails && { details: report.details }),
      ...(options.includeRecommendations && {
        recommendations: report.recommendations,
      }),
    },
    metadata: report.metadata,
  };

  // In a real implementation, this would generate the actual file
  const downloadUrl = `/api/reports/export/${report.id}?format=${options.format}`;

  return {
    format: options.format,
    data: exportData,
    downloadUrl,
  };
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const complianceReportingService = {
  generateOverallComplianceReport,
  generateExecutiveSummary,
  generateViolationAnalysisReport,
  exportReport,
};

export default complianceReportingService;
