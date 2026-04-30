"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Modal from "./Modal";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

/**
 * Custom Report Builder Component
 * Allows users to create custom reports with drag-and-drop interface
 */

export interface ReportField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "percentage";
  source: string;
}

export interface ReportChart {
  id: string;
  type: "bar" | "line" | "pie" | "area";
  title: string;
  dataKey: string;
  xAxisKey: string;
  color: string;
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  fields: ReportField[];
  charts: ReportChart[];
  filters: Array<{ field: string; operator: string; value: any }>;
  groupBy?: string;
  sortBy?: string;
  createdAt: Date;
}

interface CustomReportBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (report: CustomReport) => void;
  initialReport?: CustomReport;
}

const AVAILABLE_FIELDS: ReportField[] = [
  { id: "date", label: "Date", type: "date", source: "orders" },
  { id: "orderNumber", label: "Order Number", type: "text", source: "orders" },
  { id: "customer", label: "Customer", type: "text", source: "orders" },
  { id: "amount", label: "Amount", type: "currency", source: "orders" },
  { id: "status", label: "Status", type: "text", source: "orders" },
  { id: "quantity", label: "Quantity", type: "number", source: "inventory" },
  { id: "material", label: "Material", type: "text", source: "inventory" },
  { id: "location", label: "Location", type: "text", source: "inventory" },
  { id: "shipment", label: "Shipment", type: "text", source: "shipments" },
  { id: "carrier", label: "Carrier", type: "text", source: "shipments" },
];

const CHART_TYPES: Array<{
  type: ReportChart["type"];
  label: string;
  icon: string;
}> = [
  { type: "bar", label: "Bar Chart", icon: "ri-bar-chart-line" },
  { type: "line", label: "Line Chart", icon: "ri-line-chart-line" },
  { type: "pie", label: "Pie Chart", icon: "ri-pie-chart-line" },
  { type: "area", label: "Area Chart", icon: "ri-stack-line" },
];

const COLORS = [
  "#22d3ee",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
];

export default function CustomReportBuilder({
  isOpen,
  onClose,
  onSave,
  initialReport,
}: CustomReportBuilderProps) {
  const [reportName, setReportName] = useState(initialReport?.name || "");
  const [reportDescription, setReportDescription] = useState(
    initialReport?.description || "",
  );
  const [selectedFields, setSelectedFields] = useState<ReportField[]>(
    initialReport?.fields || [],
  );
  const [charts, setCharts] = useState<ReportChart[]>(
    initialReport?.charts || [],
  );
  const [activeTab, setActiveTab] = useState<
    "fields" | "charts" | "filters" | "preview"
  >("fields");

  const handleAddField = useCallback(
    (field: ReportField) => {
      if (!selectedFields.find((f) => f.id === field.id)) {
        setSelectedFields([...selectedFields, field]);
      }
    },
    [selectedFields],
  );

  const handleRemoveField = useCallback(
    (fieldId: string) => {
      setSelectedFields(selectedFields.filter((f) => f.id !== fieldId));
    },
    [selectedFields],
  );

  const handleAddChart = useCallback(() => {
    const newChart: ReportChart = {
      id: `chart-${Date.now()}`,
      type: "bar",
      title: "New Chart",
      dataKey:
        selectedFields.find((f) => f.type === "number" || f.type === "currency")
          ?.id || "amount",
      xAxisKey:
        selectedFields.find((f) => f.type === "text" || f.type === "date")
          ?.id || "date",
      color: COLORS[charts.length % COLORS.length],
    };
    setCharts([...charts, newChart]);
  }, [charts, selectedFields]);

  const handleUpdateChart = useCallback(
    (chartId: string, updates: Partial<ReportChart>) => {
      setCharts(
        charts.map((chart) =>
          chart.id === chartId ? { ...chart, ...updates } : chart,
        ),
      );
    },
    [charts],
  );

  const handleRemoveChart = useCallback(
    (chartId: string) => {
      setCharts(charts.filter((chart) => chart.id !== chartId));
    },
    [charts],
  );

  const handleSave = useCallback(() => {
    if (!reportName.trim()) {
      alert("Please enter a report name");
      return;
    }

    const report: CustomReport = {
      id: initialReport?.id || `report-${Date.now()}`,
      name: reportName,
      description: reportDescription,
      fields: selectedFields,
      charts,
      filters: [],
      createdAt: initialReport?.createdAt || new Date(),
    };

    if (onSave) {
      onSave(report);
    }
    onClose();
  }, [
    reportName,
    reportDescription,
    selectedFields,
    charts,
    initialReport,
    onSave,
    onClose,
  ]);

  // Mock data for preview
  const previewData = [
    { date: "2024-01-01", amount: 1000, quantity: 50, status: "Completed" },
    { date: "2024-01-02", amount: 1500, quantity: 75, status: "Pending" },
    { date: "2024-01-03", amount: 2000, quantity: 100, status: "Completed" },
    { date: "2024-01-04", amount: 1200, quantity: 60, status: "In Progress" },
    { date: "2024-01-05", amount: 1800, quantity: 90, status: "Completed" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Custom Report Builder"
      size="xl"
    >
      <div className="space-y-6">
        {/* Report Info */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Report Name *
          </label>
          <input
            type="text"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
            placeholder="Enter report name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Description
          </label>
          <textarea
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
            placeholder="Enter report description"
            rows={3}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {(["fields", "charts", "filters", "preview"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Fields Tab */}
        {activeTab === "fields" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Available Fields
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_FIELDS.map((field) => (
                  <motion.button
                    key={field.id}
                    onClick={() => handleAddField(field)}
                    disabled={selectedFields.some((f) => f.id === field.id)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      selectedFields.some((f) => f.id === field.id)
                        ? "border-green-500/50 bg-green-500/10 opacity-50 cursor-not-allowed"
                        : "border-white/10 bg-white/5 hover:border-cyan-500/50 hover:bg-white/10"
                    }`}
                    whileHover={{
                      scale: selectedFields.some((f) => f.id === field.id)
                        ? 1
                        : 1.02,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white text-sm font-medium">
                          {field.label}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {field.source}
                        </div>
                      </div>
                      {selectedFields.some((f) => f.id === field.id) && (
                        <i className="ri-check-line text-green-400"></i>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {selectedFields.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Selected Fields
                </h3>
                <div className="space-y-2">
                  {selectedFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div>
                        <div className="text-white text-sm font-medium">
                          {field.label}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {field.type} • {field.source}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveField(field.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === "charts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Charts</h3>
              <button
                onClick={handleAddChart}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-add-line mr-2"></i>
                Add Chart
              </button>
            </div>

            {charts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <i className="ri-bar-chart-line text-4xl mb-4"></i>
                <p>No charts added yet. Click "Add Chart" to create one.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {charts.map((chart) => (
                  <div
                    key={chart.id}
                    className="p-4 bg-white/5 border border-white/10 rounded-lg"
                  >
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Chart Type
                        </label>
                        <select
                          value={chart.type}
                          onChange={(e) =>
                            handleUpdateChart(chart.id, {
                              type: e.target.value as ReportChart["type"],
                            })
                          }
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                        >
                          {CHART_TYPES.map((type) => (
                            <option key={type.type} value={type.type}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={chart.title}
                          onChange={(e) =>
                            handleUpdateChart(chart.id, {
                              title: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Data Key
                        </label>
                        <select
                          value={chart.dataKey}
                          onChange={(e) =>
                            handleUpdateChart(chart.id, {
                              dataKey: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                        >
                          {selectedFields
                            .filter(
                              (f) =>
                                f.type === "number" || f.type === "currency",
                            )
                            .map((field) => (
                              <option key={field.id} value={field.id}>
                                {field.label}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          X-Axis Key
                        </label>
                        <select
                          value={chart.xAxisKey}
                          onChange={(e) =>
                            handleUpdateChart(chart.id, {
                              xAxisKey: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                        >
                          {selectedFields
                            .filter(
                              (f) => f.type === "text" || f.type === "date",
                            )
                            .map((field) => (
                              <option key={field.id} value={field.id}>
                                {field.label}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">Color:</label>
                        <input
                          type="color"
                          value={chart.color}
                          onChange={(e) =>
                            handleUpdateChart(chart.id, {
                              color: e.target.value,
                            })
                          }
                          className="w-8 h-8 rounded border border-white/10"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveChart(chart.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Preview</h3>
            {charts.length > 0 ? (
              <div className="space-y-6">
                {charts.map((chart) => (
                  <div
                    key={chart.id}
                    className="p-4 bg-white/5 border border-white/10 rounded-lg"
                  >
                    <h4 className="text-white font-medium mb-4">
                      {chart.title}
                    </h4>
                    <div className="h-64">
                      {chart.type === "bar" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={previewData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#374151"
                            />
                            <XAxis dataKey={chart.xAxisKey} stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                              }}
                            />
                            <Bar dataKey={chart.dataKey} fill={chart.color} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                      {chart.type === "line" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={previewData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#374151"
                            />
                            <XAxis dataKey={chart.xAxisKey} stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey={chart.dataKey}
                              stroke={chart.color}
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                      {chart.type === "pie" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={previewData}
                              dataKey={chart.dataKey}
                              nameKey={chart.xAxisKey}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill={chart.color}
                            >
                              {previewData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                      {chart.type === "area" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={previewData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#374151"
                            />
                            <XAxis dataKey={chart.xAxisKey} stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey={chart.dataKey}
                              stroke={chart.color}
                              fill={chart.color}
                              fillOpacity={0.6}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <i className="ri-eye-line text-4xl mb-4"></i>
                <p>Add charts to see preview</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <i className="ri-save-line mr-2"></i>
            Save Report
          </button>
        </div>
      </div>
    </Modal>
  );
}
