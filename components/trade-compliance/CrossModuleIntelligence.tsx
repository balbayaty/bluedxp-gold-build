/**
 * Cross-Module Intelligence Component
 * Connects trade compliance with other modules for comprehensive insights
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface CrossModuleInsight {
  id: string;
  module: string;
  type: "connection" | "impact" | "opportunity" | "risk";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  relatedEntities: {
    type: string;
    id: string;
    name: string;
  }[];
  action?: {
    label: string;
    path: string;
  };
}

interface ModuleConnection {
  sourceModule: string;
  targetModule: string;
  connectionType: "data_flow" | "dependency" | "impact" | "optimization";
  strength: number;
  description: string;
}

export default function CrossModuleIntelligence() {
  const router = useRouter();
  const [insights, setInsights] = useState<CrossModuleInsight[]>([]);
  const [connections, setConnections] = useState<ModuleConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCrossModuleIntelligence();
  }, []);

  const loadCrossModuleIntelligence = async () => {
    setLoading(true);
    try {
      // Simulate fetching cross-module data with a small delay to prevent blocking
      await new Promise((resolve) => setTimeout(resolve, 100));

      // In production, this would fetch from multiple modules

      const mockInsights: CrossModuleInsight[] = [
        {
          id: "1",
          module: "Inventory",
          type: "connection",
          title: "Low Stock Alert for Imported Chemicals",
          description:
            "Trade compliance records show incoming chemical shipments, but inventory levels are critically low",
          impact: "high",
          relatedEntities: [
            { type: "record", id: "rec-1", name: "Chemical Import #1234" },
            {
              type: "inventory",
              id: "inv-1",
              name: "Chemical Stock - Warehouse A",
            },
          ],
          action: {
            label: "View Inventory",
            path: "/inventory/stock-overview",
          },
        },
        {
          id: "2",
          module: "Transportation",
          type: "optimization",
          title: "Route Optimization Opportunity",
          description:
            "Multiple compliance records can be grouped for optimized transportation routes",
          impact: "medium",
          relatedEntities: [
            { type: "record", id: "rec-2", name: "Import Record #5678" },
            { type: "record", id: "rec-3", name: "Import Record #5679" },
            { type: "shipment", id: "ship-1", name: "Shipment Group A" },
          ],
          action: {
            label: "Optimize Routes",
            path: "/transportation/route-optimization",
          },
        },
        {
          id: "3",
          module: "Quality",
          type: "risk",
          title: "Quality Inspection Required",
          description:
            "Imported products require quality inspection before compliance approval",
          impact: "high",
          relatedEntities: [
            { type: "record", id: "rec-4", name: "Food Import #9012" },
            {
              type: "inspection",
              id: "insp-1",
              name: "Quality Inspection Lot #456",
            },
          ],
          action: {
            label: "View Inspections",
            path: "/quality/inspection-lots",
          },
        },
        {
          id: "4",
          module: "Orders",
          type: "connection",
          title: "Purchase Order Linked",
          description:
            "Trade compliance record is linked to purchase order with delivery timeline",
          impact: "medium",
          relatedEntities: [
            { type: "record", id: "rec-5", name: "Import Record #3456" },
            { type: "purchase_order", id: "po-1", name: "PO-2024-001" },
          ],
          action: {
            label: "View Purchase Order",
            path: "/orders/purchase-orders",
          },
        },
      ];

      const mockConnections: ModuleConnection[] = [
        {
          sourceModule: "Trade Compliance",
          targetModule: "Inventory",
          connectionType: "data_flow",
          strength: 95,
          description:
            "Compliance records automatically update inventory upon approval",
        },
        {
          sourceModule: "Trade Compliance",
          targetModule: "Transportation",
          connectionType: "dependency",
          strength: 85,
          description: "Compliance approval required before shipment release",
        },
        {
          sourceModule: "Trade Compliance",
          targetModule: "Quality",
          connectionType: "impact",
          strength: 80,
          description: "Quality inspection results affect compliance scoring",
        },
        {
          sourceModule: "Trade Compliance",
          targetModule: "Orders",
          connectionType: "data_flow",
          strength: 75,
          description: "Purchase orders trigger compliance record creation",
        },
      ];

      setInsights(mockInsights);
      setConnections(mockConnections);
    } catch (error) {
      console.error("Error loading cross-module intelligence:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "connection":
        return "border-cyan-500/50";
      case "impact":
        return "border-purple-500/50";
      case "opportunity":
        return "border-green-500/50";
      case "risk":
        return "border-red-500/50";
      default:
        return "border-gray-500/50";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-green-400";
      default:
        return "text-[#9ca3af]";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9ca3af] text-sm">
            Loading cross-module intelligence...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Connections Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-node-tree text-cyan-400"></i>
          Module Connections
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.map((connection, idx) => (
            <div
              key={idx}
              className="border border-white/10 rounded-lg p-4 hover:border-cyan-500/50 transition-colors bg-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-sm font-medium text-white">
                    {connection.sourceModule}
                  </span>
                  <i className="ri-arrow-right-line text-[#9ca3af]"></i>
                  <span className="text-sm font-medium text-white">
                    {connection.targetModule}
                  </span>
                </div>
                <span className="text-xs text-[#9ca3af]">
                  {connection.strength}%
                </span>
              </div>
              <p className="text-sm text-[#9ca3af]">{connection.description}</p>
              <div className="mt-2">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all"
                    style={{ width: `${connection.strength}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Cross-Module Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="ri-brain-line text-cyan-400"></i>
            Cross-Module Insights
          </h3>
          <span className="text-sm text-[#9ca3af]">
            {insights.length} insights
          </span>
        </div>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`border-l-4 rounded-lg p-4 bg-white/5 ${getTypeColor(insight.type)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-1 rounded bg-white/10 text-white">
                      {insight.module}
                    </span>
                    <span
                      className={`text-xs font-medium ${getImpactColor(insight.impact)}`}
                    >
                      {insight.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                  <h4 className="font-semibold text-white mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-[#9ca3af] mb-3">
                    {insight.description}
                  </p>

                  {/* Related Entities */}
                  {insight.relatedEntities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {insight.relatedEntities.map((entity, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-white/10 rounded border border-white/20 text-white"
                        >
                          {entity.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {insight.action && (
                <button
                  onClick={() => router.push(insight.action!.path)}
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  {insight.action.label}
                  <i className="ri-arrow-right-line"></i>
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Module Impact Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 sm:p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-grid-line text-indigo-400"></i>
          Module Impact Matrix
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Inventory",
            "Transportation",
            "Quality",
            "Orders",
            "Warehouse",
            "Finance",
            "Customers",
            "Suppliers",
          ].map((module) => (
            <div
              key={module}
              className="bg-white/5 rounded-lg p-4 text-center border border-white/10 hover:border-indigo-500/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/${module.toLowerCase()}`)}
            >
              <div className="text-2xl font-bold text-indigo-400 mb-1">
                {Math.floor(Math.random() * 30) + 70}%
              </div>
              <div className="text-sm text-white">{module}</div>
              <div className="text-xs text-[#9ca3af] mt-1">Connected</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
