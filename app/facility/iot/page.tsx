"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { format } from "date-fns";
import { iotManager } from "@/lib/services/iot/iotManager";
import type { IoTDevice, IoTDeviceStatus } from "@/types/iot";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

function FacilityIoTContent() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "online" | "offline" | "maintenance" | "error" | "degraded"
  >("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      // Fetch from API
      const facilityId = "facility-1"; // In real app, get from context/params
      const response = await fetch(
        `/api/facility/iot/devices?facilityId=${facilityId}&includeData=true`,
      );
      const result = await response.json();

      if (result.success && result.data) {
        setDevices(result.data);
      } else {
        // Fallback to empty array
        setDevices([]);
      }
    } catch (error) {
      console.error("Error loading IoT devices:", error);
      // Fallback to empty array on error
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  // Legacy mock data function (kept for reference, not used)
  const getMockDevices = (): IoTDevice[] => [
    {
      id: "1",
      name: "Temperature Sensor - Zone A",
      type: "sensor",
      category: "environmental",
      model: "TempSense Pro",
      manufacturer: "IoT Solutions Inc.",
      serialNumber: "TS-2024-001",
      firmwareVersion: "1.2.3",
      location: {
        facility: "facility-1",
        zone: "Zone A",
        coordinates: { lat: 10, lng: 20 },
      },
      connectivity: {
        protocol: "wifi",
        networkId: "wifi-network-1",
        signalStrength: -65,
        bandwidth: 100,
        latency: 10,
      },
      power: { source: "mains", powerConsumption: 5 },
      specifications: {
        range: { min: -40, max: 85, unit: "°C" },
        accuracy: 0.5,
        operatingTemperature: { min: -40, max: 85 },
      },
      calibration: {
        lastCalibrated: new Date("2024-01-01"),
        nextCalibration: new Date("2025-01-01"),
        calibrationHistory: [],
        isCalibrated: true,
      },
      maintenance: {
        lastMaintenance: new Date("2024-01-01"),
        nextMaintenance: new Date("2024-07-01"),
        maintenanceHistory: [],
      },
      status: {
        operational: "online",
        health: 95,
        lastSeen: new Date(),
        uptime: 86400,
        errors: [],
      },
      security: {
        encrypted: true,
        authenticated: true,
        lastSecurityScan: new Date(),
        vulnerabilities: [],
      },
      aiCapabilities: {
        edgeProcessing: false,
        modelDeployment: false,
        autonomousOperation: false,
        predictiveAnalytics: false,
      },
      tags: ["temperature", "zone-a"],
      metadata: { notes: "Main temperature monitoring" },
      tenantId: "tenant-1",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date(),
    },
    {
      id: "2",
      name: "Fire Detection System",
      type: "sensor",
      category: "safety",
      model: "FireAlert 3000",
      manufacturer: "Safety Systems Co.",
      serialNumber: "FA-2024-002",
      firmwareVersion: "2.1.0",
      location: {
        facility: "facility-1",
        zone: "Zone B",
        coordinates: { lat: 30, lng: 40 },
      },
      connectivity: {
        protocol: "ethernet",
        networkId: "ethernet-network-1",
        signalStrength: -50,
        bandwidth: 1000,
        latency: 2,
      },
      power: { source: "mains", powerConsumption: 10 },
      specifications: {
        range: { min: 0, max: 100, unit: "%" },
        accuracy: 1,
        operatingTemperature: { min: 0, max: 60 },
      },
      calibration: {
        lastCalibrated: new Date("2024-02-01"),
        nextCalibration: new Date("2025-02-01"),
        calibrationHistory: [],
        isCalibrated: true,
      },
      maintenance: {
        lastMaintenance: new Date("2024-02-01"),
        nextMaintenance: new Date("2024-08-01"),
        maintenanceHistory: [],
      },
      status: {
        operational: "online",
        health: 100,
        lastSeen: new Date(),
        uptime: 172800,
        errors: [],
      },
      security: {
        encrypted: true,
        authenticated: true,
        lastSecurityScan: new Date(),
        vulnerabilities: [],
      },
      aiCapabilities: {
        edgeProcessing: false,
        modelDeployment: false,
        autonomousOperation: false,
        predictiveAnalytics: false,
      },
      tags: ["fire-safety", "critical"],
      metadata: { notes: "Primary fire detection" },
      tenantId: "tenant-1",
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date(),
    },
    {
      id: "3",
      name: "HVAC Controller",
      type: "actuator",
      category: "hvac",
      model: "HVAC Master",
      manufacturer: "Climate Control Systems",
      serialNumber: "HVAC-2024-003",
      location: {
        facility: "facility-1",
        zone: "Zone C",
        coordinates: { lat: 50, lng: 60 },
      },
      connectivity: {
        protocol: "wifi",
        networkId: "wifi-network-1",
        signalStrength: -70,
        bandwidth: 50,
        latency: 20,
      },
      power: { source: "mains", powerConsumption: 8 },
      status: {
        operational: "offline",
        health: 45,
        lastSeen: new Date(Date.now() - 3600000),
        uptime: 0,
        errors: [
          {
            timestamp: new Date(),
            code: "CONN_LOST",
            message: "Connection lost",
            severity: "high",
          },
        ],
      },
      security: {
        encrypted: true,
        authenticated: true,
        lastSecurityScan: new Date(),
        vulnerabilities: [],
      },
      capabilities: {
        dataCollection: true,
        edgeProcessing: true,
        aiInference: false,
      },
      metadata: {
        tags: ["hvac", "automation"],
        notes: "HVAC system controller",
      },
      tenantId: "tenant-1",
      createdAt: new Date("2024-03-10"),
      updatedAt: new Date(),
    },
  ];

  const getDeviceStatus = (device: IoTDevice): string => {
    if (typeof device.status === "object") {
      return device.status.operational || "offline";
    }
    return device.status || "offline";
  };

  const getDeviceHealth = (device: IoTDevice): number => {
    if (typeof device.status === "object") {
      return device.status.health || 0;
    }
    return 100; // Default health if status is string
  };

  const filteredDevices =
    filter === "all"
      ? devices
      : devices.filter((d) => getDeviceStatus(d) === filter);

  const stats = {
    total: devices.length,
    online: devices.filter((d) => getDeviceStatus(d) === "online").length,
    offline: devices.filter((d) => getDeviceStatus(d) === "offline").length,
    maintenance: devices.filter((d) => getDeviceStatus(d) === "maintenance")
      .length,
    averageHealth:
      devices.length > 0
        ? Math.round(
            devices.reduce((sum, d) => sum + getDeviceHealth(d), 0) /
              devices.length,
          )
        : 0,
  };

  const statusDistribution = [
    { name: "Online", value: stats.online, color: "#10b981" },
    { name: "Offline", value: stats.offline, color: "#ef4444" },
    { name: "Maintenance", value: stats.maintenance, color: "#f59e0b" },
  ];

  const categoryDistribution = Array.from(
    devices.reduce((acc, d) => {
      acc.set(d.category, (acc.get(d.category) || 0) + 1);
      return acc;
    }, new Map<string, number>()),
  ).map(([category, count]) => ({ category, count }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "offline":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "maintenance":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return "text-green-400";
    if (health >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <PageTemplate
        title="IoT & Smart Buildings"
        icon="ri-sensor-line"
        description="IoT device management and monitoring"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="IoT & Smart Buildings"
      description="Manage and monitor IoT devices across facilities with real-time data collection and automation"
      icon="ri-sensor-line"
      stats={[
        {
          label: "Total Devices",
          value: stats.total,
          icon: "ri-sensor-line",
          tooltip: "Total IoT devices",
        },
        {
          label: "Online",
          value: stats.online,
          icon: "ri-checkbox-circle-line",
          tooltip: "Online devices",
        },
        {
          label: "Average Health",
          value: `${stats.averageHealth}%`,
          icon: "ri-heart-pulse-line",
          tooltip: "Average device health",
        },
        {
          label: "Offline",
          value: stats.offline,
          icon: "ri-close-circle-line",
          tooltip: "Offline devices",
        },
      ]}
      actions={
        <button
          onClick={() => (window.location.href = "/iot")}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <i className="ri-settings-3-line mr-2"></i>
          IoT Management
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        {(["all", "online", "offline", "maintenance"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="category" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                }}
              />
              <Bar dataKey="count" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">IoT Devices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Device Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Health
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Last Seen
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredDevices.map((device) => (
                <tr
                  key={device.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white">
                    {device.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {device.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {device.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(getDeviceStatus(device))}`}
                    >
                      {getDeviceStatus(device) === "online"
                        ? "✓ Online"
                        : getDeviceStatus(device) === "offline"
                          ? "✗ Offline"
                          : "🔧 Maintenance"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            getDeviceHealth(device) >= 80
                              ? "bg-green-500"
                              : getDeviceHealth(device) >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${getDeviceHealth(device)}%` }}
                        ></div>
                      </div>
                      <span
                        className={`text-sm font-semibold w-12 ${getHealthColor(getDeviceHealth(device))}`}
                      >
                        {getDeviceHealth(device)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {device.location?.zone ||
                      device.location?.facility ||
                      "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {typeof device.status === "object" && device.status.lastSeen
                      ? format(
                          new Date(device.status.lastSeen),
                          "MMM dd, HH:mm",
                        )
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedDevice(device);
                        setShowDetailModal(true);
                      }}
                      className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded text-sm hover:bg-cyan-500/30 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDevice && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedDevice.name}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Device Type
              </label>
              <p className="text-white">{selectedDevice.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Category
              </label>
              <p className="text-white">{selectedDevice.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Model</label>
              <p className="text-white">{selectedDevice.model}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Manufacturer
              </label>
              <p className="text-white">{selectedDevice.manufacturer}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Serial Number
              </label>
              <p className="text-white font-mono">
                {selectedDevice.serialNumber}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Status
              </label>
              <p className="text-white">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(getDeviceStatus(selectedDevice))}`}
                >
                  {getDeviceStatus(selectedDevice)}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Health
              </label>
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        getDeviceHealth(selectedDevice) >= 80
                          ? "bg-green-500"
                          : getDeviceHealth(selectedDevice) >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${getDeviceHealth(selectedDevice)}%` }}
                    ></div>
                  </div>
                  <span
                    className={`text-white font-semibold w-16 ${getHealthColor(getDeviceHealth(selectedDevice))}`}
                  >
                    {getDeviceHealth(selectedDevice)}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Location
              </label>
              <p className="text-white">
                {selectedDevice.location?.zone ||
                  selectedDevice.location?.facility ||
                  "N/A"}
              </p>
            </div>
            {selectedDevice.connectivity && (
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Connectivity
                </label>
                <p className="text-white">
                  {selectedDevice.connectivity.protocol?.toUpperCase() || "N/A"}
                </p>
              </div>
            )}
            {selectedDevice.power && (
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Power Source
                </label>
                <p className="text-white">
                  {selectedDevice.power.source || "N/A"}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-300">
                Last Seen
              </label>
              <p className="text-white">
                {typeof selectedDevice.status === "object" &&
                selectedDevice.status.lastSeen
                  ? format(
                      new Date(selectedDevice.status.lastSeen),
                      "MMMM dd, yyyy HH:mm:ss",
                    )
                  : "N/A"}
              </p>
            </div>
            {typeof selectedDevice.status === "object" &&
              selectedDevice.status.errors &&
              selectedDevice.status.errors.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Errors
                  </label>
                  <ul className="list-disc list-inside text-red-400 mt-1">
                    {selectedDevice.status.errors.map(
                      (error: any, idx: number) => (
                        <li key={idx}>{error.message || error}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            <div className="flex gap-3 pt-4">
              <button className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors">
                View Details
              </button>
              <button className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors">
                Configure
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}

export default function FacilityIoTPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="IoT Devices"
          description="Manage and monitor IoT devices, sensors, and connected equipment"
          icon="ri-sensor-line"
        >
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Error Loading IoT Devices
              </h2>
              <p className="text-gray-500">
                Something went wrong. Please refresh the page.
              </p>
            </div>
          </div>
        </PageTemplate>
      }
    >
      <FacilityIoTContent />
    </ErrorBoundary>
  );
}
