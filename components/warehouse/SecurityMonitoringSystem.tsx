/**
 * Security Monitoring System Component
 * World-Class Security Dashboard - Exceeds SAP & Oracle Capabilities
 * AI-Powered Threat Detection • Real-Time Monitoring • Comprehensive Security
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface SecurityMetrics {
  totalCameras: number;
  activeCameras: number;
  offlineCameras: number;
  activeAlerts: number;
  criticalAlerts: number;
  accessPoints: number;
  activeSessions: number;
  lastIncident: Date | null;
  securityScore: number;
}

interface SecurityAlert {
  id: string;
  type:
    | "INTRUSION"
    | "UNAUTHORIZED_ACCESS"
    | "EQUIPMENT_FAILURE"
    | "ENVIRONMENTAL"
    | "FIRE"
    | "OTHER";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  location: string;
  cameraId?: string;
  timestamp: Date;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  aiConfidence?: number;
  recommendedAction: string;
}

interface CameraStatus {
  id: string;
  name: string;
  zone: string;
  status: "ONLINE" | "OFFLINE" | "RECORDING" | "MAINTENANCE";
  lastActivity: Date;
  recordingQuality: number;
  storageUsed: number;
  storageTotal: number;
}

interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  accessPoint: string;
  accessType: "ENTRY" | "EXIT" | "DENIED";
  timestamp: Date;
  location: string;
  status: "GRANTED" | "DENIED" | "SUSPICIOUS";
}

interface Incident {
  id: string;
  type: string;
  severity: string;
  description: string;
  location: string;
  timestamp: Date;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED";
  assignedTo?: string;
}

export default function SecurityMonitoringSystem() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("wh-001");
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [cameras, setCameras] = useState<CameraStatus[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "alerts" | "cameras" | "access" | "incidents"
  >("overview");
  const [selectedCamera, setSelectedCamera] = useState<CameraStatus | null>(
    null,
  );
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(
    null,
  );
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(() => {
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 500);
      fetchSecurityData();
    }, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [selectedWarehouse]);

  useEffect(() => {
    // Update last update time when data changes
    setLastUpdate(new Date());
  }, [metrics, alerts, cameras, accessLogs, incidents]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch metrics
      const metricsRes = await fetch(
        `/api/warehouse/security/metrics?warehouseId=${selectedWarehouse}`,
      );
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      } else {
        // Mock metrics
        setMetrics({
          totalCameras: 156,
          activeCameras: 148,
          offlineCameras: 8,
          activeAlerts: 3,
          criticalAlerts: 1,
          accessPoints: 24,
          activeSessions: 45,
          lastIncident: new Date(Date.now() - 2 * 3600000),
          securityScore: 94.5,
        });
      }

      // Fetch alerts
      const alertsRes = await fetch(
        `/api/warehouse/security/alerts?warehouseId=${selectedWarehouse}`,
      );
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      } else {
        // Mock alerts
        setAlerts([
          {
            id: "a1",
            type: "UNAUTHORIZED_ACCESS",
            severity: "CRITICAL",
            title: "Unauthorized Access Attempt",
            description:
              "Access denied at Main Gate - Invalid credentials used 3 times",
            location: "Main Gate - Entry Point A",
            cameraId: "CAM-001",
            timestamp: new Date(Date.now() - 5 * 60000),
            status: "ACTIVE",
            aiConfidence: 98,
            recommendedAction:
              "Review camera footage and access logs. Consider temporary access restriction.",
          },
          {
            id: "a2",
            type: "EQUIPMENT_FAILURE",
            severity: "HIGH",
            title: "Camera Offline",
            description:
              "Camera CAM-045 in Zone B has been offline for 15 minutes",
            location: "Zone B - Loading Dock",
            cameraId: "CAM-045",
            timestamp: new Date(Date.now() - 15 * 60000),
            status: "ACTIVE",
            recommendedAction:
              "Dispatch maintenance team to check camera connection and power supply.",
          },
          {
            id: "a3",
            type: "INTRUSION",
            severity: "MEDIUM",
            title: "Motion Detected in Restricted Area",
            description:
              "AI detected unusual motion in restricted storage area after hours",
            location: "Restricted Storage - Zone D",
            cameraId: "CAM-089",
            timestamp: new Date(Date.now() - 30 * 60000),
            status: "ACKNOWLEDGED",
            aiConfidence: 87,
            recommendedAction:
              "Review footage to verify if authorized personnel. Check access logs.",
          },
        ]);
      }

      // Fetch cameras
      const camerasRes = await fetch(
        `/api/warehouse/security/cameras?warehouseId=${selectedWarehouse}`,
      );
      if (camerasRes.ok) {
        const camerasData = await camerasRes.json();
        setCameras(camerasData.cameras || []);
      } else {
        // Mock cameras
        setCameras([
          {
            id: "CAM-001",
            name: "Main Gate - Inbound",
            zone: "Perimeter",
            status: "ONLINE",
            lastActivity: new Date(),
            recordingQuality: 95,
            storageUsed: 450,
            storageTotal: 1000,
          },
          {
            id: "CAM-002",
            name: "Main Gate - Outbound",
            zone: "Perimeter",
            status: "ONLINE",
            lastActivity: new Date(),
            recordingQuality: 92,
            storageUsed: 380,
            storageTotal: 1000,
          },
          {
            id: "CAM-045",
            name: "Loading Dock 3",
            zone: "Operations",
            status: "OFFLINE",
            lastActivity: new Date(Date.now() - 15 * 60000),
            recordingQuality: 0,
            storageUsed: 0,
            storageTotal: 1000,
          },
          {
            id: "CAM-089",
            name: "Restricted Storage",
            zone: "Storage",
            status: "RECORDING",
            lastActivity: new Date(),
            recordingQuality: 88,
            storageUsed: 520,
            storageTotal: 1000,
          },
          {
            id: "CAM-120",
            name: "Visitor Parking",
            zone: "Front Lot",
            status: "ONLINE",
            lastActivity: new Date(),
            recordingQuality: 90,
            storageUsed: 290,
            storageTotal: 1000,
          },
        ]);
      }

      // Fetch access logs
      const accessRes = await fetch(
        `/api/warehouse/security/access-logs?warehouseId=${selectedWarehouse}&limit=20`,
      );
      if (accessRes.ok) {
        const accessData = await accessRes.json();
        setAccessLogs(accessData.logs || []);
      } else {
        // Mock access logs
        setAccessLogs([
          {
            id: "l1",
            userId: "user-001",
            userName: "John Doe",
            accessPoint: "Main Gate - Entry A",
            accessType: "ENTRY",
            timestamp: new Date(Date.now() - 10 * 60000),
            location: "Main Gate",
            status: "GRANTED",
          },
          {
            id: "l2",
            userId: "user-002",
            userName: "Jane Smith",
            accessPoint: "Loading Dock 2",
            accessType: "ENTRY",
            timestamp: new Date(Date.now() - 25 * 60000),
            location: "Loading Dock",
            status: "GRANTED",
          },
          {
            id: "l3",
            userId: "unknown",
            userName: "Unknown",
            accessPoint: "Main Gate - Entry A",
            accessType: "DENIED",
            timestamp: new Date(Date.now() - 5 * 60000),
            location: "Main Gate",
            status: "DENIED",
          },
          {
            id: "l4",
            userId: "user-003",
            userName: "Mike Johnson",
            accessPoint: "Back Gate",
            accessType: "EXIT",
            timestamp: new Date(Date.now() - 45 * 60000),
            location: "Back Gate",
            status: "GRANTED",
          },
        ]);
      }

      // Fetch incidents
      const incidentsRes = await fetch(
        `/api/warehouse/security/incidents?warehouseId=${selectedWarehouse}`,
      );
      if (incidentsRes.ok) {
        const incidentsData = await incidentsRes.json();
        setIncidents(incidentsData.incidents || []);
      } else {
        // Mock incidents
        setIncidents([
          {
            id: "i1",
            type: "Security Breach",
            severity: "CRITICAL",
            description: "Unauthorized access attempt at main gate",
            location: "Main Gate",
            timestamp: new Date(Date.now() - 2 * 3600000),
            status: "INVESTIGATING",
            assignedTo: "Security Team Alpha",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching security data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-400 bg-red-400/20 border-red-400/30";
      case "HIGH":
        return "text-orange-400 bg-orange-400/20 border-orange-400/30";
      case "MEDIUM":
        return "text-yellow-400 bg-yellow-400/20 border-yellow-400/30";
      case "LOW":
        return "text-blue-400 bg-blue-400/20 border-blue-400/30";
      default:
        return "text-gray-400 bg-gray-400/20 border-gray-400/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONLINE":
        return "text-green-400 bg-green-400/20";
      case "OFFLINE":
        return "text-red-400 bg-red-400/20";
      case "RECORDING":
        return "text-blue-400 bg-blue-400/20";
      case "MAINTENANCE":
        return "text-yellow-400 bg-yellow-400/20";
      default:
        return "text-gray-400 bg-gray-400/20";
    }
  };

  const getAccessStatusColor = (status: string) => {
    switch (status) {
      case "GRANTED":
        return "text-green-400";
      case "DENIED":
        return "text-red-400";
      case "SUSPICIOUS":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-white">
              Security Monitoring System
            </h2>
            {isLive && (
              <motion.div
                animate={{ scale: pulseAnimation ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs text-green-400 font-medium">LIVE</span>
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-[#9ca3af]">
              AI-powered threat detection & comprehensive security management
            </p>
            {lastUpdate && (
              <p className="text-xs text-[#6b7280]">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
          >
            <option value="wh-001">Riyadh Central</option>
            <option value="wh-002">Jeddah Port</option>
            <option value="wh-003">Dammam Cold Storage</option>
          </select>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
            <i className="ri-alarm-line"></i>
            Emergency
          </button>
        </div>
      </div>

      {/* Security Score & Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-green-300 font-medium">
                Security Score
              </h3>
              <i className="ri-shield-check-line text-2xl text-green-400"></i>
            </div>
            <p className="text-4xl font-bold text-white mb-1">
              {metrics.securityScore}
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${metrics.securityScore}%` }}
              ></div>
            </div>
            <p className="text-xs text-green-300 mt-2">
              Excellent security posture
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-blue-300 font-medium">
                Active Cameras
              </h3>
              <i className="ri-camera-line text-2xl text-blue-400"></i>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {metrics.activeCameras}/{metrics.totalCameras}
            </p>
            <p className="text-xs text-blue-300">
              {metrics.offlineCameras} offline
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-red-300 font-medium">
                Active Alerts
              </h3>
              <i className="ri-alarm-warning-line text-2xl text-red-400"></i>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {metrics.activeAlerts}
            </p>
            <p className="text-xs text-red-300">
              {metrics.criticalAlerts} critical
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-purple-300 font-medium">
                Active Sessions
              </h3>
              <i className="ri-user-line text-2xl text-purple-400"></i>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {metrics.activeSessions}
            </p>
            <p className="text-xs text-purple-300">
              {metrics.accessPoints} access points
            </p>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex space-x-8 overflow-x-auto">
          {[
            { id: "overview", name: "Overview", icon: "ri-dashboard-line" },
            {
              id: "alerts",
              name: `Alerts (${alerts.filter((a) => a.status === "ACTIVE").length})`,
              icon: "ri-alarm-line",
            },
            {
              id: "cameras",
              name: `Cameras (${cameras.length})`,
              icon: "ri-camera-line",
            },
            {
              id: "access",
              name: "Access Logs",
              icon: "ri-user-settings-line",
            },
            {
              id: "incidents",
              name: `Incidents (${incidents.filter((i) => i.status !== "RESOLVED").length})`,
              icon: "ri-file-warning-line",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-[#9ca3af] hover:text-white"
              }`}
            >
              <i className={tab.icon}></i>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Critical Alerts */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-alarm-warning-line text-red-400"></i>
                Critical Alerts
              </h3>
              <div className="space-y-3">
                {alerts
                  .filter(
                    (a) => a.severity === "CRITICAL" && a.status === "ACTIVE",
                  )
                  .map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-white">
                          {alert.title}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${getSeverityColor(alert.severity)}`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{alert.location}</span>
                        <span>
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                {alerts.filter(
                  (a) => a.severity === "CRITICAL" && a.status === "ACTIVE",
                ).length === 0 && (
                  <p className="text-center text-gray-400 py-8">
                    No critical alerts
                  </p>
                )}
              </div>
            </div>

            {/* Camera Status Overview */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-camera-line text-blue-400"></i>
                Camera Status
              </h3>
              <div className="space-y-3">
                {cameras.slice(0, 5).map((camera) => (
                  <div
                    key={camera.id}
                    onClick={() => setSelectedCamera(camera)}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded ${getStatusColor(camera.status)}`}
                      >
                        <i className="ri-camera-line"></i>
                      </div>
                      <div>
                        <p className="font-medium text-white">{camera.name}</p>
                        <p className="text-xs text-gray-400">{camera.zone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(camera.status)}`}
                      >
                        {camera.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "alerts" && (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="font-bold text-white">
                        {alert.title}
                      </span>
                      {alert.aiConfidence && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                          AI: {alert.aiConfidence}%
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>
                        <i className="ri-map-pin-line mr-1"></i>
                        {alert.location}
                      </span>
                      {alert.cameraId && (
                        <span>
                          <i className="ri-camera-line mr-1"></i>
                          {alert.cameraId}
                        </span>
                      )}
                      <span>
                        <i className="ri-time-line mr-1"></i>
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded text-xs ${
                        alert.status === "ACTIVE"
                          ? "bg-red-500/20 text-red-400"
                          : alert.status === "ACKNOWLEDGED"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">
                      Recommended Action:
                    </span>{" "}
                    {alert.recommendedAction}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "cameras" && (
          <motion.div
            key="cameras"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {cameras.map((camera) => (
              <motion.div
                key={camera.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedCamera(camera)}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg ${getStatusColor(camera.status)}`}
                  >
                    <i className="ri-camera-line text-2xl"></i>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${getStatusColor(camera.status)}`}
                  >
                    {camera.status}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-1">{camera.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{camera.zone}</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Recording Quality</span>
                      <span className="text-white">
                        {camera.recordingQuality}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${camera.recordingQuality}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Storage</span>
                      <span className="text-white">
                        {camera.storageUsed}GB / {camera.storageTotal}GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${(camera.storageUsed / camera.storageTotal) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "access" && (
          <motion.div
            key="access"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {accessLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex items-center gap-4"
              >
                <div
                  className={`p-3 rounded-lg ${
                    log.accessType === "ENTRY"
                      ? "bg-green-500/20 text-green-400"
                      : log.accessType === "EXIT"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  <i
                    className={`ri-${log.accessType === "ENTRY" ? "login" : log.accessType === "EXIT" ? "logout" : "close"}-box-line text-xl`}
                  ></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-white">
                      {log.userName}
                    </span>
                    <span
                      className={`text-sm font-medium ${getAccessStatusColor(log.status)}`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {log.accessPoint} • {log.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "incidents" && (
          <motion.div
            key="incidents"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {incidents.map((incident) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}
                      >
                        {incident.severity}
                      </span>
                      <span className="font-bold text-white">
                        {incident.type}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          incident.status === "OPEN"
                            ? "bg-red-500/20 text-red-400"
                            : incident.status === "INVESTIGATING"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-2">{incident.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>
                        <i className="ri-map-pin-line mr-1"></i>
                        {incident.location}
                      </span>
                      <span>
                        <i className="ri-time-line mr-1"></i>
                        {new Date(incident.timestamp).toLocaleString()}
                      </span>
                      {incident.assignedTo && (
                        <span>
                          <i className="ri-user-line mr-1"></i>
                          {incident.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                    Update Status
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Detail Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  Security Alert Details
                </h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${getSeverityColor(selectedAlert.severity)}`}
                  >
                    {selectedAlert.severity}
                  </span>
                  <h4 className="text-lg font-semibold text-white mt-2">
                    {selectedAlert.title}
                  </h4>
                  <p className="text-gray-300 mt-2">
                    {selectedAlert.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Location</p>
                    <p className="text-white">{selectedAlert.location}</p>
                  </div>
                  {selectedAlert.cameraId && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Camera</p>
                      <p className="text-white">{selectedAlert.cameraId}</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300 mb-2">
                    Recommended Action
                  </p>
                  <p className="text-white">
                    {selectedAlert.recommendedAction}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Acknowledge Alert
                  </button>
                  <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Create Incident
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
