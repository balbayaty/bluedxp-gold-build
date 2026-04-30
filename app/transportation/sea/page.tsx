/**
 * Sea Freight Management
 *
 * Manage FCL, LCL, and container shipments
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SeaShipment {
  id: string;
  shipmentNumber: string;
  type: "FCL" | "LCL";
  containerNumber?: string;
  vesselName: string;
  voyageNumber: string;
  originPort: string;
  destinationPort: string;
  blNumber: string;
  status: string;
  etd: Date | string;
  eta: Date | string;
  actualArrival?: Date | string;
  totalWeight: number;
  totalVolume: number;
  freightCost: number;
}

export default function SeaFreightPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<SeaShipment[]>([
    {
      id: "1",
      shipmentNumber: "SEA-2024-001",
      type: "FCL",
      containerNumber: "MSKU1234567",
      vesselName: "MSC OSCAR",
      voyageNumber: "V001",
      originPort: "Shanghai, China",
      destinationPort: "Jeddah, Saudi Arabia",
      blNumber: "BL-2024-001234",
      status: "IN_TRANSIT",
      etd: "2024-01-15",
      eta: "2024-02-05",
      totalWeight: 25000,
      totalVolume: 67.5,
      freightCost: 8500,
    },
    {
      id: "2",
      shipmentNumber: "SEA-2024-002",
      type: "LCL",
      vesselName: "MAERSK DENVER",
      voyageNumber: "V045",
      originPort: "Singapore",
      destinationPort: "Dammam, Saudi Arabia",
      blNumber: "BL-2024-001235",
      status: "AT_PORT",
      etd: "2024-01-20",
      eta: "2024-02-10",
      totalWeight: 8500,
      totalVolume: 12.5,
      freightCost: 3200,
    },
  ]);

  const portStats = [
    { port: "Jeddah", shipments: 45, containers: 120 },
    { port: "Dammam", shipments: 32, containers: 85 },
    { port: "Shanghai", shipments: 28, containers: 95 },
    { port: "Singapore", shipments: 22, containers: 65 },
  ];

  return (
    <PageTemplate
      title="Sea Freight Management"
      description="Manage FCL, LCL, and container shipments"
      icon="ri-ship-line"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Shipments
            </div>
            <div className="text-2xl font-bold mt-1">{shipments.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              FCL Shipments
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {shipments.filter((s) => s.type === "FCL").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              LCL Shipments
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {shipments.filter((s) => s.type === "LCL").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Freight Cost
            </div>
            <div className="text-2xl font-bold mt-1">
              {shipments
                .reduce((sum, s) => sum + s.freightCost, 0)
                .toLocaleString()}{" "}
              SAR
            </div>
          </div>
        </div>

        {/* Port Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Port Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={portStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="port" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="shipments" fill="#3b82f6" name="Shipments" />
              <Bar dataKey="containers" fill="#10b981" name="Containers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Shipments Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Sea Freight Shipments</h3>
              <button
                onClick={() => router.push("/shipments?mode=sea")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Sea Shipment
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Shipment #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Vessel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    BL Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    ETA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {shipments.map((shipment) => (
                  <tr
                    key={shipment.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {shipment.shipmentNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          shipment.type === "FCL"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        }`}
                      >
                        {shipment.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{shipment.vesselName}</div>
                      <div className="text-xs text-gray-500">
                        {shipment.voyageNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {shipment.blNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{shipment.originPort}</div>
                      <div className="text-xs text-gray-500">
                        → {shipment.destinationPort}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(shipment.eta).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        {shipment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => router.push(`/shipments/${shipment.id}`)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
