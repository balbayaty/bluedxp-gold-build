/**
 * Rate Cards Management
 * Comprehensive pricing and rate management
 */

"use client";

import { useState, useMemo } from "react";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface RateCard {
  id: string;
  name: string;
  code: string;
  category: string;
  effectiveDate: string;
  expiryDate?: string;
  currency: string;
  status: "ACTIVE" | "DRAFT" | "EXPIRED" | "PENDING";
  rates: Rate[];
  volumeDiscounts: VolumeDiscount[];
  validFor: string[];
  createdAt: string;
  updatedAt: string;
}

interface Rate {
  id: string;
  service: string;
  description: string;
  unit: string;
  baseRate: number;
  minCharge?: number;
  conditions?: string;
}

interface VolumeDiscount {
  minVolume: number;
  maxVolume?: number;
  discountPercent: number;
  unit: string;
}

const mockRateCards: RateCard[] = [
  {
    id: "rc-001",
    name: "Standard Warehousing 2025",
    code: "WH-STD-2025",
    category: "WAREHOUSING",
    effectiveDate: "2025-01-01",
    expiryDate: "2025-12-31",
    currency: "SAR",
    status: "ACTIVE",
    rates: [
      {
        id: "r1",
        service: "Pallet Storage",
        description: "Standard pallet storage (ambient)",
        unit: "Pallet/Month",
        baseRate: 50,
        minCharge: 500,
      },
      {
        id: "r2",
        service: "Pick & Pack",
        description: "Order picking and packing",
        unit: "Order",
        baseRate: 5,
        minCharge: 50,
      },
      {
        id: "r3",
        service: "Inbound Handling",
        description: "Receiving and putaway",
        unit: "Pallet",
        baseRate: 15,
      },
      {
        id: "r4",
        service: "Outbound Handling",
        description: "Order preparation and loading",
        unit: "Pallet",
        baseRate: 12,
      },
      {
        id: "r5",
        service: "Labeling",
        description: "Product labeling service",
        unit: "Unit",
        baseRate: 0.5,
      },
      {
        id: "r6",
        service: "Kitting",
        description: "Product assembly/kitting",
        unit: "Kit",
        baseRate: 3,
      },
    ],
    volumeDiscounts: [
      { minVolume: 500, maxVolume: 999, discountPercent: 5, unit: "Pallets" },
      {
        minVolume: 1000,
        maxVolume: 2499,
        discountPercent: 10,
        unit: "Pallets",
      },
      { minVolume: 2500, discountPercent: 15, unit: "Pallets" },
    ],
    validFor: ["Saudi Aramco", "SABIC", "Almarai"],
    createdAt: "2024-12-01",
    updatedAt: "2025-01-15",
  },
  {
    id: "rc-002",
    name: "Transportation FTL/LTL 2025",
    code: "TR-STD-2025",
    category: "TRANSPORTATION",
    effectiveDate: "2025-01-01",
    expiryDate: "2025-12-31",
    currency: "SAR",
    status: "ACTIVE",
    rates: [
      {
        id: "r1",
        service: "FTL - Local",
        description: "Full truck within city",
        unit: "Trip",
        baseRate: 800,
        minCharge: 800,
      },
      {
        id: "r2",
        service: "FTL - Regional",
        description: "Full truck intercity (up to 500km)",
        unit: "Trip",
        baseRate: 2500,
        minCharge: 2500,
      },
      {
        id: "r3",
        service: "FTL - Long Haul",
        description: "Full truck (500km+)",
        unit: "Km",
        baseRate: 3.5,
        minCharge: 3000,
      },
      {
        id: "r4",
        service: "LTL - Per Pallet",
        description: "Less than truckload",
        unit: "Pallet",
        baseRate: 150,
      },
      {
        id: "r5",
        service: "Express Delivery",
        description: "Same-day delivery",
        unit: "Trip",
        baseRate: 1500,
        minCharge: 1500,
      },
    ],
    volumeDiscounts: [
      { minVolume: 20, maxVolume: 49, discountPercent: 5, unit: "Trips/Month" },
      {
        minVolume: 50,
        maxVolume: 99,
        discountPercent: 10,
        unit: "Trips/Month",
      },
      { minVolume: 100, discountPercent: 15, unit: "Trips/Month" },
    ],
    validFor: ["All Customers"],
    createdAt: "2024-12-01",
    updatedAt: "2025-01-10",
  },
  {
    id: "rc-003",
    name: "Customs Clearance 2025",
    code: "CC-STD-2025",
    category: "CUSTOMS",
    effectiveDate: "2025-01-01",
    expiryDate: "2025-12-31",
    currency: "SAR",
    status: "ACTIVE",
    rates: [
      {
        id: "r1",
        service: "Import Clearance",
        description: "Standard import customs clearance",
        unit: "Shipment",
        baseRate: 500,
        minCharge: 500,
      },
      {
        id: "r2",
        service: "Export Clearance",
        description: "Standard export customs clearance",
        unit: "Shipment",
        baseRate: 400,
        minCharge: 400,
      },
      {
        id: "r3",
        service: "Transit Documentation",
        description: "Transit/TIR processing",
        unit: "Shipment",
        baseRate: 350,
        minCharge: 350,
      },
      {
        id: "r4",
        service: "Hazmat Clearance",
        description: "Dangerous goods clearance (additional)",
        unit: "Shipment",
        baseRate: 250,
      },
      {
        id: "r5",
        service: "Inspection Handling",
        description: "Physical inspection facilitation",
        unit: "Shipment",
        baseRate: 200,
      },
    ],
    volumeDiscounts: [
      {
        minVolume: 30,
        maxVolume: 59,
        discountPercent: 5,
        unit: "Shipments/Month",
      },
      {
        minVolume: 60,
        maxVolume: 99,
        discountPercent: 10,
        unit: "Shipments/Month",
      },
      { minVolume: 100, discountPercent: 15, unit: "Shipments/Month" },
    ],
    validFor: ["All Customers"],
    createdAt: "2024-12-01",
    updatedAt: "2025-01-08",
  },
  {
    id: "rc-004",
    name: "Rail Freight GCC 2025",
    code: "RF-GCC-2025",
    category: "RAIL",
    effectiveDate: "2025-01-01",
    expiryDate: "2025-12-31",
    currency: "SAR",
    status: "ACTIVE",
    rates: [
      {
        id: "r1",
        service: "GTT - DRY Port",
        description: "Dammam to Riyadh by rail",
        unit: "TEU",
        baseRate: 1200,
        minCharge: 2400,
      },
      {
        id: "r2",
        service: "GTT - JART",
        description: "Dammam to Jebel Ali by rail",
        unit: "TEU",
        baseRate: 1800,
        minCharge: 3600,
      },
      {
        id: "r3",
        service: "DRY - JED",
        description: "Riyadh to Jeddah by rail",
        unit: "TEU",
        baseRate: 1500,
        minCharge: 3000,
      },
      {
        id: "r4",
        service: "Terminal Handling",
        description: "Rail terminal handling",
        unit: "TEU",
        baseRate: 150,
      },
      {
        id: "r5",
        service: "Demurrage",
        description: "Container storage at terminal",
        unit: "TEU/Day",
        baseRate: 25,
        conditions: "First 3 days free",
      },
    ],
    volumeDiscounts: [
      { minVolume: 50, maxVolume: 99, discountPercent: 5, unit: "TEU/Month" },
      {
        minVolume: 100,
        maxVolume: 249,
        discountPercent: 10,
        unit: "TEU/Month",
      },
      { minVolume: 250, discountPercent: 15, unit: "TEU/Month" },
    ],
    validFor: ["Contract Customers"],
    createdAt: "2024-12-15",
    updatedAt: "2025-01-05",
  },
  {
    id: "rc-005",
    name: "Cold Chain Services 2025",
    code: "CC-COLD-2025",
    category: "COLD_CHAIN",
    effectiveDate: "2025-01-01",
    expiryDate: "2025-12-31",
    currency: "SAR",
    status: "ACTIVE",
    rates: [
      {
        id: "r1",
        service: "Frozen Storage (-18°C)",
        description: "Deep freeze storage",
        unit: "Pallet/Month",
        baseRate: 150,
        minCharge: 1500,
      },
      {
        id: "r2",
        service: "Chilled Storage (2-8°C)",
        description: "Refrigerated storage",
        unit: "Pallet/Month",
        baseRate: 100,
        minCharge: 1000,
      },
      {
        id: "r3",
        service: "Reefer Transport",
        description: "Temperature-controlled transport",
        unit: "Trip",
        baseRate: 3500,
        minCharge: 3500,
      },
      {
        id: "r4",
        service: "Cold Chain Handling",
        description: "Temperature-controlled handling",
        unit: "Pallet",
        baseRate: 25,
      },
      {
        id: "r5",
        service: "Temperature Monitoring",
        description: "24/7 temperature logging",
        unit: "Shipment",
        baseRate: 50,
      },
    ],
    volumeDiscounts: [
      { minVolume: 100, maxVolume: 249, discountPercent: 5, unit: "Pallets" },
      { minVolume: 250, maxVolume: 499, discountPercent: 10, unit: "Pallets" },
      { minVolume: 500, discountPercent: 15, unit: "Pallets" },
    ],
    validFor: ["Almarai", "Panda Retail", "Danube"],
    createdAt: "2024-12-10",
    updatedAt: "2025-01-12",
  },
];

const categoryColors: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  WAREHOUSING: {
    bg: "bg-indigo-500",
    text: "text-white",
    icon: "ri-building-4-line",
  },
  TRANSPORTATION: {
    bg: "bg-emerald-500",
    text: "text-white",
    icon: "ri-truck-line",
  },
  CUSTOMS: {
    bg: "bg-amber-500",
    text: "text-white",
    icon: "ri-shield-check-line",
  },
  RAIL: { bg: "bg-purple-500", text: "text-white", icon: "ri-train-line" },
  COLD_CHAIN: {
    bg: "bg-cyan-500",
    text: "text-white",
    icon: "ri-temp-cold-line",
  },
  FREIGHT: { bg: "bg-blue-500", text: "text-white", icon: "ri-ship-line" },
};

const statusColors: Record<string, { bg: string; text: string }> = {
  ACTIVE: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
  },
  DRAFT: {
    bg: "bg-gray-100 dark:bg-gray-700",
    text: "text-gray-700 dark:text-gray-400",
  },
  EXPIRED: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
  },
  PENDING: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
  },
};

// Rate comparison data for chart
const rateComparisonData = [
  { month: "Aug", warehousing: 48, transport: 2400, customs: 480 },
  { month: "Sep", warehousing: 48, transport: 2450, customs: 490 },
  { month: "Oct", warehousing: 50, transport: 2450, customs: 490 },
  { month: "Nov", warehousing: 50, transport: 2500, customs: 500 },
  { month: "Dec", warehousing: 50, transport: 2500, customs: 500 },
  { month: "Jan", warehousing: 50, transport: 2500, customs: 500 },
];

export default function RateCardsManagement() {
  const { hasModuleAccess } = useAuth();
  const [rateCards, setRateCards] = useState<RateCard[]>(mockRateCards);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRateCard, setSelectedRateCard] = useState<RateCard | null>(
    null,
  );
  const [showAddRate, setShowAddRate] = useState(false);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");

  const filteredRateCards = rateCards.filter((rc) => {
    const matchesSearch =
      rc.name.toLowerCase().includes(search.toLowerCase()) ||
      rc.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || rc.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || rc.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [
    "ALL",
    ...Array.from(new Set(rateCards.map((rc) => rc.category))),
  ];
  const statuses = ["ALL", "ACTIVE", "DRAFT", "PENDING", "EXPIRED"];

  const totalRates = rateCards.reduce((sum, rc) => sum + rc.rates.length, 0);
  const activeCards = rateCards.filter((rc) => rc.status === "ACTIVE").length;

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="Rate Cards"
        description="Manage pricing and rate structures"
        icon="ri-price-tag-3-line"
      >
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Rate Cards",
                value: rateCards.length,
                icon: "ri-file-list-3-line",
                color: "text-blue-500",
              },
              {
                label: "Active",
                value: activeCards,
                icon: "ri-checkbox-circle-line",
                color: "text-green-500",
              },
              {
                label: "Total Rates",
                value: totalRates,
                icon: "ri-price-tag-3-line",
                color: "text-purple-500",
              },
              {
                label: "Categories",
                value: new Set(rateCards.map((r) => r.category)).size,
                icon: "ri-folder-line",
                color: "text-amber-500",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${stat.color}`}
                  >
                    <i className={`${stat.icon} text-xl`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search rate cards..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "ALL" ? "All Categories" : cat.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "All Status" : status}
                  </option>
                ))}
              </select>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <i className="ri-add-line" />
              New Rate Card
            </button>
          </div>

          {/* Rate Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRateCards.map((rateCard, index) => {
              const catStyle =
                categoryColors[rateCard.category] || categoryColors.WAREHOUSING;
              const statStyle = statusColors[rateCard.status];

              return (
                <motion.div
                  key={rateCard.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Header */}
                  <div className={`${catStyle.bg} p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <i
                            className={`${catStyle.icon} text-white text-xl`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            {rateCard.name}
                          </h3>
                          <p className="text-sm text-white/80 font-mono">
                            {rateCard.code}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${statStyle.bg} ${statStyle.text}`}
                      >
                        {rateCard.status}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    {/* Validity */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <i className="ri-calendar-line" />
                        {rateCard.effectiveDate}
                      </span>
                      <span>→</span>
                      <span>{rateCard.expiryDate || "No expiry"}</span>
                      <span className="ml-auto font-medium text-gray-900 dark:text-white">
                        {rateCard.currency}
                      </span>
                    </div>

                    {/* Rates Preview */}
                    <div className="space-y-2 mb-4">
                      {rateCard.rates.slice(0, 3).map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {rate.service}
                            </p>
                            <p className="text-xs text-gray-500">{rate.unit}</p>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {rateCard.currency} {rate.baseRate.toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {rateCard.rates.length > 3 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 text-center py-1">
                          +{rateCard.rates.length - 3} more rates
                        </p>
                      )}
                    </div>

                    {/* Volume Discounts */}
                    {rateCard.volumeDiscounts.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Volume Discounts
                        </p>
                        <div className="flex gap-2">
                          {rateCard.volumeDiscounts.map((discount, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs"
                            >
                              {discount.minVolume}+ = {discount.discountPercent}
                              % off
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Valid For */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <i className="ri-user-star-line" />
                      <span>Valid for: {rateCard.validFor.join(", ")}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 flex gap-2">
                    <button
                      onClick={() => setSelectedRateCard(rateCard)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                    >
                      <i className="ri-eye-line" />
                      View Details
                    </button>
                    <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                      <i className="ri-edit-line" />
                    </button>
                    <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                      <i className="ri-file-copy-line" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Rate Trends Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rate Trends (6 Months)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rateComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "none",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="warehousing"
                    name="Warehousing (SAR/Pallet)"
                    stroke="#6366F1"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="transport"
                    name="Transport FTL (SAR)"
                    stroke="#10B981"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="customs"
                    name="Customs (SAR)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rate Card Detail Modal */}
          <AnimatePresence>
            {selectedRateCard && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedRateCard(null)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div
                    className={`${categoryColors[selectedRateCard.category]?.bg || "bg-blue-500"} p-6 sticky top-0`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {selectedRateCard.name}
                        </h2>
                        <p className="text-white/80 font-mono">
                          {selectedRateCard.code}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
                          <span>
                            {selectedRateCard.effectiveDate} →{" "}
                            {selectedRateCard.expiryDate || "No expiry"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded ${statusColors[selectedRateCard.status].bg}`}
                          >
                            {selectedRateCard.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedRateCard(null)}
                        className="p-2 hover:bg-white/20 rounded-lg text-white"
                      >
                        <i className="ri-close-line text-xl" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* All Rates */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Rate Schedule
                        </h3>
                        <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
                          <i className="ri-add-line" />
                          Add Rate
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                Service
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                Description
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                Unit
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                                Base Rate
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                                Min Charge
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                Conditions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {selectedRateCard.rates.map((rate) => (
                              <tr
                                key={rate.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              >
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                  {rate.service}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                  {rate.description}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                  {rate.unit}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                  {selectedRateCard.currency}{" "}
                                  {rate.baseRate.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                                  {rate.minCharge
                                    ? `${selectedRateCard.currency} ${rate.minCharge.toLocaleString()}`
                                    : "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                  {rate.conditions || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Volume Discounts */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Volume Discounts
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedRateCard.volumeDiscounts.map((discount, i) => (
                          <div
                            key={i}
                            className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
                          >
                            <div className="text-2xl font-bold text-green-600">
                              {discount.discountPercent}% OFF
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-400">
                              {discount.minVolume}
                              {discount.maxVolume
                                ? `-${discount.maxVolume}`
                                : "+"}{" "}
                              {discount.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Valid For */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Valid For
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedRateCard.validFor.map((customer, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                          >
                            {customer}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                        <i className="ri-edit-line" />
                        Edit Rate Card
                      </button>
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <i className="ri-file-copy-line" />
                        Duplicate
                      </button>
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <i className="ri-download-line" />
                        Export
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
