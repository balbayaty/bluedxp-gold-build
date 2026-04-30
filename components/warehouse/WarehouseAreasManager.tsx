/**
 * Comprehensive Warehouse Areas Manager Component
 * Migrated from chemcheck-ai with full BlueDXP integration
 * World's Most Comprehensive Warehouse Area/Zone Management
 * BlueDXP Platform - 4IR & 5IR Aligned • Fully Interactive
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";
import {
  listAreasAction,
  createAreaAction,
  updateAreaAction,
  deleteAreaAction,
  getAreaStatisticsAction,
} from "@/app/actions/wms/areaActions";
import type { AreaStatistics } from "@/lib/services/wms/areaService";
import { ALL_HAZARD_CLASSES } from "@/types/warehouseLocation";
import type {
  WarehouseArea,
  WarehouseAreaRequest,
} from "@/types/warehouseArea";
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
} from "recharts";

interface WarehouseAreasManagerProps {
  warehouseId?: string; // Optional - allows standalone areas
  warehouseName?: string;
  tenantId?: string;
  customerId?: string;
  onAreaSelect?: (area: WarehouseArea) => void;
  allowStandalone?: boolean; // Allow creating areas without warehouse
  linkedModuleId?: string; // For cross-module integration
  linkedEntityId?: string; // For cross-module integration
}

export default function WarehouseAreasManager({
  warehouseId,
  warehouseName,
  tenantId,
  customerId,
  onAreaSelect,
  allowStandalone = true, // ✅ Default to allowing standalone areas
  linkedModuleId,
  linkedEntityId,
}: WarehouseAreasManagerProps) {
  const [areas, setAreas] = useState<WarehouseArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<AreaStatistics | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<WarehouseArea | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table" | "analytics">(
    "grid",
  );
  const [filterZone, setFilterZone] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [areaFormData, setAreaFormData] = useState<
    Partial<WarehouseAreaRequest>
  >({
    areaCode: "",
    areaName: "",
    zone: "",
    warehouseId,
    capacity: 0,
    currentStock: 0,
    allowedHazards: [],
    restrictions: "",
    temperatureZone: "", // Added temp zone
    active: true,
  });

  // Fetch areas
  useEffect(() => {
    fetchAreas();
    if (warehouseId) {
      fetchStatistics();
    }
  }, [warehouseId, linkedModuleId, linkedEntityId]);

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const filters: Record<string, string | boolean | undefined> = {
        warehouseId: warehouseId || (allowStandalone ? undefined : ""),
        linkedModuleId,
        linkedEntityId,
        tenantId, // Add tenantId and customerId to filters
        customerId,
      };

      const [areasRes, statsRes] = await Promise.all([
        listAreasAction(filters),
        warehouseId
          ? getAreaStatisticsAction(warehouseId)
          : Promise.resolve({ success: true, data: null }), // Only fetch stats if warehouseId exists
      ]);

      if (areasRes.success && areasRes.data) {
        setAreas(areasRes.data);
      } else {
        console.error("Failed to load areas:", areasRes.error);
      }

      if (statsRes.success && statsRes.data) {
        setStatistics(statsRes.data);
      }
    } catch (error) {
      console.error("Error loading areas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Removed misplaced loadAreas definition and merged logic into fetchAreas
  // maintain previous fetchStatistics separately if needed or just use above

  // Filtered areas
  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      const matchesSearch =
        searchQuery === "" ||
        area.areaCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.zone.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesZone = filterZone === "ALL" || area.zone === filterZone;
      return matchesSearch && matchesZone;
    });
  }, [areas, searchQuery, filterZone]);

  // Zones list
  const zones = useMemo(() => {
    return Array.from(new Set(areas.map((a) => a.zone))).sort();
  }, [areas]);

  // Analytics data
  const analyticsData = useMemo(() => {
    return filteredAreas.map((area) => ({
      area: area.areaCode,
      utilization: area.utilizationPercentage || 0,
      capacity: area.capacity,
      stock: area.currentStock,
    }));
  }, [filteredAreas]);

  const zoneDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    areas.forEach((area) => {
      distribution[area.zone] = (distribution[area.zone] || 0) + 1;
    });
    return Object.entries(distribution).map(([zone, count]) => ({
      zone,
      count,
    }));
  }, [areas]);

  // Handle create area
  const handleCreateArea = async () => {
    try {
      // ✅ Comprehensive validation
      if (
        !areaFormData.areaCode ||
        !areaFormData.areaName ||
        !areaFormData.zone
      ) {
        alert(
          "Please fill in all required fields: Area Code, Area Name, and Zone",
        );
        return;
      }

      // ✅ Validate warehouse requirement
      if (!warehouseId && !allowStandalone) {
        alert(
          "Warehouse is required. Please select a warehouse or enable standalone areas.",
        );
        return;
      }

      const newArea = await warehouseAreaService.createArea({
        areaCode: areaFormData.areaCode,
        areaName: areaFormData.areaName,
        zone: areaFormData.zone,
        warehouseId: warehouseId || undefined, // ✅ Optional - allows standalone
        capacity: areaFormData.capacity || 0,
        currentStock: areaFormData.currentStock || 0,
        allowedHazards: areaFormData.allowedHazards || [],
        restrictions: areaFormData.restrictions || "",
        temperatureZone: areaFormData.temperatureZone || undefined,
        active: areaFormData.active !== undefined ? areaFormData.active : true,
        linkedModuleId: linkedModuleId || areaFormData.linkedModuleId,
        linkedEntityId: linkedEntityId || areaFormData.linkedEntityId,
        linkedEntityType: areaFormData.linkedEntityType,
      });

      setAreas([...areas, newArea]);
      await fetchStatistics();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Error creating area:", error);
      alert("Failed to create area");
    }
  };

  // Handle update area
  const handleUpdateArea = async () => {
    if (!selectedArea) return;

    try {
      const res = await updateAreaAction(selectedArea.id, {
        areaName: areaFormData.areaName!,
        areaCode: areaFormData.areaCode!,
        zone: areaFormData.zone!,
        capacity: areaFormData.capacity || 0,
        currentStock: areaFormData.currentStock || 0,
        allowedHazards: areaFormData.allowedHazards || [],
        restrictions: areaFormData.restrictions || "",
        temperatureZone: areaFormData.temperatureZone || undefined,
        active: areaFormData.active !== undefined ? areaFormData.active : true,
      });

      if (res.success && res.data) {
        setAreas(areas.map((a) => (a.id === selectedArea.id ? res.data! : a)));
        loadAreas();
      } else {
        alert("Failed to update area: " + res.error);
      }
      setShowEditModal(false);
      setSelectedArea(null);
      resetForm();
    } catch (error) {
      console.error("Error updating area:", error);
      alert("Failed to update area");
    }
  };

  // Handle delete area
  const handleDeleteArea = async (id: string) => {
    if (confirm("Are you sure you want to delete this area?")) {
      const res = await deleteAreaAction(id);
      if (res.success) {
        setAreas(areas.filter((a) => a.id !== id));
        if (selectedArea?.id === id) setSelectedArea(null);
        loadAreas();
      } else {
        alert("Failed to delete area: " + res.error);
      }
    }
  };

  // Handle import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("warehouseId", warehouseId);
      formData.append("import", "true");

      // Read CSV file
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, ""));

      const importData = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const data: Record<string, string> = {};
        headers.forEach((header, idx) => {
          data[header] = values[idx] || "";
        });
        return {
          areaCode: data["Area Code"] || data.areaCode || "",
          areaName: data["Area Name"] || data.areaName || "",
          zone: data.Zone || data.zone || "",
          capacity: parseFloat(data.Capacity || data.capacity || "0"),
          currentStock: parseFloat(
            data["Current Stock"] || data.currentStock || "0",
          ),
          allowedHazards: (data["Allowed Hazards"] || data.allowedHazards || "")
            .split(";")
            .map((s: string) => s.trim())
            .filter(Boolean),
          restrictions: data.Restrictions || data.restrictions || "",
        };
      });

      const importedAreas = await warehouseAreaService.importAreas(
        warehouseId,
        importData,
      );
      setAreas([...areas, ...importedAreas]);
      await fetchStatistics();
      setShowImportModal(false);
      alert(`Successfully imported ${importedAreas.length} areas!`);
    } catch (error) {
      console.error("Import error:", error);
      alert("Import failed. Please check your file format.");
    } finally {
      setUploading(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const exportData = await warehouseAreaService.exportAreas({
        warehouseId,
      });

      const headers = [
        "Area Code",
        "Area Name",
        "Zone",
        "Capacity",
        "Current Stock",
        "Usage %",
        "Allowed Hazards",
        "Restrictions",
      ];
      const csvRows = [
        headers.join(","),
        ...exportData.map((row) =>
          [
            row.areaCode,
            row.areaName,
            row.zone,
            row.capacity,
            row.currentStock,
            row.usagePercentage,
            `"${row.allowedHazards}"`,
            `"${row.restrictions}"`,
          ].join(","),
        ),
      ];

      const csv = csvRows.join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${warehouseName.replace(/\s+/g, "-")}-areas-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export areas");
    }
  };

  // Reset form
  const resetForm = () => {
    setAreaFormData({
      areaCode: "",
      areaName: "",
      zone: "",
      warehouseId,
      capacity: 0,
      currentStock: 0,
      allowedHazards: [],
      restrictions: "",
      active: true,
    });
  };

  // Open edit modal
  const openEditModal = (area: WarehouseArea) => {
    setSelectedArea(area);
    setAreaFormData({
      areaCode: area.areaCode,
      areaName: area.areaName,
      zone: area.zone,
      warehouseId: area.warehouseId,
      capacity: area.capacity,
      currentStock: area.currentStock,
      allowedHazards: area.allowedHazards,
      restrictions: area.restrictions,
      temperatureZone: area.temperatureZone || "",
      active: area.active,
    });
    setShowEditModal(true);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <i className="ri-grid-line text-cyan-400"></i>
            Warehouse Areas & Zones
          </h3>
          <p className="text-sm text-gray-400">
            {warehouseName
              ? `Physical storage locations in ${warehouseName}`
              : allowStandalone
                ? "Standalone areas and zones (not linked to a warehouse)"
                : "Select a warehouse to manage areas"}
          </p>
          {linkedModuleId && (
            <p className="text-xs text-cyan-400 mt-1">
              Linked to {linkedModuleId} module
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition flex items-center gap-2 text-white"
          >
            <i className="ri-upload-line"></i>
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-green-500/50 hover:bg-green-500/10 transition flex items-center gap-2 text-white"
          >
            <i className="ri-download-line"></i>
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition text-white"
          >
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">Add Area</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Total Areas</div>
            <div className="text-2xl font-bold text-white">
              {statistics.totalAreas}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Active Areas</div>
            <div className="text-2xl font-bold text-green-400">
              {statistics.activeAreas}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Total Capacity</div>
            <div className="text-2xl font-bold text-cyan-400">
              {statistics.totalCapacity.toLocaleString()}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Avg Utilization</div>
            <div className="text-2xl font-bold text-yellow-400">
              {statistics.averageUtilization.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Search areas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white placeholder-gray-500"
          />
        </div>

        <select
          value={filterZone}
          onChange={(e) => setFilterZone(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white min-w-[150px]"
        >
          <option value="ALL">All Zones</option>
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          {(["grid", "table", "analytics"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === mode
                  ? "bg-cyan-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <i
                className={`ri-${mode === "grid" ? "grid-line" : mode === "table" ? "table-line" : "bar-chart-line"}`}
              ></i>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <p className="mt-4 text-gray-400">Loading areas...</p>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAreas.map((area, index) => {
                const usagePercent = area.utilizationPercentage || 0;
                return (
                  <motion.div
                    key={area.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition group cursor-pointer"
                    onClick={() => {
                      setSelectedArea(area);
                      setShowDetailsModal(true);
                      onAreaSelect?.(area);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-white mb-1">
                          {area.areaName}
                        </h4>
                        <p className="text-xs text-cyan-400 font-mono">
                          {area.areaCode}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs">
                        {area.zone}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Usage</span>
                        <span className="text-sm font-bold text-white">
                          {usagePercent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            usagePercent > 90
                              ? "bg-red-500"
                              : usagePercent > 70
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          {area.currentStock} / {area.capacity} units
                        </span>
                      </div>
                    </div>

                    {area.allowedHazards.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-400 block mb-1">
                          Allowed Hazards
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {area.allowedHazards.slice(0, 3).map((hc, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            >
                              {hc}
                            </span>
                          ))}
                          {area.allowedHazards.length > 3 && (
                            <span className="px-2 py-0.5 text-xs rounded bg-gray-500/10 text-gray-400">
                              +{area.allowedHazards.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {area.restrictions && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                        {area.restrictions}
                      </p>
                    )}

                    <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(area);
                        }}
                        className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-blue-500/20 text-sm flex items-center justify-center gap-1 transition text-white"
                      >
                        <i className="ri-edit-line"></i>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArea(area);
                          setShowDetailsModal(true);
                        }}
                        className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-sm flex items-center justify-center gap-1 transition text-white"
                      >
                        <i className="ri-eye-line"></i>
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteArea(area.id);
                        }}
                        className="py-2 px-3 rounded-lg bg-white/5 hover:bg-red-500/20 text-sm flex items-center justify-center gap-1 transition text-red-400"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
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
                        Area Code
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                        Area Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                        Zone
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                        Capacity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                        Utilization
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                        Hazards
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredAreas.map((area) => {
                      const usagePercent = area.utilizationPercentage || 0;
                      return (
                        <tr
                          key={area.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-white font-mono">
                              {area.areaCode}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white">
                              {area.areaName}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-400">
                              {area.zone}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white">
                              {area.currentStock} / {area.capacity}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-white">
                                {usagePercent.toFixed(1)}%
                              </div>
                              <div className="w-20 h-1.5 bg-white/10 rounded-full">
                                <div
                                  className={`h-full rounded-full ${
                                    usagePercent > 90
                                      ? "bg-red-500"
                                      : usagePercent > 70
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                  }`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {area.allowedHazards.slice(0, 2).map((hc, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 text-xs rounded bg-cyan-500/10 text-cyan-400"
                                >
                                  {hc}
                                </span>
                              ))}
                              {area.allowedHazards.length > 2 && (
                                <span className="px-2 py-0.5 text-xs rounded bg-gray-500/10 text-gray-400">
                                  +{area.allowedHazards.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Tooltip content="Edit">
                                <button
                                  onClick={() => openEditModal(area)}
                                  className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                                >
                                  <i className="ri-edit-line"></i>
                                </button>
                              </Tooltip>
                              <Tooltip content="Delete">
                                <button
                                  onClick={() => handleDeleteArea(area.id)}
                                  className="p-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded hover:bg-red-600/30 transition-colors"
                                >
                                  <i className="ri-delete-bin-line"></i>
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                  Zone Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={zoneDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ zone, count }) => `${zone}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {zoneDistribution.map((entry, index) => (
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
                  Utilization by Area
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="area"
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
                    <Bar dataKey="utilization" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {filteredAreas.length === 0 && (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <i className="ri-inbox-line text-4xl text-gray-500 mb-4"></i>
              <p className="text-gray-400">No areas found</p>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <Modal
            isOpen={true}
            onClose={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              resetForm();
            }}
            title={
              selectedArea ? "Edit Warehouse Area" : "Create Warehouse Area"
            }
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Area Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={areaFormData.areaCode || ""}
                    onChange={(e) =>
                      setAreaFormData({
                        ...areaFormData,
                        areaCode: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                    placeholder="e.g. A-01, B-12"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Zone <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={areaFormData.zone || ""}
                    onChange={(e) =>
                      setAreaFormData({ ...areaFormData, zone: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                    placeholder="e.g. Zone A, Section B"
                    required
                  />
                </div>

                {/* Warehouse Selection (Optional if standalone allowed) */}
                {allowStandalone && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Warehouse (Optional)
                      <span className="ml-2 text-xs text-gray-500">
                        Leave empty for standalone area
                      </span>
                    </label>
                    <input
                      type="text"
                      value={warehouseId || ""}
                      onChange={(e) => {
                        // This would ideally be a dropdown with warehouse selection
                        // For now, allow manual entry or leave empty
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                      placeholder="Warehouse ID (optional - leave empty for standalone)"
                      disabled={!!warehouseId} // Disable if passed as prop
                    />
                    {!warehouseId && (
                      <p className="text-xs text-cyan-400 mt-1">
                        <i className="ri-information-line mr-1"></i>
                        Creating standalone area - can be linked to warehouse
                        later
                      </p>
                    )}
                  </div>
                )}

                {/* Cross-Module Integration */}
                {allowStandalone && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Linked Module (Optional)
                      </label>
                      <select
                        value={
                          areaFormData.linkedModuleId || linkedModuleId || ""
                        }
                        onChange={(e) =>
                          setAreaFormData({
                            ...areaFormData,
                            linkedModuleId: e.target.value || undefined,
                          })
                        }
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                        disabled={!!linkedModuleId}
                      >
                        <option value="">None (Standalone)</option>
                        <option value="tms">Transportation (TMS)</option>
                        <option value="qhse">QHSE</option>
                        <option value="iso-ims">ISO IMS</option>
                        <option value="facility-management">
                          Facility Management
                        </option>
                        <option value="wms">Warehouse (WMS)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Linked Entity ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={
                          areaFormData.linkedEntityId || linkedEntityId || ""
                        }
                        onChange={(e) =>
                          setAreaFormData({
                            ...areaFormData,
                            linkedEntityId: e.target.value || undefined,
                          })
                        }
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                        placeholder="Entity ID from linked module"
                        disabled={!!linkedEntityId}
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Area Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={areaFormData.areaName || ""}
                    onChange={(e) =>
                      setAreaFormData({
                        ...areaFormData,
                        areaName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                    placeholder="e.g. Flammable Liquids Section"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Capacity (units) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={areaFormData.capacity || 0}
                    onChange={(e) =>
                      setAreaFormData({
                        ...areaFormData,
                        capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Stock (units)
                  </label>
                  <input
                    type="number"
                    value={areaFormData.currentStock || 0}
                    onChange={(e) =>
                      setAreaFormData({
                        ...areaFormData,
                        currentStock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Temperature Zone
                  </label>
                  <select
                    value={areaFormData.temperatureZone || ""}
                    onChange={(e) =>
                      setAreaFormData({
                        ...areaFormData,
                        temperatureZone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                  >
                    <option value="">None (Ambient)</option>
                    <option value="AMBIENT">Ambient (15°C to 25°C)</option>
                    <option value="AIR_CONDITIONED">
                      Air Conditioned (10°C to 20°C)
                    </option>
                    <option value="CHILLED">Chilled (2°C to 8°C)</option>
                    <option value="FROZEN">Frozen (-18°C to -25°C)</option>
                    <option value="COLD_CHAIN">Cold Chain (Variable)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Allowed Hazard Classes
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-4 rounded-lg bg-white/5 border border-white/10 max-h-60 overflow-y-auto">
                    {ALL_HAZARD_CLASSES.map((hc) => (
                      <label
                        key={hc.value}
                        className="flex items-center gap-2 cursor-pointer text-sm hover:text-cyan-400 transition"
                      >
                        <input
                          type="checkbox"
                          checked={(areaFormData.allowedHazards || []).includes(
                            hc.value,
                          )}
                          onChange={(e) => {
                            const current = areaFormData.allowedHazards || [];
                            if (e.target.checked) {
                              setAreaFormData({
                                ...areaFormData,
                                allowedHazards: [...current, hc.value],
                              });
                            } else {
                              setAreaFormData({
                                ...areaFormData,
                                allowedHazards: current.filter(
                                  (h) => h !== hc.value,
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        {hc.value}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Restrictions & Notes
                  </label>
                  <textarea
                    value={areaFormData.restrictions || ""}
                    onChange={(e) =>
                      setAreaFormData({
                        ...areaFormData,
                        restrictions: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white resize-none"
                    rows={3}
                    placeholder="Special requirements, safety protocols, restrictions..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={selectedArea ? handleUpdateArea : handleCreateArea}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition flex items-center gap-2 text-white"
                >
                  <i className="ri-check-line"></i>
                  {selectedArea ? "Update Area" : "Create Area"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedArea && (
          <Modal
            isOpen={true}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedArea(null);
            }}
            title={`Area Details - ${selectedArea.areaName}`}
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs text-gray-400 block mb-1">Zone</span>
                  <p className="font-semibold text-white">
                    {selectedArea.zone}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs text-gray-400 block mb-1">
                    Capacity
                  </span>
                  <p className="font-semibold text-white">
                    {selectedArea.capacity} units
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs text-gray-400 block mb-1">
                    Current Stock
                  </span>
                  <p className="font-semibold text-white">
                    {selectedArea.currentStock} units
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs text-gray-400 block mb-1">
                    Usage
                  </span>
                  <p className="font-semibold text-white">
                    {(selectedArea.utilizationPercentage || 0).toFixed(1)}%
                  </p>
                </div>
              </div>

              {selectedArea.allowedHazards.length > 0 && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs text-gray-400 block mb-2">
                    Allowed Hazard Classes
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedArea.allowedHazards.map((hc, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      >
                        {hc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedArea.restrictions && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs text-gray-400 block mb-2">
                    Restrictions & Notes
                  </span>
                  <p className="text-gray-300">{selectedArea.restrictions}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    openEditModal(selectedArea);
                  }}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold flex items-center gap-2 text-white"
                >
                  <i className="ri-edit-line"></i>
                  Edit Area
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <Modal
            isOpen={true}
            onClose={() => setShowImportModal(false)}
            title="Import Warehouse Areas"
            size="md"
          >
            <div className="space-y-4">
              <div className="relative p-8 border-2 border-dashed border-white/20 rounded-xl hover:border-cyan-500/50 transition text-center">
                <i className="ri-upload-line text-4xl text-gray-400 mb-3"></i>
                <p className="mb-2 text-white">
                  {uploading ? "Processing file..." : "Drop CSV file here"}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Supported: .csv (Max 10MB)
                </p>
                <input
                  type="file"
                  onChange={handleFileImport}
                  accept=".csv"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                {!uploading && (
                  <span className="inline-block px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 cursor-pointer transition text-white">
                    Choose File
                  </span>
                )}
                {uploading && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500"></div>
                    <span className="text-white">Processing...</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm mb-2 text-white">CSV Format:</p>
                <p className="text-xs text-gray-400 font-mono">
                  Area Code, Area Name, Zone, Capacity, Current Stock, Allowed
                  Hazards, Restrictions
                </p>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
