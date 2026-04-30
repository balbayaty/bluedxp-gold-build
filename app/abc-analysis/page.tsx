"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { generateABCAnalysis } from "@/utils/mockDataGenerators";
import { getInventoryLinks } from "@/utils/moduleInterconnectivity";
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

export default function ABCAnalysis() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ABC analysis from API
  useEffect(() => {
    const fetchABCAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/abc-analysis');
        const result = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to fetch ABC analysis');
        }
      } catch (err) {
        console.error('Error fetching ABC analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch ABC analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchABCAnalysis();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "chart" | "analysis">(
    "table",
  );
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.materialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.materialDescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [data, searchQuery, selectedCategory]);

  const categoryStats = useMemo(() => {
    const stats = { A: 0, B: 0, C: 0 };
    const values = { A: 0, B: 0, C: 0 };
    data.forEach((item) => {
      stats[item.category as keyof typeof stats]++;
      values[item.category as keyof typeof values] += item.annualValue;
    });
    return { stats, values };
  }, [data]);

  const chartData = useMemo(() => {
    return filteredData.slice(0, 20).map((item) => ({
      material: item.materialNumber,
      value: item.annualValue,
      category: item.category,
    }));
  }, [filteredData]);

  const pieData = useMemo(() => {
    return [
      {
        name: "Category A",
        value: categoryStats.values.A,
        count: categoryStats.stats.A,
      },
      {
        name: "Category B",
        value: categoryStats.values.B,
        count: categoryStats.stats.B,
      },
      {
        name: "Category C",
        value: categoryStats.values.C,
        count: categoryStats.stats.C,
      },
    ];
  }, [categoryStats]);

  const paretoData = useMemo(() => {
    return filteredData.slice(0, 20).map((item, index) => ({
      material: item.materialNumber.substring(0, 8),
      value: item.annualValue,
      cumulative: item.cumulativePercentage,
    }));
  }, [filteredData]);

  const stats = [
    {
      label: "Total Materials",
      value: data.length,
      icon: "ri-stack-line",
      tooltip: "Total number of materials analyzed",
      trend: "up" as const,
    },
    {
      label: "Category A",
      value: categoryStats.stats.A,
      icon: "ri-star-fill",
      tooltip: "High-value materials (80% of value)",
      trend: "neutral" as const,
    },
    {
      label: "Category B",
      value: categoryStats.stats.B,
      icon: "ri-star-half-fill",
      tooltip: "Medium-value materials (15% of value)",
      trend: "neutral" as const,
    },
    {
      label: "Category C",
      value: categoryStats.stats.C,
      icon: "ri-star-line",
      tooltip: "Low-value materials (5% of value)",
      trend: "neutral" as const,
    },
  ];

  const COLORS = {
    A: "#10b981", // Green
    B: "#f59e0b", // Amber
    C: "#ef4444", // Red
  };

  if (loading) {
    return (
      <PageTemplate
        title="ABC Analysis"
        description="Material classification and inventory optimization"
        icon="ri-bar-chart-box-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading ABC analysis...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="ABC Analysis"
        description="Material classification and inventory optimization"
        icon="ri-bar-chart-box-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="ABC Analysis"
      description="Material classification and inventory optimization - Pareto analysis for strategic inventory management based on annual value and usage patterns"
      icon="ri-bar-chart-box-line"
      systemInfo={{
        sap: "ABC Analysis - Material Classification (MM01, MMBE)",
        oracle: "ABC Classification - Inventory Optimization",
        manhattan: "ABC Analysis - Strategic Inventory Management",
      }}
      examples={[
        "Classify materials by annual value (A: 80%, B: 15%, C: 5%)",
        "Optimize inventory investment and storage locations",
        "Set reorder points and safety stock by category",
        "Identify high-priority materials for better management",
        "Pareto analysis for inventory optimization",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["table", "chart", "analysis"] as const).map((mode) => (
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
                  className={`ri-${mode === "table" ? "table-line" : mode === "chart" ? "bar-chart-line" : "-line-chart-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <Tooltip content="Export ABC Analysis Report" position="bottom">
            <button className="bg-white/5 border border-white/10 hover:border-cyan-500/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <i className="ri-download-line"></i>
              Export
            </button>
          </Tooltip>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Material Number or Description..."
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
          <option value="A">Category A (High Value)</option>
          <option value="B">Category B (Medium Value)</option>
          <option value="C">Category C (Low Value)</option>
        </select>
      </div>

      {/* View Modes */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Annual Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Annual Usage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Cumulative %
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredData.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/inventory?material=${item.materialNumber}`,
                          )
                        }
                        className="text-left hover:text-cyan-400 transition-colors"
                      >
                        <div className="text-sm font-medium text-white font-mono cursor-pointer">
                          {item.materialNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {item.materialDescription}
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.category === "A"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : item.category === "B"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        Category {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        AED {item.annualValue.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {item.annualUsage.toFixed(0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {item.percentage.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {item.cumulativePercentage.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.priority === "HIGH"
                            ? "bg-red-500/20 text-red-400"
                            : item.priority === "MEDIUM"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowViewModal(true);
                            }}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="View Stock" position="top">
                          <button
                            onClick={() =>
                              router.push(
                                `/inventory?material=${item.materialNumber}`,
                              )
                            }
                            className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                          >
                            <i className="ri-stack-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="View Material Master" position="top">
                          <button
                            onClick={() =>
                              router.push(
                                `/materials?material=${item.materialNumber}`,
                              )
                            }
                            className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                          >
                            <i className="ri-file-list-line"></i>
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "chart" && (
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
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, count }) =>
                    `${name}: ${count} items (${((value / pieData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={Object.values(COLORS)[index]}
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
              Top 20 Materials by Value
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="material" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {viewMode === "analysis" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Pareto Analysis (80/20 Rule)
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={paretoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="material" stroke="#9ca3af" fontSize={12} />
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
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="value"
                stroke="#06b6d4"
                strokeWidth={2}
                name="Annual Value"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                stroke="#10b981"
                strokeWidth={2}
                name="Cumulative %"
              />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedItem(null);
        }}
        title={`ABC Analysis Details - ${selectedItem?.materialNumber || ""}`}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Number
                </label>
                <button
                  onClick={() =>
                    router.push(
                      `/inventory?material=${selectedItem.materialNumber}`,
                    )
                  }
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedItem.materialNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Category
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedItem.category === "A"
                      ? "bg-green-500/20 text-green-400"
                      : selectedItem.category === "B"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  Category {selectedItem.category}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Annual Value
                </label>
                <div className="text-sm text-white font-medium">
                  AED {selectedItem.annualValue.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Annual Usage
                </label>
                <div className="text-sm text-white">
                  {selectedItem.annualUsage.toFixed(0)}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Percentage of Total
                </label>
                <div className="text-sm text-white">
                  {selectedItem.percentage.toFixed(2)}%
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Cumulative Percentage
                </label>
                <div className="text-sm text-white">
                  {selectedItem.cumulativePercentage.toFixed(2)}%
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Storage Location
                </label>
                <div className="text-sm text-white">
                  {selectedItem.storageLocation}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Priority
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedItem.priority === "HIGH"
                      ? "bg-red-500/20 text-red-400"
                      : selectedItem.priority === "MEDIUM"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedItem.priority}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <ModuleLinks
                links={getInventoryLinks(selectedItem.materialNumber)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() =>
                  router.push(
                    `/inventory?material=${selectedItem.materialNumber}`,
                  )
                }
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-stack-line"></i>
                View Stock
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/materials?material=${selectedItem.materialNumber}`,
                  )
                }
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-file-list-line"></i>
                View Material Master
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/storage-locations?location=${selectedItem.storageLocation}`,
                  )
                }
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-map-pin-line"></i>
                View Storage Location
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
