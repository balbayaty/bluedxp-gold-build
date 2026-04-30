/**
 * 🍽️ FOOD SAFETY DASHBOARD
 * Comprehensive food safety management with HACCP, ISO 22000, FSMA
 * 5IR/6IR Features: IoT monitoring, AI hazard detection, predictive analytics
 */

"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiDroplet,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiThermometer,
  FiShield,
  FiBarChart,
  FiRefreshCw,
  FiSettings,
} from "react-icons/fi";

interface FoodSafetyDashboardProps {
  tenantId?: string;
  customerId?: string;
  facilityId?: string;
  warehouseId?: string;
}

const FoodSafetyDashboard: React.FC<FoodSafetyDashboardProps> = ({
  tenantId,
  customerId,
  facilityId,
  warehouseId,
}) => {
  const [haccpPlans, setHaccpPlans] = useState<any[]>([]);
  const [temperatureMonitoring, setTemperatureMonitoring] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
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

      const [plansRes, tempRes, incidentsRes] = await Promise.all([
        fetch(`/api/qhse/food-safety?action=haccp-plans&${params.toString()}`),
        fetch(
          `/api/qhse/food-safety?action=temperature-monitoring&${params.toString()}`,
        ),
        fetch(`/api/qhse/food-safety?action=incidents&${params.toString()}`),
      ]);

      const [plansData, tempData, incidentsData] = await Promise.all([
        plansRes.json(),
        tempRes.json(),
        incidentsRes.json(),
      ]);

      if (plansData.success) setHaccpPlans(plansData.data || []);
      if (tempData.success) setTemperatureMonitoring(tempData.data || []);
      if (incidentsData.success) setIncidents(incidentsData.data || []);
    } catch (error) {
      console.error("Error loading food safety data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiDroplet className="w-7 h-7 text-green-600" />
            Food Safety Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            HACCP • ISO 22000 • FSMA • FDA Food Code
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                HACCP Plans
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">
                {haccpPlans.length}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                {haccpPlans.filter((p) => p.status === "ACTIVE").length} active
              </p>
            </div>
            <FiShield className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                CCPs Monitored
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {haccpPlans.reduce(
                  (sum, plan) => sum + (plan.ccpRegister?.length || 0),
                  0,
                )}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Critical control points
              </p>
            </div>
            <FiCheckCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                Temperature Alerts
              </p>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                {
                  temperatureMonitoring.filter(
                    (m) => m.status === "CRITICAL" || m.status === "WARNING",
                  ).length
                }
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Active alerts
              </p>
            </div>
            <FiThermometer className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-red-200 dark:border-red-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                Food Safety Incidents
              </p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-1">
                {incidents.length}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {incidents.filter((i) => i.recallRequired).length} recall
                required
              </p>
            </div>
            <FiAlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </motion.div>
      </div>

      {/* Temperature Monitoring (5IR: IoT) */}
      {temperatureMonitoring.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <FiThermometer className="w-5 h-5 text-blue-600" />
            Real-Time Temperature Monitoring (5IR: IoT Integration)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {temperatureMonitoring.slice(0, 6).map((monitoring) => (
              <div
                key={monitoring.id}
                className={`p-4 rounded-lg border-2 ${
                  monitoring.status === "CRITICAL"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                    : monitoring.status === "WARNING"
                      ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700"
                      : "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {monitoring.location}
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      monitoring.status === "CRITICAL"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : monitoring.status === "WARNING"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}
                  >
                    {monitoring.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {monitoring.currentTemperature}°
                    {monitoring.unit === "CELSIUS" ? "C" : "F"}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Target: {monitoring.targetTemperature}°
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Range: {monitoring.minimumTemperature}° -{" "}
                  {monitoring.maximumTemperature}°
                </div>
                {monitoring.aiPrediction && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      AI Prediction (6IR)
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Predicted: {monitoring.aiPrediction.predictedTemperature}
                      °C (Confidence:{" "}
                      {(monitoring.aiPrediction.confidence * 100).toFixed(0)}%)
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HACCP Plans */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiShield className="w-5 h-5 text-green-600" />
            HACCP Plans
          </h3>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
            Create HACCP Plan
          </button>
        </div>
        {haccpPlans.length > 0 ? (
          <div className="space-y-3">
            {haccpPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {plan.productName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {plan.ccpRegister?.length || 0} CCPs • Version{" "}
                      {plan.version}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      plan.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : plan.status === "APPROVED"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                    }`}
                  >
                    {plan.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No HACCP plans found</p>
        )}
      </div>
    </div>
  );
};

export default FoodSafetyDashboard;
