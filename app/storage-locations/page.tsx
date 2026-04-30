"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { generateStorageLocations } from "@/utils/mockDataGenerators";
import StorageLocationForm from "@/components/warehouse/StorageLocationForm";
import ComplianceTracker from "@/components/warehouse/ComplianceTracker";
import { getInventoryLinks } from "@/utils/moduleInterconnectivity";
import { format } from "date-fns";
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
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import QRCodeBadge from "@/components/qr/QRCodeBadge";

interface StorageLocation {
  id: string;
  locationCode: string;
  zone: string;
  aisle: string;
  rack: string;
  level: string;
  locationType: string;
  capacity: number;
  currentStock: number;
  availableCapacity: number;
  utilization: number;
  maxWeight: number;
  currentWeight: number;
  availableWeight: number;
  weightUtilization: number;
  length: number;
  width: number;
  height: number;
  temperatureControlled?: boolean;
  minTemperature?: number;
  maxTemperature?: number;
  hazardous?: boolean;
  requiresEquipment?: boolean;
  equipmentType?: string;
  status:
    | "AVAILABLE"
    | "OCCUPIED"
    | "FULL"
    | "NEAR_FULL"
    | "RESERVED"
    | "BLOCKED";
  materialCount?: number;
  batchCount?: number;
  lastPutaway?: Date | string;
  lastPicking?: Date | string;
  lastCycleCount?: Date | string;
  coordinates?: {
    x: number;
    y: number;
    z: number;
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export default function StorageLocations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationFilter = searchParams.get("location");

  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch storage locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/locations?limit=200');
        const result = await response.json();

        if (result.success && result.data) {
          // Map API response to StorageLocation format
          const mappedLocations: StorageLocation[] = result.data.map((loc: any, index: number) => ({
            id: loc.id || `loc-${index}`,
            locationCode: loc.code || loc.name || `LOC-${index + 1}`,
            zone: loc.location?.cityCode || 'A',
            aisle: String(Math.floor(Math.random() * 20) + 1),
            rack: String(Math.floor(Math.random() * 10) + 1),
            level: String(Math.floor(Math.random() * 4) + 1),
            locationType: loc.type || 'BIN',
            capacity: loc.totalPalletCapacity || 100,
            currentStock: loc.currentPalletsUsed || 0,
            availableCapacity: (loc.totalPalletCapacity || 100) - (loc.currentPalletsUsed || 0),
            utilization: loc.currentPalletsUsed && loc.totalPalletCapacity 
              ? (loc.currentPalletsUsed / loc.totalPalletCapacity) * 100 
              : 0,
            maxWeight: 1000,
            currentWeight: 0,
            availableWeight: 1000,
            weightUtilization: 0,
            length: 2,
            width: 1,
            height: 2,
            temperatureControlled: loc.storageRestrictions?.temperatureControlled || false,
            minTemperature: loc.storageRestrictions?.temperatureControlled ? -20 : undefined,
            maxTemperature: loc.storageRestrictions?.temperatureControlled ? 20 : undefined,
            hazardous: loc.storageRestrictions?.hazardClassesAllowed?.length > 0 || false,
            requiresEquipment: false,
            equipmentType: undefined,
            status: loc.active === false ? 'BLOCKED' as const : 
                   (loc.currentPalletsUsed || 0) >= (loc.totalPalletCapacity || 100) ? 'FULL' as const :
                   (loc.currentPalletsUsed || 0) / (loc.totalPalletCapacity || 100) > 0.9 ? 'NEAR_FULL' as const :
                   (loc.currentPalletsUsed || 0) > 0 ? 'OCCUPIED' as const : 'AVAILABLE' as const,
            materialCount: 0,
            batchCount: 0,
            lastPutaway: undefined,
            lastPicking: undefined,
            lastCycleCount: loc.lastInspection ? new Date(loc.lastInspection) : undefined,
            coordinates: { x: 0, y: 0, z: 0 },
            createdAt: loc.createdAt ? new Date(loc.createdAt) : new Date(),
            updatedAt: loc.updatedAt ? new Date(loc.updatedAt) : undefined,
          }));
          setLocations(mappedLocations);
        } else {
          setError(result.error || 'Failed to fetch storage locations');
        }
      } catch (err) {
        console.error('Error fetching storage locations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch storage locations');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "analytics" | "utilization"
  >("table");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<StorageLocation | null>(null);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesSearch =
        loc.locationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.zone.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || loc.status === selectedStatus;
      const matchesZone = selectedZone === "ALL" || loc.zone === selectedZone;
      const matchesType =
        selectedType === "ALL" || loc.locationType === selectedType;
      const matchesLocation =
        !locationFilter || loc.locationCode === locationFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesZone &&
        matchesType &&
        matchesLocation
      );
    });
  }, [
    locations,
    searchQuery,
    selectedStatus,
    selectedZone,
    selectedType,
    locationFilter,
  ]);

  const statusStats = useMemo(() => {
    const stats: Record<string, number> = {};
    locations.forEach((loc) => {
      stats[loc.status] = (stats[loc.status] || 0) + 1;
    });
    return Object.entries(stats).map(([status, count]) => ({ status, count }));
  }, [locations]);

  const zoneStats = useMemo(() => {
    const stats: Record<
      string,
      { count: number; totalCapacity: number; usedCapacity: number }
    > = {};
    locations.forEach((loc) => {
      if (!stats[loc.zone]) {
        stats[loc.zone] = { count: 0, totalCapacity: 0, usedCapacity: 0 };
      }
      stats[loc.zone].count++;
      stats[loc.zone].totalCapacity += loc.capacity;
      stats[loc.zone].usedCapacity += loc.currentStock;
    });
    return Object.entries(stats).map(([zone, data]) => ({
      zone,
      count: data.count,
      utilization: (data.usedCapacity / data.totalCapacity) * 100,
    }));
  }, [locations]);

  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    locations.forEach((loc) => {
      stats[loc.locationType] = (stats[loc.locationType] || 0) + 1;
    });
    return Object.entries(stats).map(([type, count]) => ({ type, count }));
  }, [locations]);

  const utilizationData = useMemo(() => {
    return locations
      .map((loc) => ({
        location: loc.locationCode,
        utilization: loc.utilization,
        weightUtilization: loc.weightUtilization,
      }))
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 20);
  }, [locations]);

  const totalCapacity = useMemo(() => {
    return locations.reduce((sum, loc) => sum + loc.capacity, 0);
  }, [locations]);

  const totalUsed = useMemo(() => {
    return locations.reduce((sum, loc) => sum + loc.currentStock, 0);
  }, [locations]);

  const overallUtilization = useMemo(() => {
    return (totalUsed / totalCapacity) * 100;
  }, [totalUsed, totalCapacity]);

  const stats = [
    {
      label: "Total Locations",
      value: locations.length,
      icon: "ri-map-pin-3-line",
      tooltip: "Total storage locations",
      trend: "up" as const,
    },
    {
      label: "Available",
      value: locations.filter((l) => l.status === "AVAILABLE").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Available locations",
      trend: "up" as const,
    },
    {
      label: "Overall Utilization",
      value: `${overallUtilization.toFixed(1)}%`,
      icon: "ri-bar-chart-line",
      tooltip: "Overall capacity utilization",
      trend: "neutral" as const,
    },
    {
      label: "Full Locations",
      value: locations.filter(
        (l) => l.status === "FULL" || l.status === "NEAR_FULL",
      ).length,
      icon: "ri-alert-line",
      tooltip: "Full or near-full locations",
      trend: "neutral" as const,
    },
  ];

  const handleView = (location: StorageLocation) => {
    setSelectedLocation(location);
    setShowViewModal(true);
  };

  const handleNavigateToInventory = (location: StorageLocation) => {
    router.push(`/inventory?location=${location.locationCode}`);
  };

  if (loading) {
    return (
      <PageTemplate
        title="Storage Locations"
        description="Warehouse storage locations with capacity planning, utilization tracking, and analytics"
        icon="ri-map-pin-3-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading storage locations...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Storage Locations"
        description="Warehouse storage locations with capacity planning, utilization tracking, and analytics"
        icon="ri-map-pin-3-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Storage Locations"
      description="Warehouse storage locations with capacity planning, utilization tracking, and analytics"
      icon="ri-map-pin-3-line"
      systemInfo={{
        sap: "Storage Location, IM01",
        oracle: "Subinventory, Locator",
        manhattan: "Storage Locations, Location Master",
      }}
      examples={[
        "Storage location capacity planning",
        "Utilization tracking and optimization",
        "Zone and aisle management",
        "Location type configuration",
        "Weight and volume capacity",
        "Temperature-controlled locations",
        "Hazmat storage management",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["table", "analytics", "utilization"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <i
                  className={`ri-${mode === "table" ? "table-line" : mode === "analytics" ? "bar-chart-line" : "pie-chart-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
            <i className="ri-add-line"></i>
            Create Location
          </button>
        </div>
      }
    >
      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        [
                          "#10b981",
                          "#3b82f6",
                          "#f59e0b",
                          "#ef4444",
                          "#8b5cf6",
                          "#6b7280",
                        ][index % 6]
                      }
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Location Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="type"
                  stroke="#9ca3af"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:col-span-2"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Zone Utilization
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={zoneStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="zone" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#06b6d4" name="Location Count" />
                <Line
                  type="monotone"
                  dataKey="utilization"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Utilization %"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Utilization View */}
      {viewMode === "utilization" && (
        <div className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Top 20 Locations by Utilization
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="location"
                stroke="#9ca3af"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar
                dataKey="utilization"
                fill="#06b6d4"
                name="Capacity Utilization %"
              />
              <Bar
                dataKey="weightUtilization"
                fill="#8b5cf6"
                name="Weight Utilization %"
              />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Location Code, Zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="FULL">Full</option>
          <option value="NEAR_FULL">Near Full</option>
          <option value="RESERVED">Reserved</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[120px]"
        >
          <option value="ALL">All Zones</option>
          {Array.from(new Set(locations.map((l) => l.zone))).map((zone) => (
            <option key={zone} value={zone}>
              Zone {zone}
            </option>
          ))}
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="BULK">Bulk</option>
          <option value="RACK">Rack</option>
          <option value="FLOOR">Floor</option>
          <option value="COLD_STORAGE">Cold Storage</option>
          <option value="HAZMAT">Hazmat</option>
          <option value="QUARANTINE">Quarantine</option>
          <option value="PICKING">Picking</option>
          <option value="STAGING">Staging</option>
        </select>
      </div>

      {/* Locations Table */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Location Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Zone/Aisle/Rack
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredLocations.map((location, index) => {
                  const isHighUtilization = location.utilization > 75;
                  const isFull = location.utilization > 90;
                  return (
                    <motion.tr
                      key={location.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleNavigateToInventory(location)}
                          className="text-left hover:text-cyan-400 transition-colors"
                        >
                          <div className="text-sm font-medium text-white font-mono cursor-pointer">
                            {location.locationCode}
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          Zone {location.zone}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Aisle {location.aisle} • Rack {location.rack} • Level{" "}
                          {location.level}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {location.locationType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {location.currentStock.toFixed(1)} /{" "}
                          {location.capacity.toFixed(1)}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Available: {location.availableCapacity.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            isFull
                              ? "text-red-400"
                              : isHighUtilization
                                ? "text-yellow-400"
                                : "text-white"
                          }`}
                        >
                          {location.utilization.toFixed(1)}%
                        </div>
                        <div className="w-20 h-1.5 bg-white/10 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${
                              isFull
                                ? "bg-red-500"
                                : isHighUtilization
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(location.utilization, 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {location.currentWeight.toFixed(0)} /{" "}
                          {location.maxWeight.toFixed(0)} kg
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {location.weightUtilization.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            location.status === "AVAILABLE"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : location.status === "FULL"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : location.status === "NEAR_FULL"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : location.status === "OCCUPIED"
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : location.status === "RESERVED"
                                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                      : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {location.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Tooltip content="View Details" position="top">
                            <button
                              onClick={() => handleView(location)}
                              className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                          </Tooltip>
                          <Tooltip content="View Inventory" position="top">
                            <button
                              onClick={() =>
                                handleNavigateToInventory(location)
                              }
                              className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                            >
                              <i className="ri-stack-line"></i>
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedLocation(null);
        }}
        title={`Storage Location Details - ${selectedLocation?.locationCode || ""}`}
        size="lg"
      >
        {selectedLocation && (
          <div className="space-y-4">
            {/* QR Code Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <UniversalQRGenerator
                entityId={selectedLocation.id}
                entityType="location"
                entityName={selectedLocation.locationCode}
                documentType="other"
                documentUrl={`/storage-locations?location=${selectedLocation.locationCode}`}
                module="wms"
                showAdvanced={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Location Code
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedLocation.locationCode}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedLocation.status === "AVAILABLE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedLocation.status === "FULL"
                        ? "bg-red-500/20 text-red-400"
                        : selectedLocation.status === "NEAR_FULL"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : selectedLocation.status === "OCCUPIED"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedLocation.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Zone
                </label>
                <div className="text-sm text-white">
                  Zone {selectedLocation.zone}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Aisle / Rack / Level
                </label>
                <div className="text-sm text-white">
                  Aisle {selectedLocation.aisle} • Rack {selectedLocation.rack}{" "}
                  • Level {selectedLocation.level}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Location Type
                </label>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {selectedLocation.locationType.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Dimensions (L×W×H)
                </label>
                <div className="text-sm text-white">
                  {selectedLocation.length.toFixed(2)} ×{" "}
                  {selectedLocation.width.toFixed(2)} ×{" "}
                  {selectedLocation.height.toFixed(2)} m
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Capacity Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Total Capacity
                  </label>
                  <div className="text-sm text-white font-medium">
                    {selectedLocation.capacity.toFixed(2)} units
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Current Stock
                  </label>
                  <div className="text-sm text-white font-medium">
                    {selectedLocation.currentStock.toFixed(2)} units
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Available Capacity
                  </label>
                  <div className="text-sm text-white font-medium">
                    {selectedLocation.availableCapacity.toFixed(2)} units
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Utilization
                  </label>
                  <div
                    className={`text-sm font-medium ${
                      selectedLocation.utilization > 90
                        ? "text-red-400"
                        : selectedLocation.utilization > 75
                          ? "text-yellow-400"
                          : "text-white"
                    }`}
                  >
                    {selectedLocation.utilization.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Weight Capacity
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Max Weight
                  </label>
                  <div className="text-sm text-white font-medium">
                    {selectedLocation.maxWeight.toFixed(0)} kg
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Current Weight
                  </label>
                  <div className="text-sm text-white font-medium">
                    {selectedLocation.currentWeight.toFixed(0)} kg
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Available Weight
                  </label>
                  <div className="text-sm text-white font-medium">
                    {selectedLocation.availableWeight.toFixed(0)} kg
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Weight Utilization
                  </label>
                  <div className="text-sm text-white font-medium">
                    {selectedLocation.weightUtilization.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
            {(selectedLocation.temperatureControlled ||
              selectedLocation.hazardous ||
              selectedLocation.requiresEquipment) && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Location Attributes
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedLocation.temperatureControlled && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Temperature Controlled
                      </label>
                      <div className="text-sm text-green-400">
                        <i className="ri-checkbox-circle-line mr-1"></i>
                        Yes
                        {selectedLocation.minTemperature !== undefined &&
                          selectedLocation.maxTemperature !== undefined && (
                            <span className="text-white ml-2">
                              ({selectedLocation.minTemperature.toFixed(1)}°C to{" "}
                              {selectedLocation.maxTemperature.toFixed(1)}°C)
                            </span>
                          )}
                      </div>
                    </div>
                  )}
                  {selectedLocation.hazardous && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Hazardous Storage
                      </label>
                      <div className="text-sm text-red-400">
                        <i className="ri-alert-line mr-1"></i>
                        Yes
                      </div>
                    </div>
                  )}
                  {selectedLocation.requiresEquipment && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Requires Equipment
                      </label>
                      <div className="text-sm text-white">
                        {selectedLocation.equipmentType?.replace(/_/g, " ") ||
                          "Yes"}
                      </div>
                    </div>
                  )}
                  {selectedLocation.materialCount !== undefined && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Material Count
                      </label>
                      <div className="text-sm text-white font-medium">
                        {selectedLocation.materialCount}
                      </div>
                    </div>
                  )}
                  {selectedLocation.batchCount !== undefined && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Batch Count
                      </label>
                      <div className="text-sm text-white font-medium">
                        {selectedLocation.batchCount}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {(selectedLocation.lastPutaway ||
              selectedLocation.lastPicking ||
              selectedLocation.lastCycleCount) && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Last Activity
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedLocation.lastPutaway && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Last Putaway
                      </label>
                      <div className="text-sm text-white">
                        {format(
                          new Date(selectedLocation.lastPutaway),
                          "MMM dd, yyyy HH:mm",
                        )}
                      </div>
                    </div>
                  )}
                  {selectedLocation.lastPicking && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Last Picking
                      </label>
                      <div className="text-sm text-white">
                        {format(
                          new Date(selectedLocation.lastPicking),
                          "MMM dd, yyyy HH:mm",
                        )}
                      </div>
                    </div>
                  )}
                  {selectedLocation.lastCycleCount && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Last Cycle Count
                      </label>
                      <div className="text-sm text-white">
                        {format(
                          new Date(selectedLocation.lastCycleCount),
                          "MMM dd, yyyy",
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  handleNavigateToInventory(selectedLocation);
                  setShowViewModal(false);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-stack-line"></i>
                View Inventory
              </button>
            </div>
            {getInventoryLinks && (
              <div className="pt-4 border-t border-white/10">
                <ModuleLinks
                  links={getInventoryLinks(
                    undefined,
                    selectedLocation.locationCode,
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
