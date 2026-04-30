/**
 * IoT Device Dashboard
 * Mind-blowing real-time IoT monitoring and control
 * Real-time • Interactive • Beautiful
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  iotService,
  type IoTDevice,
  type SensorReading,
  type EnvironmentalMonitoring,
} from "@/lib/services/wms/iotService";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface IoTDeviceDashboardProps {
  locationId: string;
  warehouseId: string;
}

export default function IoTDeviceDashboard({
  locationId,
  warehouseId,
}: IoTDeviceDashboardProps) {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [monitoring, setMonitoring] = useState<EnvironmentalMonitoring | null>(
    null,
  );
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
    loadMonitoring();
    const interval = setInterval(() => {
      loadMonitoring();
      if (selectedDevice) loadReadings();
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [locationId, selectedDevice]);

  const loadDevices = async () => {
    try {
      const deviceList = await iotService.getDevicesByLocation(locationId);
      setDevices(deviceList);
      if (deviceList.length > 0 && !selectedDevice) {
        setSelectedDevice(deviceList[0].deviceId);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonitoring = async () => {
    try {
      const env = await iotService.getEnvironmentalMonitoring(locationId);
      setMonitoring(env);
    } catch (error) {
      console.error("Error loading monitoring:", error);
    }
  };

  const loadReadings = async () => {
    if (!selectedDevice) return;
    try {
      const deviceReadings = await iotService.getSensorReadings(
        selectedDevice,
        new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      );
      setReadings(deviceReadings.slice(0, 50)); // Last 50 readings
    } catch (error) {
      console.error("Error loading readings:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const chartData = readings.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString(),
    value: r.value,
    quality: r.quality === "GOOD" ? 1 : r.quality === "WARNING" ? 0.5 : 0,
  }));

  const deviceStatusColors = {
    ACTIVE: "bg-green-500",
    INACTIVE: "bg-gray-500",
    MAINTENANCE: "bg-yellow-500",
    ERROR: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <i className="ri-sensor-line text-blue-500"></i>
            IoT Device Dashboard
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time monitoring • Location: {locationId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Environmental Monitoring Cards */}
      {monitoring && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-xl shadow-xl ${
              monitoring.temperature &&
              (monitoring.temperature > 30 || monitoring.temperature < 2)
                ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
                : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <i className="ri-temp-cold-line text-2xl opacity-80"></i>
              {monitoring.alerts?.some((a) => a.type === "TEMPERATURE") && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  Alert
                </span>
              )}
            </div>
            <div className="text-3xl font-bold">
              {monitoring.temperature?.toFixed(1) || "N/A"}°C
            </div>
            <div className="text-sm opacity-90 mt-1">Temperature</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-xl shadow-xl ${
              monitoring.humidity &&
              (monitoring.humidity > 80 || monitoring.humidity < 20)
                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                : "bg-gradient-to-br from-green-500 to-green-600 text-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <i className="ri-water-percent-line text-2xl opacity-80"></i>
              {monitoring.alerts?.some((a) => a.type === "HUMIDITY") && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  Alert
                </span>
              )}
            </div>
            <div className="text-3xl font-bold">
              {monitoring.humidity?.toFixed(1) || "N/A"}%
            </div>
            <div className="text-sm opacity-90 mt-1">Humidity</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-xl text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <i className="ri-barometer-line text-2xl opacity-80"></i>
            </div>
            <div className="text-3xl font-bold">
              {monitoring.pressure?.toFixed(1) || "N/A"} hPa
            </div>
            <div className="text-sm opacity-90 mt-1">Pressure</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-xl text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <i className="ri-alert-line text-2xl opacity-80"></i>
            </div>
            <div className="text-3xl font-bold">
              {monitoring.alerts?.length || 0}
            </div>
            <div className="text-sm opacity-90 mt-1">Active Alerts</div>
          </motion.div>
        </div>
      )}

      {/* Alerts */}
      {monitoring && monitoring.alerts && monitoring.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-6"
        >
          <h4 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <i className="ri-alert-line"></i>
            Active Alerts
          </h4>
          <div className="space-y-2">
            {monitoring.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  alert.severity === "CRITICAL"
                    ? "bg-red-100 dark:bg-red-900/40"
                    : alert.severity === "HIGH"
                      ? "bg-orange-100 dark:bg-orange-900/40"
                      : "bg-yellow-100 dark:bg-yellow-900/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      className={`font-semibold ${
                        alert.severity === "CRITICAL"
                          ? "text-red-900 dark:text-red-100"
                          : alert.severity === "HIGH"
                            ? "text-orange-900 dark:text-orange-100"
                            : "text-yellow-900 dark:text-yellow-100"
                      }`}
                    >
                      {alert.type}
                    </span>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded text-xs ${
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
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {alert.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Devices Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i className="ri-device-line text-blue-500"></i>
          Connected Devices
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedDevice(device.deviceId)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedDevice === device.deviceId
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {device.name}
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${deviceStatusColors[device.status]}`}
                ></div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {device.sensorType || device.type}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>ID: {device.deviceId}</span>
                {device.batteryLevel !== undefined && (
                  <span className="flex items-center gap-1">
                    <i className="ri-battery-line"></i>
                    {device.batteryLevel}%
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sensor Readings Chart */}
      {selectedDevice && readings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i className="ri-line-chart-line text-green-500"></i>
            Sensor Readings (Last 24 Hours)
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
