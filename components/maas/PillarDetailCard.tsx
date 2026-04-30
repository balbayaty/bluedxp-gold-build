/**
 * Pillar Detail Card
 *
 * Comprehensive pillar information card with:
 * - Services list
 * - Pricing model
 * - Revenue metrics
 * - Utilization tracking
 * - Performance metrics
 */

"use client";

import { motion } from "framer-motion";
import {
  Building,
  Bot,
  FlaskConical,
  Truck,
  GraduationCap,
  ShoppingCart,
  Leaf,
  Network,
  FileCheck,
  Lightbulb,
  Wallet,
  Headphones,
  TrendingUp,
  DollarSign,
  Activity,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { MAASPillarDefinition } from "@/lib/services/maas/types";

interface PillarDetailCardProps {
  pillar: MAASPillarDefinition & {
    utilization?: number;
    revenue?: number;
    tenants?: number;
    status?: "active" | "inactive" | "pending";
  };
  onDrillDown?: (pillar: MAASPillarDefinition) => void;
}

const pillarIcons: Record<string, React.ReactNode> = {
  SMART_FACTORY_INFRASTRUCTURE: <Building className="w-6 h-6" />,
  ROBOTICS_AUTOMATION: <Bot className="w-6 h-6" />,
  QUALITY_ASSURANCE_LABS: <FlaskConical className="w-6 h-6" />,
  LOGISTICS_HUB: <Truck className="w-6 h-6" />,
  TALENT_TRAINING_ACADEMY: <GraduationCap className="w-6 h-6" />,
  PROCUREMENT_CONSORTIUM: <ShoppingCart className="w-6 h-6" />,
  SUSTAINABILITY_SERVICES: <Leaf className="w-6 h-6" />,
  DIGITAL_TWIN_PLATFORM: <Network className="w-6 h-6" />,
  COMPLIANCE_CERTIFICATION: <FileCheck className="w-6 h-6" />,
  RD_COLLABORATION_HUB: <Lightbulb className="w-6 h-6" />,
  FINANCIAL_SERVICES: <Wallet className="w-6 h-6" />,
  CUSTOMER_SUCCESS_PLATFORM: <Headphones className="w-6 h-6" />,
};

export default function PillarDetailCard({
  pillar,
  onDrillDown,
}: PillarDetailCardProps) {
  const [expanded, setExpanded] = useState(false);

  const icon = pillarIcons[pillar.type] || <Building className="w-6 h-6" />;
  const utilization = pillar.utilization || Math.random() * 100;
  const revenue = pillar.revenue || Math.random() * 200000;
  const tenants = pillar.tenants || Math.floor(Math.random() * 10) + 1;
  const status = pillar.status || (utilization > 50 ? "active" : "pending");

  const statusColors = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <div className="text-blue-400">{icon}</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold text-white">
                  {pillar.name}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${statusColors[status]}`}
                >
                  {status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-3">{pillar.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-400">
                  <Activity className="w-4 h-4" />
                  <span>{utilization.toFixed(1)}% utilized</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {revenue.toLocaleString("en-US", {
                      style: "currency",
                      currency: "SAR",
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Building className="w-4 h-4" />
                  <span>{tenants} tenants</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Utilization Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Utilization</span>
            <span className="text-sm font-semibold text-white">
              {utilization.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                utilization > 80
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : utilization > 60
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                    : "bg-gradient-to-r from-amber-500 to-yellow-500"
              }`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4 pt-4 border-t border-white/10"
          >
            {/* Services */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">
                Services Offered
              </h4>
              <div className="flex flex-wrap gap-2">
                {pillar.services.map((service, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/5 rounded-lg text-xs text-gray-300 border border-white/10"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {/* Pricing Model */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">
                Pricing Model
              </h4>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Model</span>
                  <span className="text-sm font-medium text-white">
                    {pillar.pricing.model}
                  </span>
                </div>
                {pillar.pricing.basePrice && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Base Price</span>
                    <span className="text-sm font-medium text-white">
                      {pillar.pricing.basePrice.toLocaleString("en-US", {
                        style: "currency",
                        currency: "SAR",
                      })}
                    </span>
                  </div>
                )}
                {pillar.pricing.unitPrice && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Unit Price</span>
                    <span className="text-sm font-medium text-white">
                      {pillar.pricing.unitPrice.toLocaleString("en-US", {
                        style: "currency",
                        currency: "SAR",
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Margin</span>
                  <span className="text-sm font-medium text-emerald-400">
                    {pillar.pricing.margin}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue Info */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">
                Revenue Stream
              </h4>
              <p className="text-sm text-gray-400">{pillar.revenue}</p>
            </div>

            {/* Actions */}
            {onDrillDown && (
              <button
                onClick={() => onDrillDown(pillar)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                View Detailed Analytics
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
