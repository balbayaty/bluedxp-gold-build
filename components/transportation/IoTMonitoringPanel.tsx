/**
 * IoT Monitoring Panel
 *
 * Real-time IoT sensor data visualization
 */

"use client";

import { motion } from "framer-motion";
import {
  Thermometer,
  Droplet,
  MapPin,
  AlertTriangle,
  Activity,
} from "lucide-react";
import type {
  TransportationSensorData,
  TransportationIoTAlert,
} from "@/lib/services/transportation";

interface IoTMonitoringPanelProps {
  sensorData: TransportationSensorData | null;
  alerts: TransportationIoTAlert[];
  onAlertClick?: (alert: TransportationIoTAlert) => void;
}

export default function IoTMonitoringPanel({
  sensorData,
  alerts,
  onAlertClick,
}: IoTMonitoringPanelProps) {
  if (!sensorData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border text-center">
        <p className="text-gray-500">No sensor data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Activity className="w-5 h-5 text-green-500" />
        Real-Time IoT Monitoring
      </h3>

      {/* Current Sensor Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Temperature */}
        {sensorData.sensors.temperature !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-5 h-5 text-red-500" />
              <span className="font-semibold">Temperature</span>
            </div>
            <p className="text-2xl font-bold">
              {sensorData.sensors.temperature.toFixed(1)}°C
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Source:{" "}
              {sensorData.source === "GOVERNMENT" ? "ELM/Rabet.sa" : "Direct"}
            </p>
          </motion.div>
        )}

        {/* Humidity */}
        {sensorData.sensors.humidity !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">Humidity</span>
            </div>
            <p className="text-2xl font-bold">
              {sensorData.sensors.humidity.toFixed(1)}%
            </p>
          </motion.div>
        )}

        {/* Location */}
        {sensorData.location && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border"
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Location</span>
            </div>
            <p className="text-sm">{sensorData.location.address}</p>
            <p className="text-xs text-gray-500 mt-1">
              Accuracy: {sensorData.location.accuracy}m
            </p>
          </motion.div>
        )}

        {/* Shock */}
        {sensorData.sensors.shock !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white dark:bg-gray-800 rounded-lg p-4 border ${
              sensorData.sensors.shock > 5 ? "border-red-500" : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">Shock</span>
            </div>
            <p className="text-2xl font-bold">
              {sensorData.sensors.shock.toFixed(2)}g
            </p>
            {sensorData.sensors.shock > 5 && (
              <p className="text-xs text-red-500 mt-1">
                Excessive shock detected
              </p>
            )}
          </motion.div>
        )}

        {/* Vehicle Speed */}
        {sensorData.vehicle?.speed !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-500" />
              <span className="font-semibold">Speed</span>
            </div>
            <p className="text-2xl font-bold">
              {sensorData.vehicle.speed} km/h
            </p>
          </motion.div>
        )}

        {/* Fuel Level */}
        {sensorData.vehicle?.fuelLevel !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Fuel</span>
            </div>
            <p className="text-2xl font-bold">
              {sensorData.vehicle.fuelLevel}%
            </p>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${sensorData.vehicle.fuelLevel}%` }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Active Alerts ({alerts.length})
          </h4>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border ${
                  alert.severity === "CRITICAL"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                    : alert.severity === "HIGH"
                      ? "bg-orange-50 dark:bg-orange-900/20 border-orange-500"
                      : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                } ${onAlertClick ? "cursor-pointer hover:shadow-md" : ""}`}
                onClick={() => onAlertClick?.(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{alert.message}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {alert.alertType.replace(/_/g, " ")}
                    </p>
                    {alert.recommendedAction && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {alert.recommendedAction}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      alert.severity === "CRITICAL"
                        ? "bg-red-500 text-white"
                        : alert.severity === "HIGH"
                          ? "bg-orange-500 text-white"
                          : "bg-yellow-500 text-white"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Last Update */}
      <div className="text-xs text-gray-500 text-center">
        Last update: {new Date(sensorData.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
