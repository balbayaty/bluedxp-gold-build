"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  SupplyChainSLA,
  SupplyChainKPI,
  SupplyChainSLAComplianceResult,
  SupplyChainKPIResult,
} from "@/types/supplyChainSLA";
import { CustomerSLA, KPI } from "@/types/asn";
import { getSLAMockData } from "@/utils/slaMockDataGenerators";
import { format } from "date-fns";
import Tooltip from "@/components/Tooltip";

export default function SLAMockDataViewer() {
  const [mockData, setMockData] = useState<{
    multiPartySLAs: SupplyChainSLA[];
    multiPartyKPIs: SupplyChainKPI[];
    legacySLAs: CustomerSLA[];
    legacyKPIs: KPI[];
    complianceResults: SupplyChainSLAComplianceResult[];
    kpiResults: SupplyChainKPIResult[];
  } | null>(null);
  const [viewMode, setViewMode] = useState<
    "slas" | "kpis" | "compliance" | "overview"
  >("overview");
  const [selectedPartyType, setSelectedPartyType] = useState<string>("ALL");

  useEffect(() => {
    const data = getSLAMockData();
    setMockData(data);
  }, []);

  if (!mockData) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
        <i className="ri-loader-4-line text-4xl text-cyan-400 animate-spin mb-4"></i>
        <p className="text-[#9ca3af]">Loading mock data...</p>
      </div>
    );
  }

  const partyTypes = [
    "ALL",
    ...Array.from(new Set(mockData.multiPartySLAs.map((s) => s.partyType))),
  ];
  const filteredSLAs =
    selectedPartyType === "ALL"
      ? mockData.multiPartySLAs
      : mockData.multiPartySLAs.filter(
          (s) => s.partyType === selectedPartyType,
        );

  const stats = [
    {
      label: "Multi-Party SLAs",
      value: mockData.multiPartySLAs.length,
      icon: "ri-file-list-line",
      tooltip: "Total multi-party SLAs",
    },
    {
      label: "Legacy SLAs",
      value: mockData.legacySLAs.length,
      icon: "ri-time-line",
      tooltip: "Legacy customer SLAs",
    },
    {
      label: "Multi-Party KPIs",
      value: mockData.multiPartyKPIs.length,
      icon: "ri-dashboard-line",
      tooltip: "Total multi-party KPIs",
    },
    {
      label: "Legacy KPIs",
      value: mockData.legacyKPIs.length,
      icon: "ri-bar-chart-line",
      tooltip: "Legacy KPIs",
    },
    {
      label: "Compliance Results",
      value: mockData.complianceResults.length,
      icon: "ri-checkbox-circle-line",
      tooltip: "SLA compliance results",
    },
    {
      label: "KPI Results",
      value: mockData.kpiResults.length,
      icon: "ri-line-chart-line",
      tooltip: "KPI calculation results",
    },
  ];

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
        {(["overview", "slas", "kpis", "compliance"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 min-h-[36px] ${
              viewMode === mode
                ? "bg-cyan-500 text-white"
                : "text-[#9ca3af] hover:text-white hover:bg-white/5"
            }`}
            aria-label={`View ${mode} mode`}
          >
            <i
              className={`ri-${mode === "overview" ? "dashboard-line" : mode === "slas" ? "file-list-line" : mode === "kpis" ? "bar-chart-line" : "checkbox-circle-line"} text-sm sm:text-base`}
            ></i>
            <span className="hidden sm:inline">
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </span>
          </button>
        ))}
      </div>

      {/* Stats Overview */}
      {viewMode === "overview" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <Tooltip content={stat.tooltip} position="top">
                  <div className="flex items-center gap-2 min-w-0">
                    <i
                      className={`${stat.icon} text-cyan-400 text-lg flex-shrink-0`}
                    ></i>
                    <span className="text-xs text-[#9ca3af] truncate">
                      {stat.label}
                    </span>
                  </div>
                </Tooltip>
              </div>
              <div className="text-2xl font-bold text-white leading-none">
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* SLAs View */}
      {viewMode === "slas" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm text-white font-medium">
              Filter by Party Type:
            </label>
            <select
              value={selectedPartyType}
              onChange={(e) => setSelectedPartyType(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              {partyTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* SLA List */}
          <div className="space-y-3">
            {filteredSLAs.slice(0, 20).map((sla) => (
              <motion.div
                key={sla.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 leading-tight truncate">
                      {sla.name}
                    </h3>
                    <p className="text-sm text-[#9ca3af] leading-relaxed line-clamp-2">
                      {sla.description}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium leading-tight ml-2 flex-shrink-0 ${
                      sla.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {sla.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-white/10 text-sm">
                  <div>
                    <span className="text-[#9ca3af] leading-normal">
                      Party:
                    </span>
                    <span className="text-white font-medium ml-2 leading-tight">
                      {(sla.partyType || "").replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af] leading-normal">
                      Service:
                    </span>
                    <span className="text-white font-medium ml-2 leading-tight truncate">
                      {(sla.serviceCategory || "").replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af] leading-normal">
                      Target:
                    </span>
                    <span className="text-white font-medium ml-2 leading-tight">
                      {sla.metric === "percentage"
                        ? `${sla.targetDuration.toFixed(1)}%`
                        : `${(sla.targetDuration / 3600).toFixed(1)}h`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af] leading-normal">
                      Responsible:
                    </span>
                    <span className="text-white font-medium ml-2 leading-tight truncate">
                      {(sla.responsibleParty || "").replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs View */}
      {viewMode === "kpis" && (
        <div className="space-y-3">
          {mockData.multiPartyKPIs.slice(0, 20).map((kpi) => (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 leading-tight truncate">
                    {kpi.name}
                  </h3>
                  <p className="text-sm text-[#9ca3af] leading-relaxed line-clamp-2">
                    {kpi.description}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium leading-tight ml-2 flex-shrink-0 ${
                    kpi.isActive
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {kpi.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-white/10 text-sm">
                <div>
                  <span className="text-[#9ca3af] leading-normal">Party:</span>
                  <span className="text-white font-medium ml-2 leading-tight">
                    {(kpi.partyType || "").replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <span className="text-[#9ca3af] leading-normal">Target:</span>
                  <span className="text-white font-medium ml-2 leading-tight">
                    {kpi.target} {kpi.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[#9ca3af] leading-normal">
                    Category:
                  </span>
                  <span className="text-white font-medium ml-2 leading-tight capitalize">
                    {kpi.category}
                  </span>
                </div>
                <div>
                  <span className="text-[#9ca3af] leading-normal">
                    Formula:
                  </span>
                  <span className="text-white font-medium ml-2 leading-tight truncate font-mono text-xs">
                    {kpi.formula}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Compliance Results View */}
      {viewMode === "compliance" && (
        <div className="space-y-3">
          {mockData.complianceResults.slice(0, 20).map((result) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 leading-tight truncate">
                    {result.slaName}
                  </h3>
                  <p className="text-sm text-[#9ca3af] leading-relaxed">
                    {result.partyName} •{" "}
                    {(result.partyType || "").replace(/_/g, " ")}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium leading-tight ml-2 flex-shrink-0 ${
                    result.status === "MET"
                      ? "bg-green-500/20 text-green-400"
                      : result.status === "WARNING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : result.status === "CRITICAL"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {result.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-white/10 text-sm">
                <div>
                  <span className="text-[#9ca3af] leading-normal">
                    Compliance:
                  </span>
                  <span className="text-white font-medium ml-2 leading-tight">
                    {result.compliancePercentage.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[#9ca3af] leading-normal">Target:</span>
                  <span className="text-white font-medium ml-2 leading-tight">
                    {result.targetDuration > 1000
                      ? `${(result.targetDuration / 3600).toFixed(1)}h`
                      : `${result.targetDuration.toFixed(1)}%`}
                  </span>
                </div>
                <div>
                  <span className="text-[#9ca3af] leading-normal">Actual:</span>
                  <span className="text-white font-medium ml-2 leading-tight">
                    {result.actualDuration > 1000
                      ? `${(result.actualDuration / 3600).toFixed(1)}h`
                      : `${result.actualDuration.toFixed(1)}%`}
                  </span>
                </div>
                <div>
                  <span className="text-[#9ca3af] leading-normal">
                    Calculated:
                  </span>
                  <span className="text-white font-medium ml-2 leading-tight text-xs">
                    {format(new Date(result.calculatedAt), "MMM dd, HH:mm")}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
