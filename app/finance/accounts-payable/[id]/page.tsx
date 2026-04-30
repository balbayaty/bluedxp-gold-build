/**
 * Accounts Payable Invoice Detail Page
 * Full AP invoice view with payment history and actions
 * UX Enhanced: Toast notifications, confirmation dialogs, error handling
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { AccountsPayable } from "@/types/finance";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  PENDING: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: "ri-time-line" },
  PARTIAL: { bg: "bg-blue-500/20", text: "text-blue-400", icon: "ri-pie-chart-line" },
  PAID: { bg: "bg-green-500/20", text: "text-green-400", icon: "ri-checkbox-circle-line" },
  OVERDUE: { bg: "bg-red-500/20", text: "text-red-400", icon: "ri-error-warning-line" },
  CANCELLED: { bg: "bg-gray-500/20", text: "text-gray-400", icon: "ri-close-circle-line" },
};

const TABS = [
  { id: "details", label: "Details", icon: "ri-file-text-line" },
  { id: "payments", label: "Payments", icon: "ri-money-dollar-circle-line" },
  { id: "gl", label: "GL Entries", icon: "ri-book-line" },
  { id: "history", label: "History", icon: "ri-time-line" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function APInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  
  const [invoice, setInvoice] = useState<AccountsPayable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [processing, setProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  const loadInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/finance/accounts-payable/${invoiceId}`);
      if (!response.ok) throw new Error("Invoice not found");
      const data = await response.json();
      if (data.success) {
        setInvoice(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handlePayment = async () => {
    if (!invoice) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/finance/accounts-payable/${invoiceId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: invoice.outstandingAmount }),
      });
      if (response.ok) {
        showSuccess("Payment Recorded", `Payment of ${formatCurrency(invoice.outstandingAmount, invoice.currency)} has been recorded`);
        loadInvoice();
      } else {
        throw new Error("Payment failed");
      }
    } catch (err) {
      showError("Payment Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowPaymentDialog(false);
    }
  };

  const handleVoid = async () => {
    if (!invoice) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/finance/accounts-payable/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (response.ok) {
        showSuccess("Invoice Voided", "The invoice has been cancelled");
        loadInvoice();
      } else {
        throw new Error("Void failed");
      }
    } catch (err) {
      showError("Void Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowVoidDialog(false);
    }
  };

  const handlePrint = () => {
    showInfo("Print", "Opening print dialog...");
    window.print();
  };

  const handleDownload = () => {
    showInfo("Download", "Preparing PDF download...");
    // In real implementation, this would trigger PDF generation
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <ErrorDisplay
          title="Invoice Not Found"
          message={error || "The requested invoice could not be found"}
          onRetry={loadInvoice}
          onBack={() => router.push("/finance/accounts-payable")}
          icon="ri-file-unknow-line"
        />
      </div>
    );
  }

  const statusStyle = statusConfig[invoice.status] || statusConfig.PENDING;
  const daysUntilDue = getDaysUntilDue();
  const paymentProgress = ((invoice.paidAmount / invoice.amount) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Payment Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onConfirm={handlePayment}
        title="Record Payment"
        message={`Record a payment of ${formatCurrency(invoice.outstandingAmount, invoice.currency)} for invoice ${invoice.invoiceNumber}?`}
        confirmLabel="Record Payment"
        variant="info"
        loading={processing}
        icon="ri-money-dollar-circle-line"
      />

      {/* Void Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showVoidDialog}
        onClose={() => setShowVoidDialog(false)}
        onConfirm={handleVoid}
        title="Void Invoice"
        message={`Are you sure you want to void invoice ${invoice.invoiceNumber}? This action cannot be undone.`}
        confirmLabel="Void Invoice"
        variant="danger"
        loading={processing}
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Link href="/finance/accounts-payable" className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back to AP">
                <i className="ri-arrow-left-line text-2xl"></i>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1`}>
                    <i className={statusStyle.icon}></i>
                    {invoice.status}
                  </span>
                </div>
                <p className="text-gray-400 mt-1">{invoice.vendorName}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span><i className="ri-calendar-line mr-1"></i>Invoice Date: {formatDate(invoice.invoiceDate)}</span>
                  <span><i className="ri-alarm-line mr-1"></i>Due: {formatDate(invoice.dueDate)}</span>
                  <span className={daysUntilDue < 0 ? "text-red-400" : daysUntilDue < 7 ? "text-yellow-400" : "text-green-400"}>
                    {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                <>
                  <button
                    onClick={() => setShowPaymentDialog(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:shadow-lg hover:shadow-green-500/30 flex items-center gap-2 transition-all"
                  >
                    <i className="ri-money-dollar-circle-line"></i>
                    Record Payment
                  </button>
                  <button
                    onClick={() => setShowVoidDialog(true)}
                    className="p-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl transition-all text-gray-400 hover:text-red-400"
                    aria-label="Void invoice"
                  >
                    <i className="ri-close-circle-line text-xl"></i>
                  </button>
                </>
              )}
              <button 
                onClick={handlePrint}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                aria-label="Print invoice"
              >
                <i className="ri-printer-line text-xl"></i>
              </button>
              <button 
                onClick={handleDownload}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                aria-label="Download PDF"
              >
                <i className="ri-download-line text-xl"></i>
              </button>
            </div>
          </div>

          {/* Amount Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <p className="text-gray-400 text-sm">Invoice Amount</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(invoice.amount, invoice.currency)}</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <p className="text-gray-400 text-sm">Paid Amount</p>
              <p className="text-3xl font-bold mt-1 text-green-400">{formatCurrency(invoice.paidAmount, invoice.currency)}</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <p className="text-gray-400 text-sm">Outstanding</p>
              <p className={`text-3xl font-bold mt-1 ${invoice.outstandingAmount > 0 ? "text-red-400" : "text-green-400"}`}>
                {formatCurrency(invoice.outstandingAmount, invoice.currency)}
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <p className="text-gray-400 text-sm">Payment Progress</p>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl font-bold">{paymentProgress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${paymentProgress}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  ></motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-1" role="tablist" aria-label="Invoice details">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? "border-cyan-500 text-cyan-400" : "border-transparent text-gray-400 hover:text-white"
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
        <AnimatePresence mode="wait">
          {activeTab === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <i className="ri-store-2-line text-cyan-400"></i>
                  Vendor Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Vendor Name</label>
                    <p className="mt-1 font-medium">{invoice.vendorName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Vendor ID</label>
                    <p className="mt-1 font-mono text-sm">{invoice.vendorId}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Payment Terms</label>
                    <p className="mt-1">{invoice.paymentTerms}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <i className="ri-file-info-line text-cyan-400"></i>
                  Invoice Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Invoice Source</label>
                    <p className="mt-1">
                      <span className="px-2 py-1 bg-white/10 rounded text-sm">{invoice.invoiceSource}</span>
                    </p>
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
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <i className="ri-calendar-2-line text-cyan-400"></i>
                  Important Dates
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className="text-sm text-gray-400">Invoice Date</label>
                    <p className="mt-1 font-medium">{formatDate(invoice.invoiceDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Due Date</label>
                    <p className={`mt-1 font-medium ${daysUntilDue < 0 ? "text-red-400" : ""}`}>{formatDate(invoice.dueDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Created</label>
                    <p className="mt-1">{formatDate(invoice.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Last Updated</label>
                    <p className="mt-1">{formatDate(invoice.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <i className="ri-money-dollar-circle-line text-cyan-400"></i>
                  Payment History
                </h3>
                {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                  <button 
                    onClick={() => setShowPaymentDialog(true)} 
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <i className="ri-add-line"></i>Record Payment
                  </button>
                )}
              </div>
              {invoice.paidAmount > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <i className="ri-check-line text-green-400"></i>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Payment Received</p>
                      <p className="text-sm text-gray-400">Bank Transfer</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">{formatCurrency(invoice.paidAmount)}</p>
                      <p className="text-sm text-gray-400">{formatDate(invoice.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <i className="ri-wallet-3-line text-5xl mb-4"></i>
                  <p>No payments recorded yet</p>
                  <p className="text-sm mt-1">Click "Record Payment" to add a payment</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "gl" && (
            <motion.div
              key="gl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <i className="ri-book-line text-cyan-400"></i>
                General Ledger Entries
              </h3>
              {invoice.glEntryId ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 text-gray-400 font-medium">Date</th>
                        <th className="text-left py-3 text-gray-400 font-medium">Account</th>
                        <th className="text-right py-3 text-gray-400 font-medium">Debit</th>
                        <th className="text-right py-3 text-gray-400 font-medium">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3">{formatDate(invoice.invoiceDate)}</td>
                        <td className="py-3">Accounts Payable (2000)</td>
                        <td className="py-3 text-right">-</td>
                        <td className="py-3 text-right text-green-400">{formatCurrency(invoice.amount)}</td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3">{formatDate(invoice.invoiceDate)}</td>
                        <td className="py-3">Expense (5000)</td>
                        <td className="py-3 text-right text-red-400">{formatCurrency(invoice.amount)}</td>
                        <td className="py-3 text-right">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <i className="ri-book-open-line text-5xl mb-4"></i>
                  <p>GL entries will be created when invoice is posted</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <i className="ri-time-line text-cyan-400"></i>
                Invoice History
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
                <div className="space-y-6">
                  <div className="relative flex items-start gap-4 pl-10">
                    <div className="absolute left-2 w-5 h-5 rounded-full bg-cyan-500 border-2 border-gray-900"></div>
                    <div>
                      <p className="font-medium">Invoice Created</p>
                      <p className="text-sm text-gray-400">{new Date(invoice.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {invoice.paidAmount > 0 && (
                    <div className="relative flex items-start gap-4 pl-10">
                      <div className="absolute left-2 w-5 h-5 rounded-full bg-green-500 border-2 border-gray-900"></div>
                      <div>
                        <p className="font-medium">Payment Received: {formatCurrency(invoice.paidAmount)}</p>
                        <p className="text-sm text-gray-400">{new Date(invoice.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {invoice.status === "PAID" && (
                    <div className="relative flex items-start gap-4 pl-10">
                      <div className="absolute left-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-gray-900"></div>
                      <div>
                        <p className="font-medium text-emerald-400">Invoice Fully Paid</p>
                        <p className="text-sm text-gray-400">{new Date(invoice.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {invoice.status === "CANCELLED" && (
                    <div className="relative flex items-start gap-4 pl-10">
                      <div className="absolute left-2 w-5 h-5 rounded-full bg-red-500 border-2 border-gray-900"></div>
                      <div>
                        <p className="font-medium text-red-400">Invoice Voided</p>
                        <p className="text-sm text-gray-400">{new Date(invoice.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
