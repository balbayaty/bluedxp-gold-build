/**
 * Vendor Master Page
 * INTEGRATED: Now uses real Prisma database via /api/wms/vendors
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { getPurchaseOrderLinks } from "@/utils/moduleInterconnectivity";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface Vendor {
  id: string;
  vendorNumber: string;
  vendorName: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentTerms: string;
  currency: string;
  status: string;
  vendorType?: string;
  totalPurchaseOrders?: number;
  totalPurchaseValue?: number;
  averagePOValue?: number;
  onTimeDeliveryRate?: number;
  qualityScore?: number;
  priceCompetitiveness?: number;
  overallRating?: number;
  rating?: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR" | "CRITICAL";
  isoCertified?: boolean;
  isoCertification?: string;
  fdaApproved?: boolean;
  halalCertified?: boolean;
  complianceScore?: number;
  averageLeadTime?: number;
  minimumLeadTime?: number;
  maximumLeadTime?: number;
  taxId?: string;
  registrationNumber?: string;
  website?: string;
  lastOrderDate?: Date | string;
  firstOrderDate?: Date | string;
  daysSinceLastOrder?: number;
  notes?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export default function VendorMaster() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorFilter = searchParams.get("vendor");

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Fetch vendors from real API
  useEffect(() => {
    async function fetchVendors() {
      try {
        setLoading(true);
        const response = await fetch("/api/wms/vendors?limit=100");
        const result = await response.json();
        
        if (result.success && result.data) {
          setVendors(result.data);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchVendors();
  }, []);
  const [selectedRating, setSelectedRating] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "analytics" | "performance"
  >("table");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchesSearch =
        vendor.vendorNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || vendor.status === selectedStatus;
      const matchesRating =
        selectedRating === "ALL" || vendor.rating === selectedRating;
      const matchesType =
        selectedType === "ALL" || vendor.vendorType === selectedType;
      const matchesVendor =
        !vendorFilter || vendor.vendorNumber === vendorFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesRating &&
        matchesType &&
        matchesVendor
      );
    });
  }, [
    vendors,
    searchQuery,
    selectedStatus,
    selectedRating,
    selectedType,
    vendorFilter,
  ]);

  const ratingStats = useMemo(() => {
    const stats: Record<string, number> = {};
    vendors.forEach((vendor) => {
      const rating = vendor.rating || "AVERAGE";
      stats[rating] = (stats[rating] || 0) + 1;
    });
    return Object.entries(stats).map(([rating, count]) => ({ rating, count }));
  }, [vendors]);

  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    vendors.forEach((vendor) => {
      const type = vendor.vendorType || "SUPPLIER";
      stats[type] = (stats[type] || 0) + 1;
    });
    return Object.entries(stats).map(([type, count]) => ({ type, count }));
  }, [vendors]);

  const performanceData = useMemo(() => {
    return vendors
      .filter((v) => v.status === "ACTIVE")
      .map((vendor) => ({
        name: vendor.vendorName.substring(0, 15),
        onTimeDelivery: vendor.onTimeDeliveryRate || 0,
        quality: (vendor.qualityScore || 0) * 20, // Convert to percentage
        price: (vendor.priceCompetitiveness || 0) * 20, // Convert to percentage
        overall: (vendor.overallRating || 0) * 20, // Convert to percentage
      }));
  }, [vendors]);

  const totalPurchaseValue = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (v.totalPurchaseValue || 0), 0);
  }, [vendors]);

  const stats = [
    {
      label: "Total Vendors",
      value: vendors.length,
      icon: "ri-building-line",
      tooltip: "Total number of vendors",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: vendors.filter((v) => v.status === "ACTIVE").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active vendors",
      trend: "up" as const,
    },
    {
      label: "Total Purchase Value",
      value: `AED ${(totalPurchaseValue / 1000000).toFixed(1)}M`,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total purchase value from all vendors",
      trend: "up" as const,
    },
    {
      label: "Excellent Rating",
      value: vendors.filter((v) => v.rating === "EXCELLENT").length,
      icon: "ri-star-line",
      tooltip: "Vendors with excellent rating",
      trend: "neutral" as const,
    },
  ];

  const handleView = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowViewModal(true);
  };

  const handleNavigateToPurchaseOrders = (vendor: Vendor) => {
    router.push(`/purchase-orders?vendor=${vendor.vendorNumber}`);
  };

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case "EXCELLENT":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "GOOD":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "AVERAGE":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "POOR":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <PageTemplate
      title="Vendor Master"
      description="Vendor master data with performance tracking, rating system, and compliance management"
      icon="ri-building-line"
      systemInfo={{
        sap: "Vendor Master, XK01/XK02/XK03",
        oracle: "Supplier Master, Supplier Definition",
        manhattan: "Vendor Master, Supplier Master",
      }}
      examples={[
        "Vendor performance tracking",
        "Rating system (Excellent, Good, Average, Poor, Critical)",
        "Compliance certification tracking",
        "Lead time management",
        "Quality and delivery metrics",
        "Purchase order history",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["table", "analytics", "performance"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <i
                  className={`ri-${mode === "table" ? "table-line" : mode === "analytics" ? "bar-chart-line" : "line-chart-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
            <i className="ri-add-line"></i>
            Create Vendor
          </button>
        </div>
      }
    >
      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Rating Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ratingStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ rating, count }) => `${rating}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {ratingStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#10b981", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"][
                          index % 5
                        ]
                      }
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Vendor Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="type"
                  stroke="#9ca3af"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Performance View */}
      {viewMode === "performance" && (
        <div className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Vendor Performance Metrics
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={performanceData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="onTimeDelivery"
                stroke="#10b981"
                strokeWidth={2}
                name="On-Time Delivery %"
              />
              <Line
                type="monotone"
                dataKey="quality"
                stroke="#06b6d4"
                strokeWidth={2}
                name="Quality Score %"
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Price Competitiveness %"
              />
              <Line
                type="monotone"
                dataKey="overall"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Overall Rating %"
              />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Vendor Number, Name, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="BLOCKED">Blocked</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
        </select>
        <select
          value={selectedRating}
          onChange={(e) => setSelectedRating(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Ratings</option>
          <option value="EXCELLENT">Excellent</option>
          <option value="GOOD">Good</option>
          <option value="AVERAGE">Average</option>
          <option value="POOR">Poor</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="MANUFACTURER">Manufacturer</option>
          <option value="DISTRIBUTOR">Distributor</option>
          <option value="SUPPLIER">Supplier</option>
          <option value="TRADER">Trader</option>
          <option value="IMPORTER">Importer</option>
        </select>
      </div>

      {/* Vendors Table */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Vendor Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Vendor Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Total POs
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    On-Time Delivery
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Quality Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredVendors.map((vendor, index) => (
                  <motion.tr
                    key={vendor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {vendor.vendorNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {vendor.vendorName}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {vendor.city}, {vendor.country}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getRatingColor(vendor.rating)}`}
                      >
                        {vendor.rating || "N/A"}
                      </span>
                      {vendor.overallRating && (
                        <div className="text-xs text-[#9ca3af] mt-1">
                          {vendor.overallRating.toFixed(1)}/5.0
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {vendor.totalPurchaseOrders || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {vendor.currency}{" "}
                        {(vendor.totalPurchaseValue || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {vendor.onTimeDeliveryRate?.toFixed(1) || "N/A"}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {vendor.qualityScore?.toFixed(1) || "N/A"}/5.0
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          vendor.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : vendor.status === "BLOCKED"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : vendor.status === "PENDING_APPROVAL"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => handleView(vendor)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="View Purchase Orders" position="top">
                          <button
                            onClick={() =>
                              handleNavigateToPurchaseOrders(vendor)
                            }
                            className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                          >
                            <i className="ri-shopping-bag-line"></i>
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedVendor(null);
        }}
        title={`Vendor Details - ${selectedVendor?.vendorNumber || ""}`}
        size="lg"
      >
        {selectedVendor && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Vendor Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedVendor.vendorNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedVendor.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedVendor.status === "BLOCKED"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedVendor.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Vendor Name
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedVendor.vendorName}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Vendor Type
                </label>
                <div className="text-sm text-white">
                  {selectedVendor.vendorType?.replace(/_/g, " ") || "N/A"}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Rating
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getRatingColor(selectedVendor.rating)}`}
                >
                  {selectedVendor.rating || "N/A"}
                </span>
                {selectedVendor.overallRating && (
                  <div className="text-xs text-[#9ca3af] mt-1">
                    Overall: {selectedVendor.overallRating.toFixed(1)}/5.0
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Contact Person
                </label>
                <div className="text-sm text-white">
                  {selectedVendor.contactPerson}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Email
                </label>
                <div className="text-sm text-white">{selectedVendor.email}</div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Phone
                </label>
                <div className="text-sm text-white">{selectedVendor.phone}</div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Address
                </label>
                <div className="text-sm text-white">
                  {selectedVendor.address}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {selectedVendor.city}, {selectedVendor.country}{" "}
                  {selectedVendor.postalCode}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Payment Terms
                </label>
                <div className="text-sm text-white">
                  {selectedVendor.paymentTerms}
                </div>
              </div>
            </div>
            {selectedVendor.totalPurchaseOrders !== undefined && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Total Purchase Orders
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedVendor.totalPurchaseOrders}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Total Purchase Value
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedVendor.currency}{" "}
                      {(
                        selectedVendor.totalPurchaseValue || 0
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Average PO Value
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedVendor.currency}{" "}
                      {(selectedVendor.averagePOValue || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      On-Time Delivery
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedVendor.onTimeDeliveryRate?.toFixed(1) || "N/A"}%
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Quality Score
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedVendor.qualityScore?.toFixed(1) || "N/A"}/5.0
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Price Competitiveness
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedVendor.priceCompetitiveness?.toFixed(1) || "N/A"}
                      /5.0
                    </div>
                  </div>
                </div>
              </div>
            )}
            {selectedVendor.averageLeadTime !== undefined && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Lead Times
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Average
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedVendor.averageLeadTime} days
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Minimum
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedVendor.minimumLeadTime} days
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Maximum
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedVendor.maximumLeadTime} days
                    </div>
                  </div>
                </div>
              </div>
            )}
            {(selectedVendor.isoCertified ||
              selectedVendor.fdaApproved ||
              selectedVendor.halalCertified) && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Compliance & Certifications
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedVendor.isoCertified && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        ISO Certified
                      </label>
                      <div className="text-sm text-green-400">
                        <i className="ri-checkbox-circle-line mr-1"></i>
                        {selectedVendor.isoCertification?.replace(/_/g, " ") ||
                          "ISO Certified"}
                      </div>
                    </div>
                  )}
                  {selectedVendor.fdaApproved && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        FDA Approved
                      </label>
                      <div className="text-sm text-green-400">
                        <i className="ri-checkbox-circle-line mr-1"></i>
                        Yes
                      </div>
                    </div>
                  )}
                  {selectedVendor.halalCertified && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        HALAL Certified
                      </label>
                      <div className="text-sm text-green-400">
                        <i className="ri-checkbox-circle-line mr-1"></i>
                        Yes
                      </div>
                    </div>
                  )}
                  {selectedVendor.complianceScore !== undefined && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Compliance Score
                      </label>
                      <div className="text-sm text-white font-medium">
                        {selectedVendor.complianceScore.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  handleNavigateToPurchaseOrders(selectedVendor);
                  setShowViewModal(false);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-shopping-bag-line"></i>
                View Purchase Orders
              </button>
            </div>
            {getPurchaseOrderLinks && (
              <div className="pt-4 border-t border-white/10">
                <ModuleLinks
                  links={getPurchaseOrderLinks(
                    undefined,
                    selectedVendor.vendorNumber,
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
