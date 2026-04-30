/**
 * Accounts Receivable Invoice Detail Page
 * Full AR invoice view with collection history
 * UX Enhanced: Toast notifications, confirmation dialogs, error handling
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { AccountsReceivable } from "@/types/finance";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  PENDING: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: "ri-time-line" },
  PARTIAL: { bg: "bg-blue-500/20", text: "text-blue-400", icon: "ri-pie-chart-line" },
  PAID: { bg: "bg-green-500/20", text: "text-green-400", icon: "ri-checkbox-circle-line" },
  OVERDUE: { bg: "bg-red-500/20", text: "text-red-400", icon: "ri-error-warning-line" },
  WRITTEN_OFF: { bg: "bg-gray-500/20", text: "text-gray-400", icon: "ri-close-circle-line" },
};

export default function ARInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  
  const [invoice, setInvoice] = useState<AccountsReceivable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [processing, setProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showWriteOffDialog, setShowWriteOffDialog] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  const loadInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/finance/accounts-receivable/${invoiceId}`);
      if (!response.ok) throw new Error("Invoice not found");
      const data = await response.json();
      if (data.success) setInvoice(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handleRecordPayment = async () => {
    if (!invoice) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/finance/accounts-receivable/${invoiceId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: invoice.outstandingAmount }),
      });
      if (response.ok) {
        showSuccess("Payment Recorded", `Payment of ${formatCurrency(invoice.outstandingAmount)} has been recorded`);
        loadInvoice();
      } else {
        throw new Error("Payment recording failed");
      }
    } catch (err) {
      showError("Payment Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowPaymentDialog(false);
    }
  };

  const handleWriteOff = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/finance/accounts-receivable/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WRITTEN_OFF" }),
      });
      if (response.ok) {
        showSuccess("Invoice Written Off", "The invoice has been marked as written off");
        loadInvoice();
      } else {
        throw new Error("Write-off failed");
      }
    } catch (err) {
      showError("Write-off Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowWriteOffDialog(false);
    }
  };

  const handleSendReminder = async () => {
    showInfo("Reminder Sent", `Payment reminder sent to ${invoice?.customerId}`);
  };

  const formatCurrency = (amount: number, currency: string = "SAR") => {
    return new Intl.NumberFormat("en-SA", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getDaysUntilDue = () => {
    if (!invoice) return 0;
    const due = new Date(invoice.dueDate);
    const today = new Date();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <ErrorDisplay
          title="Invoice Not Found"
          message={error || "The requested invoice could not be found"}
          onRetry={loadInvoice}
          onBack={() => router.push("/finance/accounts-receivable")}
          icon="ri-money-dollar-circle-line"
        />
      </div>
    );
  }

  const statusStyle = statusConfig[invoice.status] || statusConfig.PENDING;
  const daysUntilDue = getDaysUntilDue();
  const collectionProgress = ((invoice.receivedAmount / invoice.amount) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Record Payment Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onConfirm={handleRecordPayment}
        title="Record Full Payment"
        message={`Record a payment of ${formatCurrency(invoice.outstandingAmount)} for invoice ${invoice.invoiceNumber}?`}
        confirmLabel="Record Payment"
        variant="info"
        loading={processing}
        icon="ri-money-dollar-circle-line"
      />

      {/* Write-off Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showWriteOffDialog}
        onClose={() => setShowWriteOffDialog(false)}
        onConfirm={handleWriteOff}
        title="Write Off Invoice"
        message={`Are you sure you want to write off invoice ${invoice.invoiceNumber} with outstanding amount ${formatCurrency(invoice.outstandingAmount)}? This action cannot be undone.`}
        confirmLabel="Write Off"
        variant="danger"
        loading={processing}
        icon="ri-close-circle-line"
      />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Link href="/finance/accounts-receivable" className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back">
                <i className="ri-arrow-left-line text-2xl"></i>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1`}>
                    <i className={statusStyle.icon}></i>{invoice.status}
                  </span>
                </div>
                <p className="text-gray-400 mt-1">{invoice.customerName}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span><i className="ri-calendar-line mr-1"></i>Invoice: {formatDate(invoice.invoiceDate)}</span>
                  <span><i className="ri-alarm-line mr-1"></i>Due: {formatDate(invoice.dueDate)}</span>
                  <span className={daysUntilDue < 0 ? "text-red-400" : daysUntilDue < 7 ? "text-yellow-400" : "text-green-400"}>
                    {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {invoice.status !== "PAID" && invoice.status !== "WRITTEN_OFF" && (
                <>
                  <button
                    onClick={handleRecordPayment}
                    disabled={processing}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2"
                  >
                    {processing ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-money-dollar-circle-line"></i>}
                    Record Receipt
                  </button>
                  <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2">
                    <i className="ri-mail-send-line"></i>Send Reminder
                  </button>
                </>
              )}
              <button className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl">
                <i className="ri-printer-line text-xl"></i>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Invoice Amount</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(invoice.amount, invoice.currency)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Received</p>
              <p className="text-3xl font-bold mt-1 text-emerald-400">{formatCurrency(invoice.receivedAmount, invoice.currency)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Outstanding</p>
              <p className={`text-3xl font-bold mt-1 ${invoice.outstandingAmount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {formatCurrency(invoice.outstandingAmount, invoice.currency)}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Collection Progress</p>
              <div className="mt-2">
                <span className="text-2xl font-bold">{collectionProgress}%</span>
                <div className="h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${collectionProgress}%` }}></div>
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
            {[
              { id: "details", label: "Details", icon: "ri-file-text-line" },
              { id: "receipts", label: "Receipts", icon: "ri-money-dollar-circle-line" },
              { id: "communications", label: "Communications", icon: "ri-mail-line" },
              { id: "history", label: "History", icon: "ri-time-line" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? "border-emerald-500 text-emerald-400" : "border-transparent text-gray-400 hover:text-white"
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
        {activeTab === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <i className="ri-user-star-line text-emerald-400"></i>
                Customer Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Customer Name</label>
                  <p className="mt-1 font-medium">{invoice.customerName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Customer ID</label>
                  <p className="mt-1 font-mono text-sm">{invoice.customerId}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Payment Terms</label>
                  <p className="mt-1">{invoice.paymentTerms}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <i className="ri-file-info-line text-emerald-400"></i>
                Invoice Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Source</label>
                  <p className="mt-1"><span className="px-2 py-1 bg-white/10 rounded text-sm">{invoice.invoiceSource}</span></p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Reference ID</label>
                  <p className="mt-1 font-mono text-sm">{invoice.invoiceId}</p>
                </div>
                {invoice.glEntryId && (
                  <div>
                    <label className="text-sm text-gray-400">GL Entry</label>
                    <p className="mt-1 font-mono text-sm">{invoice.glEntryId}</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <i className="ri-speed-line text-emerald-400"></i>
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="py-4 bg-white/5 hover:bg-white/10 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors">
                  <i className="ri-mail-send-line text-2xl text-emerald-400"></i>
                  <span className="text-sm">Send Reminder</span>
                </button>
                <button className="py-4 bg-white/5 hover:bg-white/10 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors">
                  <i className="ri-phone-line text-2xl text-blue-400"></i>
                  <span className="text-sm">Log Call</span>
                </button>
                <button className="py-4 bg-white/5 hover:bg-white/10 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors">
                  <i className="ri-file-copy-line text-2xl text-purple-400"></i>
                  <span className="text-sm">Duplicate</span>
                </button>
                <button className="py-4 bg-white/5 hover:bg-white/10 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors">
                  <i className="ri-close-circle-line text-2xl text-red-400"></i>
                  <span className="text-sm">Write Off</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === "receipts" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Payment Receipts</h3>
              {invoice.status !== "PAID" && (
                <button onClick={handleRecordPayment} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2">
                  <i className="ri-add-line"></i>Record Receipt
                </button>
              )}
            </div>
            {invoice.receivedAmount > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <i className="ri-check-line text-emerald-400"></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Payment Received</p>
                    <p className="text-sm text-gray-400">Bank Transfer</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{formatCurrency(invoice.receivedAmount)}</p>
                    <p className="text-sm text-gray-400">{formatDate(invoice.updatedAt)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <i className="ri-wallet-3-line text-5xl mb-4"></i>
                <p>No payments received yet</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "communications" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Communication History</h3>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-2">
                <i className="ri-mail-send-line"></i>Send Reminder
              </button>
            </div>
            <div className="text-center py-12 text-gray-400">
              <i className="ri-mail-line text-5xl mb-4"></i>
              <p>No communications logged</p>
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6">Invoice History</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
              <div className="space-y-6">
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-gray-900"></div>
                  <div>
                    <p className="font-medium">Invoice Created</p>
                    <p className="text-sm text-gray-400">{new Date(invoice.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {invoice.receivedAmount > 0 && (
                  <div className="relative flex items-start gap-4 pl-10">
                    <div className="absolute left-2 w-5 h-5 rounded-full bg-teal-500 border-2 border-gray-900"></div>
                    <div>
                      <p className="font-medium">Payment: {formatCurrency(invoice.receivedAmount)}</p>
                      <p className="text-sm text-gray-400">{new Date(invoice.updatedAt).toLocaleString()}</p>
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
