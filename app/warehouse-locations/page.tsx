/**
 * Comprehensive Warehouse Locations Page
 * World's Most Comprehensive Storage Location Management
 * BlueDXP Platform - 4IR & 5IR Aligned
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import StorageLocationForm from "@/components/warehouse/StorageLocationForm";
import { warehouseLocationService } from "@/lib/services/wms/locationService";
import { regulatoryComplianceService } from "@/lib/services/wms/regulatoryComplianceService";
import type {
  StorageLocation,
  StorageLocationFilters,
} from "@/types/warehouseLocation";
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
} from "recharts";

export default function WarehouseLocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [selectedCompliance, setSelectedCompliance] = useState<string>("ALL");
  const [selectedFireSystem, setSelectedFireSystem] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "grid" | "table" | "map" | "analytics"
  >("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<StorageLocation | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const filters: StorageLocationFilters = {};
      const fetchedLocations =
        await warehouseLocationService.listLocations(filters);
      setLocations(fetchedLocations);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesSearch =
        searchQuery === "" ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.location.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry =
        selectedCountry === "ALL" ||
        loc.location.countryCode === selectedCountry;
      const matchesCompliance =
        selectedCompliance === "ALL" ||
        loc.complianceStatus === selectedCompliance;
      const matchesFireSystem =
        selectedFireSystem === "ALL" ||
        loc.fireSuppressionType === selectedFireSystem;
      return (
        matchesSearch &&
        matchesCountry &&
        matchesCompliance &&
        matchesFireSystem
      );
    });
  }, [
    locations,
    searchQuery,
    selectedCountry,
    selectedCompliance,
    selectedFireSystem,
  ]);

  // Analytics data
  const complianceDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    locations.forEach((loc) => {
      distribution[loc.complianceStatus] =
        (distribution[loc.complianceStatus] || 0) + 1;
    });
    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
    }));
  }, [locations]);

  const fireSystemDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    locations.forEach((loc) => {
      distribution[loc.fireSuppressionType] =
        (distribution[loc.fireSuppressionType] || 0) + 1;
    });
    return Object.entries(distribution).map(([system, count]) => ({
      system,
      count,
    }));
  }, [locations]);

  const utilizationData = useMemo(() => {
    return locations
      .filter((loc) => loc.utilizationRate !== undefined)
      .map((loc) => ({
        location: loc.code,
        utilization: loc.utilizationRate || 0,
      }))
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 20);
  }, [locations]);

  const countries = useMemo(() => {
    return Array.from(
      new Set(locations.map((loc) => loc.location.countryCode)),
    ).sort();
  }, [locations]);

  const stats = [
    {
      label: "Total Locations",
      value: locations.length,
      icon: "ri-map-pin-3-line",
      tooltip: "Total storage locations",
      trend: "up" as const,
    },
    {
      label: "Active Locations",
      value: locations.filter((l) => l.active).length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active storage locations",
      trend: "up" as const,
    },
    {
      label: "Avg Utilization",
      value:
        locations.length > 0
          ? `${(locations.reduce((sum, l) => sum + (l.utilizationRate || 0), 0) / locations.length).toFixed(1)}%`
          : "0%",
      icon: "ri-bar-chart-line",
      tooltip: "Average capacity utilization",
      trend: "neutral" as const,
    },
    {
      label: "Compliant",
      value: locations.filter((l) => l.complianceStatus === "Compliant").length,
      icon: "ri-shield-check-line",
      tooltip: "Fully compliant locations",
      trend: "up" as const,
    },
  ];

  const handleSaveLocation = async (location: StorageLocation) => {
    await fetchLocations();
    setShowCreateModal(false);
  };

  const handleViewLocation = (location: StorageLocation) => {
    setSelectedLocation(location);
    setShowViewModal(true);
  };

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <PageTemplate
      title="Warehouse Locations"
      description="Comprehensive storage location management with fire safety, compliance tracking, and global support"
      icon="ri-map-pin-3-line"
      systemInfo={{
        sap: "Storage Location, IM01",
        oracle: "Subinventory, Locator",
        manhattan: "Storage Locations, Location Master",
      }}
      examples={[
        "Multi-country location management",
        "Fire suppression system tracking",
        "Hazard class compliance",
        "Regulatory compliance verification",
        "Capacity and utilization tracking",
        "AI-powered compliance checking",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["grid", "table", "map", "analytics"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <i
                  className={`ri-${mode === "grid" ? "grid-line" : mode === "table" ? "table-line" : mode === "map" ? "map-pin-line" : "bar-chart-line"}`}
                ></i>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <i className="ri-add-line"></i>
            Create Location
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-white placeholder-gray-500"
          />
        </div>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-white min-w-[150px]"
        >
          <option value="ALL">All Countries</option>
          {countries.map((code) => {
            const loc = locations.find((l) => l.location.countryCode === code);
            return loc ? (
              <option key={code} value={code}>
                {loc.location.country}
              </option>
            ) : null;
          })}
        </select>
        <select
          value={selectedCompliance}
          onChange={(e) => setSelectedCompliance(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-white min-w-[180px]"
        >
          <option value="ALL">All Compliance</option>
          <option value="Compliant">Compliant</option>
          <option value="Compliant with exceptions">
            Compliant with Exceptions
          </option>
          <option value="Non-Compliant">Non-Compliant</option>
          <option value="Pending Inspection">Pending Inspection</option>
        </select>
        <select
          value={selectedFireSystem}
          onChange={(e) => setSelectedFireSystem(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-white min-w-[200px]"
        >
          <option value="ALL">All Fire Systems</option>
          {Array.from(new Set(locations.map((l) => l.fireSuppressionType))).map(
            (system) => (
              <option key={system} value={system}>
                {system}
              </option>
            ),
          )}
        </select>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location, index) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => handleViewLocation(location)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {location.name}
                  </h3>
                  <p className="text-sm text-cyan-400 font-mono">
                    {location.code}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    location.complianceStatus === "Compliant"
                      ? "bg-green-500/20 text-green-400"
                      : location.complianceStatus === "Non-Compliant"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {location.complianceStatus}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-white">
                    {location.location.city}, {location.location.country}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Fire System:</span>
                  <span className="text-white text-xs">
                    {location.fireSuppressionType}
                  </span>
                </div>
                {location.utilizationRate !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Utilization:</span>
                    <span
                      className={`font-medium ${
                        location.utilizationRate > 90
                          ? "text-red-400"
                          : location.utilizationRate > 75
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}
                    >
                      {location.utilizationRate.toFixed(1)}%
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Hazard Classes:</span>
                  <span className="text-white">
                    {location.storageRestrictions.hazardClassesAllowed.length}
                  </span>
                </div>
              </div>

              {location.utilizationRate !== undefined && (
                <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full ${
                      location.utilizationRate > 90
                        ? "bg-red-500"
                        : location.utilizationRate > 75
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${location.utilizationRate}%` }}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewLocation(location);
                  }}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm transition-colors hover:bg-cyan-600/30"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Fire System
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Compliance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Utilization
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredLocations.map((location) => (
                  <tr
                    key={location.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white font-mono">
                        {location.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{location.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">
                        {location.location.city}
                      </div>
                      <div className="text-xs text-gray-400">
                        {location.location.country}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-300">
                        {location.fireSuppressionType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          location.complianceStatus === "Compliant"
                            ? "bg-green-500/20 text-green-400"
                            : location.complianceStatus === "Non-Compliant"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {location.complianceStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {location.utilizationRate !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">
                            {location.utilizationRate.toFixed(1)}%
                          </span>
                          <div className="w-20 h-1.5 bg-white/10 rounded-full">
                            <div
                              className={`h-full rounded-full ${
                                location.utilizationRate > 90
                                  ? "bg-red-500"
                                  : location.utilizationRate > 75
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                              style={{ width: `${location.utilizationRate}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Tooltip content="View Details">
                        <button
                          onClick={() => handleViewLocation(location)}
                          className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Compliance Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={complianceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {complianceDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Fire System Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fireSystemDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="system"
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
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">
              Top 20 Locations by Utilization
            </h3>
            <ResponsiveContainer width="100%" height={300}>
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
                <Bar dataKey="utilization" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Map View */}
      {viewMode === "map" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Location Map
          </h3>
          <div className="bg-white/5 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
            <div>
              <i className="ri-map-pin-line text-6xl text-gray-500 mb-4"></i>
              <p className="text-gray-400">Map integration coming soon</p>
              <p className="text-xs text-gray-500 mt-2">
                {locations.length} locations with coordinates available
              </p>
            </div>
          </div>
        </div>
      )}

      {filteredLocations.length === 0 && !loading && (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <i className="ri-inbox-line text-4xl text-gray-500 mb-4"></i>
          <p className="text-gray-400">No locations found</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <StorageLocationForm
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveLocation}
        />
      )}

      {/* View Details Modal */}
      {showViewModal && selectedLocation && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowViewModal(false);
            setSelectedLocation(null);
          }}
          title={`Location Details - ${selectedLocation.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Location Code
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedLocation.code}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Compliance Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedLocation.complianceStatus === "Compliant"
                      ? "bg-green-500/20 text-green-400"
                      : selectedLocation.complianceStatus === "Non-Compliant"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedLocation.complianceStatus}
                </span>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Location
                </label>
                <div className="text-sm text-white">
                  {selectedLocation.location.city},{" "}
                  {selectedLocation.location.country}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Fire Suppression System
                </label>
                <div className="text-sm text-white">
                  {selectedLocation.fireSuppressionType}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Regulatory Authority
                </label>
                <div className="text-sm text-white">
                  {selectedLocation.regulatoryAuthority}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Last Inspection
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedLocation.lastInspection),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
            </div>

            {selectedLocation.storageRestrictions.hazardClassesAllowed.length >
              0 && (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <label className="text-xs text-gray-400 mb-2 block">
                  Allowed Hazard Classes
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedLocation.storageRestrictions.hazardClassesAllowed.map(
                    (hc, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      >
                        {hc}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

            {selectedLocation.regulatoryNotes && (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <label className="text-xs text-gray-400 mb-2 block">
                  Regulatory Notes
                </label>
                <p className="text-sm text-gray-300">
                  {selectedLocation.regulatoryNotes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}
