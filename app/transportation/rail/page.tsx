/**
 * Rail Freight Management
 *
 * Manage rail freight and intermodal shipments
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";

interface RailShipment {
  id: string;
  shipmentNumber: string;
  trainNumber: string;
  railway: string;
  originStation: string;
  destinationStation: string;
  status: string;
  departureDate: Date | string;
  arrivalDate: Date | string;
  totalWeight: number;
  containers: number;
  freightCost: number;
}

export default function RailFreightPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<RailShipment[]>([
    {
      id: "1",
      shipmentNumber: "RAIL-2024-001",
      trainNumber: "TR-12345",
      railway: "Saudi Railways",
      originStation: "Riyadh Central",
      destinationStation: "Dammam Port",
      status: "IN_TRANSIT",
      departureDate: "2024-01-20T08:00:00",
      arrivalDate: "2024-01-20T14:00:00",
      totalWeight: 45000,
      containers: 2,
      freightCost: 12000,
    },
  ]);

  return (
    <PageTemplate
      title="Rail Freight Management"
      description="Manage rail freight and intermodal shipments"
      icon="ri-train-line"
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
              Total Containers
            </div>
            <div className="text-2xl font-bold mt-1">
              {shipments.reduce((sum, s) => sum + s.containers, 0)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Weight
            </div>
            <div className="text-2xl font-bold mt-1">
              {(
                shipments.reduce((sum, s) => sum + s.totalWeight, 0) / 1000
              ).toFixed(1)}{" "}
              tons
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Cost
            </div>
            <div className="text-2xl font-bold mt-1">
              {shipments
                .reduce((sum, s) => sum + s.freightCost, 0)
                .toLocaleString()}{" "}
              SAR
            </div>
          </div>
        </div>

        {/* Shipments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Rail Freight Shipments</h3>
              <button
                onClick={() => router.push("/shipments?mode=rail")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Rail Shipment
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {shipments.map((shipment) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold">
                        {shipment.shipmentNumber}
                      </h4>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {shipment.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Train:
                        </span>{" "}
                        <span className="font-medium">
                          {shipment.trainNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Railway:
                        </span>{" "}
                        <span className="font-medium">{shipment.railway}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Containers:
                        </span>{" "}
                        <span className="font-medium">
                          {shipment.containers}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Cost:
                        </span>{" "}
                        <span className="font-medium">
                          {shipment.freightCost.toLocaleString()} SAR
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex-1 text-center">
                    <div className="text-sm font-medium">
                      {shipment.originStation}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Departure:{" "}
                      {new Date(shipment.departureDate).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-2xl">🚂</div>
                  <div className="flex-1 text-center">
                    <div className="text-sm font-medium">
                      {shipment.destinationStation}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Arrival: {new Date(shipment.arrivalDate).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Weight:
                    </span>{" "}
                    <span className="font-medium">
                      {(shipment.totalWeight / 1000).toFixed(1)} tons
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(`/shipments/${shipment.id}`)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
