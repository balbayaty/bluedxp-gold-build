"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { Network, Plus, Eye, Package, TrendingUp } from "lucide-react";
import { warehouseNetworkService } from "@/lib/services/warehouse-network";
import type { WarehouseNetwork } from "@/lib/services/warehouse-network";

export default function NetworksPage() {
  const router = useRouter();
  const [networks, setNetworks] = useState<WarehouseNetwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNetworks();
  }, []);

  const loadNetworks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/warehouse-network/networks");
      const result = await response.json();
      if (result.success) {
        setNetworks(result.data);
      }
    } catch (error) {
      console.error("Failed to load networks:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="Warehouse Networks"
      description="Manage your warehouse networks"
      icon="ri-networks-line"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">All Networks</h2>
          <button
            onClick={() => router.push("/warehouse-network/networks/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Network</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-500">Warehouses</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {network.warehouses.length}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Network className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-slate-500">Coverage</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {network.coverage.regions.length} regions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-slate-500">Capacity</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {network.networkMetrics.totalCapacity.toLocaleString()}{" "}
                        m³
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-slate-500">Utilization</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {network.networkMetrics.totalUtilization}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-slate-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/warehouse-network/networks/${network.id}`);
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
