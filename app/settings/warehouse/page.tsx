"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import {
  getStorageLocationLinks,
  getWorkCenterLinks,
} from "@/utils/moduleInterconnectivity";
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
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";
import {
  listWarehouses,
  createWarehouse,
  updateWarehouse,
} from "@/app/actions/wms/warehouseSettings";
import type { WarehouseType, WarehouseStatus } from "@prisma/client";

interface WarehouseConfig {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  type:
    | "MAIN"
    | "DISTRIBUTION"
    | "CROSS_DOCK"
    | "COLD_STORAGE"
    | "HAZMAT"
    | "BONDED";
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  address: string;
  city: string;
  country: string;
  totalArea: number; // m²
  storageCapacity: number; // m³
  weightCapacity: number; // kg
  zones: Array<{
    zoneCode: string;
    zoneName: string;
    zoneType: "BULK" | "RACK" | "COLD" | "HAZMAT" | "PICKING";
    capacity: number;
    utilization: number;
  }>;
  equipment: Array<{
    equipmentType: string;
    quantity: number;
    status: "OPERATIONAL" | "MAINTENANCE" | "OUT_OF_SERVICE";
  }>;
  operatingHours: {
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
  };
  contactInfo: {
    manager: string;
    phone: string;
    email: string;
  };
  complianceStandards: string[];
  lastModified: Date | string;
  modifiedBy: string;
  createdAt: Date | string;
}

const generateWarehouseConfigs = (count: number = 20): WarehouseConfig[] => {
  const types: WarehouseConfig["type"][] = [
    "MAIN",
    "DISTRIBUTION",
    "CROSS_DOCK",
    "COLD_STORAGE",
    "HAZMAT",
    "BONDED",
  ];
  const statuses: WarehouseConfig["status"][] = [
    "ACTIVE",
    "INACTIVE",
    "MAINTENANCE",
  ];
  const cities = [
    "Riyadh",
    "Jeddah",
    "Dammam",
    "Khobar",
    "Mecca",
    "Medina",
    "Abha",
    "Tabuk",
    "Buraidah",
    "Al Jubail",
    "Yanbu",
  ];

  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];

    const zones = Array.from(
      { length: Math.floor(Math.random() * 5) + 3 },
      (_, j) => ({
        zoneCode: `ZONE-${String(j + 1).padStart(2, "0")}`,
        zoneName: `Zone ${j + 1}`,
        zoneType: ["BULK", "RACK", "COLD", "HAZMAT", "PICKING"][
          Math.floor(Math.random() * 5)
        ] as any,
        capacity: Math.random() * 10000 + 1000,
        utilization: Math.random() * 100,
      }),
    );

    const equipment = [
      {
        equipmentType: "Forklift",
        quantity: Math.floor(Math.random() * 10) + 2,
        status: "OPERATIONAL" as const,
      },
      {
        equipmentType: "Pallet Jack",
        quantity: Math.floor(Math.random() * 20) + 5,
        status: "OPERATIONAL" as const,
      },
      {
        equipmentType: "Conveyor",
        quantity: Math.floor(Math.random() * 5) + 1,
        status:
          Math.random() > 0.8
            ? ("MAINTENANCE" as const)
            : ("OPERATIONAL" as const),
      },
    ];

    return {
      id: `WH-${String(i + 1).padStart(6, "0")}`,
      warehouseCode: `WH-${city.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
      warehouseName: `${city} Warehouse ${i + 1}`,
      type,
      status,
      address: `Industrial Area ${Math.floor(Math.random() * 10) + 1}, ${city}`,
      city,
      country: "UAE",
      totalArea: Math.random() * 50000 + 10000,
      storageCapacity: Math.random() * 100000 + 20000,
      weightCapacity: Math.random() * 500000 + 100000,
      zones,
      equipment,
      operatingHours: {
        startTime: "07:00",
        endTime: "19:00",
        daysOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
      },
      contactInfo: {
        manager: `Manager ${i + 1}`,
        phone: `+966${["50", "51", "52", "53", "54", "55", "56", "57", "58", "59"][Math.floor(Math.random() * 10)]}${Math.floor(
          Math.random() * 10000000,
        )
          .toString()
          .padStart(7, "0")}`,
        email: `warehouse${i + 1}@example.com`,
      },
      complianceStandards: [
        "SASO Standards",
        "SABER Certification",
        "SFDA Food Safety",
        "MODON Industrial Compliance",
        "ZATCA Customs Compliance",
        "ISO 9001:2015",
        "ISO 14001:2015",
        "ISO 45001:2018",
        "Halal Certification",
      ].slice(0, Math.floor(Math.random() * 5) + 3),
      lastModified: new Date(Date.now() - Math.random() * 90 * 86400000),
      modifiedBy: `User ${Math.floor(Math.random() * 10) + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 365 * 86400000),
    };
  });
};

export default function WarehouseSetup() {
  const router = useRouter();
  // Start with empty, will load from DB
  const [configs, setConfigs] = useState<WarehouseConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from backend
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await listWarehouses("tenant-1"); // Hardcoded tenant for now
      if (res.success && res.data) {
        // Adapt Prisma model to local WarehouseConfig interface
        const adapted: WarehouseConfig[] = res.data.map((w) => ({
          id: w.id,
          warehouseCode: w.code,
          warehouseName: w.name,
          type: w.type as any, // Cast to local union if needed
          status: w.status as any,
          address: (w.location as any)?.address || "",
          city: (w.location as any)?.city || "",
          country: (w.location as any)?.country || "UAE",
          totalArea: 5000, // Def
          storageCapacity: w.capacity || 20000,
          weightCapacity: 100000,
          zones:
            (w as any).areas?.map((a: any) => ({
              zoneCode: a.code || "Z-01",
              zoneName: a.name,
              zoneType: a.type || "BULK",
              capacity: a.capacity || 1000,
              utilization: 0,
            })) || [],
          equipment: [],
          operatingHours: {
            startTime: "08:00",
            endTime: "17:00",
            daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri"],
          },
          contactInfo: { manager: "", phone: "", email: "" },
          complianceStandards: [],
          lastModified: w.updatedAt,
          modifiedBy: "System",
          createdAt: w.createdAt,
        }));
        setConfigs(adapted);
      } else {
        console.error(res.error);
        // Fallback to mock if fetch fails? Or just show error?
        // leaving empty to show "No warehouses" is better than confusing generic data
      }
      setLoading(false);
    }
    loadData();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "grid",
  );
  const [selectedConfig, setSelectedConfig] = useState<WarehouseConfig | null>(
    null,
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<Partial<WarehouseConfig>>({});
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalWarehouses: 0,
    active: 0,
    totalCapacity: 0,
    totalUtilization: 0,
  });

  const filteredConfigs = useMemo(() => {
    return configs.filter((config) => {
      const matchesSearch =
        config.warehouseCode
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        config.warehouseName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        config.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === "ALL" || config.type === selectedType;
      const matchesStatus =
        selectedStatus === "ALL" || config.status === selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [configs, searchQuery, selectedType, selectedStatus]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    configs.forEach((c) => {
      counts[c.type] = (counts[c.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      count,
    }));
  }, [configs]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    configs.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [configs]);

  const capacityUtilization = useMemo(() => {
    return configs.map((c) => ({
      warehouse: c.warehouseCode,
      capacity: c.storageCapacity,
      utilization: c.zones.reduce(
        (sum, z) => sum + (z.capacity * z.utilization) / 100,
        0,
      ),
    }));
  }, [configs]);

  const aggregateStats = useMemo(() => {
    const totalWarehouses = configs.length;
    const active = configs.filter((c) => c.status === "ACTIVE").length;
    const totalCapacity = configs.reduce(
      (sum, c) => sum + c.storageCapacity,
      0,
    );
    const totalUtilization =
      (configs.reduce(
        (sum, c) =>
          sum +
          c.zones.reduce((s, z) => s + (z.capacity * z.utilization) / 100, 0),
        0,
      ) /
        totalCapacity) *
      100;

    return {
      totalWarehouses,
      active,
      totalCapacity,
      totalUtilization: parseFloat(totalUtilization.toFixed(1)),
    };
  }, [configs]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "warehouse-setup-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "warehouse-setup-stats",
      () => ({
        totalWarehouses: aggregateStats.totalWarehouses,
        active: simulateKPIUpdates(aggregateStats.active, 0.05),
        totalCapacity: aggregateStats.totalCapacity,
        totalUtilization: simulateKPIUpdates(
          aggregateStats.totalUtilization,
          0.02,
        ),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    realTimeEnabled,
    aggregateStats.totalWarehouses,
    aggregateStats.active,
    aggregateStats.totalCapacity,
    aggregateStats.totalUtilization,
  ]);

  const stats = [
    {
      label: "Total Warehouses",
      value: realTimeEnabled
        ? realTimeStats.totalWarehouses
        : aggregateStats.totalWarehouses,
      icon: "ri-warehouse-fill",
      tooltip: "Total warehouses",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: realTimeEnabled ? realTimeStats.active : aggregateStats.active,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active warehouses",
      trend: "up" as const,
    },
    {
      label: "Total Capacity",
      value: `${((realTimeEnabled ? realTimeStats.totalCapacity : aggregateStats.totalCapacity) / 1000).toFixed(0)}K m³`,
      icon: "ri-stack-line",
      tooltip: "Total storage capacity",
      trend: "up" as const,
    },
    {
      label: "Utilization",
      value: `${(realTimeEnabled ? realTimeStats.totalUtilization : aggregateStats.totalUtilization).toFixed(1)}%`,
      icon: "ri-bar-chart-box-line",
      tooltip: "Average utilization",
      trend: "neutral" as const,
    },
  ];

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const handleView = (config: WarehouseConfig) => {
    setSelectedConfig(config);
    setShowViewModal(true);
  };

  const handleCreate = () => {
    setFormData({
      type: "MAIN",
      status: "ACTIVE",
      country: "UAE",
      zones: [],
      equipment: [],
      operatingHours: {
        startTime: "07:00",
        endTime: "19:00",
        daysOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
      },
      complianceStandards: [],
    });
    setShowCreateModal(true);
  };

  const handleEdit = (config: WarehouseConfig) => {
    setFormData({
      id: config.id,
      warehouseCode: config.warehouseCode,
      warehouseName: config.warehouseName,
      type: config.type,
      status: config.status,
      city: config.city,
      totalArea: config.totalArea,
      storageCapacity: config.storageCapacity,
      weightCapacity: config.weightCapacity,
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (formData.warehouseCode && formData.warehouseName) {
      try {
        if (formData.id) {
          // Update existing
          const result = await updateWarehouse(formData.id, {
            name: formData.warehouseName,
            type: formData.type as WarehouseType,
            status: formData.status as WarehouseStatus,
            capacity: formData.storageCapacity,
          });

          if (result.success && result.data) {
            setConfigs((prev) =>
              prev.map((c) =>
                c.id === formData.id
                  ? {
                      ...c,
                      warehouseName: result.data!.name,
                      type: result.data!.type as any,
                      status: result.data!.status as any,
                      storageCapacity: result.data!.capacity,
                    }
                  : c,
              ),
            );
            setShowCreateModal(false);
            setFormData({});
          } else {
            alert("Error updating warehouse: " + result.error);
          }
        } else {
          // Create new
          const result = await createWarehouse({
            code: formData.warehouseCode,
            name: formData.warehouseName,
            type: (formData.type as WarehouseType) || "MAIN",
            status: (formData.status as WarehouseStatus) || "ACTIVE",
            tenantId: "tenant-1",
            city: formData.city,
            country: formData.country,
          });

          if (result.success && result.data) {
            // Determine the new config object with adapters
            const w = result.data;
            const newConfig: WarehouseConfig = {
              id: w.id,
              warehouseCode: w.code,
              warehouseName: w.name,
              type: w.type as any,
              status: w.status as any,
              address: (w.location as any)?.address || "",
              city: (w.location as any)?.city || "",
              country: (w.location as any)?.country || "UAE",
              totalArea: formData.totalArea || 0,
              storageCapacity: w.capacity || 0,
              weightCapacity: formData.weightCapacity || 0,
              zones: [],
              equipment: [],
              operatingHours: {
                startTime: "07:00",
                endTime: "19:00",
                daysOfWeek: [],
              },
              contactInfo: { manager: "", phone: "", email: "" },
              complianceStandards: [],
              lastModified: w.updatedAt,
              modifiedBy: "Current User",
              createdAt: w.createdAt,
            };

            setConfigs((prev) => [newConfig, ...prev]);
            setShowCreateModal(false);
            setFormData({});
            // Ideally show success toast
          } else {
            alert("Error creating warehouse: " + result.error);
          }
        }
      } catch (e) {
        alert("An unexpected error occurred");
        console.error(e);
      }
    } else {
      alert("Please fill in required fields");
    }
  };

  return (
    <PageTemplate
      title="Warehouse Setup"
      description="Warehouse configuration management with zone setup, equipment tracking, capacity planning, operating hours, and compliance standards"
      icon="ri-warehouse-fill"
      systemInfo={{
        sap: "Warehouse Setup, Warehouse Management",
        oracle: "Warehouse Setup, Warehouse Management",
        manhattan: "Warehouse Setup, Warehouse Management",
      }}
      examples={[
        "Warehouse configuration",
        "Zone management",
        "Equipment tracking",
        "Capacity planning",
        "Operating hours",
        "Compliance standards",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Grid View"
            >
              <i className="ri-grid-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Table View"
            >
              <i className="ri-table-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "analytics"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Analytics View"
            >
              <i className="ri-bar-chart-line text-sm sm:text-base"></i>
            </button>
          </div>
          <button
            onClick={handleCreate}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Create Warehouse
          </button>
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              realTimeEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i
              className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
            ></i>
            Real-time
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search warehouses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="MAIN">Main</option>
          <option value="DISTRIBUTION">Distribution</option>
          <option value="CROSS_DOCK">Cross Dock</option>
          <option value="COLD_STORAGE">Cold Storage</option>
          <option value="HAZMAT">Hazmat</option>
          <option value="BONDED">Bonded</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConfigs.map((config, index) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        config.type === "MAIN"
                          ? "bg-blue-500/20 text-blue-400"
                          : config.type === "COLD_STORAGE"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : config.type === "HAZMAT"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {config.type.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        config.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : config.status === "MAINTENANCE"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {config.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1 font-mono">
                    {config.warehouseCode}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {config.warehouseName}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Location:</span>
                  <span className="text-white text-xs">{config.city}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Total Area:</span>
                  <span className="text-white font-medium">
                    {(config.totalArea / 1000).toFixed(1)}K m²
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Storage Capacity:</span>
                  <span className="text-white font-medium">
                    {(config.storageCapacity / 1000).toFixed(1)}K m³
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Zones:</span>
                  <span className="text-white">
                    {config.zones.length} zones
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Equipment:</span>
                  <span className="text-white">
                    {config.equipment.reduce((sum, e) => sum + e.quantity, 0)}{" "}
                    units
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Operating Hours:</span>
                  <span className="text-white text-xs">
                    {config.operatingHours.startTime} -{" "}
                    {config.operatingHours.endTime}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleView(config)}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
                <button
                  onClick={() =>
                    router.push(`/warehouses?warehouse=${config.warehouseCode}`)
                  }
                  className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                  title="View Warehouse Details"
                >
                  <i className="ri-arrow-right-line"></i>
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Warehouse Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Zones
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
                {filteredConfigs.map((config, index) => (
                  <motion.tr
                    key={config.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {config.warehouseCode}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">
                        {config.warehouseName}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {config.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          config.type === "MAIN"
                            ? "bg-blue-500/20 text-blue-400"
                            : config.type === "COLD_STORAGE"
                              ? "bg-cyan-500/20 text-cyan-400"
                              : config.type === "HAZMAT"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {config.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{config.city}</div>
                      <div className="text-xs text-[#9ca3af]">
                        {config.country}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {(config.storageCapacity / 1000).toFixed(1)}K m³
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {(config.totalArea / 1000).toFixed(1)}K m²
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {config.zones.length} zones
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {config.equipment.reduce(
                          (sum, e) => sum + e.quantity,
                          0,
                        )}{" "}
                        equipment
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          config.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : config.status === "MAINTENANCE"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {config.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="Edit Configuration" position="top">
                          <button
                            onClick={() => handleEdit(config)}
                            className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                          >
                            <i className="ri-pencil-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => handleView(config)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="View Warehouse" position="top">
                          <button
                            onClick={() =>
                              router.push(
                                `/warehouses?warehouse=${config.warehouseCode}`,
                              )
                            }
                            className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                          >
                            <i className="ri-arrow-right-line"></i>
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Warehouse Type Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, count }) => `${type}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
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
                Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="status" stroke="#9ca3af" fontSize={10} />
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
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Capacity vs Utilization
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={capacityUtilization.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="warehouse"
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
                <Legend />
                <Bar dataKey="capacity" fill="#06b6d4" name="Capacity (m³)" />
                <Bar
                  dataKey="utilization"
                  fill="#10b981"
                  name="Utilization (m³)"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedConfig(null);
        }}
        title={`Warehouse Configuration - ${selectedConfig?.warehouseName || ""}`}
        size="lg"
      >
        {selectedConfig && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Warehouse Code
                </div>
                <div className="text-white font-medium font-mono">
                  {selectedConfig.warehouseCode}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Warehouse Name
                </div>
                <div className="text-white">{selectedConfig.warehouseName}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Type</div>
                <div className="text-white">
                  {selectedConfig.type.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedConfig.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedConfig.status === "MAINTENANCE"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedConfig.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Address</div>
                <div className="text-white">{selectedConfig.address}</div>
                <div className="text-xs text-[#9ca3af]">
                  {selectedConfig.city}, {selectedConfig.country}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Contact</div>
                <div className="text-white">
                  {selectedConfig.contactInfo.manager}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {selectedConfig.contactInfo.phone}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {selectedConfig.contactInfo.email}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Area</div>
                <div className="text-lg font-semibold text-white">
                  {(selectedConfig.totalArea / 1000).toFixed(1)}K m²
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Storage Capacity
                </div>
                <div className="text-lg font-semibold text-white">
                  {(selectedConfig.storageCapacity / 1000).toFixed(1)}K m³
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Weight Capacity
                </div>
                <div className="text-lg font-semibold text-white">
                  {(selectedConfig.weightCapacity / 1000).toFixed(1)}K kg
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Zones</div>
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                {selectedConfig.zones.map((zone, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-white/5 rounded"
                  >
                    <div>
                      <div className="text-sm text-white font-mono">
                        {zone.zoneCode}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {zone.zoneName} - {zone.zoneType}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">
                        {(zone.capacity / 1000).toFixed(1)}K m³
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {zone.utilization.toFixed(1)}% utilized
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Equipment</div>
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                {selectedConfig.equipment.map((eq, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-white/5 rounded"
                  >
                    <div className="text-sm text-white">{eq.equipmentType}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white font-medium">
                        {eq.quantity} units
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          eq.status === "OPERATIONAL"
                            ? "bg-green-500/20 text-green-400"
                            : eq.status === "MAINTENANCE"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {eq.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Operating Hours</div>
              <div className="text-white">
                {selectedConfig.operatingHours.startTime} -{" "}
                {selectedConfig.operatingHours.endTime}
              </div>
              <div className="text-xs text-[#9ca3af] mt-1">
                {selectedConfig.operatingHours.daysOfWeek.join(", ")}
              </div>
            </div>
            {selectedConfig.complianceStandards.length > 0 && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-2">
                  Compliance Standards
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedConfig.complianceStandards.map((standard, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400"
                    >
                      {standard}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <ModuleLinks
              links={[
                {
                  label: "View Warehouse",
                  href: `/warehouses?warehouse=${selectedConfig.warehouseCode}`,
                },
                {
                  label: "Storage Locations",
                  href: `/storage-locations?warehouse=${selectedConfig.warehouseCode}`,
                },
                {
                  label: "Work Centers",
                  href: `/work-centers?warehouse=${selectedConfig.warehouseCode}`,
                },
              ]}
            />
          </div>
        )}
      </Modal>

      {/* Create Modal - Simplified for now */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({});
        }}
        title={
          formData.id
            ? "Edit Warehouse Configuration"
            : "Create Warehouse Configuration"
        }
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Warehouse Code *
            </label>
            <input
              type="text"
              value={formData.warehouseCode || ""}
              onChange={(e) =>
                setFormData({ ...formData, warehouseCode: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="WH-XXX-001"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Warehouse Name *
            </label>
            <input
              type="text"
              value={formData.warehouseName || ""}
              onChange={(e) =>
                setFormData({ ...formData, warehouseName: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Warehouse Name"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">Type</label>
              <select
                value={formData.type || "MAIN"}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="MAIN">Main</option>
                <option value="DISTRIBUTION">Distribution</option>
                <option value="CROSS_DOCK">Cross Dock</option>
                <option value="COLD_STORAGE">Cold Storage</option>
                <option value="HAZMAT">Hazmat</option>
                <option value="BONDED">Bonded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Status
              </label>
              <select
                value={formData.status || "ACTIVE"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">City</label>
              <input
                type="text"
                value={formData.city || ""}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Total Area (m²)
              </label>
              <input
                type="number"
                value={formData.totalArea || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalArea: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Storage Capacity (m³)
              </label>
              <input
                type="number"
                value={formData.storageCapacity || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    storageCapacity: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="20000"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Weight Capacity (kg)
              </label>
              <input
                type="number"
                value={formData.weightCapacity || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weightCapacity: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="100000"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Warehouse
            </button>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setFormData({});
              }}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
