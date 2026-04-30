/**
 * Air Freight Management
 *
 * Manage express, standard, and economy air shipments
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";

interface AirShipment {
  id: string;
  shipmentNumber: string;
  serviceType: "EXPRESS" | "STANDARD" | "ECONOMY";
  awbNumber: string;
  flightNumber: string;
  airline: string;
  originAirport: string;
  destinationAirport: string;
  status: string;
  etd: Date | string;
  eta: Date | string;
  actualArrival?: Date | string;
  totalWeight: number;
  totalVolume: number;
  freightCost: number;
}

export default function AirFreightPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<AirShipment[]>([
    {
      id: "1",
      shipmentNumber: "AIR-2024-001",
      serviceType: "EXPRESS",
      awbNumber: "AWB-12345678",
      flightNumber: "SV-1234",
      airline: "Saudi Airlines",
      originAirport: "DXB (Dubai)",
      destinationAirport: "RUH (Riyadh)",
      status: "IN_TRANSIT",
      etd: "2024-01-20T10:00:00",
      eta: "2024-01-20T14:00:00",
      totalWeight: 1250,
      totalVolume: 5.5,
      freightCost: 4500,
    },
    {
      id: "2",
      shipmentNumber: "AIR-2024-002",
      serviceType: "STANDARD",
      awbNumber: "AWB-12345679",
      flightNumber: "EK-5678",
      airline: "Emirates",
      originAirport: "DXB (Dubai)",
      destinationAirport: "JED (Jeddah)",
      status: "DELIVERED",
      etd: "2024-01-18T08:00:00",
      eta: "2024-01-18T12:00:00",
      actualArrival: "2024-01-18T11:45:00",
      totalWeight: 2800,
      totalVolume: 12.3,
      freightCost: 6800,
    },
  ]);

  const serviceColors: Record<string, string> = {
    EXPRESS: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    STANDARD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    ECONOMY:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  };

  return (
    <PageTemplate
      title="Air Freight Management"
      description="Manage express, standard, and economy air shipments"
      icon="ri-plane-line"
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
              Express
            </div>
            <div className="text-2xl font-bold mt-1 text-red-600">
              {shipments.filter((s) => s.serviceType === "EXPRESS").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              In Transit
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {shipments.filter((s) => s.status === "IN_TRANSIT").length}
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

        {/* Shipments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Air Freight Shipments</h3>
              <button
                onClick={() => router.push("/shipments?mode=air")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Air Shipment
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
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${serviceColors[shipment.serviceType]}`}
                      >
                        {shipment.serviceType}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {shipment.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          AWB:
                        </span>{" "}
                        <span className="font-medium">
                          {shipment.awbNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Flight:
                        </span>{" "}
                        <span className="font-medium">
                          {shipment.flightNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Airline:
                        </span>{" "}
                        <span className="font-medium">{shipment.airline}</span>
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
                      {shipment.originAirport}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ETD: {new Date(shipment.etd).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-2xl">✈️</div>
                  <div className="flex-1 text-center">
                    <div className="text-sm font-medium">
                      {shipment.destinationAirport}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ETA: {new Date(shipment.eta).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Weight:
                    </span>{" "}
                    <span className="font-medium">
                      {shipment.totalWeight} kg
                    </span>
                    {" | "}
                    <span className="text-gray-600 dark:text-gray-400">
                      Volume:
                    </span>{" "}
                    <span className="font-medium">
                      {shipment.totalVolume} m³
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
