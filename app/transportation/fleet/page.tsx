/**
 * Fleet Management
 *
 * Comprehensive fleet management dashboard with optimization, maintenance, and fuel tracking
 * Module: tms
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import { apiFetch } from "@/utils/apiFetch";
import {
  RiTruckLine,
  RiToolsLine,
  RiGasStationLine,
  RiBarChartBoxLine,
} from "react-icons/ri";

interface FleetVehicle {
  id: string;
  licensePlate: string;
  type: string;
  status: string;
  currentLocation?: { lat: number; lng: number };
  odometer: number;
  fuelLevel?: number;
  nextMaintenance?: string;
}

interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  inMaintenance: number;
  availableVehicles: number;
  averageFuelEfficiency: number;
  totalDistance: number;
}

function TransportationFleetPageContent() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch fleet data
      const response = await apiFetch("/api/transportation/fleet?action=list");

      if (!response.ok) {
        throw new Error(`Failed to load fleet data: ${response.statusText}`);
      }

      const data = await response.json();
      setVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
      setStats(data.stats || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load fleet data",
      );
      console.error("Error loading fleet data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Fleet Management"
        description="Fleet optimization, maintenance, and fuel tracking"
        icon="ri-truck-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading fleet data..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Fleet Management"
      description="Fleet optimization, maintenance, and fuel tracking"
      icon="ri-truck-line"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Vehicles
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.totalVehicles}
                  </p>
                </div>
                <RiTruckLine className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Active
                  </p>
                  <p className="text-2xl font-bold mt-1 text-green-600">
                    {stats.activeVehicles}
                  </p>
                </div>
                <RiBarChartBoxLine className="w-8 h-8 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    In Maintenance
                  </p>
                  <p className="text-2xl font-bold mt-1 text-yellow-600">
                    {stats.inMaintenance}
                  </p>
                </div>
                <RiToolsLine className="w-8 h-8 text-yellow-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fuel Efficiency
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.averageFuelEfficiency.toFixed(1)} km/L
                  </p>
                </div>
                <RiGasStationLine className="w-8 h-8 text-orange-500" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Vehicles List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <RiTruckLine className="w-5 h-5" />
            Fleet Vehicles
          </h2>

          {vehicles.length === 0 ? (
            <div className="text-center py-12">
              <RiTruckLine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No vehicles found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">
                      License Plate
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Odometer
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Fuel Level
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Next Maintenance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-4 font-medium">
                        {vehicle.licensePlate}
                      </td>
                      <td className="py-3 px-4">{vehicle.type}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            vehicle.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : vehicle.status === "MAINTENANCE"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {vehicle.odometer.toLocaleString()} km
                      </td>
                      <td className="py-3 px-4">
                        {vehicle.fuelLevel !== undefined
                          ? `${vehicle.fuelLevel}%`
                          : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {vehicle.nextMaintenance
                          ? new Date(
                              vehicle.nextMaintenance,
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </PageTemplate>
  );
}

export default function TransportationFleetPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Fleet Management"
          description="Fleet optimization, maintenance, and fuel tracking"
          icon="ri-truck-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <TransportationFleetPageContent />
    </ErrorBoundary>
  );
}
