"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  generateModernSLADocument,
  allModernSLAs,
  modernKPIs,
  performanceTiers,
  escalationProcedures,
  type PerformanceTier,
  type ServiceCategory,
} from "@/data/modernSLAStandard";
import { format } from "date-fns";

/**
 * Modern SLA Document Viewer
 *
 * Displays a comprehensive, industry-leading SLA document with:
 * - Professional structure and formatting
 * - Detailed explanations and tables
 * - Performance tiers and escalation procedures
 * - Interactive sections and navigation
 */
export default function ModernSLADocument() {
  const [selectedTier, setSelectedTier] = useState<PerformanceTier>("GOLD");
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [slaDocument, setSlaDocument] = useState(
    generateModernSLADocument("STANDARD", "Standard Customer", selectedTier),
  );

  useEffect(() => {
    setSlaDocument(
      generateModernSLADocument("STANDARD", "Standard Customer", selectedTier),
    );
  }, [selectedTier]);

  const formatDuration = (seconds: number): string => {
    if (seconds >= 86400) {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days !== 1 ? "s" : ""}`;
    } else if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  };

  const sections = [
    { id: "overview", label: "Overview", icon: "ri-file-list-3-line" },
    { id: "inbound", label: "Inbound Logistics", icon: "ri-truck-line" },
    { id: "outbound", label: "Outbound Fulfillment", icon: "ri-ship-line" },
    { id: "value-added", label: "Value-Added Services", icon: "ri-tools-line" },
    {
      id: "reverse",
      label: "Reverse Logistics",
      icon: "ri-arrow-go-back-line",
    },
    { id: "customs", label: "Customs Clearance", icon: "ri-file-check-line" },
    {
      id: "transportation",
      label: "Transportation (FCL/LCL)",
      icon: "ri-truck-fill",
    },
    { id: "freight", label: "Freight Forwarding", icon: "ri-global-line" },
    { id: "data", label: "Data & Analytics", icon: "ri-bar-chart-line" },
    {
      id: "quality",
      label: "Quality & Compliance",
      icon: "ri-shield-check-line",
    },
    {
      id: "kpis",
      label: "Key Performance Indicators",
      icon: "ri-dashboard-line",
    },
    { id: "tiers", label: "Performance Tiers", icon: "ri-medal-line" },
    { id: "escalation", label: "Escalation Procedures", icon: "ri-alert-line" },
  ];

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 border-b border-blue-500/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Service Level Agreement
              </h1>
              <p className="text-blue-100 text-lg">
                Modern Industry-Standard Framework v2.0
              </p>
              <p className="text-blue-200 text-sm mt-2">
                Effective:{" "}
                {format(new Date(slaDocument.effectiveDate), "MMMM dd, yyyy")} |
                Review Date:{" "}
                {format(new Date(slaDocument.reviewDate), "MMMM dd, yyyy")}
              </p>
            </div>
            <div className="text-right">
              <label className="block text-sm font-medium mb-2 text-blue-100">
                Performance Tier
              </label>
              <select
                value={selectedTier}
                onChange={(e) =>
                  setSelectedTier(e.target.value as PerformanceTier)
                }
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-4 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="PLATINUM">Platinum</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="BRONZE">Bronze</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-4 sticky top-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-menu-line text-cyan-400"></i>
                Navigation
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
                      activeSection === section.id
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                        : "text-gray-300 hover:bg-[#374151] hover:text-white"
                    }`}
                  >
                    <i className={`${section.icon} text-sm`}></i>
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Overview Section */}
            {activeSection === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-file-list-3-line text-cyan-400"></i>
                    Document Overview
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed mb-4">
                      This Service Level Agreement (SLA) establishes the
                      performance standards, metrics, and service expectations
                      between the logistics provider and customer. This modern
                      framework incorporates industry best practices, digital
                      transformation initiatives, and continuous improvement
                      methodologies.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                        <h4 className="font-semibold text-cyan-400 mb-2">
                          Service Categories
                        </h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Digital Fulfillment</li>
                          <li>• Inbound Logistics</li>
                          <li>• Warehouse Operations</li>
                          <li>• Outbound Fulfillment</li>
                          <li>• Reverse Logistics</li>
                          <li>• Value-Added Services</li>
                          <li>• Customs Clearance</li>
                          <li>• Transportation (FCL/LCL)</li>
                          <li>• Freight Forwarding</li>
                          <li>• Data & Analytics</li>
                        </ul>
                      </div>
                      <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                        <h4 className="font-semibold text-cyan-400 mb-2">
                          Key Features
                        </h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Real-time visibility and tracking</li>
                          <li>• Predictive analytics and AI insights</li>
                          <li>• Automated reporting and notifications</li>
                          <li>• Performance tier-based service levels</li>
                          <li>• Comprehensive escalation procedures</li>
                          <li>• Continuous improvement framework</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Tier Summary */}
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-medal-line text-cyan-400"></i>
                    Current Performance Tier: {selectedTier}
                  </h3>
                  {performanceTiers
                    .filter((tier) => tier.tier === selectedTier)
                    .map((tier) => (
                      <div key={tier.tier} className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-1">
                              Compliance Target
                            </p>
                            <p className="text-2xl font-bold text-cyan-400">
                              {tier.complianceTarget}%
                            </p>
                          </div>
                          <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-1">
                              Priority Level
                            </p>
                            <p className="text-2xl font-bold text-cyan-400">
                              #{tier.priorityLevel}
                            </p>
                          </div>
                          <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-1">
                              Pricing Multiplier
                            </p>
                            <p className="text-2xl font-bold text-cyan-400">
                              {tier.pricingMultiplier}x
                            </p>
                          </div>
                        </div>
                        <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                          <h4 className="font-semibold text-cyan-400 mb-2">
                            Service Features
                          </h4>
                          <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-300">
                            {tier.serviceFeatures.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <i className="ri-checkbox-circle-line text-green-400"></i>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Inbound Logistics Section */}
            {activeSection === "inbound" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-truck-line text-cyan-400"></i>
                    Inbound Logistics Excellence
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Comprehensive SLAs for receiving, validation, and inventory
                    intake operations. Focus on speed, accuracy, and real-time
                    visibility.
                  </p>

                  <div className="space-y-4">
                    {allModernSLAs
                      .filter(
                        (sla) =>
                          sla.id.includes("advance-shipping-notice") ||
                          sla.id.includes("dock-to-stock") ||
                          sla.id.includes("inventory-accuracy"),
                      )
                      .map((sla) => (
                        <div
                          key={sla.id}
                          className="bg-[#111827] border border-[#374151] rounded-lg p-5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">
                                {sla.name}
                              </h3>
                              <p className="text-gray-400 text-sm mb-3">
                                {sla.description}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                sla.responsibility === "WAREHOUSE"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              }`}
                            >
                              {sla.responsibility === "WAREHOUSE"
                                ? "Our Responsibility"
                                : "Customer Responsibility"}
                            </span>
                          </div>

                          <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Target Duration
                              </p>
                              <p className="text-lg font-bold text-cyan-400">
                                {typeof sla.targetDuration === "number" &&
                                sla.targetDuration < 1000
                                  ? formatDuration(sla.targetDuration)
                                  : `${sla.targetDuration}%`}
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Warning Threshold
                              </p>
                              <p className="text-lg font-bold text-yellow-400">
                                {sla.warningThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Critical Threshold
                              </p>
                              <p className="text-lg font-bold text-red-400">
                                {sla.criticalThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Metric
                              </p>
                              <p className="text-lg font-bold text-white capitalize">
                                {sla.metric.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Outbound Fulfillment Section */}
            {activeSection === "outbound" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-ship-line text-cyan-400"></i>
                    Outbound Fulfillment Excellence
                  </h2>
                  <p className="text-gray-300 mb-6">
                    SLAs for order processing, picking, packing, and shipping
                    operations. Focus on order accuracy, speed, and customer
                    experience.
                  </p>

                  <div className="space-y-4">
                    {allModernSLAs
                      .filter(
                        (sla) =>
                          sla.id.includes("order-to-ship") ||
                          sla.id.includes("pick-accuracy") ||
                          sla.id.includes("shipment-notification"),
                      )
                      .map((sla) => (
                        <div
                          key={sla.id}
                          className="bg-[#111827] border border-[#374151] rounded-lg p-5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">
                                {sla.name}
                              </h3>
                              <p className="text-gray-400 text-sm mb-3">
                                {sla.description}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                sla.responsibility === "WAREHOUSE"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              }`}
                            >
                              {sla.responsibility === "WAREHOUSE"
                                ? "Our Responsibility"
                                : "Customer Responsibility"}
                            </span>
                          </div>

                          <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Target Duration
                              </p>
                              <p className="text-lg font-bold text-cyan-400">
                                {typeof sla.targetDuration === "number" &&
                                sla.targetDuration < 1000
                                  ? formatDuration(sla.targetDuration)
                                  : `${sla.targetDuration}%`}
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Warning Threshold
                              </p>
                              <p className="text-lg font-bold text-yellow-400">
                                {sla.warningThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Critical Threshold
                              </p>
                              <p className="text-lg font-bold text-red-400">
                                {sla.criticalThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Metric
                              </p>
                              <p className="text-lg font-bold text-white capitalize">
                                {sla.metric.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* KPIs Section */}
            {activeSection === "kpis" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-dashboard-line text-cyan-400"></i>
                    Key Performance Indicators
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Comprehensive KPIs aligned with industry best practices and
                    digital transformation initiatives.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#111827] border-b border-[#374151]">
                          <th className="text-left p-4 text-sm font-semibold text-gray-300">
                            KPI Name
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-300">
                            Description
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-300">
                            Formula
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-300">
                            Target
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-300">
                            Category
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {modernKPIs.map((kpi, idx) => (
                          <tr
                            key={kpi.id}
                            className={`border-b border-[#374151] ${idx % 2 === 0 ? "bg-[#111827]" : "bg-[#0f172a]"}`}
                          >
                            <td className="p-4">
                              <div className="font-semibold text-white">
                                {kpi.name}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                <span
                                  className={`px-2 py-0.5 rounded ${
                                    kpi.responsibility === "WAREHOUSE"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-orange-500/20 text-orange-400"
                                  }`}
                                >
                                  {kpi.responsibility === "WAREHOUSE"
                                    ? "Our Responsibility"
                                    : "Customer Responsibility"}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-gray-300">
                              {kpi.description}
                            </td>
                            <td className="p-4">
                              <code className="text-xs bg-[#1e293b] px-2 py-1 rounded text-cyan-400">
                                {kpi.formula}
                              </code>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-cyan-400">
                                {kpi.target} {kpi.unit}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 rounded text-xs bg-[#1e293b] text-gray-300 capitalize">
                                {kpi.category}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Performance Tiers Section */}
            {activeSection === "tiers" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-medal-line text-cyan-400"></i>
                    Performance Tiers
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Service levels are tiered based on performance targets and
                    customer requirements.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#111827] border-b border-[#374151]">
                          <th className="text-left p-4 text-sm font-semibold text-gray-300">
                            Tier
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-300">
                            Compliance Target
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-300">
                            Priority Level
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-300">
                            Pricing Multiplier
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-300">
                            Service Features
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {performanceTiers.map((tier, idx) => (
                          <tr
                            key={tier.tier}
                            className={`border-b border-[#374151] ${idx % 2 === 0 ? "bg-[#111827]" : "bg-[#0f172a]"}`}
                          >
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  tier.tier === "PLATINUM"
                                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                    : tier.tier === "GOLD"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                      : tier.tier === "SILVER"
                                        ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                        : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                }`}
                              >
                                {tier.tier}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-cyan-400">
                                {tier.complianceTarget}%
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-white">
                                #{tier.priorityLevel}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-white">
                                {tier.pricingMultiplier}x
                              </span>
                            </td>
                            <td className="p-4">
                              <ul className="text-sm text-gray-300 space-y-1">
                                {tier.serviceFeatures.map((feature, fIdx) => (
                                  <li
                                    key={fIdx}
                                    className="flex items-center gap-2"
                                  >
                                    <i className="ri-checkbox-circle-line text-green-400 text-xs"></i>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Escalation Procedures Section */}
            {activeSection === "escalation" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-alert-line text-cyan-400"></i>
                    Escalation & Remediation Procedures
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Structured escalation procedures ensure timely response and
                    resolution of performance issues.
                  </p>

                  <div className="space-y-4">
                    {escalationProcedures.map((procedure) => (
                      <div
                        key={procedure.level}
                        className="bg-[#111827] border border-[#374151] rounded-lg p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white">
                            {procedure.level}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#1e293b] text-gray-300">
                            Threshold: {procedure.threshold}% of target
                          </span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400 mb-2">
                              Response Timeframe
                            </p>
                            <p className="text-cyan-400 font-semibold">
                              {procedure.timeframe}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 mb-2">
                              Stakeholders
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {procedure.stakeholders.map(
                                (stakeholder, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 rounded text-xs bg-[#1e293b] text-gray-300"
                                  >
                                    {stakeholder}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-400 mb-2">Actions</p>
                          <ul className="space-y-2">
                            {procedure.actions.map((action, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-gray-300"
                              >
                                <i className="ri-arrow-right-s-line text-cyan-400 mt-0.5"></i>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Value-Added Services Section */}
            {activeSection === "value-added" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-tools-line text-cyan-400"></i>
                    Value-Added Services
                  </h2>
                  <p className="text-gray-300 mb-6">
                    SLAs for kitting, assembly, relabeling, and specialized
                    services. Focus on customization, quality, and turnaround
                    time.
                  </p>
                  <div className="space-y-4">
                    {allModernSLAs
                      .filter(
                        (sla) =>
                          sla.id.includes("kitting") ||
                          sla.id.includes("relabeling"),
                      )
                      .map((sla) => (
                        <div
                          key={sla.id}
                          className="bg-[#111827] border border-[#374151] rounded-lg p-5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">
                                {sla.name}
                              </h3>
                              <p className="text-gray-400 text-sm mb-3">
                                {sla.description}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                sla.responsibility === "WAREHOUSE"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              }`}
                            >
                              {sla.responsibility === "WAREHOUSE"
                                ? "Our Responsibility"
                                : "Customer Responsibility"}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Target Duration
                              </p>
                              <p className="text-lg font-bold text-cyan-400">
                                {typeof sla.targetDuration === "number" &&
                                sla.targetDuration < 1000
                                  ? formatDuration(sla.targetDuration)
                                  : `${sla.targetDuration}%`}
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Warning Threshold
                              </p>
                              <p className="text-lg font-bold text-yellow-400">
                                {sla.warningThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Critical Threshold
                              </p>
                              <p className="text-lg font-bold text-red-400">
                                {sla.criticalThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Metric
                              </p>
                              <p className="text-lg font-bold text-white capitalize">
                                {sla.metric.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Reverse Logistics Section */}
            {activeSection === "reverse" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-arrow-go-back-line text-cyan-400"></i>
                    Reverse Logistics
                  </h2>
                  <p className="text-gray-300 mb-6">
                    SLAs for returns processing, refurbishment, and disposition.
                    Focus on speed, accuracy, and proper handling.
                  </p>
                  <div className="space-y-4">
                    {allModernSLAs
                      .filter((sla) => sla.id.includes("return"))
                      .map((sla) => (
                        <div
                          key={sla.id}
                          className="bg-[#111827] border border-[#374151] rounded-lg p-5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">
                                {sla.name}
                              </h3>
                              <p className="text-gray-400 text-sm mb-3">
                                {sla.description}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                sla.responsibility === "WAREHOUSE"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              }`}
                            >
                              {sla.responsibility === "WAREHOUSE"
                                ? "Our Responsibility"
                                : "Customer Responsibility"}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Target Duration
                              </p>
                              <p className="text-lg font-bold text-cyan-400">
                                {typeof sla.targetDuration === "number" &&
                                sla.targetDuration < 1000
                                  ? formatDuration(sla.targetDuration)
                                  : `${sla.targetDuration}%`}
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Warning Threshold
                              </p>
                              <p className="text-lg font-bold text-yellow-400">
                                {sla.warningThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Critical Threshold
                              </p>
                              <p className="text-lg font-bold text-red-400">
                                {sla.criticalThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Metric
                              </p>
                              <p className="text-lg font-bold text-white capitalize">
                                {sla.metric.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Data & Analytics Section */}
            {activeSection === "data" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-bar-chart-line text-cyan-400"></i>
                    Data & Analytics
                  </h2>
                  <p className="text-gray-300 mb-6">
                    SLAs for reporting, API availability, and real-time
                    visibility. Focus on timeliness, accuracy, and system
                    reliability.
                  </p>
                  <div className="space-y-4">
                    {allModernSLAs
                      .filter(
                        (sla) =>
                          sla.id.includes("daily-reporting") ||
                          sla.id.includes("api-availability"),
                      )
                      .map((sla) => (
                        <div
                          key={sla.id}
                          className="bg-[#111827] border border-[#374151] rounded-lg p-5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">
                                {sla.name}
                              </h3>
                              <p className="text-gray-400 text-sm mb-3">
                                {sla.description}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                sla.responsibility === "WAREHOUSE"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              }`}
                            >
                              {sla.responsibility === "WAREHOUSE"
                                ? "Our Responsibility"
                                : "Customer Responsibility"}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Target Duration
                              </p>
                              <p className="text-lg font-bold text-cyan-400">
                                {typeof sla.targetDuration === "number" &&
                                sla.targetDuration < 1000
                                  ? formatDuration(sla.targetDuration)
                                  : `${sla.targetDuration}%`}
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Warning Threshold
                              </p>
                              <p className="text-lg font-bold text-yellow-400">
                                {sla.warningThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Critical Threshold
                              </p>
                              <p className="text-lg font-bold text-red-400">
                                {sla.criticalThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Metric
                              </p>
                              <p className="text-lg font-bold text-white capitalize">
                                {sla.metric.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                          {sla.metric === "custom" && sla.customFormula && (
                            <div className="mt-4 pt-4 border-t border-[#374151]">
                              <p className="text-xs text-gray-400 mb-2">
                                Custom Formula:
                              </p>
                              <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                                <code className="text-cyan-400 text-sm font-mono">
                                  {sla.customFormula}
                                </code>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quality & Compliance Section */}
            {activeSection === "quality" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-shield-check-line text-cyan-400"></i>
                    Quality & Compliance
                  </h2>
                  <p className="text-gray-300 mb-6">
                    SLAs for quality assurance, regulatory compliance, and risk
                    management. Focus on accuracy, timeliness, and proper
                    documentation.
                  </p>
                  <div className="space-y-4">
                    {allModernSLAs
                      .filter((sla) => sla.id.includes("damage"))
                      .map((sla) => (
                        <div
                          key={sla.id}
                          className="bg-[#111827] border border-[#374151] rounded-lg p-5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">
                                {sla.name}
                              </h3>
                              <p className="text-gray-400 text-sm mb-3">
                                {sla.description}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                sla.responsibility === "WAREHOUSE"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              }`}
                            >
                              {sla.responsibility === "WAREHOUSE"
                                ? "Our Responsibility"
                                : "Customer Responsibility"}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Target Duration
                              </p>
                              <p className="text-lg font-bold text-cyan-400">
                                {typeof sla.targetDuration === "number" &&
                                sla.targetDuration < 1000
                                  ? formatDuration(sla.targetDuration)
                                  : `${sla.targetDuration}%`}
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Warning Threshold
                              </p>
                              <p className="text-lg font-bold text-yellow-400">
                                {sla.warningThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Critical Threshold
                              </p>
                              <p className="text-lg font-bold text-red-400">
                                {sla.criticalThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Metric
                              </p>
                              <p className="text-lg font-bold text-white capitalize">
                                {sla.metric.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Customs Clearance Section */}
            {activeSection === "customs" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-file-check-line text-cyan-400"></i>
                    Customs Clearance
                  </h2>
                  <p className="text-gray-300 mb-6">
                    SLAs for customs documentation, clearance processing, and
                    regulatory compliance. Focus on accuracy, timeliness, and
                    adherence to import/export regulations.
                  </p>
                  <div className="space-y-4">
                    {allModernSLAs
                      .filter(
                        (sla) =>
                          sla.id.includes("customs") ||
                          sla.id.includes("clearance"),
                      )
                      .map((sla) => (
                        <div
                          key={sla.id}
                          className="bg-[#111827] border border-[#374151] rounded-lg p-5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">
                                {sla.name}
                              </h3>
                              <p className="text-gray-400 text-sm mb-3">
                                {sla.description}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                sla.responsibility === "WAREHOUSE"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              }`}
                            >
                              {sla.responsibility === "WAREHOUSE"
                                ? "Our Responsibility"
                                : "Customer Responsibility"}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Target Duration
                              </p>
                              <p className="text-lg font-bold text-cyan-400">
                                {typeof sla.targetDuration === "number" &&
                                sla.targetDuration < 1000
                                  ? formatDuration(sla.targetDuration)
                                  : `${sla.targetDuration}%`}
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Warning Threshold
                              </p>
                              <p className="text-lg font-bold text-yellow-400">
                                {sla.warningThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Critical Threshold
                              </p>
                              <p className="text-lg font-bold text-red-400">
                                {sla.criticalThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Metric
                              </p>
                              <p className="text-lg font-bold text-white capitalize">
                                {sla.metric.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                          {sla.metric === "custom" && sla.customFormula && (
                            <div className="mt-4 pt-4 border-t border-[#374151]">
                              <p className="text-xs text-gray-400 mb-2">
                                Custom Formula:
                              </p>
                              <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                                <code className="text-cyan-400 text-sm font-mono">
                                  {sla.customFormula}
                                </code>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Transportation Section */}
            {activeSection === "transportation" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-truck-fill text-cyan-400"></i>
                    Transportation (FCL & LCL)
                  </h2>
                  <p className="text-gray-300 mb-6">
                    SLAs for local FCL (Full Container Load) and LCL (Less than
                    Container Load) transportation services. Focus on transit
                    times, container management, and on-time delivery.
                  </p>
                  <div className="space-y-4">
                    {allModernSLAs
                      .filter(
                        (sla) =>
                          sla.id.includes("fcl") ||
                          sla.id.includes("lcl") ||
                          sla.id.includes("container") ||
                          sla.id.includes("transportation-on-time") ||
                          sla.id.includes("container-pickup") ||
                          sla.id.includes("lcl-consolidation"),
                      )
                      .map((sla) => (
                        <div
                          key={sla.id}
                          className="bg-[#111827] border border-[#374151] rounded-lg p-5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">
                                {sla.name}
                              </h3>
                              <p className="text-gray-400 text-sm mb-3">
                                {sla.description}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                sla.responsibility === "WAREHOUSE"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              }`}
                            >
                              {sla.responsibility === "WAREHOUSE"
                                ? "Our Responsibility"
                                : "Customer Responsibility"}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Target Duration
                              </p>
                              <p className="text-lg font-bold text-cyan-400">
                                {typeof sla.targetDuration === "number" &&
                                sla.targetDuration < 1000
                                  ? formatDuration(sla.targetDuration)
                                  : `${sla.targetDuration}%`}
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Warning Threshold
                              </p>
                              <p className="text-lg font-bold text-yellow-400">
                                {sla.warningThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Critical Threshold
                              </p>
                              <p className="text-lg font-bold text-red-400">
                                {sla.criticalThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Metric
                              </p>
                              <p className="text-lg font-bold text-white capitalize">
                                {sla.metric.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                          {sla.metric === "custom" && sla.customFormula && (
                            <div className="mt-4 pt-4 border-t border-[#374151]">
                              <p className="text-xs text-gray-400 mb-2">
                                Custom Formula:
                              </p>
                              <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                                <code className="text-cyan-400 text-sm font-mono">
                                  {sla.customFormula}
                                </code>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Freight Forwarding Section */}
            {activeSection === "freight" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i className="ri-global-line text-cyan-400"></i>
                    Freight Forwarding
                  </h2>
                  <p className="text-gray-300 mb-6">
                    SLAs for international freight forwarding, multi-modal
                    transportation, and end-to-end logistics services. Focus on
                    ocean freight, air freight, documentation, and seamless
                    coordination.
                  </p>
                  <div className="space-y-4">
                    {allModernSLAs
                      .filter(
                        (sla) =>
                          sla.id.includes("freight") ||
                          sla.id.includes("ocean") ||
                          sla.id.includes("air") ||
                          sla.id.includes("multimodal") ||
                          sla.id.includes("bill-of-lading") ||
                          sla.id.includes("freight-tracking") ||
                          sla.id.includes("freight-on-time"),
                      )
                      .map((sla) => (
                        <div
                          key={sla.id}
                          className="bg-[#111827] border border-[#374151] rounded-lg p-5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">
                                {sla.name}
                              </h3>
                              <p className="text-gray-400 text-sm mb-3">
                                {sla.description}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                sla.responsibility === "WAREHOUSE"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              }`}
                            >
                              {sla.responsibility === "WAREHOUSE"
                                ? "Our Responsibility"
                                : "Customer Responsibility"}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Target Duration
                              </p>
                              <p className="text-lg font-bold text-cyan-400">
                                {typeof sla.targetDuration === "number" &&
                                sla.targetDuration < 1000
                                  ? formatDuration(sla.targetDuration)
                                  : `${sla.targetDuration}%`}
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Warning Threshold
                              </p>
                              <p className="text-lg font-bold text-yellow-400">
                                {sla.warningThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Critical Threshold
                              </p>
                              <p className="text-lg font-bold text-red-400">
                                {sla.criticalThreshold}%
                              </p>
                            </div>
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                Metric
                              </p>
                              <p className="text-lg font-bold text-white capitalize">
                                {sla.metric.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                          {sla.metric === "custom" && sla.customFormula && (
                            <div className="mt-4 pt-4 border-t border-[#374151]">
                              <p className="text-xs text-gray-400 mb-2">
                                Custom Formula:
                              </p>
                              <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3">
                                <code className="text-cyan-400 text-sm font-mono">
                                  {sla.customFormula}
                                </code>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
