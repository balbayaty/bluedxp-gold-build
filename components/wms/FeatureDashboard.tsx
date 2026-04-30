"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WMSFeature,
  FeatureStatus,
  FEATURE_STATUS_CONFIG,
  calculateFeatureReadiness,
} from "@/types/featureRegistry";
import {
  WMS_FEATURES,
  WMS_FEATURE_CATEGORIES,
  getFeaturesByReadiness,
  getFeaturesByImportance,
} from "@/lib/services/wms/featureRegistry";
import FeatureRequirementTooltip, {
  FeatureStatusIndicator,
  FeatureReadinessBadge,
} from "@/components/FeatureRequirementTooltip";

type ViewMode = "grid" | "list" | "matrix";
type SortMode = "category" | "readiness" | "importance" | "status";
type FilterStatus = FeatureStatus | "ALL";

/**
 * WMS Feature Dashboard
 * Comprehensive view of all WMS features with status, requirements, and benchmarks
 */
export default function FeatureDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("category");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  // Get all features as array
  const allFeatures = useMemo(() => Object.values(WMS_FEATURES), []);

  // Filter and sort features
  const filteredFeatures = useMemo(() => {
    let features = [...allFeatures];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      features = features.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query) ||
          f.category.toLowerCase().includes(query),
      );
    }

    // Apply status filter
    if (filterStatus !== "ALL") {
      features = features.filter((f) => f.status === filterStatus);
    }

    // Apply category filter
    if (selectedCategory) {
      features = features.filter(
        (f) => f.category === selectedCategory.toUpperCase(),
      );
    }

    // Apply sorting
    switch (sortMode) {
      case "readiness":
        features = features.sort(
          (a, b) => b.metrics.probability - a.metrics.probability,
        );
        break;
      case "importance":
        features = features.sort((a, b) => b.metrics.weight - a.metrics.weight);
        break;
      case "status":
        const statusOrder: Record<FeatureStatus, number> = {
          PRODUCTION: 5,
          READY: 4,
          PARTIAL: 3,
          DEMO: 2,
          MOCK: 1,
        };
        features = features.sort(
          (a, b) => statusOrder[b.status] - statusOrder[a.status],
        );
        break;
      default:
        // Category sorting (default)
        features = features.sort((a, b) =>
          a.category.localeCompare(b.category),
        );
    }

    return features;
  }, [allFeatures, searchQuery, filterStatus, selectedCategory, sortMode]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = allFeatures.length;
    const byStatus: Record<FeatureStatus, number> = {
      MOCK: 0,
      DEMO: 0,
      PARTIAL: 0,
      READY: 0,
      PRODUCTION: 0,
    };
    let totalReadiness = 0;

    allFeatures.forEach((f) => {
      byStatus[f.status]++;
      totalReadiness += calculateFeatureReadiness(f).overallScore;
    });

    return {
      total,
      byStatus,
      avgReadiness: Math.round(totalReadiness / total),
    };
  }, [allFeatures]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            WMS Feature Dashboard
          </h2>
          <p className="text-sm text-[#9ca3af]">
            Hover over any feature to see requirements, benchmarks, and
            implementation details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-[#1e293b] rounded-lg border border-[#374151]">
            <span className="text-2xl font-bold text-white">
              {stats.avgReadiness}%
            </span>
            <span className="text-xs text-[#9ca3af] ml-2">Avg Readiness</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-6 gap-3">
        {(
          ["PRODUCTION", "READY", "PARTIAL", "DEMO", "MOCK"] as FeatureStatus[]
        ).map((status) => {
          const config = FEATURE_STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() =>
                setFilterStatus(filterStatus === status ? "ALL" : status)
              }
              className={`p-3 rounded-lg border transition-all ${
                filterStatus === status
                  ? `${config.bgColor} ${config.borderColor} border-2`
                  : "bg-[#1e293b]/50 border-[#374151] hover:border-[#4b5563]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <i className={`${config.icon} ${config.color}`}></i>
                <span className="text-xl font-bold text-white">
                  {stats.byStatus[status]}
                </span>
              </div>
              <div
                className={`text-xs ${filterStatus === status ? config.color : "text-[#9ca3af]"}`}
              >
                {config.label}
              </div>
            </button>
          );
        })}
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`p-3 rounded-lg border transition-all ${
            filterStatus === "ALL"
              ? "bg-cyan-500/20 border-cyan-500/50 border-2"
              : "bg-[#1e293b]/50 border-[#374151] hover:border-[#4b5563]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <i className="ri-apps-line text-cyan-400"></i>
            <span className="text-xl font-bold text-white">{stats.total}</span>
          </div>
          <div
            className={`text-xs ${filterStatus === "ALL" ? "text-cyan-400" : "text-[#9ca3af]"}`}
          >
            All Features
          </div>
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"></i>
          <input
            type="text"
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1e293b] border border-[#374151] rounded-lg text-white placeholder-[#9ca3af] focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          {WMS_FEATURE_CATEGORIES.slice(0, 4).map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? `bg-${cat.color}-500/20 text-${cat.color}-400 border border-${cat.color}-500/50`
                  : "bg-[#1e293b] text-[#9ca3af] border border-transparent hover:border-[#374151]"
              }`}
            >
              <i className={`${cat.icon} mr-1`}></i>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort & View Controls */}
        <div className="flex items-center gap-2">
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="px-3 py-2 bg-[#1e293b] border border-[#374151] rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="category">Sort by Category</option>
            <option value="readiness">Sort by Readiness</option>
            <option value="importance">Sort by Importance</option>
            <option value="status">Sort by Status</option>
          </select>

          <div className="flex items-center border border-[#374151] rounded-lg overflow-hidden">
            {(["grid", "list", "matrix"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 transition-colors ${
                  viewMode === mode
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-[#1e293b] text-[#9ca3af] hover:text-white"
                }`}
              >
                <i
                  className={`ri-${mode === "grid" ? "grid-line" : mode === "list" ? "list-check" : "table-line"}`}
                ></i>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
              >
                <FeatureCard feature={feature} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Feature List */}
      {viewMode === "list" && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
              >
                <FeatureListItem
                  feature={feature}
                  expanded={expandedFeature === feature.id}
                  onToggle={() =>
                    setExpandedFeature(
                      expandedFeature === feature.id ? null : feature.id,
                    )
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Feature Matrix */}
      {viewMode === "matrix" && (
        <div className="bg-[#1e293b]/50 rounded-xl border border-[#374151] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#374151]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Ready %
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Ease
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    ROI
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-blue-400 uppercase tracking-wider">
                    SAP
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-orange-400 uppercase tracking-wider">
                    Oracle
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-purple-400 uppercase tracking-wider">
                    Manhattan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#374151]">
                {filteredFeatures.map((feature) => {
                  const readiness = calculateFeatureReadiness(feature);
                  return (
                    <tr
                      key={feature.id}
                      className="hover:bg-[#1e293b] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <FeatureRequirementTooltip
                          feature={feature}
                          showBadge={false}
                        >
                          <div className="cursor-help">
                            <div className="text-sm text-white font-medium hover:text-cyan-400 transition-colors">
                              {feature.name}
                            </div>
                            <div className="text-xs text-[#9ca3af]">
                              {feature.category}
                            </div>
                          </div>
                        </FeatureRequirementTooltip>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <FeatureStatusIndicator status={feature.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-sm font-bold ${
                            readiness.overallScore >= 80
                              ? "text-green-400"
                              : readiness.overallScore >= 60
                                ? "text-cyan-400"
                                : readiness.overallScore >= 40
                                  ? "text-yellow-400"
                                  : "text-red-400"
                          }`}
                        >
                          {readiness.overallScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-white">
                          {feature.metrics.weight}/10
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-white">
                          {feature.metrics.ease}/10
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-white">
                          {feature.metrics.roi}/10
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <i
                          className={`${feature.benchmark.sap.hasFeature ? "ri-checkbox-circle-fill text-green-400" : "ri-close-circle-fill text-red-400"}`}
                        ></i>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <i
                          className={`${feature.benchmark.oracle.hasFeature ? "ri-checkbox-circle-fill text-green-400" : "ri-close-circle-fill text-red-400"}`}
                        ></i>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <i
                          className={`${feature.benchmark.manhattan.hasFeature ? "ri-checkbox-circle-fill text-green-400" : "ri-close-circle-fill text-red-400"}`}
                        ></i>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredFeatures.length === 0 && (
        <div className="text-center py-12">
          <i className="ri-inbox-line text-4xl text-[#9ca3af] mb-4"></i>
          <p className="text-[#9ca3af]">No features match your filters</p>
        </div>
      )}
    </div>
  );
}

/**
 * Feature Card Component
 */
function FeatureCard({ feature }: { feature: WMSFeature }) {
  const readiness = calculateFeatureReadiness(feature);
  const status = FEATURE_STATUS_CONFIG[feature.status];

  return (
    <FeatureRequirementTooltip feature={feature} position="right">
      <div className="p-4 bg-[#1e293b]/50 rounded-xl border border-[#374151] hover:border-cyan-500/50 transition-all cursor-help group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-white font-medium group-hover:text-cyan-400 transition-colors">
              {feature.name}
            </h3>
            <span className="text-xs text-[#9ca3af]">{feature.category}</span>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
          >
            <i className={`${status.icon} mr-1`}></i>
            {status.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-[#9ca3af] mb-4 line-clamp-2">
          {feature.description}
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 bg-[#0f172a] rounded-lg">
            <div
              className={`text-lg font-bold ${
                readiness.overallScore >= 80
                  ? "text-green-400"
                  : readiness.overallScore >= 60
                    ? "text-cyan-400"
                    : readiness.overallScore >= 40
                      ? "text-yellow-400"
                      : "text-red-400"
              }`}
            >
              {readiness.overallScore}%
            </div>
            <div className="text-[10px] text-[#9ca3af]">Ready</div>
          </div>
          <div className="text-center p-2 bg-[#0f172a] rounded-lg">
            <div className="text-lg font-bold text-white">
              {feature.metrics.weight}
            </div>
            <div className="text-[10px] text-[#9ca3af]">Weight</div>
          </div>
          <div className="text-center p-2 bg-[#0f172a] rounded-lg">
            <div className="text-lg font-bold text-cyan-400">
              {feature.metrics.ease}
            </div>
            <div className="text-[10px] text-[#9ca3af]">Ease</div>
          </div>
          <div className="text-center p-2 bg-[#0f172a] rounded-lg">
            <div className="text-lg font-bold text-green-400">
              {feature.metrics.roi}
            </div>
            <div className="text-[10px] text-[#9ca3af]">ROI</div>
          </div>
        </div>

        {/* Readiness Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#9ca3af]">Overall Readiness</span>
            <span className="text-white">{readiness.overallScore}%</span>
          </div>
          <div className="h-2 bg-[#0f172a] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${readiness.overallScore}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`h-full rounded-full ${
                readiness.overallScore >= 80
                  ? "bg-gradient-to-r from-green-500 to-emerald-400"
                  : readiness.overallScore >= 60
                    ? "bg-gradient-to-r from-cyan-500 to-blue-400"
                    : readiness.overallScore >= 40
                      ? "bg-gradient-to-r from-yellow-500 to-orange-400"
                      : "bg-gradient-to-r from-red-500 to-pink-400"
              }`}
            />
          </div>
        </div>

        {/* Hover hint */}
        <div className="mt-3 pt-3 border-t border-[#374151] flex items-center justify-center gap-1 text-xs text-[#9ca3af] opacity-0 group-hover:opacity-100 transition-opacity">
          <i className="ri-information-line"></i>
          <span>Hover for detailed requirements</span>
        </div>
      </div>
    </FeatureRequirementTooltip>
  );
}

/**
 * Feature List Item Component
 */
function FeatureListItem({
  feature,
  expanded,
  onToggle,
}: {
  feature: WMSFeature;
  expanded: boolean;
  onToggle: () => void;
}) {
  const readiness = calculateFeatureReadiness(feature);
  const status = FEATURE_STATUS_CONFIG[feature.status];

  return (
    <div className="bg-[#1e293b]/50 rounded-xl border border-[#374151] overflow-hidden">
      <FeatureRequirementTooltip feature={feature} position="right">
        <div
          onClick={onToggle}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#1e293b] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-lg ${status.bgColor} flex items-center justify-center`}
            >
              <i className={`${status.icon} ${status.color} text-xl`}></i>
            </div>
            <div>
              <h3 className="text-white font-medium">{feature.name}</h3>
              <p className="text-xs text-[#9ca3af]">
                {feature.category} • {feature.description.slice(0, 60)}...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div
                  className={`text-lg font-bold ${
                    readiness.overallScore >= 80
                      ? "text-green-400"
                      : readiness.overallScore >= 60
                        ? "text-cyan-400"
                        : readiness.overallScore >= 40
                          ? "text-yellow-400"
                          : "text-red-400"
                  }`}
                >
                  {readiness.overallScore}%
                </div>
                <div className="text-[10px] text-[#9ca3af]">Ready</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {feature.metrics.weight}/10
                </div>
                <div className="text-[10px] text-[#9ca3af]">Weight</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-400">
                  {feature.metrics.ease}/10
                </div>
                <div className="text-[10px] text-[#9ca3af]">Ease</div>
              </div>
            </div>

            <FeatureStatusIndicator status={feature.status} />

            <i
              className={`ri-arrow-${expanded ? "up" : "down"}-s-line text-[#9ca3af] text-xl`}
            ></i>
          </div>
        </div>
      </FeatureRequirementTooltip>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#374151]"
          >
            <div className="p-4 grid grid-cols-3 gap-4">
              {/* Examples */}
              <div>
                <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">
                  Examples
                </h4>
                <ul className="space-y-1">
                  {feature.examples.slice(0, 3).map((ex, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-[#9ca3af] flex items-start gap-1"
                    >
                      <i className="ri-arrow-right-s-line text-green-400 mt-0.5"></i>
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div>
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-2">
                  Benefits
                </h4>
                <ul className="space-y-1">
                  {feature.benefits.slice(0, 3).map((b, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-[#9ca3af] flex items-start gap-1"
                    >
                      <i className="ri-checkbox-circle-line text-cyan-400 mt-0.5"></i>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Configuration */}
              <div>
                <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-2">
                  Configuration Steps
                </h4>
                <ul className="space-y-1">
                  {feature.requirements.configuration
                    .slice(0, 3)
                    .map((step, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-[#9ca3af] flex items-start gap-1"
                      >
                        <span className="text-purple-400 font-bold">
                          {step.step}.
                        </span>
                        {step.action.slice(0, 40)}...
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
