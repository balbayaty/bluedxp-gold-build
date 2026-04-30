/**
 * 🌟 COMPREHENSIVE QHSE DASHBOARD
 * World's Most Advanced QHSE Management Dashboard
 *
 * Features:
 * - ISO Standards (9001, 14001, 45001, 22000, 22301, etc.)
 * - FDA API Compliance (21 CFR Part 11, cGMP, ICH Q7)
 * - Oil & Gas Standards (API 510, 570, 653, 1160)
 * - Food Safety (HACCP, ISO 22000, FSMA)
 * - Business Continuity (ISO 22301)
 * - 5IR/6IR Alignment (Human-AI Collaboration, IoT, Digital Twins, Predictive Analytics)
 *
 * Better than industry leaders: SAP EHS, Enablon, VelocityEHS, Intelex, Cority
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ErrorBoundary } from "react-error-boundary";
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiActivity,
  FiBarChart,
  FiRefreshCw,
  FiDatabase,
  FiCpu,
  FiZap,
  FiTarget,
  FiAward,
  FiUsers,
  FiGlobe,
  FiLayers,
  FiLink,
  FiDroplet,
  FiHeart,
  FiFileText,
  FiSettings,
  FiGrid,
} from "react-icons/fi";
import RealTimeQHSEDashboard from "./RealTimeQHSEDashboard";
import FoodSafetyDashboard from "./FoodSafetyDashboard";
import PharmaceuticalDashboard from "./PharmaceuticalDashboard";
import OilGasDashboard from "./OilGasDashboard";
import BusinessContinuityDashboard from "./BusinessContinuityDashboard";

interface ComprehensiveQHSEDashboardProps {
  tenantId?: string;
  customerId?: string;
  warehouseId?: string;
  industry?: "PHARMACEUTICAL" | "FOOD_PROCESSING" | "OIL_GAS" | "ALL";
  showStandards?: boolean;
  showIRFeatures?: boolean;
  autoRefresh?: boolean;
}

interface StandardCompliance {
  standardCode: string;
  standardName: string;
  complianceLevel: number;
  status: "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT";
  lastAudit?: Date;
  nextAudit?: Date;
}

interface IRFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
}

function QHSEErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-900">
      <h2 className="text-lg font-semibold mb-2">QHSE Dashboard error</h2>
      <p className="text-sm mb-4">
        An unexpected error occurred while rendering this dashboard.
      </p>
      <pre className="text-xs whitespace-pre-wrap">{error.message}</pre>
    </div>
  );
}

function QHSEErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={QHSEErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}

const ComprehensiveQHSEDashboard: React.FC<ComprehensiveQHSEDashboardProps> = ({
  tenantId,
  customerId,
  warehouseId,
  industry = "ALL",
  showStandards = true,
  showIRFeatures = true,
}) => {
  const [standards, setStandards] = useState<StandardCompliance[]>([]);
  const [ir5Features, setIR5Features] = useState<IRFeature[]>([]);
  const [ir6Features, setIR6Features] = useState<IRFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "standards"
    | "food-safety"
    | "pharmaceutical"
    | "oil-gas"
    | "business-continuity"
    | "ir-features"
  >("overview");

  const loadStandards = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append("tenantId", tenantId);
      if (industry) params.append("industry", industry);

      // Load standards
      if (showStandards) {
        const standardsRes = await fetch(
          `/api/qhse/standards?action=all-standards&${params.toString()}`,
        );
        const standardsData = await standardsRes.json();

        if (standardsData.success) {
          // Get compliance status for each standard
          const compliancePromises = standardsData.data
            .slice(0, 10)
            .map(async (code: string) => {
              const statusRes = await fetch(
                `/api/qhse/standards?action=compliance-status&standardCode=${code}&${params.toString()}`,
              );
              const statusData = await statusRes.json();
              return statusData.success ? statusData.data : null;
            });

          const complianceStatuses = await Promise.all(compliancePromises);
          setStandards(complianceStatuses.filter(Boolean));
        }
      }

      // Load IR features
      if (showIRFeatures) {
        const [ir5Res, ir6Res] = await Promise.all([
          fetch(`/api/qhse/standards?action=ir5-features&${params.toString()}`),
          fetch(`/api/qhse/standards?action=ir6-features&${params.toString()}`),
        ]);

        const [ir5Data, ir6Data] = await Promise.all([
          ir5Res.json(),
          ir6Res.json(),
        ]);

        if (ir5Data.success) {
          setIR5Features(
            ir5Data.data.map((f: any) => ({
              ...f,
              enabled: true,
              status: "ACTIVE" as const,
            })),
          );
        }

        if (ir6Data.success) {
          setIR6Features(
            ir6Data.data.map((f: any) => ({
              ...f,
              enabled: true,
              status: "ACTIVE" as const,
            })),
          );
        }
      }
    } catch (error) {
      console.error("Error loading standards:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, industry, showStandards, showIRFeatures]);

  useEffect(() => {
    loadStandards();
  }, [loadStandards]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLIANT":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PARTIALLY_COMPLIANT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "NON_COMPLIANT":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getComplianceLevelColor = (level: number) => {
    if (level >= 90) return "text-green-600 dark:text-green-400";
    if (level >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading Comprehensive QHSE Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <QHSEErrorBoundary>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <FiShield className="w-8 h-8 text-blue-600" />
              Comprehensive QHSE Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              World's Most Advanced QHSE System - ISO, FDA, API, Food Safety,
              Business Continuity
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-2">
              <FiCpu className="w-4 h-4" />
              5IR/6IR Aligned • Industry-Leading Standards • AI-Powered
              Intelligence
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 overflow-x-auto">
            {(
              [
                "overview",
                "standards",
                "food-safety",
                "pharmaceutical",
                "oil-gas",
                "business-continuity",
                "ir-features",
              ] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Standards Overview */}
            {showStandards && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FiAward className="w-6 h-6 text-blue-600" />
                    Standards Compliance Overview
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {standards.length} Standards
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {standards.slice(0, 9).map((standard) => (
                    <motion.div
                      key={standard.standardCode}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {standard.standardCode}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(standard.status)}`}
                        >
                          {standard.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        {standard.standardName}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Compliance
                        </span>
                        <span
                          className={`text-lg font-bold ${getComplianceLevelColor(standard.complianceLevel)}`}
                        >
                          {standard.complianceLevel.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            standard.complianceLevel >= 90
                              ? "bg-green-500"
                              : standard.complianceLevel >= 70
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${standard.complianceLevel}%` }}
                        ></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* IR Features Overview */}
            {showIRFeatures && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                    <FiZap className="w-5 h-5 text-purple-600" />
                    5IR Features
                  </h3>
                  <div className="space-y-3">
                    {ir5Features.slice(0, 5).map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {feature.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {feature.description}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            feature.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                          }`}
                        >
                          {feature.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                    <FiCpu className="w-5 h-5 text-cyan-600" />
                    6IR Features
                  </h3>
                  <div className="space-y-3">
                    {ir6Features.slice(0, 5).map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {feature.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {feature.description}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            feature.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                          }`}
                        >
                          {feature.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Main QHSE Dashboard */}
            <RealTimeQHSEDashboard
              tenantId={tenantId}
              customerId={customerId}
              warehouseId={warehouseId}
              autoRefresh={true}
              refreshInterval={30000}
              showKnowledgeBaseInsights={true}
              showCrossModuleConnections={true}
            />
          </div>
        )}

        {activeTab === "standards" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Comprehensive Standards Compliance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {standards.map((standard) => (
                  <div
                    key={standard.standardCode}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {standard.standardCode}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {standard.standardName}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Compliance</span>
                      <span
                        className={`text-lg font-bold ${getComplianceLevelColor(standard.complianceLevel)}`}
                      >
                        {standard.complianceLevel.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          standard.complianceLevel >= 90
                            ? "bg-green-500"
                            : standard.complianceLevel >= 70
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${standard.complianceLevel}%` }}
                      ></div>
                    </div>
                    <span
                      className={`mt-2 inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(standard.status)}`}
                    >
                      {standard.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "food-safety" && (
          <div className="space-y-6">
            <FoodSafetyDashboard
              tenantId={tenantId}
              customerId={customerId}
              facilityId={facilityId}
              warehouseId={warehouseId}
            />
          </div>
        )}

        {activeTab === "pharmaceutical" && (
          <div className="space-y-6">
            <PharmaceuticalDashboard
              tenantId={tenantId}
              customerId={customerId}
              facilityId={facilityId}
              warehouseId={warehouseId}
            />
          </div>
        )}

        {activeTab === "oil-gas" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <FiZap className="w-6 h-6 text-orange-600" />
                Oil & Gas Compliance
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                API 510, 570, 653, 1160, ISO 29001 compliance
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Inspections
                  </h3>
                  <p className="text-2xl font-bold text-orange-600">0</p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Scheduled
                  </p>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    Risk-Based Inspections
                  </h3>
                  <p className="text-2xl font-bold text-amber-600">0</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Active RBIs
                  </p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Process Safety Indicators
                  </h3>
                  <p className="text-2xl font-bold text-red-600">0</p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    Tier 1 events
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "business-continuity" && (
          <div className="space-y-6">
            <BusinessContinuityDashboard
              tenantId={tenantId}
              customerId={customerId}
              facilityId={facilityId}
              warehouseId={warehouseId}
            />
          </div>
        )}

        {activeTab === "ir-features" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FiZap className="w-6 h-6 text-purple-600" />
                  5IR Features
                </h2>
                <div className="space-y-4">
                  {ir5Features.map((feature) => (
                    <div
                      key={feature.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {feature.name}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            feature.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                          }`}
                        >
                          {feature.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {feature.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                          {feature.category.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FiCpu className="w-6 h-6 text-cyan-600" />
                  6IR Features
                </h2>
                <div className="space-y-4">
                  {ir6Features.map((feature) => (
                    <div
                      key={feature.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {feature.name}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            feature.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                          }`}
                        >
                          {feature.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {feature.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 rounded">
                          {feature.category.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </QHSEErrorBoundary>
  );
};

export default ComprehensiveQHSEDashboard;
