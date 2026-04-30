"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ComplianceReport,
  ReportType,
  complianceReportingService,
} from "@/lib/services/compliance/complianceReportingService";
import { complianceService } from "@/lib/services/compliance/complianceService";
import { intelligentComplianceEngine } from "@/lib/services/compliance/intelligentComplianceEngine";
import { authorityHierarchyService } from "@/lib/services/compliance/authorityHierarchyService";

interface ComplianceReportsProps {
  tenantId: string;
}

export default function ComplianceReports({
  tenantId,
}: ComplianceReportsProps) {
  const [selectedReportType, setSelectedReportType] =
    useState<ReportType>("OVERALL_COMPLIANCE");
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<
    "PDF" | "EXCEL" | "CSV" | "JSON"
  >("PDF");

  useEffect(() => {
    generateReport();
  }, [selectedReportType, tenantId]);

  const generateReport = async () => {
    try {
      setLoading(true);
      const records = complianceService.getRecordsByTenant(tenantId);
      const dashboard = await complianceService.generateDashboard(tenantId);

      let newReport: ComplianceReport;

      switch (selectedReportType) {
        case "OVERALL_COMPLIANCE":
          newReport =
            complianceReportingService.generateOverallComplianceReport(
              tenantId,
              records,
            );
          break;
        case "EXECUTIVE_SUMMARY":
          const allAuthorities = authorityHierarchyService.getAllNodes();
          const regulations = allAuthorities.flatMap((auth) =>
            authorityHierarchyService.getRegulationsByAuthority(auth.id),
          );
          const riskPrediction =
            intelligentComplianceEngine.predictComplianceRisk(
              records,
              regulations,
            );
          const recommendations =
            intelligentComplianceEngine.generateIntelligentRecommendations(
              records,
              regulations,
            );
          newReport = complianceReportingService.generateExecutiveSummary(
            tenantId,
            dashboard,
            riskPrediction,
            recommendations,
          );
          break;
        case "VIOLATION_ANALYSIS":
          const violations = records.flatMap((r) => r.violations);
          newReport =
            complianceReportingService.generateViolationAnalysisReport(
              tenantId,
              violations,
            );
          break;
        default:
          newReport =
            complianceReportingService.generateOverallComplianceReport(
              tenantId,
              records,
            );
      }

      setReport(newReport);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;
    const exported = complianceReportingService.exportReport(report, {
      format: exportFormat,
      includeCharts: true,
      includeDetails: true,
      includeRecommendations: true,
    });
    // In real implementation, this would download the file
    console.log("Export:", exported);
    alert(`Report exported as ${exportFormat}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No report data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Compliance Reports</h2>
          <p className="text-gray-400 mt-1">
            Generate comprehensive compliance reports and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as any)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="PDF">PDF</option>
            <option value="EXCEL">Excel</option>
            <option value="CSV">CSV</option>
            <option value="JSON">JSON</option>
          </select>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            <i className="ri-download-line mr-2"></i>
            Export
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2 border-b border-white/10">
        {[
          {
            id: "OVERALL_COMPLIANCE",
            label: "Overall Compliance",
            icon: "ri-dashboard-line",
          },
          {
            id: "EXECUTIVE_SUMMARY",
            label: "Executive Summary",
            icon: "ri-file-chart-line",
          },
          {
            id: "VIOLATION_ANALYSIS",
            label: "Violation Analysis",
            icon: "ri-alert-line",
          },
          {
            id: "AUDIT_READINESS",
            label: "Audit Readiness",
            icon: "ri-file-search-line",
          },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedReportType(type.id as ReportType)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              selectedReportType === type.id
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <i className={`${type.icon} mr-2`}></i>
            {type.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400">Compliance Score</p>
            <p className="text-2xl font-bold text-white mt-1">
              {report.summary.overallComplianceScore.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400">Total Requirements</p>
            <p className="text-2xl font-bold text-white mt-1">
              {report.summary.totalRequirements}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400">Violations</p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {report.summary.totalViolations}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400">Risk Level</p>
            <p className="text-2xl font-bold text-orange-400 mt-1">
              {report.summary.riskLevel}
            </p>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Compliance Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Compliant</p>
              <p className="text-xl font-bold text-green-400">
                {report.summary.compliantCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Non-Compliant</p>
              <p className="text-xl font-bold text-red-400">
                {report.summary.nonCompliantCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">At Risk</p>
              <p className="text-xl font-bold text-yellow-400">
                {report.summary.atRiskCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Critical Violations</p>
              <p className="text-xl font-bold text-red-400">
                {report.summary.criticalViolations}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Open Violations</p>
              <p className="text-xl font-bold text-orange-400">
                {report.summary.openViolations}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Resolved</p>
              <p className="text-xl font-bold text-green-400">
                {report.summary.resolvedViolations}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Recommendations
            </h3>
            <ul className="space-y-2">
              {report.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-300 flex items-start gap-2"
                >
                  <i className="ri-arrow-right-s-line text-cyan-400 mt-1"></i>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Report Metadata */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </span>
            <span>
              Period: {new Date(report.period.startDate).toLocaleDateString()} -{" "}
              {new Date(report.period.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
