"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import {
  generateVendorMaster,
} from "@/utils/mockDataGenerators";
import { getPurchaseOrderLinks } from "@/utils/moduleInterconnectivity";
import { format, differenceInDays } from "date-fns";
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
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import { useCurrency } from "@/contexts/CurrencyContext";
import ExportButton from "@/components/ExportButton";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import QRCodeBadge from "@/components/qr/QRCodeBadge";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorNumber: string;
  vendorName: string;
  orderDate: Date | string;
  expectedDeliveryDate: Date | string;
  status:
    | "CREATED"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "CONFIRMED"
    | "PARTIALLY_RECEIVED"
    | "RECEIVED"
    | "COMPLETED"
    | "CANCELLED";
  totalValue: number;
  currency: string;
  totalItems: number;
  totalQuantity: number;
  items: Array<{
    materialNumber: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  approvedDate?: Date | string;
  receivedQuantity?: number;
  receivedValue?: number;
}

export default function PurchaseOrders() {
  const router = useRouter();
  const { currencyInfo } = useCurrency();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendors] = useState(() => generateVendorMaster(30));
  
  // Fetch purchase orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/purchase-orders?limit=100');
        const result = await response.json();
        
        if (result.success && result.data) {
          // Map API response to component interface
          const mappedOrders: PurchaseOrder[] = result.data.map((order: any) => ({
            id: order.id,
            poNumber: order.orderNumber,
            vendorNumber: order.vendorId || '',
            vendorName: order.vendorName || '',
            orderDate: order.orderDate,
            expectedDeliveryDate: order.expectedDeliveryDate || order.orderDate,
            status: (order.status === 'DRAFT' ? 'CREATED' : 
                    order.status === 'PENDING' ? 'PENDING_APPROVAL' :
                    order.status) as PurchaseOrder["status"],
            totalValue: Number(order.totalAmount || order.subtotal || 0),
            currency: order.currency || 'SAR',
            totalItems: order.lines?.length || 0,
            totalQuantity: order.lines?.reduce((sum: number, line: any) => sum + (line.quantity || 0), 0) || 0,
            items: order.lines?.map((line: any) => ({
              materialNumber: line.sku || '',
              quantity: Number(line.quantity || 0),
              unit: line.unit || 'EA',
              price: Number(line.unitPrice || 0),
            })) || [],
            approvalStatus: order.status === 'PENDING_APPROVAL' ? 'PENDING' as const :
                          order.status === 'APPROVED' ? 'APPROVED' as const : undefined,
            approvedBy: order.approvedBy,
            approvedDate: order.approvedAt,
            receivedQuantity: order.lines?.reduce((sum: number, line: any) => sum + (line.receivedQty || 0), 0) || 0,
            receivedValue: order.lines?.reduce((sum: number, line: any) => {
              const receivedQty = line.receivedQty || 0;
              return sum + (receivedQty * Number(line.unitPrice || 0));
            }, 0) || 0,
          }));
          setOrders(mappedOrders);
        } else {
          setError(result.error || 'Failed to fetch purchase orders');
        }
      } catch (err) {
        console.error('Error fetching purchase orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch purchase orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Refresh function for use after actions
  const refreshOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/wms/purchase-orders?limit=100');
      const result = await response.json();
      
      if (result.success && result.data) {
        const mappedOrders: PurchaseOrder[] = result.data.map((order: any) => ({
          id: order.id,
          poNumber: order.orderNumber,
          vendorNumber: order.vendorId || '',
          vendorName: order.vendorName || '',
          orderDate: order.orderDate,
          expectedDeliveryDate: order.expectedDeliveryDate || order.orderDate,
          status: (order.status === 'DRAFT' ? 'CREATED' : 
                  order.status === 'PENDING' ? 'PENDING_APPROVAL' :
                  order.status) as PurchaseOrder["status"],
          totalValue: Number(order.totalAmount || order.subtotal || 0),
          currency: order.currency || 'SAR',
          totalItems: order.lines?.length || 0,
          totalQuantity: order.lines?.reduce((sum: number, line: any) => sum + (line.quantity || 0), 0) || 0,
          items: order.lines?.map((line: any) => ({
            materialNumber: line.sku || '',
            quantity: Number(line.quantity || 0),
            unit: line.unit || 'EA',
            price: Number(line.unitPrice || 0),
          })) || [],
          approvalStatus: order.status === 'PENDING_APPROVAL' ? 'PENDING' as const :
                        order.status === 'APPROVED' ? 'APPROVED' as const : undefined,
          approvedBy: order.approvedBy,
          approvedDate: order.approvedAt,
          receivedQuantity: order.lines?.reduce((sum: number, line: any) => sum + (line.receivedQty || 0), 0) || 0,
          receivedValue: order.lines?.reduce((sum: number, line: any) => {
            const receivedQty = line.receivedQty || 0;
            return sum + (receivedQty * Number(line.unitPrice || 0));
          }, 0) || 0,
        }));
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error('Error refreshing orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh orders');
    } finally {
      setLoading(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedVendor, setSelectedVendor] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "analytics" | "workflow">(
    "table",
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalOrders: 0,
    pendingApproval: 0,
    overdue: 0,
    totalValue: 0,
  });

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.vendorNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || order.status === selectedStatus;
      const matchesVendor =
        selectedVendor === "ALL" || order.vendorNumber === selectedVendor;
      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [orders, searchQuery, selectedStatus, selectedVendor]);

  const statusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [orders]);

  const vendorPerformance = useMemo(() => {
    const vendorStats: Record<
      string,
      { orders: number; totalValue: number; avgDeliveryTime: number }
    > = {};
    orders.forEach((order) => {
      if (!vendorStats[order.vendorNumber]) {
        vendorStats[order.vendorNumber] = {
          orders: 0,
          totalValue: 0,
          avgDeliveryTime: 0,
        };
      }
      vendorStats[order.vendorNumber].orders++;
      vendorStats[order.vendorNumber].totalValue += order.totalValue;
    });
    return Object.entries(vendorStats)
      .map(([vendor, stats]) => ({
        vendor:
          vendors.find((v) => v.vendorNumber === vendor)?.vendorName || vendor,
        ...stats,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);
  }, [orders, vendors]);

  const pendingApprovals = useMemo(() => {
    return orders.filter(
      (o) => o.status === "PENDING_APPROVAL" || o.approvalStatus === "PENDING",
    ).length;
  }, [orders]);

  const overdueOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      if (!o.expectedDeliveryDate) return false;
      return (
        new Date(o.expectedDeliveryDate) < now &&
        !["COMPLETED", "CANCELLED"].includes(o.status)
      );
    }).length;
  }, [orders]);

  const aggregateStats = useMemo(() => {
    return {
      totalOrders: orders.length,
      pendingApproval: pendingApprovals,
      overdue: overdueOrders,
      totalValue: orders.reduce((sum, o) => sum + o.totalValue, 0),
    };
  }, [orders.length, pendingApprovals, overdueOrders, orders]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "purchase-orders-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "purchase-orders-stats",
      () => ({
        totalOrders: aggregateStats.totalOrders,
        pendingApproval: simulateKPIUpdates(
          aggregateStats.pendingApproval,
          0.1,
        ),
        overdue: simulateKPIUpdates(aggregateStats.overdue, 0.1),
        totalValue: simulateKPIUpdates(aggregateStats.totalValue, 0.02),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    realTimeEnabled,
    aggregateStats.totalOrders,
    aggregateStats.pendingApproval,
    aggregateStats.overdue,
    aggregateStats.totalValue,
  ]);

  const stats = [
    {
      label: "Total Orders",
      value: realTimeEnabled
        ? realTimeStats.totalOrders
        : aggregateStats.totalOrders,
      icon: "ri-file-list-3-line",
      tooltip: "Total purchase orders",
      trend: "up" as const,
    },
    {
      label: "Pending Approval",
      value: realTimeEnabled
        ? realTimeStats.pendingApproval
        : aggregateStats.pendingApproval,
      icon: "ri-time-line",
      tooltip: "Orders awaiting approval",
      trend:
        (realTimeEnabled
          ? realTimeStats.pendingApproval
          : aggregateStats.pendingApproval) > 0
          ? ("down" as const)
          : ("neutral" as const),
    },
    {
      label: "Overdue",
      value: realTimeEnabled ? realTimeStats.overdue : aggregateStats.overdue,
      icon: "ri-alarm-warning-line",
      tooltip: "Overdue orders",
      trend:
        (realTimeEnabled ? realTimeStats.overdue : aggregateStats.overdue) > 0
          ? ("down" as const)
          : ("neutral" as const),
    },
    {
      label: "Total Value",
      value: realTimeEnabled
        ? realTimeStats.totalValue
        : aggregateStats.totalValue,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total purchase order value",
      trend: "up" as const,
      isCurrency: true,
    },
  ];

  const handleView = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleApproval = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowApprovalModal(true);
  };

  const handleReceive = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowReceiveModal(true);
  };

  const handleNavigateToGR = (order: PurchaseOrder) => {
    router.push(`/goods-receipt?po=${order.poNumber}`);
  };

  const handleNavigateToVendor = (order: PurchaseOrder) => {
    router.push(`/vendors?vendor=${order.vendorNumber}`);
  };

  const handleCreatePO = () => {
    setShowCreateModal(true);
  };

  const createPurchaseOrder = async (orderData: any) => {
    try {
      const response = await fetch('/api/wms/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: orderData.vendorId,
          vendorName: orderData.vendorName,
          expectedDeliveryDate: orderData.expectedDeliveryDate || undefined,
          currency: orderData.currency || 'SAR',
          lines: orderData.items.map((item: any) => ({
            sku: item.materialNumber,
            description: item.description || '',
            quantity: Number(item.quantity) || 0,
            unit: item.unit || 'EA',
            unitPrice: Number(item.price) || 0,
          })),
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Refresh data from API
        await refreshOrders();
        setShowCreateModal(false);
      } else {
        setError(result.error || 'Failed to create purchase order');
      }
    } catch (err) {
      console.error('Error creating purchase order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create purchase order');
    }
  };

  const approveOrder = async () => {
    if (selectedOrder) {
      try {
        const response = await fetch(`/api/wms/purchase-orders/${selectedOrder.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'APPROVED',
            approvedBy: 'Current User',
            approvedAt: new Date().toISOString(),
          }),
        });

        const result = await response.json();
        if (result.success) {
          // Refresh data from API
          const refreshResponse = await fetch('/api/wms/purchase-orders?limit=100');
          const refreshResult = await refreshResponse.json();
          if (refreshResult.success && refreshResult.data) {
            const mappedOrders: PurchaseOrder[] = refreshResult.data.map((order: any) => ({
              id: order.id,
              poNumber: order.orderNumber,
              vendorNumber: order.vendorId || '',
              vendorName: order.vendorName || '',
              orderDate: order.orderDate,
              expectedDeliveryDate: order.expectedDeliveryDate || order.orderDate,
              status: (order.status === 'DRAFT' ? 'CREATED' :
                      order.status === 'PENDING' ? 'PENDING_APPROVAL' :
                      order.status) as PurchaseOrder["status"],
              totalValue: Number(order.totalAmount || order.subtotal || 0),
              currency: order.currency || 'SAR',
              totalItems: order.lines?.length || 0,
              totalQuantity: order.lines?.reduce((sum: number, line: any) => sum + (line.quantity || 0), 0) || 0,
              items: order.lines?.map((line: any) => ({
                materialNumber: line.sku || '',
                quantity: Number(line.quantity || 0),
                unit: line.unit || 'EA',
                price: Number(line.unitPrice || 0),
              })) || [],
              approvalStatus: order.status === 'PENDING_APPROVAL' ? 'PENDING' as const :
                            order.status === 'APPROVED' ? 'APPROVED' as const : undefined,
              approvedBy: order.approvedBy,
              approvedDate: order.approvedAt,
              receivedQuantity: order.lines?.reduce((sum: number, line: any) => sum + (line.receivedQty || 0), 0) || 0,
              receivedValue: order.lines?.reduce((sum: number, line: any) => {
                const receivedQty = line.receivedQty || 0;
                return sum + (receivedQty * Number(line.unitPrice || 0));
              }, 0) || 0,
            }));
            setOrders(mappedOrders);
          }
          setShowApprovalModal(false);
          setSelectedOrder(null);
        } else {
          setError(result.error || 'Failed to approve order');
        }
      } catch (err) {
        console.error('Error approving order:', err);
        setError(err instanceof Error ? err.message : 'Failed to approve order');
      }
    }
  };

  return (
    <PageTemplate
      title="Purchase Orders"
      description="Purchase order management with full workflow - Create, approve, track, and receive purchase orders with vendor performance analytics"
      icon="ri-shopping-bag-3-line"
      systemInfo={{
        sap: "ME21N - Create PO, ME22N - Change PO, ME23N - Display PO, ME29N - Approve PO",
        oracle: "Purchase Order, PO Management, Requisition",
        manhattan: "Purchase Order Management, Procurement",
      }}
      examples={[
        "Create purchase orders",
        "Approve/reject orders",
        "Track order status",
        "Receive goods against PO",
        "Monitor vendor performance",
        "Handle order changes",
        "GR integration",
      ]}
      stats={stats}
      loading={loading}
      error={error}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            {(["table", "analytics", "workflow"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 sm:p-2 rounded transition-colors ${
                  viewMode === mode
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-[#9ca3af] hover:text-white"
                }`}
                title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} View`}
              >
                <i
                  className={`ri-${mode === "table" ? "table-line" : mode === "analytics" ? "bar-chart-line" : "flow-chart-line"} text-sm sm:text-base`}
                ></i>
              </button>
            ))}
          </div>
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              realTimeEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i
              className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
            ></i>
            Real-time
          </button>
          <button 
            onClick={handleCreatePO}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">Create PO</span>
          </button>
        </div>
      }
    >
      {/* Alerts */}
      {(pendingApprovals > 0 || overdueOrders > 0) && (
        <div className="mb-6 space-y-2">
          {pendingApprovals > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
              <i className="ri-time-line text-yellow-400 text-xl"></i>
              <div className="flex-1">
                <div className="text-yellow-400 font-medium">
                  {pendingApprovals} Order{pendingApprovals > 1 ? "s" : ""}{" "}
                  Pending Approval
                </div>
                <div className="text-yellow-300/80 text-sm">
                  Requires immediate attention
                </div>
              </div>
            </div>
          )}
          {overdueOrders > 0 && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <i className="ri-alarm-warning-line text-red-400 text-xl"></i>
              <div className="flex-1">
                <div className="text-red-400 font-medium">
                  {overdueOrders} Overdue Order{overdueOrders > 1 ? "s" : ""}
                </div>
                <div className="text-red-300/80 text-sm">
                  Follow up with vendors required
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Order Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][
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
              Top 10 Vendors by Value
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendorPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  dataKey="vendor"
                  type="category"
                  stroke="#9ca3af"
                  fontSize={12}
                  width={150}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="totalValue"
                  fill="#06b6d4"
                  name={`Total Value (${currencyInfo.code})`}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Workflow View */}
      {viewMode === "workflow" && (
        <div className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Purchase Order Workflow
          </h3>
          <div className="flex items-center justify-between">
            {[
              "CREATED",
              "PENDING_APPROVAL",
              "APPROVED",
              "CONFIRMED",
              "PARTIALLY_RECEIVED",
              "RECEIVED",
              "COMPLETED",
            ].map((status, index) => (
              <div key={status} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      index === 0
                        ? "bg-cyan-500 border-cyan-500"
                        : index === 1
                          ? "bg-yellow-500 border-yellow-500"
                          : index === 2
                            ? "bg-green-500 border-green-500"
                            : "bg-gray-500 border-gray-500"
                    }`}
                  >
                    <i className="ri-check-line text-white"></i>
                  </div>
                  <div className="text-xs text-white mt-2 text-center">
                    {status.replace(/_/g, " ")}
                  </div>
                  <div className="text-xs text-[#9ca3af] mt-1">
                    {orders.filter((o) => o.status === status).length}
                  </div>
                </div>
                {index < 6 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 ${
                      index < 2 ? "bg-cyan-500" : "bg-gray-500"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by PO Number, Vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="CREATED">Created</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PARTIALLY_RECEIVED">Partially Received</option>
          <option value="RECEIVED">Received</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[200px]"
        >
          <option value="ALL">All Vendors</option>
          {vendors.slice(0, 20).map((vendor) => (
            <option key={vendor.vendorNumber} value={vendor.vendorNumber}>
              {vendor.vendorName}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Purchase Orders
            </h3>
            <ExportButton
              data={filteredOrders.map((order) => ({
                poNumber: order.poNumber,
                vendorName: order.vendorName,
                vendorNumber: order.vendorNumber,
                orderDate: format(new Date(order.orderDate), "yyyy-MM-dd"),
                expectedDeliveryDate: format(
                  new Date(order.expectedDeliveryDate),
                  "yyyy-MM-dd",
                ),
                status: order.status,
                totalValue: order.totalValue,
                currency: order.currency,
                totalItems: order.totalItems,
                priority: (order as any).priority,
              }))}
              columns={[
                { key: "poNumber", label: "PO Number" },
                { key: "vendorName", label: "Vendor" },
                { key: "orderDate", label: "Order Date" },
                { key: "expectedDeliveryDate", label: "Expected Delivery" },
                { key: "status", label: "Status" },
                { key: "totalValue", label: "Total Value" },
                { key: "totalItems", label: "Items" },
              ]}
              filename="purchase-orders"
              title="Purchase Orders"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredOrders.map((order, index) => {
                  const progress = order.receivedQuantity
                    ? (order.receivedQuantity / order.totalQuantity) * 100
                    : 0;
                  const daysToDelivery = order.expectedDeliveryDate
                    ? differenceInDays(
                        new Date(order.expectedDeliveryDate),
                        new Date(),
                      )
                    : null;
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Tooltip
                          content={`PO Number: ${order.poNumber}`}
                          position="right"
                        >
                          <span className="text-sm font-medium text-white font-mono cursor-help">
                            {order.poNumber}
                          </span>
                        </Tooltip>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-white font-medium">
                            {order.vendorName}
                          </div>
                          <div className="text-xs text-[#9ca3af] font-mono">
                            {order.vendorNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {format(new Date(order.orderDate), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            daysToDelivery !== null && daysToDelivery < 0
                              ? "text-red-400"
                              : daysToDelivery !== null && daysToDelivery < 7
                                ? "text-yellow-400"
                                : "text-white"
                          }`}
                        >
                          {format(
                            new Date(order.expectedDeliveryDate),
                            "MMM dd, yyyy",
                          )}
                        </div>
                        {daysToDelivery !== null && (
                          <div className="text-xs text-[#9ca3af]">
                            {daysToDelivery < 0
                              ? `${Math.abs(daysToDelivery)}d overdue`
                              : `${daysToDelivery}d remaining`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            order.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : order.status === "APPROVED" ||
                                  order.status === "CONFIRMED"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : order.status === "PENDING_APPROVAL"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : order.status === "PARTIALLY_RECEIVED"
                                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CurrencyDisplay
                          amount={order.totalValue}
                          size="sm"
                          variant="default"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-24 bg-white/10 rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-[#9ca3af] mt-1">
                          {progress.toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <QRCodeBadge
                            entityId={order.id}
                            entityType="purchase-order"
                            entityName={order.poNumber}
                            documentType="other"
                            documentUrl={`/purchase-orders?po=${order.poNumber}`}
                            module="procurement"
                            size="sm"
                          />
                          <Tooltip content="View Details" position="top">
                            <button
                              onClick={() => handleView(order)}
                              className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                          </Tooltip>
                          {order.status === "PENDING_APPROVAL" && (
                            <Tooltip content="Approve Order" position="top">
                              <button
                                onClick={() => handleApproval(order)}
                                className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                              >
                                <i className="ri-check-line"></i>
                              </button>
                            </Tooltip>
                          )}
                          {[
                            "APPROVED",
                            "CONFIRMED",
                            "PARTIALLY_RECEIVED",
                          ].includes(order.status) && (
                            <Tooltip
                              content="Receive Goods (Go to GR)"
                              position="top"
                            >
                              <button
                                onClick={() => handleNavigateToGR(order)}
                                className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                              >
                                <i className="ri-inbox-line"></i>
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip content="View Vendor" position="top">
                            <button
                              onClick={() => handleNavigateToVendor(order)}
                              className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                            >
                              <i className="ri-user-line"></i>
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
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
          setSelectedOrder(null);
        }}
        title={`Purchase Order Details - ${selectedOrder?.poNumber || ""}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* QR Code Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <UniversalQRGenerator
                entityId={selectedOrder.id}
                entityType="purchase-order"
                entityName={selectedOrder.poNumber}
                documentType="other"
                documentUrl={`/purchase-orders?po=${selectedOrder.poNumber}`}
                module="procurement"
                showAdvanced={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  PO Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedOrder.poNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Vendor
                </label>
                <div className="text-sm text-white">
                  {selectedOrder.vendorName}
                </div>
                <div className="text-xs text-[#9ca3af] font-mono">
                  {selectedOrder.vendorNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Order Date
                </label>
                <div className="text-sm text-white">
                  {format(new Date(selectedOrder.orderDate), "MMM dd, yyyy")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Expected Delivery
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedOrder.expectedDeliveryDate),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedOrder.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedOrder.status === "APPROVED"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedOrder.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Value
                </label>
                <CurrencyDisplay
                  amount={selectedOrder.totalValue}
                  size="sm"
                  variant="default"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <label className="text-xs text-[#9ca3af] mb-2 block">
                Order Items
              </label>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <button
                        onClick={() =>
                          router.push(
                            `/inventory?material=${item.materialNumber}`,
                          )
                        }
                        className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        {item.materialNumber}
                      </button>
                      <div className="text-xs text-[#9ca3af]">
                        Qty: {item.quantity.toFixed(2)} {item.unit}
                      </div>
                    </div>
                    <CurrencyDisplay
                      amount={item.price}
                      size="sm"
                      variant="default"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <ModuleLinks
                links={getPurchaseOrderLinks(selectedOrder.poNumber)}
              />
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleNavigateToGR(selectedOrder)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-inbox-line"></i>
                Go to Goods Receipt
              </button>
              <button
                onClick={() => handleNavigateToVendor(selectedOrder)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <i className="ri-user-line"></i>
                View Vendor
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedOrder(null);
        }}
        title={`Approve Purchase Order - ${selectedOrder?.poNumber || ""}`}
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-white mb-2">
                Order Value:{" "}
                <span className="font-medium">
                  <CurrencyDisplay
                    amount={selectedOrder.totalValue}
                    size="sm"
                    variant="highlight"
                  />
                </span>
              </div>
              <div className="text-sm text-white mb-2">
                Vendor:{" "}
                <span className="font-medium">{selectedOrder.vendorName}</span>
              </div>
              <div className="text-sm text-white">
                Items:{" "}
                <span className="font-medium">{selectedOrder.totalItems}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={approveOrder}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors"
              >
                Approve Order
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Receive Goods Modal */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => {
          setShowReceiveModal(false);
          setSelectedOrder(null);
        }}
        title={`Receive Goods - ${selectedOrder?.poNumber || ""}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-[#9ca3af] mb-1">
                Expected Quantity
              </div>
              <div className="text-lg text-white font-medium">
                {selectedOrder.totalQuantity.toFixed(2)}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-2 block">
                Received Quantity
              </label>
              <input
                type="number"
                max={selectedOrder.totalQuantity}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Enter received quantity"
              />
            </div>
            <div className="flex items-center gap-3 justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowReceiveModal(false);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleNavigateToGR(selectedOrder);
                  setShowReceiveModal(false);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors"
              >
                Receive Goods
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create PO Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Purchase Order"
        size="lg"
      >
        <CreatePOForm
          vendors={vendors}
          onSubmit={createPurchaseOrder}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </PageTemplate>
  );
}

// Create PO Form Component
function CreatePOForm({ vendors, onSubmit, onCancel }: {
  vendors: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    vendorId: '',
    vendorName: '',
    expectedDeliveryDate: '',
    currency: 'SAR',
    items: [{ materialNumber: '', quantity: 0, unit: 'EA', price: 0, description: '' }],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { materialNumber: '', quantity: 0, unit: 'EA', price: 0, description: '' }],
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-[#9ca3af] mb-2 block">Vendor</label>
        <select
          value={formData.vendorId}
          onChange={(e) => {
            const vendor = vendors.find(v => v.vendorNumber === e.target.value);
            setFormData(prev => ({
              ...prev,
              vendorId: e.target.value,
              vendorName: vendor?.vendorName || '',
            }));
          }}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
          required
        >
          <option value="">Select Vendor</option>
          {vendors.map(vendor => (
            <option key={vendor.vendorNumber} value={vendor.vendorNumber}>
              {vendor.vendorName} ({vendor.vendorNumber})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-[#9ca3af] mb-2 block">Expected Delivery Date</label>
        <input
          type="date"
          value={formData.expectedDeliveryDate}
          onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
          required
        />
      </div>

      <div>
        <label className="text-xs text-[#9ca3af] mb-2 block">Currency</label>
        <select
          value={formData.currency}
          onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="SAR">SAR</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-[#9ca3af]">Items</label>
          <button
            type="button"
            onClick={addItem}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            <i className="ri-add-line mr-1"></i>Add Item
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {formData.items.map((item, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-3 flex gap-2">
              <input
                type="text"
                placeholder="Material Number"
                value={item.materialNumber}
                onChange={(e) => updateItem(index, 'materialNumber', e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white"
                required
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                className="w-20 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white"
                required
                min="1"
              />
              <input
                type="text"
                placeholder="Unit"
                value={item.unit}
                onChange={(e) => updateItem(index, 'unit', e.target.value)}
                className="w-20 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white"
              />
              <input
                type="number"
                placeholder="Price"
                value={item.price}
                onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                className="w-24 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white"
                required
                min="0"
                step="0.01"
              />
              {formData.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors"
        >
          Create Purchase Order
        </button>
      </div>
    </form>
  );
}
