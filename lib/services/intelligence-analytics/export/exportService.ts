/**
 * Export Service
 *
 * Exports intelligence data in various formats
 */

import type {
  UnifiedRootCauseAnalysis,
  DataMiningResult,
  ProcessMiningResult,
  UnifiedAnalytics,
} from "@/types/intelligence-analytics";

export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Export to JSON
   */
  exportToJSON(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export to CSV
   */
  exportToCSV(data: any[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const rows = data.map((item) =>
      headers.map((header) => {
        const value = item[header];
        if (typeof value === "object") {
          return JSON.stringify(value);
        }
        return String(value || "");
      }),
    );

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  }

  /**
   * Export RCA to PDF (simplified - returns JSON for now)
   */
  async exportRCAToPDF(rca: UnifiedRootCauseAnalysis): Promise<string> {
    // In production, use a PDF library like pdfkit or puppeteer
    // For now, return JSON representation
    return this.exportToJSON(rca);
  }

  /**
   * Export RCA to Excel (simplified - returns CSV for now)
   */
  async exportRCAToExcel(rca: UnifiedRootCauseAnalysis): Promise<string> {
    const data = [
      {
        "Root Cause ID": rca.id,
        "Issue ID": rca.issueId,
        "Issue Type": rca.issueType,
        Description: rca.issueDescription,
        Confidence: rca.confidence,
        Validated: rca.validated,
        Method: rca.analysisMethod,
        "Root Causes Count": rca.rootCauses.length,
        "Evidence Count": rca.evidence.length,
        "Recommendations Count": rca.recommendations.length,
      },
      ...rca.rootCauses.map((rc) => ({
        "Root Cause ID": rc.id,
        Type: rc.type,
        Category: rc.category,
        Title: rc.title,
        Description: rc.description,
        Confidence: Math.round(rc.confidence * 100),
        Severity: rc.impact.severity,
      })),
    ];

    return this.exportToCSV(data);
  }

  /**
   * Export data mining results
   */
  exportDataMiningResults(results: DataMiningResult[]): string {
    const data = results.map((r) => ({
      ID: r.id,
      Type: r.analysisType,
      Title: r.title,
      Description: r.description,
      Confidence: r.confidence,
      Impact: r.impact,
      Category: r.category,
      Status: r.status,
      "Generated At": new Date(r.generatedAt).toISOString(),
    }));

    return this.exportToCSV(data);
  }

  /**
   * Export process mining results
   */
  exportProcessMiningResults(result: ProcessMiningResult): string {
    const data = [
      {
        "Process ID": result.id,
        "Process Type": result.processType,
        "Process Name": result.processName,
        Variants: result.variants.length,
        Deviations: result.deviations.length,
        Efficiency: result.performance.efficiency,
        "Compliance Rate": result.performance.complianceRate,
        "Case Count": result.caseCount,
        "Event Count": result.eventCount,
      },
    ];

    return this.exportToCSV(data);
  }

  /**
   * Export analytics
   */
  exportAnalytics(analytics: UnifiedAnalytics): string {
    const data = [
      {
        "Analytics ID": analytics.id,
        "Time Range Start": new Date(analytics.timeRange.start).toISOString(),
        "Time Range End": new Date(analytics.timeRange.end).toISOString(),
        "Total Events": analytics.aggregatedMetrics.totalEvents,
        "Total Issues": analytics.aggregatedMetrics.totalIssues,
        "Compliance Rate": analytics.aggregatedMetrics.complianceRate,
        Efficiency: analytics.aggregatedMetrics.efficiency,
        "Insights Count": analytics.insights.length,
      },
    ];

    return this.exportToCSV(data);
  }
}

// Export singleton instance
export const exportService = ExportService.getInstance();
