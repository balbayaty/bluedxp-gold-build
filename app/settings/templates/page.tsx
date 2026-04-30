"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

interface PrintTemplate {
  id: string;
  templateCode: string;
  templateName: string;
  documentType:
    | "DELIVERY_NOTE"
    | "PICKING_LIST"
    | "SHIPPING_LABEL"
    | "INVOICE"
    | "PACKING_SLIP"
    | "BATCH_LABEL"
    | "CUSTOM";
  printerType: "THERMAL" | "LASER" | "INKJET" | "LABEL" | "ANY";
  paperSize: "A4" | "A5" | "LETTER" | "LABEL_4x6" | "LABEL_3x2" | "CUSTOM";
  orientation: "PORTRAIT" | "LANDSCAPE";
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  isDefault: boolean;
  templateContent: string;
  variables: string[];
  previewUrl?: string;
  usageCount: number;
  lastUsed?: Date | string;
  lastModified: Date | string;
  modifiedBy: string;
  createdAt: Date | string;
}

interface PrintJob {
  id: string;
  jobNumber: string;
  templateCode: string;
  templateName: string;
  documentType: string;
  status: "PENDING" | "PRINTING" | "COMPLETED" | "FAILED" | "CANCELLED";
  printerName: string;
  copies: number;
  requestedBy: string;
  requestedAt: Date | string;
  completedAt?: Date | string;
  errorMessage?: string;
}

const generatePrintTemplates = (count: number = 50): PrintTemplate[] => {
  const documentTypes: PrintTemplate["documentType"][] = [
    "DELIVERY_NOTE",
    "PICKING_LIST",
    "SHIPPING_LABEL",
    "INVOICE",
    "PACKING_SLIP",
    "BATCH_LABEL",
    "CUSTOM",
  ];
  const printerTypes: PrintTemplate["printerType"][] = [
    "THERMAL",
    "LASER",
    "INKJET",
    "LABEL",
    "ANY",
  ];
  const paperSizes: PrintTemplate["paperSize"][] = [
    "A4",
    "A5",
    "LETTER",
    "LABEL_4x6",
    "LABEL_3x2",
    "CUSTOM",
  ];
  const statuses: PrintTemplate["status"][] = ["ACTIVE", "INACTIVE", "DRAFT"];

  const templates = [
    {
      code: "DN-STD",
      name: "Standard Delivery Note",
      type: "DELIVERY_NOTE" as const,
      variables: ["customerName", "orderNumber", "items", "date"],
    },
    {
      code: "PL-PICK",
      name: "Picking List",
      type: "PICKING_LIST" as const,
      variables: ["orderNumber", "picker", "locations", "items"],
    },
    {
      code: "SL-4x6",
      name: "Shipping Label 4x6",
      type: "SHIPPING_LABEL" as const,
      variables: ["trackingNumber", "address", "barcode"],
    },
    {
      code: "INV-A4",
      name: "Invoice A4",
      type: "INVOICE" as const,
      variables: ["invoiceNumber", "customer", "items", "total"],
    },
    {
      code: "PS-STD",
      name: "Packing Slip",
      type: "PACKING_SLIP" as const,
      variables: ["orderNumber", "items", "weight"],
    },
    {
      code: "BATCH-LBL",
      name: "Batch Label",
      type: "BATCH_LABEL" as const,
      variables: ["batchNumber", "material", "expiry"],
    },
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const printerType =
      printerTypes[Math.floor(Math.random() * printerTypes.length)];
    const paperSize = paperSizes[Math.floor(Math.random() * paperSizes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const isDefault = Math.random() > 0.9;

    return {
      id: `TEMPLATE-${String(i + 1).padStart(6, "0")}`,
      templateCode: template.code || `TMP-${i + 1}`,
      templateName: template.name || `Template ${i + 1}`,
      documentType: template.type,
      printerType,
      paperSize,
      orientation: paperSize.includes("LABEL")
        ? ("PORTRAIT" as const)
        : Math.random() > 0.5
          ? ("PORTRAIT" as const)
          : ("LANDSCAPE" as const),
      status,
      isDefault,
      templateContent: `Template content for ${template.name}`,
      variables: template.variables,
      usageCount: Math.floor(Math.random() * 1000),
      lastUsed:
        Math.random() > 0.3
          ? new Date(Date.now() - Math.random() * 30 * 86400000)
          : undefined,
      lastModified: new Date(Date.now() - Math.random() * 90 * 86400000),
      modifiedBy: `User ${Math.floor(Math.random() * 10) + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 180 * 86400000),
    };
  });
};

const generatePrintJobs = (count: number = 100): PrintJob[] => {
  const statuses: PrintJob["status"][] = [
    "PENDING",
    "PRINTING",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
  ];

  return Array.from({ length: count }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const requestedAt = new Date(Date.now() - Math.random() * 7 * 86400000);

    return {
      id: `JOB-${String(i + 1).padStart(6, "0")}`,
      jobNumber: `JOB-${new Date().getFullYear()}-${String(i + 1).padStart(6, "0")}`,
      templateCode: `TMP-${Math.floor(Math.random() * 50) + 1}`,
      templateName: `Template ${Math.floor(Math.random() * 50) + 1}`,
      documentType: ["DELIVERY_NOTE", "PICKING_LIST", "SHIPPING_LABEL"][
        Math.floor(Math.random() * 3)
      ],
      status,
      printerName: `Printer ${Math.floor(Math.random() * 10) + 1}`,
      copies: Math.floor(Math.random() * 5) + 1,
      requestedBy: `User ${Math.floor(Math.random() * 10) + 1}`,
      requestedAt,
      completedAt: ["COMPLETED", "FAILED"].includes(status)
        ? new Date(requestedAt.getTime() + Math.random() * 3600000)
        : undefined,
      errorMessage: status === "FAILED" ? "Printer offline" : undefined,
    };
  });
};

export default function PrintTemplates() {
  const [templates, setTemplates] = useState<PrintTemplate[]>(() =>
    generatePrintTemplates(50),
  );
  const [printJobs] = useState<PrintJob[]>(() => generatePrintJobs(100));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"templates" | "jobs" | "analytics">(
    "templates",
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<PrintTemplate | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [formData, setFormData] = useState<Partial<PrintTemplate>>({});
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalTemplates: 0,
    activeTemplates: 0,
    totalJobs: 0,
    pendingJobs: 0,
  });

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        template.templateCode
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        template.templateName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === "ALL" || template.documentType === selectedType;
      const matchesStatus =
        selectedStatus === "ALL" || template.status === selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [templates, searchQuery, selectedType, selectedStatus]);

  const filteredJobs = useMemo(() => {
    return printJobs.filter((job) => {
      const matchesSearch =
        job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.printerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [printJobs, searchQuery]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach((t) => {
      counts[t.documentType] = (counts[t.documentType] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      count,
    }));
  }, [templates]);

  const jobStatusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    printJobs.forEach((j) => {
      counts[j.status] = (counts[j.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [printJobs]);

  const dailyJobTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; completed: number; failed: number }
    > = {};

    printJobs.forEach((j) => {
      const date = format(new Date(j.requestedAt), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, completed: 0, failed: 0 };
      }
      if (j.status === "COMPLETED") {
        dailyData[date].completed++;
      } else if (j.status === "FAILED") {
        dailyData[date].failed++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        completed: d.completed,
        failed: d.failed,
      }));
  }, [printJobs]);

  const aggregateStats = useMemo(() => {
    const totalTemplates = templates.length;
    const activeTemplates = templates.filter(
      (t) => t.status === "ACTIVE",
    ).length;
    const totalJobs = printJobs.length;
    const pendingJobs = printJobs.filter((j) =>
      ["PENDING", "PRINTING"].includes(j.status),
    ).length;

    return {
      totalTemplates,
      activeTemplates,
      totalJobs,
      pendingJobs,
    };
  }, [templates, printJobs]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "print-templates-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "print-templates-stats",
      () => ({
        totalTemplates: aggregateStats.totalTemplates,
        activeTemplates: simulateKPIUpdates(
          aggregateStats.activeTemplates,
          0.05,
        ),
        totalJobs: aggregateStats.totalJobs,
        pendingJobs: simulateKPIUpdates(aggregateStats.pendingJobs, 0.1),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    realTimeEnabled,
    aggregateStats.totalTemplates,
    aggregateStats.activeTemplates,
    aggregateStats.totalJobs,
    aggregateStats.pendingJobs,
  ]);

  const stats = [
    {
      label: "Total Templates",
      value: realTimeEnabled
        ? realTimeStats.totalTemplates
        : aggregateStats.totalTemplates,
      icon: "ri-file-text-line",
      tooltip: "Total print templates",
      trend: "up" as const,
    },
    {
      label: "Active Templates",
      value: realTimeEnabled
        ? realTimeStats.activeTemplates
        : aggregateStats.activeTemplates,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active templates",
      trend: "up" as const,
    },
    {
      label: "Total Print Jobs",
      value: realTimeEnabled
        ? realTimeStats.totalJobs
        : aggregateStats.totalJobs,
      icon: "ri-printer-line",
      tooltip: "Total print jobs",
      trend: "up" as const,
    },
    {
      label: "Pending Jobs",
      value: realTimeEnabled
        ? realTimeStats.pendingJobs
        : aggregateStats.pendingJobs,
      icon: "ri-time-line",
      tooltip: "Pending print jobs",
      trend: "neutral" as const,
    },
  ];

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const handleView = (template: PrintTemplate) => {
    setSelectedTemplate(template);
    setShowViewModal(true);
  };

  const handlePreview = (template: PrintTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleCreate = () => {
    setFormData({
      documentType: "DELIVERY_NOTE",
      printerType: "LASER",
      paperSize: "A4",
      orientation: "PORTRAIT",
      status: "DRAFT",
      isDefault: false,
      templateContent: "",
      variables: [],
    });
    setShowCreateModal(true);
  };

  const handleSave = () => {
    if (formData.templateCode && formData.templateName) {
      const newTemplate: PrintTemplate = {
        id: `TEMPLATE-${String(templates.length + 1).padStart(6, "0")}`,
        templateCode: formData.templateCode,
        templateName: formData.templateName,
        documentType: formData.documentType || "DELIVERY_NOTE",
        printerType: formData.printerType || "LASER",
        paperSize: formData.paperSize || "A4",
        orientation: formData.orientation || "PORTRAIT",
        status: formData.status || "DRAFT",
        isDefault: formData.isDefault || false,
        templateContent: formData.templateContent || "",
        variables: formData.variables || [],
        usageCount: 0,
        lastModified: new Date(),
        modifiedBy: "Current User",
        createdAt: new Date(),
      };
      setTemplates((prev) => [...prev, newTemplate]);
      setShowCreateModal(false);
      setFormData({});
    }
  };

  return (
    <PageTemplate
      title="Print Templates"
      description="Print template management with template designer, preview, print job tracking, and printer configuration"
      icon="ri-file-text-line"
      systemInfo={{
        sap: "Print Templates, Output Management",
        oracle: "Print Templates, Output Management",
        manhattan: "Print Templates, Output Management",
      }}
      examples={[
        "Template designer",
        "Document preview",
        "Print job tracking",
        "Printer configuration",
        "Template variables",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            <button
              onClick={() => setViewMode("templates")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "templates"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Templates"
            >
              <i className="ri-file-text-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("jobs")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "jobs"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Print Jobs"
            >
              <i className="ri-printer-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "analytics"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Analytics"
            >
              <i className="ri-bar-chart-line text-sm sm:text-base"></i>
            </button>
          </div>
          <button
            onClick={handleCreate}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Create Template
          </button>
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              realTimeEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i
              className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
            ></i>
            Real-time
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search templates or jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        {viewMode === "templates" && (
          <>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
            >
              <option value="ALL">All Types</option>
              <option value="DELIVERY_NOTE">Delivery Note</option>
              <option value="PICKING_LIST">Picking List</option>
              <option value="SHIPPING_LABEL">Shipping Label</option>
              <option value="INVOICE">Invoice</option>
              <option value="PACKING_SLIP">Packing Slip</option>
              <option value="BATCH_LABEL">Batch Label</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DRAFT">Draft</option>
            </select>
          </>
        )}
      </div>

      {/* Templates View */}
      {viewMode === "templates" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {template.isDefault && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                        Default
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        template.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : template.status === "INACTIVE"
                            ? "bg-gray-500/20 text-gray-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {template.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1 font-mono">
                    {template.templateCode}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {template.templateName}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Type:</span>
                  <span className="text-white text-xs">
                    {template.documentType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Printer:</span>
                  <span className="text-white text-xs">
                    {template.printerType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Paper Size:</span>
                  <span className="text-white text-xs">
                    {template.paperSize}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Usage:</span>
                  <span className="text-white font-medium">
                    {template.usageCount} times
                  </span>
                </div>
                {template.lastUsed && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Last Used:</span>
                    <span className="text-white text-xs">
                      {format(new Date(template.lastUsed), "MMM dd")}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleView(template)}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
                <button
                  onClick={() => handlePreview(template)}
                  className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                  title="Preview"
                >
                  <i className="ri-eye-2-line"></i>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Print Jobs View */}
      {viewMode === "jobs" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Job Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Printer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Copies
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Requested
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredJobs.map((job, index) => (
                  <motion.tr
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {job.jobNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {job.templateName}
                      </div>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {job.templateCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                        {job.documentType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {job.printerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {job.copies}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          job.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : job.status === "PRINTING"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : job.status === "PENDING"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : job.status === "FAILED"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {format(new Date(job.requestedAt), "MMM dd, HH:mm")}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {job.requestedBy}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Template Type Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, count }) => `${type}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Print Job Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jobStatusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="status" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Daily Print Job Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyJobTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Completed"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Failed"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTemplate(null);
        }}
        title={`Print Template - ${selectedTemplate?.templateName || ""}`}
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Template Code</div>
                <div className="text-white font-medium font-mono">
                  {selectedTemplate.templateCode}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Template Name</div>
                <div className="text-white">
                  {selectedTemplate.templateName}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Document Type</div>
                <div className="text-white">
                  {selectedTemplate.documentType.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Printer Type</div>
                <div className="text-white">{selectedTemplate.printerType}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Paper Size</div>
                <div className="text-white">{selectedTemplate.paperSize}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Orientation</div>
                <div className="text-white">{selectedTemplate.orientation}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedTemplate.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedTemplate.status === "INACTIVE"
                        ? "bg-gray-500/20 text-gray-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedTemplate.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Is Default</div>
                <div
                  className={`text-white ${selectedTemplate.isDefault ? "text-yellow-400" : "text-gray-400"}`}
                >
                  {selectedTemplate.isDefault ? "Yes" : "No"}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">
                Template Variables
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.variables.map((variable, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded text-xs bg-cyan-500/20 text-cyan-400 font-mono"
                  >
                    {`{${variable}}`}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">
                Template Content
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <pre className="text-sm text-white font-mono whitespace-pre-wrap">
                  {selectedTemplate.templateContent}
                </pre>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Usage Count</div>
                <div className="text-lg font-semibold text-white">
                  {selectedTemplate.usageCount}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Last Modified</div>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedTemplate.lastModified),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Modified By</div>
                <div className="text-sm text-white">
                  {selectedTemplate.modifiedBy}
                </div>
              </div>
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
        title={`Preview - ${selectedTemplate?.templateName || ""}`}
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="border-2 border-dashed border-gray-300 p-6 min-h-[400px]">
                <div className="text-center text-gray-500">
                  <i className="ri-file-text-line text-6xl mb-4"></i>
                  <p className="text-lg font-semibold mb-2">
                    {selectedTemplate.templateName}
                  </p>
                  <p className="text-sm">
                    Preview of{" "}
                    {selectedTemplate.documentType.replace(/_/g, " ")}
                  </p>
                  <div className="mt-4 text-xs text-gray-400">
                    Paper Size: {selectedTemplate.paperSize} | Orientation:{" "}
                    {selectedTemplate.orientation}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors">
                <i className="ri-printer-line mr-2"></i>
                Print Preview
              </button>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({});
        }}
        title="Create Print Template"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Template Code *
            </label>
            <input
              type="text"
              value={formData.templateCode || ""}
              onChange={(e) =>
                setFormData({ ...formData, templateCode: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="TMP-CODE"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.templateName || ""}
              onChange={(e) =>
                setFormData({ ...formData, templateName: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Template Name"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Document Type
              </label>
              <select
                value={formData.documentType || "DELIVERY_NOTE"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    documentType: e.target.value as any,
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="DELIVERY_NOTE">Delivery Note</option>
                <option value="PICKING_LIST">Picking List</option>
                <option value="SHIPPING_LABEL">Shipping Label</option>
                <option value="INVOICE">Invoice</option>
                <option value="PACKING_SLIP">Packing Slip</option>
                <option value="BATCH_LABEL">Batch Label</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Printer Type
              </label>
              <select
                value={formData.printerType || "LASER"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    printerType: e.target.value as any,
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="THERMAL">Thermal</option>
                <option value="LASER">Laser</option>
                <option value="INKJET">Inkjet</option>
                <option value="LABEL">Label</option>
                <option value="ANY">Any</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Paper Size
              </label>
              <select
                value={formData.paperSize || "A4"}
                onChange={(e) =>
                  setFormData({ ...formData, paperSize: e.target.value as any })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="A4">A4</option>
                <option value="A5">A5</option>
                <option value="LETTER">Letter</option>
                <option value="LABEL_4x6">Label 4x6</option>
                <option value="LABEL_3x2">Label 3x2</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Orientation
              </label>
              <select
                value={formData.orientation || "PORTRAIT"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    orientation: e.target.value as any,
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="PORTRAIT">Portrait</option>
                <option value="LANDSCAPE">Landscape</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Template Content
            </label>
            <textarea
              value={formData.templateContent || ""}
              onChange={(e) =>
                setFormData({ ...formData, templateContent: e.target.value })
              }
              rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter template content with variables like {customerName}, {orderNumber}, etc."
            />
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Template
            </button>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setFormData({});
              }}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
