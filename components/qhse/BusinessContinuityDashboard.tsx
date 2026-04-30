/**
 * 🔄 BUSINESS CONTINUITY MANAGEMENT DASHBOARD
 * Comprehensive business continuity (ISO 22301, NFPA 1600)
 * 5IR/6IR Features: AI risk assessment, digital twin simulation, predictive disruption
 */

"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiActivity,
  FiBarChart,
  FiRefreshCw as FiRefresh,
  FiShield,
  FiFileText,
  FiSettings,
  FiZap,
  FiTarget,
} from "react-icons/fi";

interface BusinessContinuityDashboardProps {
  tenantId?: string;
  customerId?: string;
  facilityId?: string;
  warehouseId?: string;
}

const BusinessContinuityDashboard: React.FC<
  BusinessContinuityDashboardProps
> = ({ tenantId, customerId, facilityId, warehouseId }) => {
  const [bcps, setBCPs] = useState<any[]>([]);
  const [bias, setBIAs] = useState<any[]>([]);
  const [crises, setCrises] = useState<any[]>([]);
  const [drps, setDRPs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tenantId, customerId, facilityId, warehouseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append("tenantId", tenantId);
      if (customerId) params.append("customerId", customerId);
      if (facilityId) params.append("facilityId", facilityId);
      if (warehouseId) params.append("warehouseId", warehouseId);

      const [bcpsRes, biasRes, crisesRes, drpsRes] = await Promise.all([
        fetch(`/api/qhse/business-continuity?action=bcps&${params.toString()}`),
        fetch(`/api/qhse/business-continuity?action=bias&${params.toString()}`),
        fetch(
          `/api/qhse/business-continuity?action=crises&${params.toString()}`,
        ),
        fetch(`/api/qhse/business-continuity?action=drps&${params.toString()}`),
      ]);

      const [bcpsData, biasData, crisesData, drpsData] = await Promise.all([
        bcpsRes.json(),
        biasRes.json(),
        crisesRes.json(),
        drpsRes.json(),
      ]);

      if (bcpsData.success) setBCPs(bcpsData.data || []);
      if (biasData.success) setBIAs(biasData.data || []);
      if (crisesData.success) setCrises(crisesData.data || []);
      if (drpsData.success) setDRPs(drpsData.data || []);
    } catch (error) {
      console.error("Error loading business continuity data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiRefreshCw className="w-7 h-7 text-blue-600" />
            Business Continuity Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ISO 22301 • NFPA 1600 • Crisis Management • Disaster Recovery
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiRefresh className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                BC Plans
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {bcps.length}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {bcps.filter((b) => b.status === "ACTIVE").length} active
              </p>
            </div>
            <FiFileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                Disaster Recovery Plans
              </p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                {drps.length}
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                DRPs configured
              </p>
            </div>
            <FiShield className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-red-200 dark:border-red-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                Active Crises
              </p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-1">
                {
                  crises.filter(
                    (c) => c.status !== "RESOLVED" && c.status !== "CLOSED",
                  ).length
                }
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Crisis events
              </p>
            </div>
            <FiAlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                Business Impact Analyses
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">
                {bias.length}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                BIAs completed
              </p>
            </div>
            <FiTarget className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </motion.div>
      </div>

      {/* Business Continuity Plans */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiFileText className="w-5 h-5 text-blue-600" />
            Business Continuity Plans (ISO 22301)
          </h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            Create BCP
          </button>
        </div>
        {bcps.length > 0 ? (
          <div className="space-y-3">
            {bcps.map((bcp) => (
              <div
                key={bcp.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {bcp.planName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Version {bcp.planVersion} • Scope: {bcp.scope}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {bcp.activated && bcp.activatedDate && (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          Activated:{" "}
                          {new Date(bcp.activatedDate).toLocaleDateString()}
                        </span>
                      )}
                      {bcp.maintenance.nextReview && (
                        <span>
                          Next Review:{" "}
                          {new Date(
                            bcp.maintenance.nextReview,
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bcp.status === "ACTIVATED"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : bcp.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : bcp.status === "APPROVED"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                      }`}
                    >
                      {bcp.status}
                    </span>
                    {bcp.digitalTwinScenario && (
                      <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 rounded text-xs flex items-center gap-1">
                        <FiZap className="w-3 h-3" />
                        Digital Twin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No business continuity plans found
          </p>
        )}
      </div>

      {/* Active Crises */}
      {crises.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED")
        .length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-red-300 dark:border-red-700 p-6">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center gap-2 mb-4">
            <FiAlertTriangle className="w-5 h-5 text-red-600" />
            Active Crises
          </h3>
          <div className="space-y-3">
            {crises
              .filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED")
              .map((crisis) => (
                <div
                  key={crisis.id}
                  className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-red-900 dark:text-red-100">
                        {crisis.crisisType}
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {crisis.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-red-600 dark:text-red-400">
                        <span>
                          Detected:{" "}
                          {new Date(crisis.detectedDate).toLocaleDateString()}
                        </span>
                        <span>Severity: {crisis.severity}</span>
                        {crisis.response.activated && (
                          <span className="font-medium">
                            Response Activated
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        crisis.severity === "CRITICAL"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      }`}
                    >
                      {crisis.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessContinuityDashboard;
