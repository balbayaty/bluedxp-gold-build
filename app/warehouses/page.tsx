"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import AIVisionOverlay from "@/components/warehouse/AIVisionOverlay";
import EmergencyResponseCenter from "@/components/warehouse/EmergencyResponseCenter";
import SustainabilityDashboard from "@/components/wms/SustainabilityDashboard";
import { Warehouse, IoTSensor } from "@/types/warehouse-management";

import SmartInventoryManagement from "@/components/warehouse/SmartInventoryManagement";
import SecurityMonitoringSystem from "@/components/warehouse/SecurityMonitoringSystem";
import WarehousePerformanceComparison from "@/components/warehouse/WarehousePerformanceComparison";

const WarehousesPage: React.FC = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [sortBy, setSortBy] = useState<
    "name" | "capacity" | "performance" | "uptime"
  >("name");

  useEffect(() => {
    initializeWarehouseData();

    // Set up real-time IoT updates
    const interval = setInterval(() => {
      updateIoTData();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Set default selected warehouse when warehouses are loaded
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouse) {
      setSelectedWarehouse(warehouses[0]);
    }
  }, [warehouses]);

  const initializeWarehouseData = async () => {
    try {
      const r = await fetch("/api/warehouse/config");
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j.items) && j.items.length) {
          setWarehouses(j.items);
          setSensors([]);
          return;
        }
      }
    } catch {}

    // Initialize warehouse data with IoT integration
    const mockWarehouses: Warehouse[] = [
      {
        id: "wh-001",
        name: "Riyadh Central Distribution Center",
        location: {
          address: "King Fahd Industrial City",
          city: "Riyadh",
          country: "Saudi Arabia",
          coordinates: { lat: 24.7136, lng: 46.6753 },
        },
        type: "main",
        status: "operational",
        capacity: {
          total: 50000,
          used: 42500,
          available: 7500,
          unit: "m³",
        },
        zones: [],
        environmental: {
          temperature: 23.2,
          humidity: 48,
          airQuality: 85,
          lighting: 92,
          noise: 45,
        },
        security: {
          cameras: 156,
          accessPoints: 24,
          alarms: 8,
          lastIncident: null,
        },
        iot: {
          sensors: 234,
          connectedDevices: 189,
          networkStatus: "excellent",
          dataPoints: 15600,
        },
        performance: {
          throughput: 94.5,
          accuracy: 99.7,
          efficiency: 91.2,
          uptime: 99.9,
        },
        staff: {
          total: 45,
          onDuty: 32,
          shift: "morning",
        },
      },
      {
        id: "wh-002",
        name: "Jeddah Port Facility",
        location: {
          address: "Islamic Port of Jeddah",
          city: "Jeddah",
          country: "Saudi Arabia",
          coordinates: { lat: 21.4858, lng: 39.1925 },
        },
        type: "distribution",
        status: "operational",
        capacity: {
          total: 35000,
          used: 28900,
          available: 6100,
          unit: "m³",
        },
        zones: [],
        environmental: {
          temperature: 28.7,
          humidity: 62,
          airQuality: 78,
          lighting: 88,
          noise: 52,
        },
        security: {
          cameras: 98,
          accessPoints: 18,
          alarms: 6,
          lastIncident: new Date("2024-01-10"),
        },
        iot: {
          sensors: 167,
          connectedDevices: 134,
          networkStatus: "good",
          dataPoints: 9800,
        },
        performance: {
          throughput: 87.3,
          accuracy: 98.9,
          efficiency: 86.7,
          uptime: 98.5,
        },
        staff: {
          total: 38,
          onDuty: 26,
          shift: "afternoon",
        },
      },
      {
        id: "wh-003",
        name: "Dammam Cold Storage",
        location: {
          address: "King Abdul Aziz Port",
          city: "Dammam",
          country: "Saudi Arabia",
          coordinates: { lat: 26.4207, lng: 50.0888 },
        },
        type: "cold_storage",
        status: "operational",
        capacity: {
          total: 15000,
          used: 12800,
          available: 2200,
          unit: "m³",
        },
        zones: [],
        environmental: {
          temperature: -18.5,
          humidity: 85,
          airQuality: 95,
          lighting: 85,
          noise: 38,
        },
        security: {
          cameras: 67,
          accessPoints: 12,
          alarms: 4,
          lastIncident: null,
        },
        iot: {
          sensors: 89,
          connectedDevices: 78,
          networkStatus: "excellent",
          dataPoints: 5340,
        },
        performance: {
          throughput: 92.1,
          accuracy: 99.9,
          efficiency: 88.9,
          uptime: 99.8,
        },
        staff: {
          total: 22,
          onDuty: 16,
          shift: "night",
        },
      },
      {
        id: "wh-004",
        name: "Jubail HAZMAT Facility",
        location: {
          address: "Jubail Industrial City",
          city: "Jubail",
          country: "Saudi Arabia",
          coordinates: { lat: 27.0174, lng: 49.6003 },
        },
        type: "hazmat",
        status: "maintenance",
        capacity: {
          total: 8000,
          used: 5400,
          available: 2600,
          unit: "m³",
        },
        zones: [],
        environmental: {
          temperature: 24.1,
          humidity: 42,
          airQuality: 92,
          lighting: 95,
          noise: 41,
        },
        security: {
          cameras: 45,
          accessPoints: 8,
          alarms: 12,
          lastIncident: new Date("2023-12-15"),
        },
        iot: {
          sensors: 156,
          connectedDevices: 145,
          networkStatus: "good",
          dataPoints: 8900,
        },
        performance: {
          throughput: 0,
          accuracy: 99.95,
          efficiency: 0,
          uptime: 85.2,
        },
        staff: {
          total: 28,
          onDuty: 8,
          shift: "morning",
        },
      },
    ];

    // Initialize IoT sensors
    const mockSensors: IoTSensor[] = [
      {
        id: "sensor-001",
        warehouseId: "wh-001",
        zoneId: "zone-001",
        type: "temperature",
        name: "Temperature Sensor A1",
        value: 22.5,
        unit: "°C",
        status: "online",
        lastReading: new Date(),
        batteryLevel: 87,
        threshold: { min: 18, max: 25 },
        alerts: false,
      },
      {
        id: "sensor-002",
        warehouseId: "wh-001",
        zoneId: "zone-001",
        type: "humidity",
        name: "Humidity Sensor A1",
        value: 45,
        unit: "%",
        status: "online",
        lastReading: new Date(),
        batteryLevel: 92,
        threshold: { min: 30, max: 60 },
        alerts: false,
      },
      {
        id: "sensor-003",
        warehouseId: "wh-001",
        zoneId: "zone-001",
        type: "air_quality",
        name: "Air Quality Monitor A1",
        value: 85,
        unit: "AQI",
        status: "online",
        lastReading: new Date(),
        threshold: { min: 0, max: 100 },
        alerts: false,
      },
      {
        id: "sensor-004",
        warehouseId: "wh-002",
        zoneId: "",
        type: "motion",
        name: "Motion Detector B1",
        value: 1,
        unit: "detected",
        status: "online",
        lastReading: new Date(),
        batteryLevel: 65,
        threshold: { min: 0, max: 1 },
        alerts: false,
      },
      {
        id: "sensor-005",
        warehouseId: "wh-003",
        zoneId: "",
        type: "temperature",
        name: "Freezer Temp Monitor C1",
        value: -18.5,
        unit: "°C",
        status: "online",
        lastReading: new Date(),
        batteryLevel: 78,
        threshold: { min: -20, max: -15 },
        alerts: false,
      },
    ];

    setWarehouses(mockWarehouses);
    setSensors(mockSensors);
  };

  const updateIoTData = () => {
    // Simulate real-time IoT data updates
    setSensors((prev) =>
      prev.map((sensor) => ({
        ...sensor,
        value: sensor.value + (Math.random() - 0.5) * 2,
        lastReading: new Date(),
        batteryLevel: sensor.batteryLevel
          ? Math.max(0, sensor.batteryLevel - Math.random() * 0.1)
          : undefined,
      })),
    );

    setWarehouses((prev) =>
      prev.map((warehouse) => ({
        ...warehouse,
        environmental: {
          ...warehouse.environmental,
          temperature:
            warehouse.environmental.temperature + (Math.random() - 0.5) * 0.5,
          humidity: Math.max(
            0,
            Math.min(
              100,
              warehouse.environmental.humidity + (Math.random() - 0.5) * 2,
            ),
          ),
          airQuality: Math.max(
            0,
            Math.min(
              100,
              warehouse.environmental.airQuality + (Math.random() - 0.5) * 1,
            ),
          ),
        },
        iot: {
          ...warehouse.iot,
          dataPoints: warehouse.iot.dataPoints + Math.floor(Math.random() * 50),
        },
      })),
    );
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    updateIoTData();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
      case "online":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "maintenance":
      case "calibrating":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "offline":
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "emergency":
        return "bg-red-600/20 text-red-500 border-red-600/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getNetworkStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-400";
      case "good":
        return "text-blue-400";
      case "poor":
        return "text-yellow-400";
      case "disconnected":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const filteredAndSortedWarehouses = warehouses
    .filter((warehouse) => {
      const matchesSearch =
        warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        warehouse.location.city
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        warehouse.location.country
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || warehouse.status === statusFilter;
      const matchesType = typeFilter === "all" || warehouse.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "capacity":
          return (
            b.capacity.used / b.capacity.total -
            a.capacity.used / a.capacity.total
          );
        case "performance":
          return b.performance.efficiency - a.performance.efficiency;
        case "uptime":
          return b.performance.uptime - a.performance.uptime;
        default:
          return 0;
      }
    });

  const exportWarehouses = () => {
    const data = filteredAndSortedWarehouses.map((w) => ({
      Name: w.name,
      Location: `${w.location.city}, ${w.location.country}`,
      Type: w.type,
      Status: w.status,
      "Capacity Used": `${((w.capacity.used / w.capacity.total) * 100).toFixed(1)}%`,
      "Total Capacity": `${w.capacity.total} ${w.capacity.unit}`,
      Performance: `${w.performance.efficiency.toFixed(1)}%`,
      Uptime: `${w.performance.uptime.toFixed(1)}%`,
      "IoT Sensors": w.iot.sensors,
      "Staff On Duty": `${w.staff.onDuty}/${w.staff.total}`,
    }));

    const csv = [
      Object.keys(data[0] || {}).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warehouses-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderOverview = () => {
    return (
      <div className="space-y-6">
        {/* Warehouse Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9ca3af]">Total Warehouses</p>
                <p className="text-2xl font-bold text-white">
                  {warehouses.length}
                </p>
              </div>
              <i className="ri-focus-3-line w-8 h-8 text-blue-400"></i>
            </div>
            <div className="mt-2">
              <span className="text-green-400 text-sm">
                ↗ {warehouses.filter((w) => w.status === "operational").length}{" "}
                operational
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9ca3af]">Total Capacity</p>
                <p className="text-2xl font-bold text-white">
                  {(
                    warehouses.reduce((sum, w) => sum + w.capacity.total, 0) /
                    1000
                  ).toFixed(0)}
                  K m³
                </p>
              </div>
              <i className="ri-box-3-line w-8 h-8 text-green-400"></i>
            </div>
            <div className="mt-2">
              <span className="text-blue-400 text-sm">
                {Math.round(
                  (warehouses.reduce((sum, w) => sum + w.capacity.used, 0) /
                    warehouses.reduce((sum, w) => sum + w.capacity.total, 0)) *
                    100,
                )}
                % utilized
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9ca3af]">IoT Sensors</p>
                <p className="text-2xl font-bold text-white">
                  {warehouses.reduce((sum, w) => sum + w.iot.sensors, 0)}
                </p>
              </div>
              <i className="ri-wifi-line w-8 h-8 text-purple-400"></i>
            </div>
            <div className="mt-2">
              <span className="text-green-400 text-sm">
                {sensors.filter((s) => s.status === "online").length} online
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9ca3af]">Staff on Duty</p>
                <p className="text-2xl font-bold text-white">
                  {warehouses.reduce((sum, w) => sum + w.staff.onDuty, 0)}
                </p>
              </div>
              <i className="ri-user-line w-8 h-8 text-orange-400"></i>
            </div>
            <div className="mt-2">
              <span className="text-blue-400 text-sm">
                of {warehouses.reduce((sum, w) => sum + w.staff.total, 0)} total
              </span>
            </div>
          </motion.div>
        </div>

        {/* Filters & Search */}
        <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af]"></i>
                <input
                  type="text"
                  placeholder="Search warehouses by name, city, or country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#9ca3af] focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
              >
                <option value="all">All Types</option>
                <option value="main">Main</option>
                <option value="distribution">Distribution</option>
                <option value="cold_storage">Cold Storage</option>
                <option value="hazmat">HAZMAT</option>
              </select>
              <button
                onClick={() => {
                  setIsExporting(true);
                  exportWarehouses();
                  setTimeout(() => setIsExporting(false), 1000);
                }}
                disabled={
                  isExporting || filteredAndSortedWarehouses.length === 0
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {isExporting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-download-line"></i>
                    <span>Export CSV</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="text-sm text-[#9ca3af]">
            Showing {filteredAndSortedWarehouses.length} of {warehouses.length}{" "}
            warehouses
          </div>
        </div>

        {/* Warehouse Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAndSortedWarehouses.length === 0 ? (
            <div className="col-span-2 p-12 text-center rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
              <i className="ri-search-line text-6xl text-gray-400 mb-4"></i>
              <p className="text-white text-lg mb-2">No warehouses found</p>
              <p className="text-[#9ca3af]">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              {filteredAndSortedWarehouses.map((warehouse) => (
                <motion.div
                  key={warehouse.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg cursor-pointer hover:shadow-xl hover:border-cyan-500/50 transition-all"
                  onClick={() => setSelectedWarehouse(warehouse)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {warehouse.name}
                      </h3>
                      <p className="text-sm text-[#9ca3af]">
                        {warehouse.location.city}, {warehouse.location.country}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(warehouse.status)}`}
                      >
                        {warehouse.status}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          warehouse.type === "main"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : warehouse.type === "hazmat"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : warehouse.type === "cold_storage"
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {warehouse.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#9ca3af]">Capacity</span>
                      <span className="text-white">
                        {(
                          (warehouse.capacity.used / warehouse.capacity.total) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          warehouse.capacity.used / warehouse.capacity.total >
                          0.9
                            ? "bg-red-400"
                            : warehouse.capacity.used /
                                  warehouse.capacity.total >
                                0.8
                              ? "bg-yellow-400"
                              : "bg-green-400"
                        }`}
                        style={{
                          width: `${(warehouse.capacity.used / warehouse.capacity.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-[#9ca3af]">Temperature</span>
                      <p className="font-medium text-white">
                        {warehouse.environmental.temperature.toFixed(1)}°C
                      </p>
                    </div>
                    <div>
                      <span className="text-[#9ca3af]">IoT Devices</span>
                      <p className="font-medium text-white">
                        {warehouse.iot.connectedDevices}/{warehouse.iot.sensors}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#9ca3af]">Uptime</span>
                      <p className="font-medium text-white">
                        {warehouse.performance.uptime.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Network Status */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i
                        className={`ri-wifi-line w-4 h-4 ${getNetworkStatusColor(warehouse.iot.networkStatus)}`}
                      ></i>
                      <span
                        className={`text-sm ${getNetworkStatusColor(warehouse.iot.networkStatus)}`}
                      >
                        {warehouse.iot.networkStatus} network
                      </span>
                    </div>
                    <span className="text-xs text-[#6b7280]">
                      {warehouse.iot.dataPoints.toLocaleString()} data points
                    </span>
                  </div>

                  {/* View Details Button */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/warehouses/${warehouse.id}`);
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                    >
                      <i className="ri-arrow-right-line"></i>
                      <span>View Full Details</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderIoTDashboard = () => {
    return (
      <div className="space-y-6">
        {/* IoT Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Sensors",
              value: sensors.length,
              subtitle: `${sensors.filter((s) => s.status === "online").length} online`,
              icon: "ri-cpu-line",
              color: "text-blue-400",
            },
            {
              title: "Data Points",
              value: `${(warehouses.reduce((sum, w) => sum + w.iot.dataPoints, 0) / 1000).toFixed(1)}K`,
              subtitle: "Last 24h",
              icon: "ri-database-2-line",
              color: "text-green-400",
            },
            {
              title: "Alerts",
              value: sensors.filter((s) => s.alerts).length,
              subtitle: "0 critical",
              icon: "ri-alert-line",
              color: "text-yellow-400",
            },
            {
              title: "Avg Battery",
              value: `${Math.round(sensors.filter((s) => s.batteryLevel).reduce((sum, s) => sum + (s.batteryLevel || 0), 0) / sensors.filter((s) => s.batteryLevel).length)}%`,
              subtitle: "Good health",
              icon: "ri-flashlight-line",
              color: "text-purple-400",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#9ca3af]">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <i className={`${stat.icon} w-8 h-8 ${stat.color}`}></i>
              </div>
              <div className="mt-2">
                <span className="text-green-400 text-sm">{stat.subtitle}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Real-time Sensor Data */}
        <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">
              Real-time Sensor Data
            </h3>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isRefreshing ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <i className="ri-refresh-line"></i>
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sensors.map((sensor) => (
              <motion.div
                key={sensor.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg border border-white/10 bg-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded ${
                      sensor.type === "temperature"
                        ? "bg-red-500/20 text-red-400"
                        : sensor.type === "humidity"
                          ? "bg-blue-500/20 text-blue-400"
                          : sensor.type === "air_quality"
                            ? "bg-green-500/20 text-green-400"
                            : sensor.type === "motion"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    <i
                      className={`ri-${sensor.type === "temperature" ? "temp-cold" : sensor.type === "humidity" ? "water-percent" : sensor.type === "air_quality" ? "eye" : "pulse"}-line w-4 h-4`}
                    ></i>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs border ${getStatusColor(sensor.status)}`}
                  >
                    {sensor.status}
                  </span>
                </div>

                <h4 className="font-medium text-sm mb-2 text-white">
                  {sensor.name}
                </h4>

                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-xl font-bold text-white">
                    {sensor.value.toFixed(1)}
                  </span>
                  <span className="text-sm text-[#9ca3af]">{sensor.unit}</span>
                </div>

                {sensor.batteryLevel && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#9ca3af]">Battery</span>
                      <span className="text-white">
                        {Math.round(sensor.batteryLevel)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full ${
                          sensor.batteryLevel > 50
                            ? "bg-green-400"
                            : sensor.batteryLevel > 20
                              ? "bg-yellow-400"
                              : "bg-red-400"
                        }`}
                        style={{ width: `${sensor.batteryLevel}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="text-xs text-right">
                  <span className="text-[#6b7280]">
                    Updated: {sensor.lastReading.toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    {
      id: "comparison",
      name: "Performance Comparison",
      icon: "ri-bar-chart-box-line",
    },
    { id: "overview", name: "Warehouse Overview", icon: "ri-focus-3-line" },
    { id: "iot", name: "IoT Dashboard", icon: "ri-wifi-line" },
    { id: "inventory", name: "Smart Inventory", icon: "ri-box-3-line" },
    {
      id: "analytics",
      name: "Performance Analytics",
      icon: "ri-bar-chart-line",
    },
    {
      id: "security",
      name: "Security & Monitoring",
      icon: "ri-shield-check-line",
    },
    {
      id: "sustainability",
      name: "Sustainability & ESG",
      icon: "ri-leaf-line",
    },
    { id: "vision", name: "AI Vision Overlay", icon: "ri-eye-line" },
    { id: "emergency", name: "Emergency Response", icon: "ri-alert-line" },
  ];

  const stats = [
    {
      label: "Total Warehouses",
      value: warehouses.length,
      icon: "ri-building-line",
      tooltip: "Total warehouse locations",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: warehouses.filter((w) => w.status === "operational").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active warehouses",
      trend: "up" as const,
    },
    {
      label: "Total Capacity",
      value: `${(warehouses.reduce((sum, w) => sum + w.capacity.total, 0) / 1000).toFixed(0)}K m³`,
      icon: "ri-layout-grid-line",
      tooltip: "Total warehouse area",
      trend: "neutral" as const,
    },
    {
      label: "IoT Sensors",
      value: warehouses.reduce((sum, w) => sum + w.iot.sensors, 0),
      icon: "ri-wifi-line",
      tooltip: "Connected IoT sensors",
      trend: "up" as const,
    },
  ];

  return (
    <PageTemplate
      title="Warehouse Management"
      description="Smart inventory management with advanced IoT integration and real-time monitoring"
      icon="ri-building-line"
      systemInfo={{
        sap: "Warehouse Management, Warehouse Master",
        oracle: "Warehouse Administration, Facility Management",
        manhattan: "Warehouse Management, Multi-Warehouse",
      }}
      examples={[
        "Multi-warehouse overview",
        "IoT sensor monitoring",
        "Real-time environmental tracking",
        "Security and access control",
        "AI-powered vision overlay",
        "Emergency response systems",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isRefreshing
                ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isRefreshing ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-1"></i>
                Refreshing...
              </>
            ) : (
              <>
                <i className="ri-refresh-line mr-1"></i>
                Refresh
              </>
            )}
          </button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-white/10">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    selectedTab === tab.id
                      ? "border-green-500 text-green-400"
                      : "border-transparent text-[#9ca3af] hover:text-white hover:border-white/30"
                  }
                `}
              >
                <i className={`${tab.icon} w-4 h-4`}></i>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {selectedTab === "overview" && renderOverview()}
          {selectedTab === "iot" && renderIoTDashboard()}
          {selectedTab === "inventory" && (
            <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
              <SmartInventoryManagement />
            </div>
          )}
          {selectedTab === "analytics" && (
            <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
              <h3 className="text-xl font-bold mb-4 text-white">
                Performance Analytics
              </h3>
              <p className="text-[#9ca3af] mb-4">
                Warehouse performance analytics functionality has been
                integrated into the main consolidated dashboard.
              </p>
              <button
                onClick={() => window.open("/dashboards/warehouse", "_blank")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Open Warehouse Analytics Dashboard
              </button>
            </div>
          )}
          {selectedTab === "security" && (
            <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
              <SecurityMonitoringSystem />
            </div>
          )}
          {selectedTab === "sustainability" && selectedWarehouse && (
            <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
              <SustainabilityDashboard
                warehouseId={selectedWarehouse.id}
                warehouseName={selectedWarehouse.name}
              />
            </div>
          )}
          {selectedTab === "sustainability" && !selectedWarehouse && (
            <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
              <div className="text-center py-8">
                <i className="ri-leaf-line text-6xl text-green-400 mb-4"></i>
                <p className="text-white mb-2">
                  Select a warehouse to view sustainability metrics
                </p>
                <p className="text-[#9ca3af]">
                  Please select a warehouse from the overview to see its
                  sustainability dashboard.
                </p>
              </div>
            </div>
          )}
          {selectedTab === "vision" && <AIVisionOverlay />}
          {selectedTab === "comparison" && (
            <div className="space-y-6">
              <WarehousePerformanceComparison warehouses={warehouses} />
            </div>
          )}
          {selectedTab === "emergency" && <EmergencyResponseCenter />}
        </motion.div>
      </AnimatePresence>
    </PageTemplate>
  );
};

export default WarehousesPage;
