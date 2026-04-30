/**
 * Ports & Terminals Management
 *
 * Manage port operations and terminal activities
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { apiFetch } from "@/utils/apiFetch";
import { PremiumLoader } from "@/components/loading";
import type { Port } from "@/lib/services/transportation/portsService";

export default function PortsPage() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPorts: 0,
    operationalPorts: 0,
    totalShipments: 0,
    totalContainers: 0,
  });

  useEffect(() => {
    fetchPorts();
    fetchStatistics();
  }, []);

  const fetchPorts = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/transportation/ports");
      if (response.ok) {
        const data = await response.json();
        setPorts(data.ports || []);
      }
    } catch (error) {
      console.error("Error fetching ports:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiFetch(
        "/api/transportation/ports?action=statistics",
      );
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalPorts: data.totalPorts || 0,
          operationalPorts: data.operationalPorts || 0,
          totalShipments: data.totalShipments || 0,
          totalContainers: data.totalContainers || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Ports & Terminals"
        description="Manage port operations and terminal activities"
        icon="ri-anchor-line"
      >
        <PremiumLoader />
      </PageTemplate>
    );
  }

  const statusColors: Record<string, string> = {
    OPERATIONAL:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    CONGESTED:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    CLOSED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    MAINTENANCE:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  };

  const getPortIcon = (type: string) => {
    switch (type) {
      case "SEA":
        return "🚢";
      case "AIR":
        return "✈️";
      case "RAIL":
        return "🚂";
      case "MULTI":
        return "🌐";
      default:
        return "📍";
    }
  };

  return (
    <PageTemplate
      title="Ports & Terminals"
      description="Manage port operations and terminal activities"
      icon="ri-anchor-line"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Ports
            </div>
            <div className="text-2xl font-bold mt-1">{stats.totalPorts}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Operational
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {stats.operationalPorts}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Shipments
            </div>
            <div className="text-2xl font-bold mt-1">
              {stats.totalShipments}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Containers
            </div>
            <div className="text-2xl font-bold mt-1">
              {stats.totalContainers}
            </div>
          </div>
        </div>

        {/* Ports */}
        {ports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No ports found.</p>
            <p className="text-sm mt-2">Ports will appear here once created.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ports.map((port) => (
              <motion.div
                key={port.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{port.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[port.status] || statusColors.OPERATIONAL}`}
                      >
                        {port.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div>
                        {port.country}
                        {port.region ? `, ${port.region}` : ""}
                      </div>
                      <div className="font-mono">{port.code}</div>
                    </div>
                  </div>
                  <div className="text-3xl">{getPortIcon(port.type)}</div>
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Current Shipments
                      </span>
                      <span className="text-sm font-semibold">
                        {port.currentShipments}
                      </span>
                    </div>
                  </div>
                  {port.type === "SEA" && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Containers
                        </span>
                        <span className="text-sm font-semibold">
                          {port.containers}
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Utilization Rate
                      </span>
                      <span className="text-sm font-semibold">
                        {port.utilizationRate}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          port.utilizationRate < 70
                            ? "bg-green-500"
                            : port.utilizationRate < 90
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${port.utilizationRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    View Port Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
