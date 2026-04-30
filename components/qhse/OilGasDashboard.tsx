/**
 * ⛽ OIL & GAS COMPLIANCE DASHBOARD
 * Comprehensive oil & gas standards compliance (API 510, 570, 653, 1160)
 * 5IR/6IR Features: IoT monitoring, predictive maintenance, digital twin
 */

"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiZap,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiActivity,
  FiBarChart,
  FiRefreshCw,
  FiSettings,
  FiTool,
  FiEye,
  FiEdit,
  FiCalendar,
  FiTarget,
} from "react-icons/fi";

interface OilGasDashboardProps {
  tenantId?: string;
  customerId?: string;
  facilityId?: string;
  warehouseId?: string;
}

const OilGasDashboard: React.FC<OilGasDashboardProps> = ({
  tenantId,
  customerId,
  facilityId,
  warehouseId,
}) => {
  const [inspections, setInspections] = useState<any[]>([]);
  const [rbiRecords, setRbiRecords] = useState<any[]>([]);
  const [pipelineIntegrity, setPipelineIntegrity] = useState<any[]>([]);
  const [psi, setPSI] = useState<any>(null);
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

      const [inspectionsRes, psiRes] = await Promise.all([
        fetch(`/api/qhse/oil-gas?action=inspections&${params.toString()}`),
        fetch(`/api/qhse/oil-gas?action=calculate-psi&${params.toString()}`),
      ]);

      const [inspectionsData, psiData] = await Promise.all([
        inspectionsRes.json(),
        psiRes.json(),
      ]);

      if (inspectionsData.success) {
        setInspections(inspectionsData.data || []);
      }
      if (psiData.success) {
        setPSI(psiData.data);
      }
    } catch (error) {
      console.error("Error loading oil & gas data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiZap className="w-7 h-7 text-orange-600" />
            Oil & Gas Compliance
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            API 510 • API 570 • API 653 • API 1160 • ISO 29001 • Risk-Based
            Inspection
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                Inspections
              </p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                {inspections.length}
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                {inspections.filter((i) => i.status === "SCHEDULED").length}{" "}
                scheduled
              </p>
            </div>
            <FiTool className="w-10 h-10 text-orange-600 dark:text-orange-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                Risk-Based Inspections
              </p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                {rbiRecords.length}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Active RBIs
              </p>
            </div>
            <FiTarget className="w-10 h-10 text-amber-600 dark:text-amber-400" />
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
                Process Safety Indicators
              </p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-1">
                {psi?.tier1 || 0}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Tier 1 events (API RP 754)
              </p>
            </div>
            <FiAlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                Pipeline Integrity
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {pipelineIntegrity.length}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Managed pipelines (API 1160)
              </p>
            </div>
            <FiActivity className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>
      </div>

      {/* Process Safety Indicators (API RP 754) */}
      {psi && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
            <FiBarChart className="w-5 h-5 text-red-600" />
            Process Safety Indicators (API RP 754)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                Tier 1
              </p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {psi.tier1}
              </p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">
                Tier 2
              </p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {psi.tier2}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">
                Tier 3
              </p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {psi.tier3}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                Tier 4
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {psi.tier4}
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Total PSI Events:{" "}
              <span className="text-2xl font-bold">{psi.total}</span>
            </p>
          </div>
        </div>
      )}

      {/* Inspections */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiTool className="w-5 h-5 text-orange-600" />
            Inspections (API 510, 570, 653)
          </h3>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
            Schedule Inspection
          </button>
        </div>
        {inspections.length > 0 ? (
          <div className="space-y-3">
            {inspections.map((inspection) => (
              <div
                key={inspection.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {inspection.equipmentName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {inspection.inspectionType} • {inspection.standard} •{" "}
                      {inspection.location}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Scheduled:{" "}
                        {new Date(
                          inspection.scheduledDate,
                        ).toLocaleDateString()}
                      </span>
                      <span>
                        Due: {new Date(inspection.dueDate).toLocaleDateString()}
                      </span>
                      {inspection.nextInspectionDate && (
                        <span>
                          Next:{" "}
                          {new Date(
                            inspection.nextInspectionDate,
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {inspection.remainingLife && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                        <p className="text-blue-900 dark:text-blue-100">
                          Remaining Life: {inspection.remainingLife.years} years
                          {inspection.remainingLife.months &&
                            ` (${inspection.remainingLife.months} months)`}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        inspection.status === "COMPLETED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : inspection.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : inspection.status === "OVERDUE"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                      }`}
                    >
                      {inspection.status}
                    </span>
                    {inspection.aiAnalysis && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs flex items-center gap-1">
                        <FiZap className="w-3 h-3" />
                        AI
                      </span>
                    )}
                  </div>
                </div>
                {inspection.riskAssessment && (
                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-600 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Risk Assessment
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          inspection.riskAssessment.riskLevel === "CRITICAL"
                            ? "text-red-600"
                            : inspection.riskAssessment.riskLevel === "HIGH"
                              ? "text-orange-600"
                              : inspection.riskAssessment.riskLevel === "MEDIUM"
                                ? "text-yellow-600"
                                : "text-green-600"
                        }`}
                      >
                        {inspection.riskAssessment.riskLevel} (
                        {inspection.riskAssessment.riskScore.toFixed(0)})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No inspections found</p>
        )}
      </div>
    </div>
  );
};

export default OilGasDashboard;
