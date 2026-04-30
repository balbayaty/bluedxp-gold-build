/**
 * Transportation Dashboard
 *
 * Comprehensive dashboard for transportation module
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  TrendingUp,
  DollarSign,
  MapPin,
  AlertTriangle,
  Activity,
  BarChart3,
  Clock,
  Shield,
} from "lucide-react";
import RouteComparisonPanel from "./RouteComparisonPanel";
import PricingIntelligencePanel from "./PricingIntelligencePanel";
import CO2EmissionsTracker from "./CO2EmissionsTracker";
import LoadMatchingPanel from "./LoadMatchingPanel";
import IoTMonitoringPanel from "./IoTMonitoringPanel";
import FreightAuditPanel from "./FreightAuditPanel";
import ComplianceStatusPanel from "./ComplianceStatusPanel";
import SecurityIntelligencePanel from "./SecurityIntelligencePanel";
import type { Shipment } from "@/types/tms";

interface TransportationDashboardProps {
  shipment?: Shipment;
  onShipmentUpdate?: (shipment: Shipment) => void;
}

export default function TransportationDashboard({
  shipment,
  onShipmentUpdate,
}: TransportationDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "route"
    | "pricing"
    | "emissions"
    | "matching"
    | "iot"
    | "audit"
    | "compliance"
    | "security"
  >("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "route", label: "Route", icon: MapPin },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "emissions", label: "Emissions", icon: Activity },
    { id: "matching", label: "Load Matching", icon: Truck },
    { id: "iot", label: "IoT Monitoring", icon: Activity },
    { id: "audit", label: "Freight Audit", icon: AlertTriangle },
    { id: "compliance", label: "Compliance", icon: AlertTriangle },
    { id: "security", label: "Security & Intel", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transportation Dashboard</h2>
          {shipment && (
            <p className="text-sm text-gray-500 mt-1">
              Shipment: {shipment.shipmentNumber} | Status: {shipment.status}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Key Metrics Cards */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Total Shipments</span>
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold">0</p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Total Cost</span>
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold">$0</p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">On-Time Rate</span>
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold">0%</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">CO2 Saved</span>
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold">0 kg</p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
          </motion.div>
        )}

        {activeTab === "route" && shipment?.route && (
          <RouteComparisonPanel
            comparison={{
              request: {
                origin: shipment.origin,
                destination: shipment.destination,
                mode: shipment.mode,
                cargo: {
                  weight: shipment.totalWeight,
                  volume: shipment.totalVolume,
                  type: shipment.type,
                },
              },
              options: shipment.alternativeRoutes || [],
              recommended: shipment.route,
              generatedAt: shipment.updatedAt,
            }}
          />
        )}

        {activeTab === "pricing" && shipment?.pricingIntelligence && (
          <PricingIntelligencePanel pricing={shipment.pricingIntelligence} />
        )}

        {activeTab === "emissions" && shipment?.emissions && (
          <CO2EmissionsTracker emissions={shipment.emissions} />
        )}

        {activeTab === "matching" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <p className="text-gray-500">Load matching will appear here</p>
            {/* LoadMatchingPanel would be rendered here with actual data */}
          </div>
        )}

        {activeTab === "iot" && shipment && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <p className="text-gray-500">IoT monitoring will appear here</p>
            {/* IoTMonitoringPanel would be rendered here with actual data */}
          </div>
        )}

        {activeTab === "audit" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <p className="text-gray-500">
              Freight audit results will appear here
            </p>
            {/* FreightAuditPanel would be rendered here with actual data */}
          </div>
        )}

        {activeTab === "compliance" && shipment && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <p className="text-gray-500">Compliance status will appear here</p>
            {/* ComplianceStatusPanel would be rendered here with actual data */}
          </div>
        )}

        {activeTab === "security" && shipment && (
          <SecurityIntelligencePanel shipment={shipment} />
        )}
      </div>
    </div>
  );
}
