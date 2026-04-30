/**
 * Edge Computing Page
 *
 * Edge device management and offline capabilities
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Cpu,
  Wifi,
  WifiOff,
  Zap,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Download,
  Upload,
  Activity,
  AlertCircle,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import PageTemplate from "@/components/PageTemplate";
import type {
  EdgeDevice,
  EdgeApplication,
  EdgeDecision,
} from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";

export default function EdgeComputingPage() {
  const [devices, setDevices] = useState<EdgeDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<EdgeDevice | null>(null);
  const [applications, setApplications] = useState<EdgeApplication[]>([]);
  const [viewMode, setViewMode] = useState<
    "DEVICES" | "APPLICATIONS" | "DECISIONS"
  >("DEVICES");

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await apiFetch("/api/transportation/edge-computing");
      const data = await response.json();
      if (data.devices) {
        setDevices(data.devices);
        if (data.devices.length > 0 && !selectedDevice) {
          setSelectedDevice(data.devices[0]);
          loadApplications(data.devices[0].id);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading devices", err, {
        module: "transportation",
        service: "edge-computing",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "edge-computing",
      });
    }
  };

  const loadApplications = async (deviceId: string) => {
    try {
      const response = await apiFetch(
        `/api/transportation/edge-computing?deviceId=${deviceId}`,
      );
      const data = await response.json();
      if (data.applications) {
        setApplications(data.applications);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading applications", err, {
        module: "transportation",
        service: "edge-computing",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "edge-computing",
      });
    }
  };

  const updateDeviceStatus = async (
    deviceId: string,
    status: EdgeDevice["status"],
  ) => {
    try {
      await apiFetch("/api/transportation/edge-computing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-status",
          deviceId,
          status,
        }),
      });
      loadDevices();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error updating status", err, {
        module: "transportation",
        service: "edge-computing",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "edge-computing",
      });
    }
  };

  return (
    <PageTemplate
      title="Edge Computing"
      description="Edge device management with offline capabilities and local decision-making"
      icon="ri-server-line"
      stats={[
        { label: "Devices", value: devices.length, icon: "ri-server-line" },
        {
          label: "Online",
          value: devices.filter((d) => d.status === "ONLINE").length,
          icon: "ri-wifi-line",
        },
        {
          label: "Applications",
          value: applications.length,
          icon: "ri-apps-line",
        },
        {
          label: "Offline Capable",
          value: devices.filter((d) => d.status === "OFFLINE").length,
          icon: "ri-wifi-off-line",
        },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          {[
            { id: "DEVICES", label: "Devices", icon: Server },
            { id: "APPLICATIONS", label: "Applications", icon: Cpu },
            { id: "DECISIONS", label: "Decisions", icon: Activity },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                viewMode === mode.id
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <mode.icon className="w-4 h-4 inline mr-2" />
              {mode.label}
            </button>
          ))}
        </div>

        {/* Devices View */}
        {viewMode === "DEVICES" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onClick={() => {
                  setSelectedDevice(device);
                  loadApplications(device.id);
                }}
                onStatusChange={(status) =>
                  updateDeviceStatus(device.id, status)
                }
              />
            ))}
          </div>
        )}

        {/* Applications View */}
        {viewMode === "APPLICATIONS" && selectedDevice && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold mb-4">
                Applications on {selectedDevice.name}
              </h3>
              <div className="space-y-3">
                {applications.map((app) => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Decisions View */}
        {viewMode === "DECISIONS" && (
          <EdgeDecisionLog selectedDevice={selectedDevice} />
        )}
      </div>
    </PageTemplate>
  );
}

function DeviceCard({
  device,
  onClick,
  onStatusChange,
}: {
  device: EdgeDevice;
  onClick: () => void;
  onStatusChange: (status: EdgeDevice["status"]) => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <Server className="w-6 h-6 text-white" />
        </div>
        <StatusBadge status={device.status} />
      </div>
      <h4 className="font-bold mb-2">{device.name}</h4>
      <p className="text-sm text-gray-500 mb-4">{device.type}</p>
      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Capabilities</span>
          <span className="font-medium">{device.capabilities.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Last Seen</span>
          <span className="font-medium">
            {new Date(device.lastSeen).toLocaleTimeString()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        {device.status === "ONLINE" ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange("OFFLINE");
            }}
            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium flex items-center justify-center gap-2"
          >
            <WifiOff className="w-4 h-4" />
            Go Offline
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange("ONLINE");
            }}
            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium flex items-center justify-center gap-2"
          >
            <Wifi className="w-4 h-4" />
            Go Online
          </button>
        )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: EdgeDevice["status"] }) {
  const colorClasses = {
    ONLINE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    OFFLINE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    DEGRADED:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    MAINTENANCE:
      "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300",
  };

  return (
    <span
      className={`px-3 py-1 rounded text-sm font-medium ${colorClasses[status]}`}
    >
      {status}
    </span>
  );
}

function ApplicationCard({ application }: { application: EdgeApplication }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-bold">{application.name}</h4>
          <p className="text-sm text-gray-500">v{application.version}</p>
        </div>
        <StatusBadge status={application.status as any} />
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">CPU</span>
          <p className="font-medium">{application.resources.cpu}%</p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Memory</span>
          <p className="font-medium">{application.resources.memory}MB</p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Storage</span>
          <p className="font-medium">{application.resources.storage}MB</p>
        </div>
      </div>
    </div>
  );
}

function EdgeDecisionLog({
  selectedDevice,
}: {
  selectedDevice: EdgeDevice | null;
}) {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [filter, setFilter] = useState<
    "ALL" | "SUCCESS" | "FAILURE" | "WARNING"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadDecisions();
  }, [selectedDevice, filter]);

  const loadDecisions = async () => {
    // Demo data
    const demoDecisions = [
      {
        id: "dec-1",
        deviceId: selectedDevice?.id || "device-1",
        timestamp: new Date("2024-01-20T14:30:00"),
        decision: "ROUTE_OPTIMIZATION",
        status: "SUCCESS",
        input: {
          currentLocation: "24.7136,46.6753",
          destination: "24.7589,46.6753",
        },
        output: {
          optimizedRoute: "Route A",
          estimatedTime: "45 min",
          distance: "12.5 km",
        },
        executionTime: 125,
        confidence: 0.95,
      },
      {
        id: "dec-2",
        deviceId: selectedDevice?.id || "device-1",
        timestamp: new Date("2024-01-20T14:25:00"),
        decision: "LOAD_BALANCING",
        status: "SUCCESS",
        input: { currentLoad: 75, maxCapacity: 100 },
        output: {
          action: "CONTINUE",
          recommendation: "Load within safe limits",
        },
        executionTime: 45,
        confidence: 0.98,
      },
      {
        id: "dec-3",
        deviceId: selectedDevice?.id || "device-1",
        timestamp: new Date("2024-01-20T14:20:00"),
        decision: "TEMPERATURE_CONTROL",
        status: "WARNING",
        input: { currentTemp: 8.5, targetTemp: 2, threshold: 5 },
        output: {
          action: "ALERT",
          recommendation: "Temperature rising, check cooling system",
        },
        executionTime: 32,
        confidence: 0.87,
      },
      {
        id: "dec-4",
        deviceId: selectedDevice?.id || "device-1",
        timestamp: new Date("2024-01-20T14:15:00"),
        decision: "NETWORK_CONNECTIVITY",
        status: "FAILURE",
        input: { connectionStatus: "OFFLINE", lastSync: "2024-01-20T14:00:00" },
        output: {
          action: "FALLBACK",
          recommendation: "Using cached data, sync when online",
        },
        executionTime: 15,
        confidence: 0.92,
      },
    ];
    setDecisions(
      demoDecisions.filter((d) => filter === "ALL" || d.status === filter),
    );
  };

  const filteredDecisions = decisions.filter((d) =>
    d.decision.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return CheckCircle;
      case "FAILURE":
        return XCircle;
      case "WARNING":
        return AlertTriangle;
      default:
        return Activity;
    }
  };  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800";
      case "FAILURE":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800";
    }
  };  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Edge Decision Log
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="WARNING">Warning</option>
            <option value="FAILURE">Failure</option>
          </select>
        </div>
      </div>      <div className="space-y-4">
        {filteredDecisions.map((decision) => {
          const StatusIcon = getStatusIcon(decision.status);
          return (
            <motion.div
              key={decision.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`border rounded-lg p-4 ${getStatusColor(decision.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <StatusIcon className="w-5 h-5" />
                  <div>
                    <div className="font-bold">
                      {decision.decision.replace(/_/g, " ")}
                    </div>
                    <div className="text-sm opacity-80 flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3" />
                      {decision.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">Execution Time</div>
                  <div className="font-bold">{decision.executionTime}ms</div>
                </div>
              </div>              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                  <div className="text-xs font-medium mb-2 opacity-80">
                    Input
                  </div>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(decision.input, null, 2)}
                  </pre>
                </div>
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                  <div className="text-xs font-medium mb-2 opacity-80">
                    Output
                  </div>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(decision.output, null, 2)}
                  </pre>
                </div>
              </div>              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-80">Confidence:</span>
                  <div className="w-24 bg-white/50 dark:bg-black/20 rounded-full h-2">
                    <div
                      className="bg-current h-2 rounded-full"
                      style={{ width: `${decision.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {(decision.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs opacity-80">
                  Device: {decision.deviceId}
                </div>
              </div>
            </motion.div>
          );
        })}
        {filteredDecisions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No decisions found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
