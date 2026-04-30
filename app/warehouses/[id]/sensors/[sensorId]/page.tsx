"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { IoTSensor } from "@/types/warehouse-management";

interface SensorDetailPageProps {}

const SensorDetailPage: React.FC<SensorDetailPageProps> = () => {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params?.id as string;
  const sensorId = params?.sensorId as string;

  const [sensor, setSensor] = useState<IoTSensor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState<
    Array<{ timestamp: Date; value: number }>
  >([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    loadSensorData();

    // Set up real-time updates
    if (typeof window !== "undefined") {
      try {
        const wsUrl =
          process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
          (window.location.protocol === "https:" ? "wss:" : "ws:") +
            "//" +
            window.location.host +
            "/api/realtime";

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsRealtimeConnected(true);
          ws.send(
            JSON.stringify({
              type: "subscribe",
              channel: `sensor:${sensorId}`,
            }),
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "sensor_update" && data.sensorId === sensorId) {
              setSensor(data.sensor);
              // Add to historical data
              setHistoricalData((prev) => [
                { timestamp: new Date(), value: data.sensor.value },
                ...prev.slice(0, 100), // Keep last 100 readings
              ]);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = () => setIsRealtimeConnected(false);
        ws.onclose = () => setIsRealtimeConnected(false);

        return () => ws.close();
      } catch (error) {
        console.warn("WebSocket not available");
      }
    }
  }, [sensorId, warehouseId]);

  const loadSensorData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/warehouse/${warehouseId}/sensors/${sensorId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSensor(data.sensor);
        setHistoricalData(data.historicalData || []);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error loading sensor:", error);
    }

    // Fallback to mock data
    const mockSensor: IoTSensor = {
      id: sensorId,
      warehouseId: warehouseId,
      zoneId: "zone-001",
      type: "temperature",
      name: "Temperature Sensor A1",
      value: 23.5,
      unit: "°C",
      status: "online",
      lastReading: new Date(),
      batteryLevel: 87,
      threshold: { min: 18, max: 25 },
      alerts: false,
    };
    setSensor(mockSensor);

    // Generate mock historical data
    const mockHistorical = Array.from({ length: 50 }, (_, i) => ({
      timestamp: new Date(Date.now() - (50 - i) * 60000),
      value: 23.5 + (Math.random() - 0.5) * 2,
    }));
    setHistoricalData(mockHistorical);
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "offline":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "calibrating":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "temperature":
        return "ri-temp-cold-line";
      case "humidity":
        return "ri-water-percent-line";
      case "air_quality":
        return "ri-eye-line";
      case "motion":
        return "ri-pulse-line";
      default:
        return "ri-sensor-line";
    }
  };

  if (isLoading) {
    return (
      <PageTemplate
        title="Loading Sensor..."
        description="Please wait while we load sensor details"
        icon="ri-sensor-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="ri-loader-4-line text-6xl text-cyan-400 animate-spin mb-4"></i>
            <p className="text-white text-lg">Loading sensor information...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (!sensor) {
    return (
      <PageTemplate
        title="Sensor Not Found"
        description="The requested sensor could not be found"
        icon="ri-sensor-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="ri-error-warning-line text-6xl text-red-400 mb-4"></i>
            <p className="text-white text-lg mb-4">Sensor not found</p>
            <button
              onClick={() => router.push(`/warehouses/${warehouseId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Warehouse
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  const isWithinThreshold =
    sensor.threshold &&
    sensor.value >= sensor.threshold.min &&
    sensor.value <= sensor.threshold.max;

  return (
    <PageTemplate
      title={sensor.name}
      description={`IoT Sensor • ${sensor.type.replace("_", " ")} • ${sensor.warehouseId}`}
      icon="ri-sensor-line"
      actions={
        <div className="flex items-center gap-2">
          {isRealtimeConnected && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Live</span>
            </div>
          )}
          <button
            onClick={() => router.push(`/warehouses/${warehouseId}`)}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30"
          >
            <i className="ri-arrow-left-line mr-1"></i>
            Back
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Current Value</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {sensor.value.toFixed(2)}
                  <span className="text-lg text-[#9ca3af] ml-1">
                    {sensor.unit}
                  </span>
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  sensor.type === "temperature"
                    ? "bg-red-500/20 text-red-400"
                    : sensor.type === "humidity"
                      ? "bg-blue-500/20 text-blue-400"
                      : sensor.type === "air_quality"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                }`}
              >
                <i className={`${getTypeIcon(sensor.type)} text-3xl`}></i>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded text-xs font-medium border ${
                isWithinThreshold
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}
            >
              {isWithinThreshold ? "Within Range" : "Out of Range"}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Status</p>
                <p className="text-2xl font-bold text-white mt-1 capitalize">
                  {sensor.status}
                </p>
              </div>
              <i className="ri-checkbox-circle-line text-3xl text-green-400"></i>
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-medium border ${getStatusColor(sensor.status)}`}
            >
              {sensor.status}
            </span>
          </motion.div>

          {sensor.batteryLevel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[#9ca3af]">Battery Level</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {Math.round(sensor.batteryLevel)}%
                  </p>
                </div>
                <i className="ri-flashlight-line text-3xl text-purple-400"></i>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    sensor.batteryLevel > 50
                      ? "bg-green-400"
                      : sensor.batteryLevel > 20
                        ? "bg-yellow-400"
                        : "bg-red-400"
                  }`}
                  style={{ width: `${sensor.batteryLevel}%` }}
                />
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Last Reading</p>
                <p className="text-sm font-medium text-white mt-1">
                  {new Date(sensor.lastReading).toLocaleString()}
                </p>
              </div>
              <i className="ri-time-line text-3xl text-blue-400"></i>
            </div>
            <p className="text-xs text-[#9ca3af]">
              {Math.round(
                (Date.now() - new Date(sensor.lastReading).getTime()) / 1000,
              )}
              s ago
            </p>
          </motion.div>
        </div>

        {/* Threshold & Alerts */}
        {sensor.threshold && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-alert-line mr-2 text-yellow-400"></i>
              Threshold Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-[#9ca3af] mb-1">Minimum</p>
                <p className="text-xl font-bold text-white">
                  {sensor.threshold.min} {sensor.unit}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#9ca3af] mb-1">Current</p>
                <p
                  className={`text-xl font-bold ${
                    isWithinThreshold ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {sensor.value.toFixed(2)} {sensor.unit}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#9ca3af] mb-1">Maximum</p>
                <p className="text-xl font-bold text-white">
                  {sensor.threshold.max} {sensor.unit}
                </p>
              </div>
            </div>
            <div className="mt-4 w-full bg-white/10 rounded-full h-3 relative">
              <div
                className="absolute h-3 bg-blue-500/30 rounded-full"
                style={{
                  left: `${((sensor.threshold.min - (sensor.threshold.min - 5)) / (sensor.threshold.max + 5 - (sensor.threshold.min - 5))) * 100}%`,
                  width: `${((sensor.threshold.max - sensor.threshold.min) / (sensor.threshold.max + 5 - (sensor.threshold.min - 5))) * 100}%`,
                }}
              />
              <div
                className={`absolute h-3 rounded-full ${
                  isWithinThreshold ? "bg-green-400" : "bg-red-400"
                }`}
                style={{
                  left: `${((sensor.value - (sensor.threshold.min - 5)) / (sensor.threshold.max + 5 - (sensor.threshold.min - 5))) * 100}%`,
                  width: "4px",
                  transform: "translateX(-50%)",
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Historical Data Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <i className="ri-line-chart-line mr-2 text-cyan-400"></i>
            Historical Data (Last 50 Readings)
          </h3>
          <div className="h-64 flex items-end justify-between space-x-1">
            {historicalData
              .slice()
              .reverse()
              .map((reading, index) => {
                const maxValue = Math.max(
                  ...historicalData.map((r) => r.value),
                );
                const minValue = Math.min(
                  ...historicalData.map((r) => r.value),
                );
                const range = maxValue - minValue || 1;
                const height = ((reading.value - minValue) / range) * 100;

                return (
                  <div
                    key={index}
                    className="flex-1 bg-gradient-to-t from-cyan-500 to-blue-600 rounded-t hover:from-cyan-400 hover:to-blue-500 transition-all group relative"
                    style={{ height: `${height}%` }}
                    title={`${reading.value.toFixed(2)} ${sensor.unit} at ${reading.timestamp.toLocaleTimeString()}`}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {reading.value.toFixed(2)} {sensor.unit}
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="mt-4 flex justify-between text-xs text-[#9ca3af]">
            <span>
              {historicalData[
                historicalData.length - 1
              ]?.timestamp.toLocaleTimeString()}
            </span>
            <span>{historicalData[0]?.timestamp.toLocaleTimeString()}</span>
          </div>
        </motion.div>

        {/* Sensor Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-information-line mr-2 text-blue-400"></i>
              Sensor Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Sensor ID</span>
                <span className="text-white font-medium">{sensor.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Type</span>
                <span className="text-white font-medium capitalize">
                  {sensor.type.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Warehouse</span>
                <span className="text-white font-medium">
                  {sensor.warehouseId}
                </span>
              </div>
              {sensor.zoneId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">Zone</span>
                  <span className="text-white font-medium">
                    {sensor.zoneId}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Unit</span>
                <span className="text-white font-medium">{sensor.unit}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-settings-3-line mr-2 text-purple-400"></i>
              Configuration
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Alerts Enabled</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    sensor.alerts
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {sensor.alerts ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">
                  Real-time Updates
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    isRealtimeConnected
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {isRealtimeConnected ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Data Points</span>
                <span className="text-white font-medium">
                  {historicalData.length}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default SensorDetailPage;
