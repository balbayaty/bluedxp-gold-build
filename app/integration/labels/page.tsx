"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { format, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";

interface LabelTemplate {
  id: string;
  name: string;
  type: "SHIPPING" | "PICKING" | "LOCATION" | "PRODUCT" | "CUSTOM";
  size: string;
  format: "PDF" | "ZPL" | "EPL" | "PNG";
  fields: string[];
  printer: string;
  status: "ACTIVE" | "INACTIVE";
  printCount: number;
  lastUsed?: Date | string;
}

interface PrintJob {
  id: string;
  templateId: string;
  templateName: string;
  quantity: number;
  status: "PENDING" | "PRINTING" | "COMPLETED" | "FAILED";
  createdAt: Date | string;
  completedAt?: Date | string;
  printer: string;
  errorMessage?: string;
}

export default function LabelPrinting() {
  const [templates, setTemplates] = useState<LabelTemplate[]>([
    {
      id: "template-1",
      name: "Shipping Label - Standard",
      type: "SHIPPING",
      size: "4x6",
      format: "ZPL",
      fields: ["barcode", "address", "tracking", "carrier"],
      printer: "Zebra ZT410",
      status: "ACTIVE",
      printCount: 15420,
      lastUsed: new Date(),
    },
    {
      id: "template-2",
      name: "Picking Label",
      type: "PICKING",
      size: "3x2",
      format: "ZPL",
      fields: ["barcode", "material", "quantity", "location"],
      printer: "Zebra ZT410",
      status: "ACTIVE",
      printCount: 8920,
      lastUsed: subDays(new Date(), 1),
    },
    {
      id: "template-3",
      name: "Location Label",
      type: "LOCATION",
      size: "2x1",
      format: "ZPL",
      fields: ["barcode", "location"],
      printer: "Zebra ZT410",
      status: "ACTIVE",
      printCount: 3420,
      lastUsed: subDays(new Date(), 2),
    },
    {
      id: "template-4",
      name: "Product Label",
      type: "PRODUCT",
      size: "2x1",
      format: "ZPL",
      fields: ["barcode", "material", "batch"],
      printer: "Zebra ZT410",
      status: "ACTIVE",
      printCount: 12450,
      lastUsed: new Date(),
    },
  ]);

  const [printJobs] = useState<PrintJob[]>(() => {
    return Array.from({ length: 50 }, (_, i) => {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const statuses: PrintJob["status"][] = [
        "COMPLETED",
        "COMPLETED",
        "COMPLETED",
        "PRINTING",
        "FAILED",
      ];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const createdAt = subDays(new Date(), Math.floor(Math.random() * 7));

      return {
        id: `job-${i + 1}`,
        templateId: template.id,
        templateName: template.name,
        quantity: Math.floor(Math.random() * 100) + 1,
        status,
        createdAt,
        completedAt:
          status === "COMPLETED"
            ? new Date(createdAt.getTime() + Math.random() * 60000)
            : undefined,
        printer: template.printer,
        errorMessage: status === "FAILED" ? "Printer offline" : undefined,
      };
    });
  });

  const [selectedTemplate, setSelectedTemplate] =
    useState<LabelTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [viewMode, setViewMode] = useState<
    "overview" | "templates" | "jobs" | "printers"
  >("overview");

  // Print statistics
  const printStats = useMemo(() => {
    const totalPrints = templates.reduce((sum, t) => sum + t.printCount, 0);
    const todayPrints = printJobs
      .filter(
        (j) =>
          j.status === "COMPLETED" &&
          new Date(j.createdAt).toDateString() === new Date().toDateString(),
      )
      .reduce((sum, j) => sum + j.quantity, 0);
    const failedJobs = printJobs.filter((j) => j.status === "FAILED").length;
    const successRate =
      printJobs.length > 0
        ? (printJobs.filter((j) => j.status === "COMPLETED").length /
            printJobs.length) *
          100
        : 0;

    return {
      totalPrints,
      todayPrints,
      failedJobs,
      successRate,
      activeTemplates: templates.filter((t) => t.status === "ACTIVE").length,
    };
  }, [templates, printJobs]);

  // Print trend
  const printTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; prints: number; jobs: number }
    > = {};

    printJobs.forEach((job) => {
      const date = format(new Date(job.createdAt), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, prints: 0, jobs: 0 };
      }
      if (job.status === "COMPLETED") {
        dailyData[date].prints += job.quantity;
      }
      dailyData[date].jobs += 1;
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        prints: d.prints,
        jobs: d.jobs,
      }));
  }, [printJobs]);

  // Template usage
  const templateUsage = useMemo(() => {
    return templates
      .map((t) => ({
        name: t.name,
        prints: t.printCount,
      }))
      .sort((a, b) => b.prints - a.prints);
  }, [templates]);

  const stats = [
    {
      label: "Total Prints",
      value: printStats.totalPrints.toLocaleString(),
      icon: "ri-printer-line",
      tooltip: "Total labels printed",
      trend: "up" as const,
    },
    {
      label: "Today Prints",
      value: printStats.todayPrints.toLocaleString(),
      icon: "ri-file-line",
      tooltip: "Labels printed today",
      trend: "up" as const,
    },
    {
      label: "Success Rate",
      value: `${printStats.successRate.toFixed(1)}%`,
      icon: "ri-checkbox-circle-line",
      tooltip: "Print job success rate",
      trend: "up" as const,
    },
    {
      label: "Active Templates",
      value: printStats.activeTemplates,
      icon: "ri-file-edit-line",
      tooltip: "Active label templates",
      trend: "up" as const,
    },
  ];

  const handlePrint = (template: LabelTemplate) => {
    setSelectedTemplate(template);
    setShowPrintModal(true);
  };

  const handlePreview = (template: LabelTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  return (
    <PageTemplate
      title="Label Printing"
      description="Barcode generation, label templates, printer management, and print job tracking"
      icon="ri-printer-line"
      systemInfo={{
        sap: "Label Printing, Barcode Generation",
        oracle: "Label Management, Print Services",
        manhattan: "Label Printing, Barcode Labels",
      }}
      examples={[
        "Barcode generation",
        "Label template management",
        "Multiple printer support",
        "Print job tracking",
        "ZPL/EPL/PDF formats",
        "Shipping, picking, location labels",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["overview", "templates", "jobs", "printers"] as const).map(
              (mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-cyan-500 text-white"
                      : "text-[#9ca3af] hover:text-white"
                  }`}
                >
                  <i
                    className={`ri-${mode === "overview" ? "dashboard-line" : mode === "templates" ? "file-edit-line" : mode === "jobs" ? "file-list-line" : "printer-line"} mr-1`}
                  ></i>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ),
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <i className="ri-add-line"></i>
            New Template
          </button>
        </div>
      }
    >
      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Print Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Print Trend (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={printTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="prints"
                  fill="#06b6d4"
                  name="Labels Printed"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="jobs"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Print Jobs"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Template Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Template Usage
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={templateUsage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#9ca3af"
                  fontSize={10}
                  width={200}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="prints" fill="#06b6d4" name="Prints" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Templates View */}
      {viewMode === "templates" && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 ${
                  template.status === "ACTIVE"
                    ? "border-green-500/30"
                    : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {template.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-medium">
                        {template.type}
                      </span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                        {template.size}
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                        {template.format}
                      </span>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded inline-block ${
                        template.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {template.status}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-xs text-[#9ca3af]">
                    <i className="ri-printer-line mr-1"></i>
                    Printer: {template.printer}
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    <i className="ri-file-line mr-1"></i>
                    Prints: {template.printCount.toLocaleString()}
                  </div>
                  {template.lastUsed && (
                    <div className="text-xs text-[#9ca3af]">
                      <i className="ri-time-line mr-1"></i>
                      Last Used:{" "}
                      {format(new Date(template.lastUsed), "MMM dd, HH:mm")}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handlePrint(template)}
                    className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    <i className="ri-printer-line mr-1"></i>
                    Print
                  </button>
                  <Tooltip content="Preview" position="top">
                    <button
                      onClick={() => handlePreview(template)}
                      className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                    >
                      <i className="ri-eye-line"></i>
                    </button>
                  </Tooltip>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Print Jobs View */}
      {viewMode === "jobs" && (
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Job ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Printer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {printJobs.slice(0, 20).map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {job.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {job.templateName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {job.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9ca3af]">
                        {job.printer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            job.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400"
                              : job.status === "PRINTING"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : job.status === "FAILED"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9ca3af]">
                        {format(new Date(job.createdAt), "MMM dd, HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printers View */}
      {viewMode === "printers" && (
        <div className="space-y-4">
          {["Zebra ZT410", "Zebra ZD420", "Brother QL-800"].map(
            (printer, index) => (
              <motion.div
                key={printer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {printer}
                    </h3>
                    <div className="text-sm text-green-400">
                      <i className="ri-checkbox-circle-line mr-1"></i>
                      Online
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {printJobs
                        .filter(
                          (j) =>
                            j.printer === printer && j.status === "COMPLETED",
                        )
                        .reduce((sum, j) => sum + j.quantity, 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-sm text-[#9ca3af]">Labels Printed</div>
                  </div>
                </div>
              </motion.div>
            ),
          )}
        </div>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Label Template"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Template Name
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter template name"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Label Type
            </label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
              <option value="SHIPPING">Shipping</option>
              <option value="PICKING">Picking</option>
              <option value="LOCATION">Location</option>
              <option value="PRODUCT">Product</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">Size</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
              <option value="4x6">4x6 inches</option>
              <option value="3x2">3x2 inches</option>
              <option value="2x1">2x1 inches</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">Format</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
              <option value="ZPL">ZPL</option>
              <option value="EPL">EPL</option>
              <option value="PDF">PDF</option>
              <option value="PNG">PNG</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Create Template
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Print Modal */}
      <Modal
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setSelectedTemplate(null);
        }}
        title={`Print Labels - ${selectedTemplate?.name || ""}`}
        size="md"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Quantity
              </label>
              <input
                type="number"
                defaultValue={1}
                min={1}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Printer
              </label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                <option>{selectedTemplate.printer}</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => {
                  alert("Print job submitted!");
                  setShowPrintModal(false);
                  setSelectedTemplate(null);
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-printer-line mr-2"></i>
                Print
              </button>
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setSelectedTemplate(null);
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedTemplate(null);
        }}
        title={`Preview - ${selectedTemplate?.name || ""}`}
        size="md"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="p-8 bg-white rounded-lg border-2 border-dashed border-gray-300 text-center">
              <div className="text-sm text-gray-500 mb-2">Label Preview</div>
              <div className="text-xs text-gray-400">
                {selectedTemplate.size} | {selectedTemplate.format}
              </div>
              <div className="mt-4 text-xs text-gray-600">
                Fields: {selectedTemplate.fields.join(", ")}
              </div>
            </div>
            <button
              onClick={() => {
                setShowPreviewModal(false);
                setSelectedTemplate(null);
              }}
              className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
