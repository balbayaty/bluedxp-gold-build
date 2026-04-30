/**
 * QHSE ESG Reporting Page - ENHANCED
 * Comprehensive ESG reports and sustainability tracking
 * With tabs, detailed metrics, and cross-module links
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FiDownload,
  FiPlus,
  FiGlobe,
  FiFeather,
  FiUsers,
  FiShield,
  FiTrendingUp,
  FiBarChart,
  FiActivity,
  FiDroplet,
  FiZap,
} from "react-icons/fi";
import type { ESGReport } from "@/types/qhse";
import CrossModuleLinks from "@/components/qhse/CrossModuleLinks";
import { PremiumLoader } from "@/components/loading";

export default function QHSEESGPage() {
  const [report, setReport] = useState<ESGReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "environmental" | "social" | "governance" | "frameworks"
  >("overview");

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/qhse/esg");
      const data = await response.json();

      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      console.error("Error fetching ESG report:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a]">
        <PremiumLoader
          message="Loading ESG reports..."
          size="xl"
          variant="default"
        />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ESG Reporting</h1>
            <p className="text-gray-600 mt-1">
              Environmental, Social, and Governance metrics
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Generate Report
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FiGlobe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">No ESG report available</p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Generate Your First ESG Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ESG Reporting</h1>
          <p className="text-gray-600 mt-1">
            Environmental, Social, and Governance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Generate Report
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <FiDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Report Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {report.reportNumber}
            </h2>
            <p className="text-gray-600 mt-1">
              Reporting Period:{" "}
              {new Date(report.periodStart).toLocaleDateString()} -{" "}
              {new Date(report.periodEnd).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Framework: {report.framework}
            </p>
          </div>
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              report.status === "PUBLISHED"
                ? "bg-green-100 text-green-800"
                : report.status === "APPROVED"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {report.status}
          </span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: "overview", label: "Overview", icon: FiBarChart },
              { id: "environmental", label: "Environmental", icon: FiFeather },
              { id: "social", label: "Social", icon: FiUsers },
              { id: "governance", label: "Governance", icon: FiShield },
              { id: "frameworks", label: "Frameworks", icon: FiGlobe },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Environmental Summary */}
              {report.environmental && (
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <FiFeather className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Environmental
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {report.environmental.carbonFootprint && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500">
                          Carbon Footprint
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {report.environmental.carbonFootprint.total?.toFixed(
                            2,
                          ) || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {report.environmental.carbonFootprint.unit}
                        </p>
                      </div>
                    )}
                    {report.environmental.wasteManagement && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500">
                          Waste Diversion
                        </p>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                          {report.environmental.wasteManagement.diversionRate?.toFixed(
                            1,
                          ) || "N/A"}
                          %
                        </p>
                      </div>
                    )}
                    {report.environmental.energyConsumption && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500">
                          Energy
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {report.environmental.energyConsumption.totalEnergy?.toFixed(
                            2,
                          ) || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {report.environmental.energyConsumption.unit}
                        </p>
                      </div>
                    )}
                    {report.environmental.waterUsage && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500">
                          Water
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {report.environmental.waterUsage.totalWater?.toFixed(
                            2,
                          ) || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {report.environmental.waterUsage.unit}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Social Summary */}
              {report.social && (
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <FiUsers className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">Social</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {report.social.employeeSafety && (
                      <>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-500">
                            TRIR
                          </p>
                          <p className="text-2xl font-bold text-gray-900 mt-2">
                            {report.social.employeeSafety.trir?.toFixed(2) ||
                              "N/A"}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-500">
                            LTIFR
                          </p>
                          <p className="text-2xl font-bold text-gray-900 mt-2">
                            {report.social.employeeSafety.ltifr?.toFixed(2) ||
                              "N/A"}
                          </p>
                        </div>
                      </>
                    )}
                    {report.social.training && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500">
                          Training Completion
                        </p>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                          {report.social.training.trainingCompletionRate?.toFixed(
                            1,
                          ) || "N/A"}
                          %
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Governance Summary */}
              {report.governance && (
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <FiShield className="w-6 h-6 text-purple-600" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Governance
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-500">
                        Compliance Score
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {report.governance.complianceScore || "N/A"}%
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-500">
                        Audits Completed
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {report.governance.auditsCompleted || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-500">
                        Certifications
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {report.governance.certifications || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-500">
                        Violations
                      </p>
                      <p className="text-2xl font-bold text-red-600 mt-2">
                        {report.governance.violations || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Environmental Tab */}
          {activeTab === "environmental" && report.environmental && (
            <div className="space-y-6">
              {report.environmental.carbonFootprint && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FiActivity className="w-6 h-6 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Carbon Footprint
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {report.environmental.carbonFootprint.total?.toFixed(
                          2,
                        ) || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {report.environmental.carbonFootprint.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Scope 1</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {report.environmental.carbonFootprint.scope1?.toFixed(
                          2,
                        ) || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Scope 2</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {report.environmental.carbonFootprint.scope2?.toFixed(
                          2,
                        ) || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {report.environmental.wasteManagement && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FiFeather className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Waste Management
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Diversion Rate</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {report.environmental.wasteManagement.diversionRate?.toFixed(
                          1,
                        ) || "N/A"}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Waste Generated</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {report.environmental.wasteManagement.totalWaste?.toFixed(
                          2,
                        ) || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Recycled</p>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        {report.environmental.wasteManagement.recycled?.toFixed(
                          2,
                        ) || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {report.environmental.energyConsumption && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FiZap className="w-6 h-6 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Energy Consumption
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Energy</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {report.environmental.energyConsumption.totalEnergy?.toFixed(
                          2,
                        ) || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {report.environmental.energyConsumption.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Renewable Energy</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {report.environmental.energyConsumption.renewableEnergy?.toFixed(
                          2,
                        ) || "N/A"}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {report.environmental.waterUsage && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FiDroplet className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Water Usage
                    </h3>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Water</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {report.environmental.waterUsage.totalWater?.toFixed(2) ||
                        "N/A"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {report.environmental.waterUsage.unit}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Social Tab */}
          {activeTab === "social" && report.social && (
            <div className="space-y-6">
              {report.social.employeeSafety && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FiShield className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Employee Safety
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">TRIR</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {report.social.employeeSafety.trir?.toFixed(2) || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Total Recordable Incident Rate
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">LTIFR</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {report.social.employeeSafety.ltifr?.toFixed(2) ||
                          "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Lost Time Injury Frequency Rate
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {report.social.training && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FiUsers className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Training & Development
                    </h3>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      Training Completion Rate
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {report.social.training.trainingCompletionRate?.toFixed(
                        1,
                      ) || "N/A"}
                      %
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Governance Tab */}
          {activeTab === "governance" && report.governance && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FiShield className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Governance Metrics
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Compliance Score</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {report.governance.complianceScore || "N/A"}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Audits Completed</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {report.governance.auditsCompleted || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Certifications</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {report.governance.certifications || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Violations</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      {report.governance.violations || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Frameworks Tab */}
          {activeTab === "frameworks" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ESG Frameworks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">GRI</h4>
                    <p className="text-sm text-gray-600">
                      Global Reporting Initiative
                    </p>
                    <span
                      className={`mt-2 inline-block px-2 py-1 text-xs rounded-full ${
                        report.framework === "GRI"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {report.framework === "GRI" ? "Active" : "Available"}
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">SASB</h4>
                    <p className="text-sm text-gray-600">
                      Sustainability Accounting Standards
                    </p>
                    <span
                      className={`mt-2 inline-block px-2 py-1 text-xs rounded-full ${
                        report.framework === "SASB"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {report.framework === "SASB" ? "Active" : "Available"}
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">TCFD</h4>
                    <p className="text-sm text-gray-600">
                      Task Force on Climate-Related Disclosures
                    </p>
                    <span
                      className={`mt-2 inline-block px-2 py-1 text-xs rounded-full ${
                        report.framework === "TCFD"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {report.framework === "TCFD" ? "Active" : "Available"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cross-Module Links */}
      <CrossModuleLinks
        title="Quick Navigation"
        links={[
          {
            label: "QHSE Dashboard",
            href: "/qhse/dashboard",
            icon: "ri-dashboard-3-line",
            description: "Overview",
          },
          {
            label: "Environmental Metrics",
            href: "/qhse/environmental",
            icon: "ri-leaf-line",
            description: "Environmental data",
          },
          {
            label: "Safety Metrics",
            href: "/qhse/safety-metrics",
            icon: "ri-shield-check-line",
            description: "Safety performance",
          },
          {
            label: "Regulatory Compliance",
            href: "/qhse/regulatory",
            icon: "ri-file-list-3-line",
            description: "Compliance tracking",
          },
          {
            label: "Training",
            href: "/qhse/training",
            icon: "ri-graduation-cap-line",
            description: "Training records",
          },
          {
            label: "Search",
            href: "/qhse/search",
            icon: "ri-search-line",
            description: "Advanced search",
          },
        ]}
      />
    </div>
  );
}
