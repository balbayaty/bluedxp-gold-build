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
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

interface SystemParameter {
  id: string;
  parameterKey: string;
  parameterName: string;
  category:
    | "INVENTORY"
    | "ORDER"
    | "WAREHOUSE"
    | "INTEGRATION"
    | "NOTIFICATION"
    | "SECURITY"
    | "SYSTEM";
  dataType: "STRING" | "NUMBER" | "BOOLEAN" | "DATE" | "JSON";
  value: string | number | boolean;
  defaultValue: string | number | boolean;
  description: string;
  isRequired: boolean;
  isEditable: boolean;
  validationRule?: string;
  lastModified: Date | string;
  modifiedBy: string;
  status: "ACTIVE" | "INACTIVE" | "DEPRECATED";
}

const generateSystemParameters = (count: number = 80): SystemParameter[] => {
  const categories: SystemParameter["category"][] = [
    "INVENTORY",
    "ORDER",
    "WAREHOUSE",
    "INTEGRATION",
    "NOTIFICATION",
    "SECURITY",
    "SYSTEM",
  ];
  const dataTypes: SystemParameter["dataType"][] = [
    "STRING",
    "NUMBER",
    "BOOLEAN",
    "DATE",
    "JSON",
  ];
  const statuses: SystemParameter["status"][] = [
    "ACTIVE",
    "INACTIVE",
    "DEPRECATED",
  ];

  const templates = [
    {
      key: "INVENTORY_REORDER_POINT",
      name: "Default Reorder Point",
      category: "INVENTORY" as const,
      type: "NUMBER" as const,
      defaultValue: 100,
      description: "Default reorder point for materials",
    },
    {
      key: "ORDER_AUTO_CONFIRM",
      name: "Auto Confirm Orders",
      category: "ORDER" as const,
      type: "BOOLEAN" as const,
      defaultValue: false,
      description: "Automatically confirm orders",
    },
    {
      key: "WAREHOUSE_CAPACITY_THRESHOLD",
      name: "Capacity Threshold",
      category: "WAREHOUSE" as const,
      type: "NUMBER" as const,
      defaultValue: 80,
      description: "Warehouse capacity warning threshold (%)",
    },
    {
      key: "INTEGRATION_RETRY_COUNT",
      name: "Integration Retry Count",
      category: "INTEGRATION" as const,
      type: "NUMBER" as const,
      defaultValue: 3,
      description: "Number of retries for failed integrations",
    },
    {
      key: "NOTIFICATION_EMAIL_ENABLED",
      name: "Email Notifications",
      category: "NOTIFICATION" as const,
      type: "BOOLEAN" as const,
      defaultValue: true,
      description: "Enable email notifications",
    },
    {
      key: "SECURITY_SESSION_TIMEOUT",
      name: "Session Timeout (minutes)",
      category: "SECURITY" as const,
      type: "NUMBER" as const,
      defaultValue: 30,
      description: "User session timeout in minutes",
    },
    {
      key: "SYSTEM_TIMEZONE",
      name: "System Timezone",
      category: "SYSTEM" as const,
      type: "STRING" as const,
      defaultValue: "Asia/Dubai",
      description: "System timezone",
    },
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const isRequired = Math.random() > 0.7;
    const isEditable = Math.random() > 0.3;

    let value: any = template.defaultValue;
    if (dataType === "NUMBER" && typeof value !== "number") {
      value = Math.floor(Math.random() * 1000);
    } else if (dataType === "BOOLEAN" && typeof value !== "boolean") {
      value = Math.random() > 0.5;
    } else if (dataType === "STRING" && typeof value !== "string") {
      value = `Value ${i + 1}`;
    }

    return {
      id: `PARAM-${String(i + 1).padStart(6, "0")}`,
      parameterKey: template.key || `PARAM_${i + 1}`,
      parameterName: template.name || `Parameter ${i + 1}`,
      category,
      dataType,
      value,
      defaultValue: template.defaultValue,
      description:
        template.description ||
        `System parameter for ${category.toLowerCase()}`,
      isRequired,
      isEditable,
      validationRule: dataType === "NUMBER" ? "min:0,max:10000" : undefined,
      lastModified: new Date(Date.now() - Math.random() * 90 * 86400000),
      modifiedBy: `User ${Math.floor(Math.random() * 10) + 1}`,
      status,
    };
  });
};

export default function SystemParameters() {
  const [parameters, setParameters] = useState<SystemParameter[]>([]);
  const [loading, setLoading] = useState(true);

  // Load settings from service
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { settingsService } = await import("@/lib/services/settings");
      const data = await settingsService.getSettings({});
      setParameters(data);
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Fallback to mock data
      setParameters(generateSystemParameters(80));
    } finally {
      setLoading(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedParameter, setSelectedParameter] =
    useState<SystemParameter | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<Partial<SystemParameter>>({});
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalParameters: 0,
    active: 0,
    modified: 0,
  });

  const filteredParameters = useMemo(() => {
    return parameters.filter((param) => {
      const matchesSearch =
        param.parameterKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        param.parameterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        param.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "ALL" || param.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "ALL" || param.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [parameters, searchQuery, selectedCategory, selectedStatus]);

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    parameters.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).map(([category, count]) => ({
      category: category.replace(/_/g, " "),
      count,
    }));
  }, [parameters]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    parameters.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [parameters]);

  const aggregateStats = useMemo(() => {
    const totalParameters = parameters.length;
    const active = parameters.filter((p) => p.status === "ACTIVE").length;
    const modified = parameters.filter((p) => {
      const modifiedDate = new Date(p.lastModified);
      const daysSinceModified =
        (Date.now() - modifiedDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceModified < 30;
    }).length;

    return {
      totalParameters,
      active,
      modified,
    };
  }, [parameters]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "system-parameters-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "system-parameters-stats",
      () => ({
        totalParameters: aggregateStats.totalParameters,
        active: simulateKPIUpdates(aggregateStats.active, 0.05),
        modified: simulateKPIUpdates(aggregateStats.modified, 0.1),
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
    aggregateStats.totalParameters,
    aggregateStats.active,
    aggregateStats.modified,
  ]);

  const stats = [
    {
      label: "Total Parameters",
      value: realTimeEnabled
        ? realTimeStats.totalParameters
        : aggregateStats.totalParameters,
      icon: "ri-settings-4-line",
      tooltip: "Total system parameters",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: realTimeEnabled ? realTimeStats.active : aggregateStats.active,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active parameters",
      trend: "up" as const,
    },
    {
      label: "Recently Modified",
      value: realTimeEnabled ? realTimeStats.modified : aggregateStats.modified,
      icon: "ri-edit-line",
      tooltip: "Parameters modified in last 30 days",
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

  const handleView = (parameter: SystemParameter) => {
    setSelectedParameter(parameter);
    setShowViewModal(true);
  };

  const handleEdit = (parameter: SystemParameter) => {
    setSelectedParameter(parameter);
    setFormData({ value: parameter.value });
    setShowEditModal(true);
  };

  const handleSave = () => {
    if (selectedParameter && formData.value !== undefined) {
      setParameters((prev) =>
        prev.map((p) =>
          p.id === selectedParameter.id
            ? {
                ...p,
                value: formData.value as any,
                lastModified: new Date(),
                modifiedBy: "Current User",
              }
            : p,
        ),
      );
      setShowEditModal(false);
      setSelectedParameter(null);
      setFormData({});
    }
  };

  return (
    <PageTemplate
      title="System Parameters"
      description="System configuration parameters management with categories, validation, version control, and audit trail"
      icon="ri-settings-4-line"
      systemInfo={{
        sap: "System Parameters, Configuration",
        oracle: "System Parameters, Configuration",
        manhattan: "System Parameters, Configuration",
      }}
      examples={[
        "System configuration",
        "Parameter management",
        "Category-based organization",
        "Validation rules",
        "Audit trail",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Table View"
            >
              <i className="ri-table-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Grid View"
            >
              <i className="ri-grid-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "analytics"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Analytics View"
            >
              <i className="ri-bar-chart-line text-sm sm:text-base"></i>
            </button>
          </div>
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
            placeholder="Search parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Categories</option>
          <option value="INVENTORY">Inventory</option>
          <option value="ORDER">Order</option>
          <option value="WAREHOUSE">Warehouse</option>
          <option value="INTEGRATION">Integration</option>
          <option value="NOTIFICATION">Notification</option>
          <option value="SECURITY">Security</option>
          <option value="SYSTEM">System</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DEPRECATED">Deprecated</option>
        </select>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Parameter Key
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredParameters.map((parameter, index) => (
                  <motion.tr
                    key={parameter.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {parameter.parameterKey}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">
                        {parameter.parameterName}
                      </div>
                      <div className="text-xs text-[#9ca3af] line-clamp-1">
                        {parameter.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                        {parameter.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                        {parameter.dataType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {typeof parameter.value === "boolean"
                          ? parameter.value
                            ? "Yes"
                            : "No"
                          : String(parameter.value)}
                      </div>
                      {parameter.value !== parameter.defaultValue && (
                        <div className="text-xs text-[#9ca3af]">
                          Default: {String(parameter.defaultValue)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          parameter.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : parameter.status === "INACTIVE"
                              ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {parameter.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => handleView(parameter)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {parameter.isEditable && (
                          <Tooltip content="Edit Parameter" position="top">
                            <button
                              onClick={() => handleEdit(parameter)}
                              className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParameters.map((parameter, index) => (
            <motion.div
              key={parameter.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 font-mono">
                    {parameter.parameterKey}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {parameter.parameterName}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    parameter.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : parameter.status === "INACTIVE"
                        ? "bg-gray-500/20 text-gray-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {parameter.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Category:</span>
                  <span className="text-white text-xs">
                    {parameter.category.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Type:</span>
                  <span className="text-white text-xs">
                    {parameter.dataType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Value:</span>
                  <span className="text-white font-medium">
                    {typeof parameter.value === "boolean"
                      ? parameter.value
                        ? "Yes"
                        : "No"
                      : String(parameter.value)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Required:</span>
                  <span
                    className={`text-xs ${parameter.isRequired ? "text-red-400" : "text-gray-400"}`}
                  >
                    {parameter.isRequired ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Editable:</span>
                  <span
                    className={`text-xs ${parameter.isEditable ? "text-green-400" : "text-gray-400"}`}
                  >
                    {parameter.isEditable ? "Yes" : "No"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleView(parameter)}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
                {parameter.isEditable && (
                  <button
                    onClick={() => handleEdit(parameter)}
                    className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                  >
                    <i className="ri-edit-line"></i>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
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
                Category Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, count }) => `${category}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {categoryDistribution.map((entry, index) => (
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
                Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusDistribution}>
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
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedParameter(null);
        }}
        title={`System Parameter - ${selectedParameter?.parameterName || ""}`}
        size="lg"
      >
        {selectedParameter && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Parameter Key</div>
                <div className="text-white font-medium font-mono">
                  {selectedParameter.parameterKey}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Parameter Name
                </div>
                <div className="text-white">
                  {selectedParameter.parameterName}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Category</div>
                <div className="text-white">
                  {selectedParameter.category.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Data Type</div>
                <div className="text-white">{selectedParameter.dataType}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Current Value</div>
                <div className="text-white font-medium">
                  {typeof selectedParameter.value === "boolean"
                    ? selectedParameter.value
                      ? "Yes"
                      : "No"
                    : String(selectedParameter.value)}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Default Value</div>
                <div className="text-white">
                  {typeof selectedParameter.defaultValue === "boolean"
                    ? selectedParameter.defaultValue
                      ? "Yes"
                      : "No"
                    : String(selectedParameter.defaultValue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedParameter.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedParameter.status === "INACTIVE"
                        ? "bg-gray-500/20 text-gray-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {selectedParameter.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Required</div>
                <div
                  className={`text-white ${selectedParameter.isRequired ? "text-red-400" : "text-gray-400"}`}
                >
                  {selectedParameter.isRequired ? "Yes" : "No"}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-1">Description</div>
              <div className="text-white">{selectedParameter.description}</div>
            </div>
            {selectedParameter.validationRule && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Validation Rule
                </div>
                <div className="text-white font-mono text-sm">
                  {selectedParameter.validationRule}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-[#9ca3af] mb-1">Last Modified</div>
              <div className="text-white">
                {format(new Date(selectedParameter.lastModified), "PPp")}
              </div>
              <div className="text-xs text-[#9ca3af] mt-1">
                By: {selectedParameter.modifiedBy}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedParameter(null);
          setFormData({});
        }}
        title={`Edit Parameter - ${selectedParameter?.parameterName || ""}`}
        size="md"
      >
        {selectedParameter && (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Parameter Key</div>
              <div className="text-white font-mono bg-white/5 p-2 rounded">
                {selectedParameter.parameterKey}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Data Type</div>
              <div className="text-white">{selectedParameter.dataType}</div>
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">Value</label>
              {selectedParameter.dataType === "BOOLEAN" ? (
                <select
                  value={String(formData.value ?? selectedParameter.value)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      value: e.target.value === "true",
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : selectedParameter.dataType === "NUMBER" ? (
                <input
                  type="number"
                  value={
                    typeof (formData.value ?? selectedParameter.value) ===
                    "number"
                      ? ((formData.value ?? selectedParameter.value) as number)
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              ) : (
                <input
                  type="text"
                  value={String(
                    formData.value ?? selectedParameter.value ?? "",
                  )}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              )}
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedParameter(null);
                  setFormData({});
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
