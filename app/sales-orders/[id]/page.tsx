/**
 * Sales Order Detail Page
 * Comprehensive SO view with line items, fulfillment, and shipping
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

interface SalesOrderLine {
  id: string;
  lineNumber: number;
  skuCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  pickedQuantity: number;
  shippedQuantity: number;
  status: string;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: "DRAFT" | "CONFIRMED" | "PICKING" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  orderDate: string;
  requestedDeliveryDate: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  lines: SalesOrderLine[];
  shippingAddress: string;
  billingAddress: string;
  paymentTerms: string;
  shippingMethod: string;
  trackingNumber?: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { bg: string; text: string; icon: string; step: number }> = {
  DRAFT: { bg: "bg-gray-500/20", text: "text-gray-400", icon: "ri-draft-line", step: 0 },
  CONFIRMED: { bg: "bg-blue-500/20", text: "text-blue-400", icon: "ri-checkbox-circle-line", step: 1 },
  PICKING: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: "ri-shopping-bag-line", step: 2 },
  PACKED: { bg: "bg-orange-500/20", text: "text-orange-400", icon: "ri-box-3-line", step: 3 },
  SHIPPED: { bg: "bg-purple-500/20", text: "text-purple-400", icon: "ri-truck-line", step: 4 },
  DELIVERED: { bg: "bg-green-500/20", text: "text-green-400", icon: "ri-check-double-line", step: 5 },
  CANCELLED: { bg: "bg-red-500/20", text: "text-red-400", icon: "ri-close-circle-line", step: -1 },
};

const TABS = [
  { id: "lines", label: "Line Items", icon: "ri-list-check" },
  { id: "fulfillment", label: "Fulfillment", icon: "ri-truck-line" },
  { id: "invoices", label: "Invoices", icon: "ri-file-text-line" },
  { id: "history", label: "History", icon: "ri-time-line" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("lines");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleCancel = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/wms/sales-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (response.ok) {
        showSuccess("Order Cancelled", `Sales order ${order?.orderNumber} has been cancelled`);
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

  const handleShip = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/wms/sales-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SHIPPED" }),
      });
      if (response.ok) {
        showSuccess("Order Shipped", `Sales order ${order?.orderNumber} has been marked as shipped`);
        loadOrder();
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      showError("Shipping Update Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowShipDialog(false);
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
        orderNumber: `SO-${orderId.slice(0, 8).toUpperCase()}`,
        customerId: "customer-001",
        customerName: "Arabian Gulf Trading Co.",
        status: "PICKING",
        orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        requestedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        currency: "SAR",
        subtotal: 85000,
        discountAmount: 4250,
        taxAmount: 12112.5,
        shippingAmount: 500,
        totalAmount: 93362.5,
        lines: [
          { id: "1", lineNumber: 1, skuCode: "SKU-10001", description: "Premium Warehouse Shelving Unit", quantity: 25, unit: "EA", unitPrice: 2000, discount: 5, totalPrice: 47500, pickedQuantity: 25, shippedQuantity: 0, status: "PICKED" },
          { id: "2", lineNumber: 2, skuCode: "SKU-10002", description: "Industrial Storage Bins - Large", quantity: 100, unit: "EA", unitPrice: 250, discount: 5, totalPrice: 23750, pickedQuantity: 80, shippedQuantity: 0, status: "PARTIAL" },
          { id: "3", lineNumber: 3, skuCode: "SKU-10003", description: "Safety Equipment Kit", quantity: 55, unit: "SET", unitPrice: 250, discount: 0, totalPrice: 13750, pickedQuantity: 0, shippedQuantity: 0, status: "OPEN" },
        ],
        shippingAddress: "King Fahd Road, Al Olaya District, Riyadh 12211",
        billingAddress: "P.O. Box 12345, Riyadh 11411",
        paymentTerms: "Net 30",
        shippingMethod: "Express Delivery",
        notes: "Priority customer - expedite processing",
        createdBy: "sales@company.com",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError("Failed to load sales order");
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
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <ErrorDisplay
          title="Order Not Found"
          message={error || "The requested sales order could not be found"}
          onRetry={loadOrder}
          onBack={() => router.push("/sales-orders")}
          icon="ri-shopping-cart-line"
        />
      </div>
    );
  }

  const statusStyle = statusConfig[order.status] || statusConfig.DRAFT;
  const totalPicked = order.lines.reduce((sum, l) => sum + l.pickedQuantity, 0);
  const totalOrdered = order.lines.reduce((sum, l) => sum + l.quantity, 0);
  const fulfillmentProgress = ((totalPicked / totalOrdered) * 100).toFixed(0);

  const WORKFLOW_STEPS = ["Confirmed", "Picking", "Packed", "Shipped", "Delivered"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title="Cancel Sales Order"
        message={`Are you sure you want to cancel sales order ${order.orderNumber}? This action cannot be undone.`}
        confirmLabel="Cancel Order"
        variant="danger"
        loading={processing}
        icon="ri-close-circle-line"
      />

      {/* Mark as Shipped Dialog */}
      <ConfirmDialog
        isOpen={showShipDialog}
        onClose={() => setShowShipDialog(false)}
        onConfirm={handleShip}
        title="Mark as Shipped"
        message={`Mark sales order ${order.orderNumber} as shipped?`}
        confirmLabel="Mark Shipped"
        variant="info"
        loading={processing}
        icon="ri-truck-line"
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Link href="/sales-orders" className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back">
                <i className="ri-arrow-left-line text-2xl"></i>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1`}>
                    <i className={statusStyle.icon}></i>{order.status}
                  </span>
                </div>
                <p className="text-gray-400 mt-1">{order.customerName}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span><i className="ri-calendar-line mr-1"></i>Order: {formatDate(order.orderDate)}</span>
                  <span><i className="ri-truck-line mr-1"></i>Requested: {formatDate(order.requestedDeliveryDate)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/sales-orders/${orderId}/edit`} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2">
                <i className="ri-edit-line"></i>Edit
              </Link>
              {order.status === "CONFIRMED" && (
                <Link href={`/picking?soId=${orderId}`} className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl hover:shadow-lg hover:shadow-orange-500/30 flex items-center gap-2">
                  <i className="ri-shopping-bag-line"></i>Start Picking
                </Link>
              )}
              {order.status === "PACKED" && (
                <button className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 flex items-center gap-2">
                  <i className="ri-truck-line"></i>Ship Order
                </button>
              )}
              <button className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl">
                <i className="ri-printer-line text-xl"></i>
              </button>
            </div>
          </div>

          {/* Order Workflow */}
          {order.status !== "CANCELLED" && (
            <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                {WORKFLOW_STEPS.map((step, i) => {
                  const stepNum = i + 1;
                  const isActive = statusStyle.step === stepNum;
                  const isComplete = statusStyle.step > stepNum;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`flex flex-col items-center flex-1 ${i === 0 ? "" : ""}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isComplete ? "bg-green-500" : isActive ? "bg-orange-500" : "bg-white/10"
                        }`}>
                          {isComplete ? <i className="ri-check-line"></i> : <span>{stepNum}</span>}
                        </div>
                        <span className={`text-sm mt-2 ${isActive ? "text-orange-400 font-medium" : isComplete ? "text-green-400" : "text-gray-500"}`}>
                          {step}
                        </span>
                      </div>
                      {i < WORKFLOW_STEPS.length - 1 && (
                        <div className={`h-0.5 flex-1 mx-2 ${isComplete ? "bg-green-500" : "bg-white/10"}`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Order Total</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(order.totalAmount)}</p>
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
              <p className="text-gray-400 text-sm">Fulfillment</p>
              <div className="mt-2">
                <span className="text-2xl font-bold">{fulfillmentProgress}%</span>
                <div className="h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" style={{ width: `${fulfillmentProgress}%` }}></div>
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
                  activeTab === tab.id ? "border-orange-500 text-orange-400" : "border-transparent text-gray-400 hover:text-white"
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
                <i className="ri-list-check text-orange-400"></i>
                Order Lines ({order.lines.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-4 px-6 text-gray-400 font-medium">#</th>
                    <th className="py-4 px-6 text-gray-400 font-medium">SKU</th>
                    <th className="py-4 px-6 text-gray-400 font-medium">Description</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Qty</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Unit Price</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Discount</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Total</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Picked</th>
                    <th className="py-4 px-6 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((line) => (
                    <tr key={line.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-6 text-gray-400">{line.lineNumber}</td>
                      <td className="py-4 px-6 font-mono text-sm">{line.skuCode}</td>
                      <td className="py-4 px-6">{line.description}</td>
                      <td className="py-4 px-6 text-right">{line.quantity} {line.unit}</td>
                      <td className="py-4 px-6 text-right">{formatCurrency(line.unitPrice)}</td>
                      <td className="py-4 px-6 text-right">{line.discount > 0 ? `${line.discount}%` : "-"}</td>
                      <td className="py-4 px-6 text-right font-medium">{formatCurrency(line.totalPrice)}</td>
                      <td className="py-4 px-6 text-right">
                        <span className={line.pickedQuantity > 0 ? "text-green-400" : "text-gray-500"}>
                          {line.pickedQuantity} / {line.quantity}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          line.status === "OPEN" ? "bg-blue-500/20 text-blue-400" :
                          line.status === "PARTIAL" ? "bg-orange-500/20 text-orange-400" :
                          line.status === "PICKED" ? "bg-yellow-500/20 text-yellow-400" :
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
                    <td colSpan={6} className="py-3 px-6 text-right">Subtotal</td>
                    <td className="py-3 px-6 text-right font-medium">{formatCurrency(order.subtotal)}</td>
                    <td colSpan={2}></td>
                  </tr>
                  <tr className="bg-white/5">
                    <td colSpan={6} className="py-3 px-6 text-right">Discount</td>
                    <td className="py-3 px-6 text-right text-red-400">-{formatCurrency(order.discountAmount)}</td>
                    <td colSpan={2}></td>
                  </tr>
                  <tr className="bg-white/5">
                    <td colSpan={6} className="py-3 px-6 text-right">VAT (15%)</td>
                    <td className="py-3 px-6 text-right">{formatCurrency(order.taxAmount)}</td>
                    <td colSpan={2}></td>
                  </tr>
                  <tr className="bg-white/5">
                    <td colSpan={6} className="py-3 px-6 text-right">Shipping</td>
                    <td className="py-3 px-6 text-right">{formatCurrency(order.shippingAmount)}</td>
                    <td colSpan={2}></td>
                  </tr>
                  <tr className="bg-white/5 border-t border-white/10">
                    <td colSpan={6} className="py-4 px-6 text-right font-semibold text-lg">Grand Total</td>
                    <td className="py-4 px-6 text-right font-bold text-lg text-orange-400">{formatCurrency(order.totalAmount)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "fulfillment" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-map-pin-line text-orange-400"></i>
                Shipping Address
              </h3>
              <p className="text-gray-300 whitespace-pre-wrap">{order.shippingAddress}</p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400">Shipping Method</p>
                <p className="mt-1">{order.shippingMethod}</p>
              </div>
              {order.trackingNumber && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400">Tracking Number</p>
                  <p className="mt-1 font-mono">{order.trackingNumber}</p>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-file-list-2-line text-orange-400"></i>
                Billing Address
              </h3>
              <p className="text-gray-300 whitespace-pre-wrap">{order.billingAddress}</p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400">Payment Terms</p>
                <p className="mt-1">{order.paymentTerms}</p>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === "invoices" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Invoices</h3>
              <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-xl flex items-center gap-2">
                <i className="ri-add-line"></i>Create Invoice
              </button>
            </div>
            <div className="text-center py-12 text-gray-400">
              <i className="ri-file-text-line text-5xl mb-4"></i>
              <p>No invoices created yet</p>
              <p className="text-sm mt-1">Invoice will be created after order is shipped</p>
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
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-blue-500 border-2 border-gray-900"></div>
                  <div>
                    <p className="font-medium">Order Confirmed</p>
                    <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-yellow-500 border-2 border-gray-900"></div>
                  <div>
                    <p className="font-medium">Picking Started</p>
                    <p className="text-sm text-gray-400">{new Date(order.updatedAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{totalPicked} of {totalOrdered} units picked</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
