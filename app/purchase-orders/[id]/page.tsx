/**
 * Purchase Order Detail Page
 * Comprehensive PO view with line items, receipts, and status tracking
 * UX Enhanced: Toast notifications, confirmation dialogs, error handling
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

interface PurchaseOrderLine {
  id: string;
  lineNumber: number;
  materialCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
  status: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  vendorName: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CLOSED" | "CANCELLED";
  orderDate: string;
  expectedDeliveryDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  lines: PurchaseOrderLine[];
  deliveryAddress: string;
  paymentTerms: string;
  notes: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  DRAFT: { bg: "bg-gray-500/20", text: "text-gray-400", icon: "ri-draft-line" },
  PENDING: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: "ri-time-line" },
  APPROVED: { bg: "bg-blue-500/20", text: "text-blue-400", icon: "ri-checkbox-circle-line" },
  PARTIALLY_RECEIVED: { bg: "bg-orange-500/20", text: "text-orange-400", icon: "ri-pie-chart-line" },
  RECEIVED: { bg: "bg-green-500/20", text: "text-green-400", icon: "ri-check-double-line" },
  CLOSED: { bg: "bg-purple-500/20", text: "text-purple-400", icon: "ri-lock-line" },
  CANCELLED: { bg: "bg-red-500/20", text: "text-red-400", icon: "ri-close-circle-line" },
};

const TABS = [
  { id: "lines", label: "Line Items", icon: "ri-list-check" },
  { id: "receipts", label: "Goods Receipts", icon: "ri-inbox-line" },
  { id: "invoices", label: "Invoices", icon: "ri-file-text-line" },
  { id: "history", label: "History", icon: "ri-time-line" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("lines");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/wms/purchase-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (response.ok) {
        showSuccess("PO Approved", `Purchase order ${order?.orderNumber} has been approved`);
        loadOrder();
      } else {
        throw new Error("Approval failed");
      }
    } catch (err) {
      showError("Approval Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowApproveDialog(false);
    }
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/wms/purchase-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (response.ok) {
        showSuccess("PO Cancelled", `Purchase order ${order?.orderNumber} has been cancelled`);
        loadOrder();
      } else {
        throw new Error("Cancellation failed");
      }
    } catch (err) {
      showError("Cancellation Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowCancelDialog(false);
    }
  };

  const handlePrint = () => {
    showInfo("Print", "Opening print dialog...");
    window.print();
  };

  const loadOrder = async () => {
    setLoading(true);
    try {
      // Mock data for demo
      setOrder({
        id: orderId,
        orderNumber: `PO-${orderId.slice(0, 8).toUpperCase()}`,
        vendorId: "vendor-001",
        vendorName: "Al-Futtaim Logistics",
        status: "APPROVED",
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        currency: "SAR",
        subtotal: 125000,
        taxAmount: 18750,
        totalAmount: 143750,
        lines: [
          { id: "1", lineNumber: 1, materialCode: "MAT-001", description: "Pallet Racking System", quantity: 50, unit: "SET", unitPrice: 1500, totalPrice: 75000, receivedQuantity: 0, status: "OPEN" },
          { id: "2", lineNumber: 2, materialCode: "MAT-002", description: "Forklift Battery Pack", quantity: 10, unit: "EA", unitPrice: 3500, totalPrice: 35000, receivedQuantity: 0, status: "OPEN" },
          { id: "3", lineNumber: 3, materialCode: "MAT-003", description: "Barcode Scanners", quantity: 30, unit: "EA", unitPrice: 500, totalPrice: 15000, receivedQuantity: 15, status: "PARTIAL" },
        ],
        deliveryAddress: "Warehouse A, Industrial City, Riyadh",
        paymentTerms: "Net 30",
        notes: "Urgent order for Q4 expansion",
        createdBy: "admin@company.com",
        approvedBy: "manager@company.com",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError("Failed to load purchase order");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "SAR") => {
    return new Intl.NumberFormat("en-SA", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <ErrorDisplay
          title="Order Not Found"
          message={error || "The requested purchase order could not be found"}
          onRetry={loadOrder}
          onBack={() => router.push("/purchase-orders")}
          icon="ri-file-list-3-line"
        />
      </div>
    );
  }

  const statusStyle = statusConfig[order.status] || statusConfig.DRAFT;
  const totalReceived = order.lines.reduce((sum, l) => sum + l.receivedQuantity, 0);
  const totalOrdered = order.lines.reduce((sum, l) => sum + l.quantity, 0);
  const receiptProgress = ((totalReceived / totalOrdered) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Approve PO Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={handleApprove}
        title="Approve Purchase Order"
        message={`Approve purchase order ${order.orderNumber} for ${formatCurrency(order.totalAmount)}?`}
        confirmLabel="Approve"
        variant="info"
        loading={processing}
        icon="ri-checkbox-circle-line"
      />

      {/* Cancel PO Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title="Cancel Purchase Order"
        message={`Are you sure you want to cancel purchase order ${order.orderNumber}? This action cannot be undone.`}
        confirmLabel="Cancel Order"
        variant="danger"
        loading={processing}
        icon="ri-close-circle-line"
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Link href="/purchase-orders" className="p-2 hover:bg-white/10 rounded-lg">
                <i className="ri-arrow-left-line text-2xl"></i>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1`}>
                    <i className={statusStyle.icon}></i>{order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-gray-400 mt-1">{order.vendorName}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span><i className="ri-calendar-line mr-1"></i>Order: {formatDate(order.orderDate)}</span>
                  <span><i className="ri-truck-line mr-1"></i>Expected: {formatDate(order.expectedDeliveryDate)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/purchase-orders/${orderId}/edit`} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2">
                <i className="ri-edit-line"></i>Edit
              </Link>
              {order.status === "APPROVED" && (
                <Link href={`/goods-receipt?poId=${orderId}`} className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:shadow-lg hover:shadow-green-500/30 flex items-center gap-2">
                  <i className="ri-inbox-line"></i>Receive Goods
                </Link>
              )}
              <button className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl">
                <i className="ri-printer-line text-xl"></i>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Order Total</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(order.totalAmount, order.currency)}</p>
              <p className="text-sm text-gray-500 mt-1">Incl. {formatCurrency(order.taxAmount)} VAT</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Line Items</p>
              <p className="text-3xl font-bold mt-1">{order.lines.length}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Units Ordered</p>
              <p className="text-3xl font-bold mt-1">{totalOrdered}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Receipt Progress</p>
              <div className="mt-2">
                <span className="text-2xl font-bold">{receiptProgress}%</span>
                <div className="h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: `${receiptProgress}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <i className={tab.icon}></i>{tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "lines" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="ri-list-check text-blue-400"></i>
                Order Lines ({order.lines.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-4 px-6 text-gray-400 font-medium">#</th>
                    <th className="py-4 px-6 text-gray-400 font-medium">Material</th>
                    <th className="py-4 px-6 text-gray-400 font-medium">Description</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Qty</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Unit Price</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Total</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Received</th>
                    <th className="py-4 px-6 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((line) => (
                    <tr key={line.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-6 text-gray-400">{line.lineNumber}</td>
                      <td className="py-4 px-6 font-mono text-sm">{line.materialCode}</td>
                      <td className="py-4 px-6">{line.description}</td>
                      <td className="py-4 px-6 text-right">{line.quantity} {line.unit}</td>
                      <td className="py-4 px-6 text-right">{formatCurrency(line.unitPrice)}</td>
                      <td className="py-4 px-6 text-right font-medium">{formatCurrency(line.totalPrice)}</td>
                      <td className="py-4 px-6 text-right">
                        <span className={line.receivedQuantity > 0 ? "text-green-400" : "text-gray-500"}>
                          {line.receivedQuantity} / {line.quantity}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          line.status === "OPEN" ? "bg-blue-500/20 text-blue-400" :
                          line.status === "PARTIAL" ? "bg-orange-500/20 text-orange-400" :
                          "bg-green-500/20 text-green-400"
                        }`}>
                          {line.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-white/5">
                    <td colSpan={5} className="py-4 px-6 text-right font-semibold">Subtotal</td>
                    <td className="py-4 px-6 text-right font-bold">{formatCurrency(order.subtotal)}</td>
                    <td colSpan={2}></td>
                  </tr>
                  <tr className="bg-white/5">
                    <td colSpan={5} className="py-4 px-6 text-right font-semibold">VAT (15%)</td>
                    <td className="py-4 px-6 text-right font-bold">{formatCurrency(order.taxAmount)}</td>
                    <td colSpan={2}></td>
                  </tr>
                  <tr className="bg-white/5">
                    <td colSpan={5} className="py-4 px-6 text-right font-semibold text-lg">Total</td>
                    <td className="py-4 px-6 text-right font-bold text-lg text-blue-400">{formatCurrency(order.totalAmount)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "receipts" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Goods Receipts</h3>
              {order.status === "APPROVED" && (
                <Link href={`/goods-receipt?poId=${orderId}`} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl flex items-center gap-2">
                  <i className="ri-add-line"></i>Create Receipt
                </Link>
              )}
            </div>
            {totalReceived > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <i className="ri-inbox-line text-green-400"></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">GR-001</p>
                    <p className="text-sm text-gray-400">15 units received</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <i className="ri-inbox-line text-5xl mb-4"></i>
                <p>No goods received yet</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "invoices" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6">Linked Invoices</h3>
            <div className="text-center py-12 text-gray-400">
              <i className="ri-file-text-line text-5xl mb-4"></i>
              <p>No invoices linked yet</p>
              <p className="text-sm mt-1">Invoices will appear here after goods receipt</p>
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6">Order History</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
              <div className="space-y-6">
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-gray-500 border-2 border-gray-900"></div>
                  <div>
                    <p className="font-medium">PO Created</p>
                    <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">By: {order.createdBy}</p>
                  </div>
                </div>
                {order.approvedBy && (
                  <div className="relative flex items-start gap-4 pl-10">
                    <div className="absolute left-2 w-5 h-5 rounded-full bg-blue-500 border-2 border-gray-900"></div>
                    <div>
                      <p className="font-medium">PO Approved</p>
                      <p className="text-sm text-gray-400">{new Date(order.updatedAt).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">By: {order.approvedBy}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
