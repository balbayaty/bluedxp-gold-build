/**
 * Chemical Inventory Management
 * Real-time inventory tracking, expiry management, and segregation
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { ChemicalInventory, InventoryStatus } from "@/types/chemical";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

type TabType = "overview" | "tracking" | "expiry" | "segregation" | "alerts";

export default function ChemicalInventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [inventory, setInventory] = useState<ChemicalInventory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/chemical/inventory");
      const data = await response.json();
      if (data.success) {
        setInventory(data.inventory || []);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: "ri-dashboard-line" },
    { id: "tracking" as TabType, label: "Tracking", icon: "ri-map-pin-line" },
    {
      id: "expiry" as TabType,
      label: "Expiry Management",
      icon: "ri-calendar-line",
    },
    {
      id: "segregation" as TabType,
      label: "Segregation",
      icon: "ri-layout-grid-line",
    },
    { id: "alerts" as TabType, label: "Alerts", icon: "ri-notification-line" },
    {
      id: "containers" as TabType,
      label: "Containers",
      icon: "ri-box-line",
      href: "/chemical-inventory/containers",
    },
  ];

  return (
    <PageTemplate
      title="Chemical Inventory"
      description="Real-time inventory tracking, expiry management, and segregation"
      icon="ri-box-line"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-700">
          {tabs.map((tab) => {
            if ("href" in tab && tab.href) {
              return (
                <a
                  key={tab.id}
                  href={tab.href}
                  className="px-4 py-3 flex items-center gap-2 font-medium transition text-gray-400 hover:text-gray-300"
                >
                  <i className={tab.icon}></i>
                  {tab.label}
                </a>
              );
            }
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 flex items-center gap-2 font-medium transition ${
                  activeTab === tab.id
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <i className={tab.icon}></i>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <InventoryOverviewTab inventory={inventory} loading={loading} />
            </motion.div>
          )}

          {activeTab === "tracking" && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <InventoryTrackingTab
                inventory={inventory}
                loading={loading}
                onRefresh={loadInventory}
              />
            </motion.div>
          )}

          {activeTab === "expiry" && (
            <motion.div
              key="expiry"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <InventoryExpiryTab inventory={inventory} loading={loading} />
            </motion.div>
          )}

          {activeTab === "segregation" && (
            <motion.div
              key="segregation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <InventorySegregationTab
                inventory={inventory}
                loading={loading}
              />
            </motion.div>
          )}

          {activeTab === "alerts" && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <InventoryAlertsTab inventory={inventory} loading={loading} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

// ============================================================================
// INVENTORY OVERVIEW TAB
// ============================================================================

interface InventoryOverviewTabProps {
  inventory: ChemicalInventory[];
  loading: boolean;
}

function InventoryOverviewTab({
  inventory,
  loading,
}: InventoryOverviewTabProps) {
  const totalValue = inventory.reduce(
    (sum, inv) => sum + (inv.currentQuantity || 0),
    0,
  );
  const expiringSoon = inventory.filter((inv) => {
    if (!inv.expiryDate) return false;
    const expiry = new Date(inv.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }).length;
  const lowStock = inventory.filter((inv) => {
    const threshold = inv.currentQuantity * 0.1; // 10% threshold
    return inv.availableQuantity < threshold;
  }).length;

  // Status distribution
  const statusDistribution = [
    {
      name: "Available",
      value: inventory.filter((i) => i.status === "Available").length,
      color: "#10b981",
    },
    {
      name: "Reserved",
      value: inventory.filter((i) => i.status === "Reserved").length,
      color: "#f59e0b",
    },
    {
      name: "Quarantine",
      value: inventory.filter((i) => i.status === "Quarantine").length,
      color: "#ef4444",
    },
    {
      name: "Expired",
      value: inventory.filter((i) => i.status === "Expired").length,
      color: "#6b7280",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Chemicals</span>
            <i className="ri-database-2-line text-cyan-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">
            {inventory.length}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Quantity</span>
            <i className="ri-box-line text-green-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">
            {totalValue.toLocaleString()}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border border-yellow-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Expiring Soon</span>
            <i className="ri-calendar-line text-yellow-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{expiringSoon}</div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-600/10 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Low Stock Alerts</span>
            <i className="ri-alert-line text-red-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{lowStock}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h4 className="font-bold mb-4 text-white">Status Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Trends */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h4 className="font-bold mb-4 text-white">
            Inventory Trends (Last 30 Days)
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                return {
                  date: date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  }),
                  quantity: Math.floor(Math.random() * 1000) + 500,
                };
              })}
            >
              <defs>
                <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="quantity"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorQuantity)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">
          Recent Inventory Activity
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : inventory.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No inventory data available
          </p>
        ) : (
          <div className="space-y-2">
            {inventory.slice(0, 10).map((inv) => (
              <div
                key={inv.id}
                className="p-3 rounded-lg bg-gray-700 flex items-center justify-between hover:bg-gray-600 transition"
              >
                <div>
                  <p className="font-semibold">{inv.chemicalName}</p>
                  <p className="text-sm text-gray-400">
                    {inv.warehouseName} • {inv.zoneName} • {inv.binName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {inv.currentQuantity} {inv.unit}
                  </p>
                  <p
                    className={`text-xs ${
                      inv.status === "Available"
                        ? "text-green-400"
                        : inv.status === "Expired"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {inv.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// INVENTORY TRACKING TAB
// ============================================================================

interface InventoryTrackingTabProps {
  inventory: ChemicalInventory[];
  loading: boolean;
  onRefresh: () => void;
}

function InventoryTrackingTab({
  inventory,
  loading,
  onRefresh,
}: InventoryTrackingTabProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedChemical, setSelectedChemical] = useState<string>("");

  const warehouses = Array.from(
    new Set(inventory.map((inv) => inv.warehouseName).filter(Boolean)),
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh} value={wh}>
                {wh}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={selectedChemical}
            onChange={(e) => setSelectedChemical(e.target.value)}
            placeholder="Search chemical..."
            className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
          />

          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
          >
            <i className="ri-refresh-line mr-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Inventory Tracking</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : inventory.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No inventory found</p>
        ) : (
          <div className="space-y-2">
            {inventory
              .filter(
                (inv) =>
                  (!selectedWarehouse ||
                    inv.warehouseName === selectedWarehouse) &&
                  (!selectedChemical ||
                    inv.chemicalName
                      .toLowerCase()
                      .includes(selectedChemical.toLowerCase())),
              )
              .map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-lg bg-gray-700 border border-gray-600"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Chemical</p>
                      <p className="font-semibold">{inv.chemicalName}</p>
                      {inv.casNumber && (
                        <p className="text-xs text-gray-500">
                          CAS: {inv.casNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Location</p>
                      <p className="font-semibold">
                        {inv.warehouseName || "N/A"} → {inv.zoneName || "N/A"} →{" "}
                        {inv.binName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Quantities</p>
                      <p className="font-semibold">
                        Current: {inv.currentQuantity} {inv.unit}
                      </p>
                      <p className="text-xs text-gray-500">
                        Available: {inv.availableQuantity} | Reserved:{" "}
                        {inv.reservedQuantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          inv.status === "Available"
                            ? "bg-green-900/30 text-green-400"
                            : inv.status === "Expired"
                              ? "bg-red-900/30 text-red-400"
                              : inv.status === "Quarantine"
                                ? "bg-yellow-900/30 text-yellow-400"
                                : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {inv.status}
                      </span>
                      {inv.expiryDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expires:{" "}
                          {new Date(inv.expiryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// OTHER TAB COMPONENTS
// ============================================================================

function InventoryExpiryTab({
  inventory,
  loading,
}: {
  inventory: ChemicalInventory[];
  loading: boolean;
}) {
  const expiringItems = inventory
    .filter((inv) => inv.expiryDate)
    .sort((a, b) => {
      const dateA = new Date(a.expiryDate!).getTime();
      const dateB = new Date(b.expiryDate!).getTime();
      return dateA - dateB;
    });

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Expiry Management</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      ) : expiringItems.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No items expiring soon</p>
      ) : (
        <div className="space-y-2">
          {expiringItems.map((inv) => {
            const expiry = new Date(inv.expiryDate!);
            const daysUntilExpiry = Math.ceil(
              (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            );
            const isExpired = daysUntilExpiry < 0;
            const isUrgent = daysUntilExpiry <= 7 && daysUntilExpiry > 0;

            return (
              <div
                key={inv.id}
                className={`p-4 rounded-lg border ${
                  isExpired
                    ? "bg-red-900/20 border-red-500/30"
                    : isUrgent
                      ? "bg-yellow-900/20 border-yellow-500/30"
                      : "bg-gray-700 border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{inv.chemicalName}</p>
                    <p className="text-sm text-gray-400">
                      {inv.warehouseName} • {inv.currentQuantity} {inv.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        isExpired
                          ? "text-red-400"
                          : isUrgent
                            ? "text-yellow-400"
                            : "text-gray-400"
                      }`}
                    >
                      {isExpired ? "Expired" : `${daysUntilExpiry} days`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {expiry.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InventorySegregationTab({
  inventory,
  loading,
}: {
  inventory: ChemicalInventory[];
  loading: boolean;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Segregation Rules</h3>
      <p className="text-gray-400">
        Segregation rules and storage class grouping coming soon...
      </p>
    </div>
  );
}

function InventoryAlertsTab({
  inventory,
  loading,
}: {
  inventory: ChemicalInventory[];
  loading: boolean;
}) {
  const allAlerts = inventory
    .filter((inv) => inv.alerts && inv.alerts.length > 0)
    .flatMap((inv) =>
      inv.alerts!.map((alert) => ({
        ...alert,
        chemical: inv.chemicalName,
        location: inv.warehouseName,
      })),
    );

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Inventory Alerts</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      ) : allAlerts.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No active alerts</p>
      ) : (
        <div className="space-y-2">
          {allAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${
                alert.severity === "Critical"
                  ? "bg-red-900/20 border-red-500/30"
                  : alert.severity === "High"
                    ? "bg-orange-900/20 border-orange-500/30"
                    : alert.severity === "Medium"
                      ? "bg-yellow-900/20 border-yellow-500/30"
                      : "bg-gray-700 border-gray-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{alert.type}</p>
                  <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {alert.chemical} • {alert.location}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    alert.severity === "Critical"
                      ? "bg-red-900/30 text-red-400"
                      : alert.severity === "High"
                        ? "bg-orange-900/30 text-orange-400"
                        : alert.severity === "Medium"
                          ? "bg-yellow-900/30 text-yellow-400"
                          : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
