"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { Route, ArrowRight, Clock, Package, Plus } from "lucide-react";
import type { NetworkRoute } from "@/lib/services/warehouse-network";

export default function RoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<NetworkRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("network-1");

  useEffect(() => {
    loadRoutes();
  }, [selectedNetwork]);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/warehouse-network/routes?networkId=${selectedNetwork}`,
      );
      const result = await response.json();
      if (result.success) {
        setRoutes(result.data);
      }
    } catch (error) {
      console.error("Failed to load routes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="Network Routes"
      description="Manage routes between warehouse networks"
      icon="ri-route-line"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Network Routes</h2>
          <button
            onClick={() => router.push("/warehouse-network/routes/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Route</span>
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
        ) : routes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Route className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No routes found
            </h3>
            <p className="text-slate-500 mb-6">
              Create routes to connect warehouses in your network
            </p>
            <button
              onClick={() => router.push("/warehouse-network/routes/new")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create Route
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {routes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">
                      {route.routeType.replace(/_/g, " ")}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {route.frequency.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      route.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {route.status}
                  </span>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Origin</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {route.originWarehouseId}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Destination</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {route.destinationWarehouseId}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {route.distance && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Distance</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {route.distance} km
                      </p>
                    </div>
                  )}
                  {route.estimatedTransitTime && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        Transit Time
                      </p>
                      <p className="text-sm font-semibold text-slate-800 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {route.estimatedTransitTime} hours
                      </p>
                    </div>
                  )}
                  {route.cost && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Cost</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {route.cost.toLocaleString()} SAR
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
