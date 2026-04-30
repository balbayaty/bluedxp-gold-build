/**
 * Advanced Reporting Page
 * Custom report builder with scheduling and export
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import {
  reportBuilder,
  ReportConfig,
  ReportField,
} from "@/lib/services/reporting/reportBuilder";
import { reportGenerator } from "@/lib/services/reporting/reportGenerator";
import Modal from "@/components/Modal";

export default function ReportingPage() {
  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(
    null,
  );
  const [showBuilder, setShowBuilder] = useState(false);
  const [newReport, setNewReport] = useState<Partial<ReportConfig>>({
    name: "",
    fields: [],
    filters: [],
    sort: [],
    format: "pdf",
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const allReports = reportBuilder.getAllReports();
    setReports(allReports);
  };

  const handleCreateReport = () => {
    const report = reportBuilder.createReport({
      name: newReport.name || "New Report",
      description: newReport.description,
      fields: newReport.fields || [],
      filters: newReport.filters || [],
      sort: newReport.sort || [],
      format: newReport.format || "pdf",
      schedule: newReport.schedule,
    });
    setReports([...reports, report]);
    setShowBuilder(false);
    setNewReport({
      name: "",
      fields: [],
      filters: [],
      sort: [],
      format: "pdf",
    });
  };

  const handleGenerateReport = async (report: ReportConfig) => {
    try {
      const data = await reportGenerator.generateReportData(report);
      let blob: Blob | string;

      switch (report.format) {
        case "pdf":
          blob = await reportGenerator.generatePDF(report, data);
          break;
        case "excel":
          blob = await reportGenerator.generateExcel(report, data);
          break;
        case "csv":
          const csv = await reportGenerator.generateCSV(report, data);
          blob = new Blob([csv], { type: "text/csv" });
          break;
        case "json":
          const json = await reportGenerator.generateJSON(report, data);
          blob = new Blob([json], { type: "application/json" });
          break;
        default:
          return;
      }

      // Download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.name}.${report.format}`;
      a.click();
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const availableFields = reportBuilder.getAvailableFields();

  return (
    <PageTemplate
      title="Advanced Reporting"
      description="Custom report builder with scheduling and export"
      icon="ri-file-chart-line"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Reports</h2>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Create Report
          </button>
        </div>

        {/* Reports List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-cyan-500/50 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {report.name}
                  </h3>
                  {report.description && (
                    <p className="text-sm text-gray-400 mt-1">
                      {report.description}
                    </p>
                  )}
                </div>
                <span className="px-2 py-1 rounded text-xs bg-cyan-900/30 text-cyan-400">
                  {report.format.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-400">
                  <strong>Fields:</strong> {report.fields.length}
                </div>
                {report.schedule?.enabled && (
                  <div className="text-sm text-gray-400">
                    <strong>Scheduled:</strong> {report.schedule.frequency}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerateReport(report)}
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
                >
                  Generate
                </button>
                <button
                  onClick={() => setSelectedReport(report)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
                >
                  <i className="ri-edit-line"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Report Builder Modal */}
        {showBuilder && (
          <Modal
            isOpen={showBuilder}
            onClose={() => setShowBuilder(false)}
            title="Create Report"
            size="xl"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  value={newReport.name}
                  onChange={(e) =>
                    setNewReport({ ...newReport, name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 outline-none"
                  placeholder="Enter report name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Fields
                </label>
                <div className="grid md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {availableFields.map((field) => (
                    <label
                      key={field.value}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={newReport.fields?.includes(field.value)}
                        onChange={(e) => {
                          const fields = newReport.fields || [];
                          if (e.target.checked) {
                            setNewReport({
                              ...newReport,
                              fields: [...fields, field.value],
                            });
                          } else {
                            setNewReport({
                              ...newReport,
                              fields: fields.filter((f) => f !== field.value),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 text-cyan-500"
                      />
                      <span className="text-sm text-white">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Format
                </label>
                <div className="flex gap-2">
                  {["pdf", "excel", "csv", "json"].map((format) => (
                    <button
                      key={format}
                      onClick={() =>
                        setNewReport({ ...newReport, format: format as any })
                      }
                      className={`px-4 py-2 rounded-lg transition ${
                        newReport.format === format
                          ? "bg-cyan-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowBuilder(false)}
                  className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateReport}
                  className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
                >
                  Create Report
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PageTemplate>
  );
}
