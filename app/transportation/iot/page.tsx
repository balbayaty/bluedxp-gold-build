/**
 * IoT Monitoring
 *
 * Real-time IoT sensor data monitoring and alerts
 * Module: tms
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import IoTMonitoringPanel from "@/components/transportation/IoTMonitoringPanel";
import { apiFetch } from "@/utils/apiFetch";
import { RiRadarLine, RiAlertLine } from "react-icons/ri";

function TransportationIotPageContent() {
  const [loading, setLoading] = useState(false);
  const [sensorData, setSensorData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState("");

  const fetchSensorData = async () => {
    if (!shipmentId) {
      setError("Please enter a shipment ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(
        `/api/transportation/iot/sensor-data?shipmentId=${shipmentId}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch sensor data: ${response.statusText}`);
      }

      const data = await response.json();
      setSensorData(data.sensorData || data);
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch sensor data",
      );
      console.error("Error fetching sensor data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds if we have sensor data
  useEffect(() => {
    if (shipmentId && sensorData) {
      const interval = setInterval(() => {
        fetchSensorData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [shipmentId, sensorData]);

  if (loading && !sensorData) {
    return (
      <PageTemplate
        title="IoT Monitoring"
        description="Real-time IoT sensor data monitoring and alerts"
        icon="ri-radar-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Connecting to IoT devices..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="IoT Monitoring"
      description="Real-time IoT sensor data monitoring and alerts"
      icon="ri-radar-line"
    >
      <div className="space-y-6">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <RiRadarLine className="w-5 h-5" />
            IoT Sensor Data
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
              placeholder="Enter shipment ID"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <button
              onClick={fetchSensorData}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Loading..." : "Fetch Data"}
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* IoT Monitoring Panel */}
        {sensorData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <IoTMonitoringPanel sensorData={sensorData} alerts={alerts} />
          </motion.div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
          >
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <RiAlertLine className="w-5 h-5 text-yellow-600" />
              Active Alerts
            </h3>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded p-3 border border-yellow-200 dark:border-yellow-700"
                >
                  <p className="font-medium">{alert.type}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!sensorData && !loading && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <RiRadarLine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Enter a shipment ID to view IoT sensor data
            </p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function TransportationIotPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="IoT Monitoring"
          description="Real-time IoT sensor data monitoring and alerts"
          icon="ri-radar-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <TransportationIotPageContent />
    </ErrorBoundary>
  );
}
