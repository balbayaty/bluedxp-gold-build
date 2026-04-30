/**
 * Warehouse Areas Manager Component
 * Manage warehouse zones, aisles, and areas
 * Migrated from chemcheck-ai/components/WarehouseAreasManager.tsx
 * Adapted for BlueDXP Platform
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface WarehouseArea {
  id: string;
  name: string;
  type: "Zone" | "Aisle" | "Section" | "Area";
  parentId?: string;
  warehouse: string;
  description?: string;
  capacity?: number;
  currentUtilization?: number;
  status: "Active" | "Inactive" | "Maintenance";
  metadata?: Record<string, any>;
}

interface WarehouseAreasManagerProps {
  warehouseId?: string;
  onAreaSelect?: (area: WarehouseArea) => void;
  onAreaCreate?: (area: Omit<WarehouseArea, "id">) => void;
  onAreaUpdate?: (area: WarehouseArea) => void;
  onAreaDelete?: (areaId: string) => void;
}

export default function WarehouseAreasManager({
  warehouseId,
  onAreaSelect,
  onAreaCreate,
  onAreaUpdate,
  onAreaDelete,
}: WarehouseAreasManagerProps) {
  const [areas, setAreas] = useState<WarehouseArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<WarehouseArea | null>(null);
  const [selectedType, setSelectedType] = useState<
    "Zone" | "Aisle" | "Section" | "Area"
  >("Zone");
  const [warehouses, setWarehouses] = useState<
    Array<{ name: string; warehouse_name: string }>
  >([]);
  const [newArea, setNewArea] = useState({
    name: "",
    type: "Zone" as WarehouseArea["type"],
    warehouse: warehouseId || "",
    description: "",
    capacity: 0,
    status: "Active" as WarehouseArea["status"],
  });

  useEffect(() => {
    fetchWarehouses();
    fetchAreas();
  }, [warehouseId]);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/erpnext/warehouses");
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
        if (!warehouseId && data.warehouses?.length > 0) {
          setNewArea({ ...newArea, warehouse: data.warehouses[0].name });
        }
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchAreas = async () => {
    try {
      // In production, this would fetch from API
      // For now, use mock data
      setAreas(generateMockAreas());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching areas:", error);
      setLoading(false);
    }
  };

  const generateMockAreas = (): WarehouseArea[] => {
    return [
      {
        id: "area-001",
        name: "Zone A",
        type: "Zone",
        warehouse: warehouseId || "WH-001",
        description: "Main storage zone",
        capacity: 10000,
        currentUtilization: 7500,
        status: "Active",
      },
      {
        id: "area-002",
        name: "Zone B",
        type: "Zone",
        warehouse: warehouseId || "WH-001",
        description: "Secondary storage zone",
        capacity: 8000,
        currentUtilization: 6000,
        status: "Active",
      },
      {
        id: "area-003",
        name: "Aisle 01",
        type: "Aisle",
        parentId: "area-001",
        warehouse: warehouseId || "WH-001",
        description: "Main aisle in Zone A",
        status: "Active",
      },
    ];
  };

  const handleCreateArea = () => {
    const areaData: WarehouseArea = {
      id: `area-${Date.now()}`,
      ...newArea,
    };
    setAreas([...areas, areaData]);
    onAreaCreate?.(newArea);
    setShowCreateModal(false);
    setNewArea({
      name: "",
      type: "Zone",
      warehouse: warehouseId || warehouses[0]?.name || "",
      description: "",
      capacity: 0,
      status: "Active",
    });
  };

  const handleUpdateArea = () => {
    if (!selectedArea) return;
    setAreas(areas.map((a) => (a.id === selectedArea.id ? selectedArea : a)));
    onAreaUpdate?.(selectedArea);
    setShowEditModal(false);
    setSelectedArea(null);
  };

  const handleDeleteArea = (areaId: string) => {
    if (confirm("Are you sure you want to delete this area?")) {
      setAreas(areas.filter((a) => a.id !== areaId));
      onAreaDelete?.(areaId);
    }
  };

  const filteredAreas = warehouseId
    ? areas.filter((a) => a.warehouse === warehouseId)
    : areas;

  const groupedAreas = filteredAreas.reduce(
    (acc, area) => {
      if (!acc[area.type]) {
        acc[area.type] = [];
      }
      acc[area.type].push(area);
      return acc;
    },
    {} as Record<string, WarehouseArea[]>,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Warehouse Areas
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage zones, aisles, and sections
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <i className="ri-add-line"></i>
          Add Area
        </button>
      </div>

      {/* Filter by Type */}
      <div className="flex gap-2">
        {(["Zone", "Aisle", "Section", "Area"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedType === type
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {type}s ({groupedAreas[type]?.length || 0})
          </button>
        ))}
      </div>

      {/* Areas List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading areas...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(groupedAreas[selectedType] || []).map((area) => (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedArea(area);
                onAreaSelect?.(area);
                setShowEditModal(true);
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {area.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {area.type}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    area.status === "Active"
                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                      : area.status === "Maintenance"
                        ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {area.status}
                </span>
              </div>

              {area.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {area.description}
                </p>
              )}

              {area.capacity && (
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      Utilization
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {area.currentUtilization || 0} / {area.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${((area.currentUtilization || 0) / area.capacity) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedArea(area);
                    setShowEditModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <i className="ri-edit-line mr-1"></i>
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteArea(area.id);
                  }}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Create New Area
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Area Name *
                </label>
                <input
                  type="text"
                  value={newArea.name}
                  onChange={(e) =>
                    setNewArea({ ...newArea, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Zone A, Aisle 01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type *
                </label>
                <select
                  value={newArea.type}
                  onChange={(e) =>
                    setNewArea({
                      ...newArea,
                      type: e.target.value as WarehouseArea["type"],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Zone">Zone</option>
                  <option value="Aisle">Aisle</option>
                  <option value="Section">Section</option>
                  <option value="Area">Area</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse *
                </label>
                <select
                  value={newArea.warehouse}
                  onChange={(e) =>
                    setNewArea({ ...newArea, warehouse: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.name} value={wh.name}>
                      {wh.warehouse_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newArea.description}
                  onChange={(e) =>
                    setNewArea({ ...newArea, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Area description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacity (optional)
                </label>
                <input
                  type="number"
                  value={newArea.capacity}
                  onChange={(e) =>
                    setNewArea({
                      ...newArea,
                      capacity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateArea}
                disabled={!newArea.name || !newArea.warehouse}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Area
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Edit Area
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedArea(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Area Name
                </label>
                <input
                  type="text"
                  value={selectedArea.name}
                  onChange={(e) =>
                    setSelectedArea({ ...selectedArea, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={selectedArea.status}
                  onChange={(e) =>
                    setSelectedArea({
                      ...selectedArea,
                      status: e.target.value as WarehouseArea["status"],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedArea(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateArea}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
