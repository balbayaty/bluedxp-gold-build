/**
 * Advanced Lifecycle Management Page
 * Deep, layered, fully interactive lifecycle management with real-time updates
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { lifecycleService } from "@/lib/services/process-lifecycle";
import {
  processOrchestrator,
  processAnalyticsService,
} from "@/lib/services/process-lifecycle";
import LifecycleView from "@/components/process-lifecycle/lifecycle/LifecycleView";
import ErrorBoundary from "@/components/ErrorBoundary";
import Link from "next/link";
import { format } from "date-fns";
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
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";

interface EntityItem {
  id: string;
  type: string;
  name: string;
  status: string;
  description: string;
  icon: string;
  href?: string;
  createdAt: Date;
  lastUpdated: Date;
  stage?: string;
  progress?: number;
  slaStatus?: "ON_TIME" | "AT_RISK" | "BREACHED";
  efficiency?: number;
  duration?: number;
}

export default function LifecycleManagementPage() {
  const [selectedEntity, setSelectedEntity] = useState<{
    id: string;
    type: string;
  } | null>(null);
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterSLA, setFilterSLA] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "grid" | "list" | "timeline" | "analytics"
  >("grid");
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(
    new Set(),
  );
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareEntities, setCompareEntities] = useState<string[]>([]);

  useEffect(() => {
    loadEntities();
    loadAnalytics();

    if (realTimeEnabled) {
      const interval = setInterval(() => {
        loadEntities();
        loadAnalytics();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const loadEntities = async () => {
    try {
      setLoading(true);
      
      // Fetch real entities with lifecycle data from API
      const response = await fetch("/api/process-lifecycle/entities?limit=100");
      const result = await response.json();
      
      if (result.success && result.data) {
        // Map API response to EntityItem interface
        const mappedEntities: EntityItem[] = result.data.map((entity: any) => ({
          id: entity.id,
          type: entity.type,
          name: entity.name,
          status: entity.status,
          description: entity.description,
          icon: entity.icon,
          href: entity.href,
          createdAt: new Date(entity.createdAt),
          lastUpdated: new Date(entity.lastUpdated),
          stage: entity.stage,
          progress: entity.progress || 0,
          slaStatus: entity.slaStatus || "ON_TIME",
          efficiency: entity.efficiency || 0,
          duration: entity.duration || 0,
        }));
        
        setEntities(mappedEntities);
      } else {
        console.error("Failed to load entities:", result.error);
        // Fallback to empty array if API fails
        setEntities([]);
      }
    } catch (error) {
      console.error("Error loading entities:", error);
      // Fallback to empty array on error
      setEntities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await processAnalyticsService.getProcessAnalytics("ALL");
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const filteredEntities = useMemo(() => {
    return entities.filter((entity) => {
      const matchesSearch =
        entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "ALL" || entity.type === filterType;
      const matchesStatus =
        filterStatus === "ALL" || entity.status === filterStatus;
      const matchesSLA = filterSLA === "ALL" || entity.slaStatus === filterSLA;
      return matchesSearch && matchesType && matchesStatus && matchesSLA;
    });
  }, [entities, searchQuery, filterType, filterStatus, filterSLA]);

  const toggleEntitySelection = (entityId: string) => {
    setSelectedEntities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId);
      } else {
        newSet.add(entityId);
      }
      return newSet;
    });
  };

  const toggleComparison = (entityId: string) => {
    setCompareEntities((prev) => {
      if (prev.includes(entityId)) {
        return prev.filter((id) => id !== entityId);
      } else if (prev.length < 3) {
        return [...prev, entityId];
      }
      return prev;
    });
  };

  const entityTypes = useMemo(() => {
    return Array.from(new Set(entities.map((e) => e.type)));
  }, [entities]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    entities.forEach((e) => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [entities]);

  const slaDistribution = useMemo(() => {
    const counts = { ON_TIME: 0, AT_RISK: 0, BREACHED: 0 };
    entities.forEach((e) => {
      if (e.slaStatus) counts[e.slaStatus]++;
    });
    return [
      { name: "On Time", value: counts.ON_TIME, color: "#10b981" },
      { name: "At Risk", value: counts.AT_RISK, color: "#f59e0b" },
      { name: "Breached", value: counts.BREACHED, color: "#ef4444" },
    ];
  }, [entities]);

  if (selectedEntity) {
    return (
      <ErrorBoundary
        fallback={
          <div className="text-red-400 p-4">
            Error loading Lifecycle Management
          </div>
        }
      >
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedEntity(null)}
            className="mb-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back to List
          </button>
          <LifecycleView
            entityId={selectedEntity.id}
            entityType={selectedEntity.type}
            viewMode="timeline"
            showLayers={["overview", "details", "events", "modules", "ai"]}
            enableRealTime={true}
            enablePredictive={true}
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="text-red-400 p-4">
          Error loading Lifecycle Management
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <i className="ri-flow-chart-line text-cyan-400"></i>
                Lifecycle Management
              </h1>
              <p className="text-[#9ca3af]">
                Manage and track entity lifecycles across the platform
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  realTimeEnabled
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-[#9ca3af] border border-white/10"
                }`}
              >
                <i
                  className={`ri-${realTimeEnabled ? "pause" : "play"}-line mr-2`}
                ></i>
                {realTimeEnabled ? "Live" : "Paused"}
              </button>
              <button
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  comparisonMode
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-white/5 text-[#9ca3af] border border-white/10"
                }`}
              >
                <i className="ri-bar-chart-line mr-2"></i>
                Compare
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 mb-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"></i>
                <input
                  type="text"
                  placeholder="Search entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#9ca3af] focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="ALL">All Types</option>
                {entityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="ALL">All Statuses</option>
                {Array.from(new Set(entities.map((e) => e.status))).map(
                  (status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </option>
                  ),
                )}
              </select>
              <select
                value={filterSLA}
                onChange={(e) => setFilterSLA(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="ALL">All SLA Status</option>
                <option value="ON_TIME">On Time</option>
                <option value="AT_RISK">At Risk</option>
                <option value="BREACHED">Breached</option>
              </select>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1 mb-4">
            {(["grid", "list", "timeline", "analytics"] as const).map(
              (mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-cyan-500 text-white"
                      : "text-[#9ca3af] hover:text-white"
                  }`}
                >
                  <i
                    className={`ri-${mode === "grid" ? "grid-line" : mode === "list" ? "list-check" : mode === "timeline" ? "time-line" : "bar-chart-line"} mr-2`}
                  ></i>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ),
            )}
          </div>

          {/* Bulk Actions */}
          {selectedEntities.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <strong>{selectedEntities.size}</strong> entity(s) selected
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors">
                    <i className="ri-download-line mr-2"></i>
                    Export
                  </button>
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors">
                    <i className="ri-bar-chart-line mr-2"></i>
                    Compare
                  </button>
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors">
                    <i className="ri-delete-bin-line mr-2"></i>
                    Archive
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Comparison Mode */}
          {comparisonMode && compareEntities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-bar-chart-line text-purple-400"></i>
                Entity Comparison ({compareEntities.length}/3)
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {compareEntities.map((entityId) => {
                  const entity = entities.find((e) => e.id === entityId);
                  if (!entity) return null;
                  return (
                    <div key={entityId} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-white">
                          {entity.name}
                        </div>
                        <button
                          onClick={() => toggleComparison(entityId)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#9ca3af]">Progress:</span>
                          <span className="text-white">{entity.progress}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#9ca3af]">Efficiency:</span>
                          <span className="text-white">
                            {entity.efficiency}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#9ca3af]">Duration:</span>
                          <span className="text-white">{entity.duration}h</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Content Area */}
        {viewMode === "analytics" ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#3b82f6",
                              "#10b981",
                              "#f59e0b",
                              "#ef4444",
                              "#8b5cf6",
                            ][index % 5]
                          }
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  SLA Performance
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={slaDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {slaDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntities.map((entity) => (
              <motion.div
                key={entity.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() =>
                  !comparisonMode &&
                  setSelectedEntity({ id: entity.id, type: entity.type })
                }
                className={`bg-white/5 backdrop-blur-xl border rounded-xl p-4 cursor-pointer transition-all group ${
                  comparisonMode && compareEntities.includes(entity.id)
                    ? "border-purple-500/50 bg-purple-500/10"
                    : selectedEntities.has(entity.id)
                      ? "border-cyan-500/50 bg-cyan-500/10"
                      : "border-white/10 hover:border-cyan-500/30"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        comparisonMode && compareEntities.includes(entity.id)
                          ? "bg-purple-500/20"
                          : "bg-cyan-500/20 group-hover:bg-cyan-500/30"
                      }`}
                    >
                      <i className={`${entity.icon} text-cyan-400 text-xl`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {entity.name}
                      </h3>
                      <p className="text-xs text-[#9ca3af]">
                        {entity.type.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {comparisonMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComparison(entity.id);
                        }}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          compareEntities.includes(entity.id)
                            ? "border-purple-400 bg-purple-500/20"
                            : "border-white/30 hover:border-purple-400"
                        }`}
                      >
                        {compareEntities.includes(entity.id) && (
                          <i className="ri-check-line text-purple-400 text-xs"></i>
                        )}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEntitySelection(entity.id);
                      }}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedEntities.has(entity.id)
                          ? "border-cyan-400 bg-cyan-500/20"
                          : "border-white/30 hover:border-cyan-400"
                      }`}
                    >
                      {selectedEntities.has(entity.id) && (
                        <i className="ri-check-line text-cyan-400 text-xs"></i>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#9ca3af] mb-3 line-clamp-2">
                  {entity.description}
                </p>

                {/* Progress Bar */}
                {entity.progress !== undefined && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#9ca3af]">Progress</span>
                      <span className="text-white font-medium">
                        {entity.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${entity.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        entity.status === "COMPLETED" ||
                        entity.status === "GR_POSTED"
                          ? "bg-green-500/20 text-green-400"
                          : entity.status === "PICKING" ||
                              entity.status === "IN_TRANSIT"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {entity.status.replace(/_/g, " ")}
                    </span>
                    {entity.slaStatus && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          entity.slaStatus === "ON_TIME"
                            ? "bg-green-500/20 text-green-400"
                            : entity.slaStatus === "AT_RISK"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {entity.slaStatus === "ON_TIME"
                          ? "✓"
                          : entity.slaStatus === "AT_RISK"
                            ? "⚠"
                            : "✗"}
                      </span>
                    )}
                  </div>
                  {entity.efficiency !== undefined && (
                    <div className="text-xs text-[#9ca3af]">
                      <i className="ri-speed-line mr-1"></i>
                      {entity.efficiency}%
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#9ca3af]">
                  <span>
                    Updated {format(entity.lastUpdated, "MMM d, HH:mm")}
                  </span>
                  {entity.duration && <span>{entity.duration}h</span>}
                </div>
              </motion.div>
            ))}
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase">
                    Entity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase">
                    SLA
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase">
                    Efficiency
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntities.map((entity) => (
                  <tr
                    key={entity.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() =>
                      setSelectedEntity({ id: entity.id, type: entity.type })
                    }
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedEntities.has(entity.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleEntitySelection(entity.id);
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <i className={`${entity.icon} text-cyan-400`}></i>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {entity.name}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {entity.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9ca3af]">
                      {entity.type.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          entity.status === "COMPLETED" ||
                          entity.status === "GR_POSTED"
                            ? "bg-green-500/20 text-green-400"
                            : entity.status === "PICKING" ||
                                entity.status === "IN_TRANSIT"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {entity.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
                            style={{ width: `${entity.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-white">
                          {entity.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {entity.slaStatus && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            entity.slaStatus === "ON_TIME"
                              ? "bg-green-500/20 text-green-400"
                              : entity.slaStatus === "AT_RISK"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {entity.slaStatus.replace(/_/g, " ")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-white">
                        <i className="ri-speed-line"></i>
                        {entity.efficiency || 0}%
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-cyan-400 hover:text-cyan-300">
                        <i className="ri-eye-line"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntities.map((entity, index) => (
              <motion.div
                key={entity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <i className={`${entity.icon} text-cyan-400 text-xl`}></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {entity.name}
                      </h3>
                      <p className="text-sm text-[#9ca3af]">
                        {entity.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        entity.status === "COMPLETED" ||
                        entity.status === "GR_POSTED"
                          ? "bg-green-500/20 text-green-400"
                          : entity.status === "PICKING" ||
                              entity.status === "IN_TRANSIT"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {entity.status.replace(/_/g, " ")}
                    </span>
                    <button
                      onClick={() =>
                        setSelectedEntity({ id: entity.id, type: entity.type })
                      }
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium transition-colors"
                    >
                      View Lifecycle
                    </button>
                  </div>
                </div>
                {entity.progress !== undefined && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-[#9ca3af]">Progress</span>
                      <span className="text-white font-medium">
                        {entity.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <motion.div
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${entity.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-[#9ca3af] mb-1">Efficiency</div>
                    <div className="text-white font-semibold">
                      {entity.efficiency || 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[#9ca3af] mb-1">Duration</div>
                    <div className="text-white font-semibold">
                      {entity.duration || 0}h
                    </div>
                  </div>
                  <div>
                    <div className="text-[#9ca3af] mb-1">SLA Status</div>
                    <div
                      className={`font-semibold ${
                        entity.slaStatus === "ON_TIME"
                          ? "text-green-400"
                          : entity.slaStatus === "AT_RISK"
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {entity.slaStatus || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#9ca3af] mb-1">Last Updated</div>
                    <div className="text-white font-semibold">
                      {format(entity.lastUpdated, "MMM d, HH:mm")}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Access */}
        <div className="mt-6 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <i className="ri-information-line text-cyan-400 text-xl"></i>
            <h3 className="text-lg font-semibold text-white">Quick Access</h3>
          </div>
          <p className="text-sm text-[#9ca3af] mb-4">
            Navigate to source modules to see more entities and manage them
            directly.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/sales-orders"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              <i className="ri-shopping-cart-2-line mr-2"></i>
              Sales Orders
            </Link>
            <Link
              href="/orders"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              <i className="ri-shopping-bag-line mr-2"></i>
              Purchase Orders
            </Link>
            <Link
              href="/inbound"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              <i className="ri-truck-line mr-2"></i>
              ASNs
            </Link>
            <Link
              href="/ncr-management"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              <i className="ri-error-warning-line mr-2"></i>
              NCRs
            </Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
