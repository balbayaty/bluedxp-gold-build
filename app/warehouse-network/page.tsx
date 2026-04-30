"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import {
  Network,
  TrendingUp,
  Package,
  ArrowRightLeft,
  MapPin,
} from "lucide-react";
import { warehouseNetworkService } from "@/lib/services/warehouse-network";
import type { WarehouseNetwork } from "@/lib/services/warehouse-network";

export default function WarehouseNetworkDashboard() {
  const router = useRouter();
  const [networks, setNetworks] = useState<WarehouseNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNetworks: 0,
    totalWarehouses: 0,
    activeTransfers: 0,
    averageUtilization: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/warehouse-network/networks");
      const result = await response.json();
      if (result.success) {
        const allNetworks = result.data;
        setNetworks(allNetworks);

        // Calculate stats
        const totalWarehouses = allNetworks.reduce(
          (sum: number, n: any) => sum + n.warehouses.length,
          0,
        );
        const avgUtilization =
          allNetworks.length > 0
            ? allNetworks.reduce(
                (sum: number, n: any) =>
                  sum + n.networkMetrics.totalUtilization,
                0,
              ) / allNetworks.length
            : 0;

        setStats({
          totalNetworks: allNetworks.length,
          totalWarehouses,
          activeTransfers: 0, // TODO: Get from transfers
          averageUtilization: Math.round(avgUtilization * 10) / 10,
        });
      }
    } catch (error) {
      console.error("Failed to load network data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="Warehouse Network"
      description="Manage multi-location warehouse networks and distribution centers"
      icon="ri-node-tree"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
            <Network className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">{stats.totalNetworks}</div>
            <div className="text-sm opacity-90 mt-1">Total Networks</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <Package className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">{stats.totalWarehouses}</div>
            <div className="text-sm opacity-90 mt-1">Total Warehouses</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <ArrowRightLeft className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">{stats.activeTransfers}</div>
            <div className="text-sm opacity-90 mt-1">Active Transfers</div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <TrendingUp className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">
              {stats.averageUtilization}%
            </div>
            <div className="text-sm opacity-90 mt-1">Avg Utilization</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/warehouse-network/networks/new")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition flex items-center space-x-4"
          >
            <div className="bg-blue-100 p-3 rounded-lg">
              <Network className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-800">Create Network</div>
              <div className="text-sm text-slate-500">
                Set up a new warehouse network
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/warehouse-network/transfers/new")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition flex items-center space-x-4"
          >
            <div className="bg-green-100 p-3 rounded-lg">
              <ArrowRightLeft className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-800">New Transfer</div>
              <div className="text-sm text-slate-500">
                Transfer inventory between warehouses
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/warehouse-network/analytics")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition flex items-center space-x-4"
          >
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-800">Analytics</div>
              <div className="text-sm text-slate-500">
                View network performance
              </div>
            </div>
          </button>
        </div>

        {/* Networks List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800">
              Warehouse Networks
            </h2>
            <button
              onClick={() => router.push("/warehouse-network/networks/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create Network
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-lg p-6 animate-pulse"
                >
                  <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : networks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Network className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                No networks found
              </h3>
              <p className="text-slate-500 mb-6">
                Create your first warehouse network to get started
              </p>
              <button
                onClick={() => router.push("/warehouse-network/networks/new")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create Network
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {networks.map((network) => (
                <div
                  key={network.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
                  onClick={() =>
                    router.push(`/warehouse-network/networks/${network.id}`)
                  }
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-1">
                        {network.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {network.description}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        network.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : network.status === "PLANNING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {network.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Warehouses</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {network.warehouses.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Coverage</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {network.coverage.regions.length} regions
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Capacity</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {network.networkMetrics.totalCapacity.toLocaleString()}{" "}
                        m³
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Utilization</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {network.networkMetrics.totalUtilization}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
