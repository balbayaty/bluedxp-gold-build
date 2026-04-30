"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import {
  Network,
  Package,
  MapPin,
  TrendingUp,
  ArrowRightLeft,
  Plus,
  Edit,
} from "lucide-react";
import type {
  WarehouseNetwork,
  NetworkRoute,
} from "@/lib/services/warehouse-network";

export default function NetworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const networkId = params.id as string;

  const [network, setNetwork] = useState<WarehouseNetwork | null>(null);
  const [routes, setRoutes] = useState<NetworkRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (networkId) {
      loadNetwork();
      loadRoutes();
    }
  }, [networkId]);

  const loadNetwork = async () => {
    try {
      const response = await fetch(
        `/api/warehouse-network/networks/${networkId}`,
      );
      const result = await response.json();
      if (result.success) {
        setNetwork(result.data);
      }
    } catch (error) {
      console.error("Failed to load network:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    try {
      const response = await fetch(
        `/api/warehouse-network/routes?networkId=${networkId}`,
      );
      const result = await response.json();
      if (result.success) {
        setRoutes(result.data);
      }
    } catch (error) {
      console.error("Failed to load routes:", error);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Network Details"
        description="View network information"
        icon="ri-networks-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-slate-500">Loading network details...</p>
        </div>
      </PageTemplate>
    );
  }

  if (!network) {
    return (
      <PageTemplate
        title="Network Not Found"
        description="The network you're looking for doesn't exist"
        icon="ri-error-warning-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Network not found
          </h3>
          <p className="text-slate-500 mb-6">
            The network you're looking for doesn't exist
          </p>
          <button
            onClick={() => router.push("/warehouse-network")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View All Networks
          </button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Network Details"
      description={network.name}
      icon="ri-networks-line"
    >
      <div className="space-y-6">
        {/* Network Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {network.name}
              </h2>
              <p className="text-slate-500">{network.description}</p>
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

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Warehouses</p>
              <p className="text-2xl font-bold text-slate-800">
                {network.warehouses.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Capacity</p>
              <p className="text-2xl font-bold text-slate-800">
                {network.networkMetrics.totalCapacity.toLocaleString()} m³
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Utilization</p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${network.networkMetrics.totalUtilization}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-slate-800">
                  {network.networkMetrics.totalUtilization}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">On-Time Performance</p>
              <p className="text-2xl font-bold text-slate-800">
                {network.networkMetrics.onTimePerformance}%
              </p>
            </div>
          </div>
        </div>

        {/* Warehouses */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Warehouses</h3>
            <button
              onClick={() =>
                router.push(
                  `/warehouse-network/networks/${networkId}/add-warehouse`,
                )
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Warehouse</span>
            </button>
          </div>
          <div className="space-y-3">
            {network.warehouses.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No warehouses in this network
              </p>
            ) : (
              network.warehouses.map((warehouse) => (
                <div
                  key={warehouse.warehouseId}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {warehouse.warehouseName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {warehouse.warehouseCode} •{" "}
                      {warehouse.role.replace(/_/g, " ")}
                      {warehouse.isPrimary && " • Primary"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Routes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Network Routes
            </h3>
            <button
              onClick={() =>
                router.push(
                  `/warehouse-network/routes/new?networkId=${networkId}`,
                )
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Route</span>
            </button>
          </div>
          <div className="space-y-3">
            {routes.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No routes configured
              </p>
            ) : (
              routes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {route.originWarehouseId}
                      </p>
                    </div>
                    <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-800">
                        {route.destinationWarehouseId}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-sm text-slate-500">
                        {route.routeType.replace(/_/g, " ")} •{" "}
                        {route.frequency.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coverage */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Coverage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-2">Regions</p>
              <div className="flex flex-wrap gap-2">
                {network.coverage.regions.map((region) => (
                  <span
                    key={region}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                  >
                    {region}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-2">Countries</p>
              <div className="flex flex-wrap gap-2">
                {network.coverage.countries.map((country) => (
                  <span
                    key={country}
                    className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Capabilities
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(network.capabilities).map(
              ([key, value]) =>
                value && (
                  <div key={key} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-700">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </div>
                ),
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
