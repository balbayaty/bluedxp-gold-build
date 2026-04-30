/**
 * Customer Master Page
 * INTEGRATED: Now uses real Prisma database via /api/wms/customers
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { getSalesOrderLinks } from "@/utils/moduleInterconnectivity";
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

interface Customer {
  id: string;
  customerNumber: string;
  customerName: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentTerms: string;
  creditLimit: number;
  creditUsed?: number;
  currency: string;
  status: string;
  serviceTier?: string;
  industry?: string;
  totalOrders?: number;
  totalValue?: number;
  averageOrderValue?: number;
  onTimeDeliveryRate?: number;
  customerSatisfactionScore?: number;
  paymentPerformance?: number;
  lastOrderDate?: Date | string;
  firstOrderDate?: Date | string;
  daysSinceLastOrder?: number;
  slaResponseTime?: string;
  slaDeliveryTime?: string;
  prioritySupport?: boolean;
  dedicatedAccountManager?: boolean;
  taxId?: string;
  registrationNumber?: string;
  website?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  type?: string;
}

export default function CustomerMaster() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerFilter = searchParams.get("customer");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch customers from real API
  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        const response = await fetch("/api/wms/customers?limit=100");
        const result = await response.json();
        
        if (result.success && result.data) {
          setCustomers(result.data);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCustomers();
  }, []);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "analytics" | "performance"
  >("table");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const matchesSearch =
        cust.customerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || cust.status === selectedStatus;
      const matchesTier =
        selectedTier === "ALL" || cust.serviceTier === selectedTier;
      const matchesIndustry =
        selectedIndustry === "ALL" || cust.industry === selectedIndustry;
      const matchesCustomer =
        !customerFilter || cust.customerNumber === customerFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesTier &&
        matchesIndustry &&
        matchesCustomer
      );
    });
  }, [
    customers,
    searchQuery,
    selectedStatus,
    selectedTier,
    selectedIndustry,
    customerFilter,
  ]);

  const tierStats = useMemo(() => {
    const stats: Record<string, number> = {};
    customers.forEach((cust) => {
      const tier = cust.serviceTier || "STANDARD";
      stats[tier] = (stats[tier] || 0) + 1;
    });
    return Object.entries(stats).map(([tier, count]) => ({ tier, count }));
  }, [customers]);

  const industryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    customers.forEach((cust) => {
      const industry = cust.industry || "OTHER";
      stats[industry] = (stats[industry] || 0) + 1;
    });
    return Object.entries(stats).map(([industry, count]) => ({
      industry,
      count,
    }));
  }, [customers]);

  const performanceData = useMemo(() => {
    return customers
      .filter((c) => c.status === "ACTIVE")
      .map((cust) => ({
        name: cust.customerName.substring(0, 15),
        onTimeDelivery: cust.onTimeDeliveryRate || 0,
        satisfaction: (cust.customerSatisfactionScore || 0) * 20, // Convert to percentage
        payment: cust.paymentPerformance || 0,
      }));
  }, [customers]);

  const totalRevenue = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalValue || 0), 0);
  }, [customers]);

  const stats = [
    {
      label: "Total Customers",
      value: customers.length,
      icon: "ri-user-3-line",
      tooltip: "Total number of customers",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: customers.filter((c) => c.status === "ACTIVE").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active customers",
      trend: "up" as const,
    },
    {
      label: "Total Revenue",
      value: `AED ${(totalRevenue / 1000000).toFixed(1)}M`,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total revenue from all customers",
      trend: "up" as const,
    },
    {
      label: "Platinum",
      value: customers.filter((c) => c.serviceTier === "PLATINUM").length,
      icon: "ri-vip-crown-line",
      tooltip: "Platinum tier customers",
      trend: "neutral" as const,
    },
  ];

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleNavigateToSalesOrders = (customer: Customer) => {
    router.push(`/sales-orders?customer=${customer.customerNumber}`);
  };

  return (
    <PageTemplate
      title="Customer Master"
      description="Customer master data with service tiers, performance metrics, and analytics"
      icon="ri-user-3-line"
      systemInfo={{
        sap: "Customer Master, BP (Business Partner)",
        oracle: "Customer Master, Trading Partner",
        manhattan: "Customer Master, Account Management",
      }}
      examples={[
        "Customer service tier management",
        "Performance metrics tracking",
        "Credit limit and payment terms",
        "SLA management",
        "Customer analytics and insights",
        "Order history and value analysis",
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
            Create Customer
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
              Service Tier Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tier, count }) => `${tier}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {tierStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#8b5cf6", "#f59e0b", "#6b7280", "#cd7f32", "#10b981"][
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
              Industry Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={industryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="industry"
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
            Customer Performance Metrics
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
                dataKey="satisfaction"
                stroke="#06b6d4"
                strokeWidth={2}
                name="Satisfaction %"
              />
              <Line
                type="monotone"
                dataKey="payment"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Payment Performance %"
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
            placeholder="Search by Customer Number, Name, Email..."
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
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Tiers</option>
          <option value="PLATINUM">Platinum</option>
          <option value="GOLD">Gold</option>
          <option value="SILVER">Silver</option>
          <option value="BRONZE">Bronze</option>
          <option value="STANDARD">Standard</option>
        </select>
        <select
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Industries</option>
          <option value="CONSTRUCTION">Construction</option>
          <option value="MANUFACTURING">Manufacturing</option>
          <option value="CHEMICAL">Chemical</option>
          <option value="PHARMACEUTICAL">Pharmaceutical</option>
          <option value="FOOD_BEVERAGE">Food & Beverage</option>
          <option value="RETAIL">Retail</option>
          <option value="LOGISTICS">Logistics</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Customers Table */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Customer Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Service Tier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Total Orders
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    On-Time Delivery
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
                {filteredCustomers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {customer.customerNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {customer.customerName}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {customer.city}, {customer.country}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          customer.serviceTier === "PLATINUM"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : customer.serviceTier === "GOLD"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : customer.serviceTier === "SILVER"
                                ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                : customer.serviceTier === "BRONZE"
                                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {customer.serviceTier || "STANDARD"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {customer.totalOrders || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {customer.currency}{" "}
                        {(customer.totalValue || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {customer.onTimeDeliveryRate?.toFixed(1) || "N/A"}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          customer.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : customer.status === "INACTIVE"
                              ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => handleView(customer)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="View Sales Orders" position="top">
                          <button
                            onClick={() =>
                              handleNavigateToSalesOrders(customer)
                            }
                            className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                          >
                            <i className="ri-shopping-cart-2-line"></i>
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
          setSelectedCustomer(null);
        }}
        title={`Customer Details - ${selectedCustomer?.customerNumber || ""}`}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Customer Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedCustomer.customerNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedCustomer.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedCustomer.status === "INACTIVE"
                        ? "bg-gray-500/20 text-gray-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {selectedCustomer.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Customer Name
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedCustomer.customerName}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Service Tier
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedCustomer.serviceTier === "PLATINUM"
                      ? "bg-purple-500/20 text-purple-400"
                      : selectedCustomer.serviceTier === "GOLD"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : selectedCustomer.serviceTier === "SILVER"
                          ? "bg-gray-500/20 text-gray-400"
                          : selectedCustomer.serviceTier === "BRONZE"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {selectedCustomer.serviceTier || "STANDARD"}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Industry
                </label>
                <div className="text-sm text-white">
                  {selectedCustomer.industry?.replace(/_/g, " ") || "N/A"}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Contact Person
                </label>
                <div className="text-sm text-white">
                  {selectedCustomer.contactPerson}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Email
                </label>
                <div className="text-sm text-white">
                  {selectedCustomer.email}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Phone
                </label>
                <div className="text-sm text-white">
                  {selectedCustomer.phone}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Address
                </label>
                <div className="text-sm text-white">
                  {selectedCustomer.address}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {selectedCustomer.city}, {selectedCustomer.country}{" "}
                  {selectedCustomer.postalCode}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Payment Terms
                </label>
                <div className="text-sm text-white">
                  {selectedCustomer.paymentTerms}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Credit Limit
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedCustomer.currency}{" "}
                  {selectedCustomer.creditLimit.toLocaleString()}
                </div>
                {selectedCustomer.creditUsed !== undefined && (
                  <div className="text-xs text-[#9ca3af]">
                    Used: {selectedCustomer.currency}{" "}
                    {selectedCustomer.creditUsed.toLocaleString()} (
                    {(
                      (selectedCustomer.creditUsed /
                        selectedCustomer.creditLimit) *
                      100
                    ).toFixed(1)}
                    %)
                  </div>
                )}
              </div>
            </div>
            {selectedCustomer.totalOrders !== undefined && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Total Orders
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedCustomer.totalOrders}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Total Value
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedCustomer.currency}{" "}
                      {(selectedCustomer.totalValue || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Average Order Value
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedCustomer.currency}{" "}
                      {(selectedCustomer.averageOrderValue || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      On-Time Delivery
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedCustomer.onTimeDeliveryRate?.toFixed(1) || "N/A"}
                      %
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Customer Satisfaction
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedCustomer.customerSatisfactionScore?.toFixed(1) ||
                        "N/A"}
                      /5.0
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Payment Performance
                    </label>
                    <div className="text-sm text-white font-medium">
                      {selectedCustomer.paymentPerformance?.toFixed(1) || "N/A"}
                      %
                    </div>
                  </div>
                </div>
              </div>
            )}
            {selectedCustomer.slaResponseTime && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Service Level Agreements
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Response Time
                    </label>
                    <div className="text-sm text-white">
                      {selectedCustomer.slaResponseTime}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Delivery Time
                    </label>
                    <div className="text-sm text-white">
                      {selectedCustomer.slaDeliveryTime}
                    </div>
                  </div>
                  {selectedCustomer.prioritySupport && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Priority Support
                      </label>
                      <div className="text-sm text-green-400">
                        <i className="ri-checkbox-circle-line mr-1"></i>
                        Enabled
                      </div>
                    </div>
                  )}
                  {selectedCustomer.dedicatedAccountManager && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Account Manager
                      </label>
                      <div className="text-sm text-green-400">
                        <i className="ri-checkbox-circle-line mr-1"></i>
                        Dedicated
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  handleNavigateToSalesOrders(selectedCustomer);
                  setShowViewModal(false);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-shopping-cart-2-line"></i>
                View Sales Orders
              </button>
            </div>
            {getSalesOrderLinks && (
              <div className="pt-4 border-t border-white/10">
                <ModuleLinks
                  links={getSalesOrderLinks(selectedCustomer.customerNumber)}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
