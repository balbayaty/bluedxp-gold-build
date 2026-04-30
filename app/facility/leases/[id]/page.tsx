/**
 * Facility Lease Detail Page
 * Comprehensive lease management with payments, documents, and renewals
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

interface Lease {
  id: string;
  leaseNumber: string;
  propertyName: string;
  propertyAddress: string;
  propertyType: "WAREHOUSE" | "OFFICE" | "RETAIL" | "INDUSTRIAL" | "LAND";
  landlordName: string;
  landlordContact: string;
  landlordEmail: string;
  status: "DRAFT" | "ACTIVE" | "EXPIRING" | "EXPIRED" | "TERMINATED";
  leaseType: "FIXED" | "MONTH_TO_MONTH" | "TRIPLE_NET" | "GROSS";
  startDate: string;
  endDate: string;
  renewalDate?: string;
  monthlyRent: number;
  annualRent: number;
  securityDeposit: number;
  currency: string;
  paymentDueDay: number;
  escalationRate: number;
  escalationFrequency: "ANNUAL" | "BI_ANNUAL" | "NONE";
  area: number;
  areaUnit: string;
  costPerUnit: number;
  terms: string;
  specialClauses: string[];
  documents: { id: string; name: string; type: string; uploadedAt: string }[];
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  period: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "PARTIAL";
}

const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  DRAFT: { bg: "bg-gray-500/20", text: "text-gray-400", icon: "ri-draft-line" },
  ACTIVE: { bg: "bg-green-500/20", text: "text-green-400", icon: "ri-checkbox-circle-line" },
  EXPIRING: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: "ri-alarm-warning-line" },
  EXPIRED: { bg: "bg-red-500/20", text: "text-red-400", icon: "ri-time-line" },
  TERMINATED: { bg: "bg-gray-500/20", text: "text-gray-400", icon: "ri-close-circle-line" },
};

const TABS = [
  { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
  { id: "payments", label: "Payments", icon: "ri-money-dollar-circle-line" },
  { id: "documents", label: "Documents", icon: "ri-file-list-3-line" },
  { id: "history", label: "History", icon: "ri-time-line" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function LeaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leaseId = params.id as string;
  
  const [lease, setLease] = useState<Lease | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  useEffect(() => {
    loadLease();
  }, [leaseId]);

  const handleTerminate = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/facility/leases/${leaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "TERMINATED" }),
      });
      if (response.ok) {
        showSuccess("Lease Terminated", "The lease has been marked as terminated");
        loadLease();
      } else {
        throw new Error("Termination failed");
      }
    } catch (err) {
      showError("Termination Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowTerminateDialog(false);
    }
  };

  const handleRenew = async () => {
    setProcessing(true);
    try {
      showSuccess("Renewal Initiated", "Lease renewal process has been started");
      router.push(`/facility/leases/${leaseId}/renew`);
    } finally {
      setProcessing(false);
      setShowRenewDialog(false);
    }
  };

  const loadLease = async () => {
    setLoading(true);
    try {
      // Mock data for demo
      setLease({
        id: leaseId,
        leaseNumber: `LSE-${leaseId.slice(0, 6).toUpperCase()}`,
        propertyName: "Riyadh Industrial Warehouse Complex",
        propertyAddress: "Industrial City, Area 3, Building 15, Riyadh 12345",
        propertyType: "WAREHOUSE",
        landlordName: "Al-Rajhi Real Estate Holdings",
        landlordContact: "+966 11 234 5678",
        landlordEmail: "properties@alrajhi-re.com",
        status: "ACTIVE",
        leaseType: "TRIPLE_NET",
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
        renewalDate: new Date(Date.now() + 640 * 24 * 60 * 60 * 1000).toISOString(),
        monthlyRent: 150000,
        annualRent: 1800000,
        securityDeposit: 450000,
        currency: "SAR",
        paymentDueDay: 1,
        escalationRate: 5,
        escalationFrequency: "ANNUAL",
        area: 15000,
        areaUnit: "SQM",
        costPerUnit: 10,
        terms: "Standard commercial lease terms apply. Tenant responsible for all utilities and maintenance.",
        specialClauses: [
          "Option to renew for additional 3 years at same rate",
          "Right of first refusal for adjacent units",
          "Landlord to maintain structural elements",
        ],
        documents: [
          { id: "1", name: "Lease Agreement - Signed", type: "PDF", uploadedAt: new Date().toISOString() },
          { id: "2", name: "Property Survey", type: "PDF", uploadedAt: new Date().toISOString() },
          { id: "3", name: "Fire Safety Certificate", type: "PDF", uploadedAt: new Date().toISOString() },
        ],
        createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setPayments([
        { id: "1", period: "January 2024", amount: 150000, dueDate: "2024-01-01", paidDate: "2024-01-01", status: "PAID" },
        { id: "2", period: "February 2024", amount: 150000, dueDate: "2024-02-01", paidDate: "2024-02-03", status: "PAID" },
        { id: "3", period: "March 2024", amount: 150000, dueDate: "2024-03-01", status: "PENDING" },
      ]);
    } catch (err) {
      setError("Failed to load lease");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "SAR") => {
    return new Intl.NumberFormat("en-SA", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getDaysRemaining = () => {
    if (!lease) return 0;
    const end = new Date(lease.endDate);
    const today = new Date();
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !lease) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <ErrorDisplay
          title="Lease Not Found"
          message={error || "The requested lease could not be found"}
          onRetry={loadLease}
          onBack={() => router.push("/facility/leases")}
          icon="ri-file-paper-line"
        />
      </div>
    );
  }

  const statusStyle = statusConfig[lease.status] || statusConfig.DRAFT;
  const daysRemaining = getDaysRemaining();
  const paidPayments = payments.filter(p => p.status === "PAID").length;
  const totalPayments = payments.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Terminate Lease Dialog */}
      <ConfirmDialog
        isOpen={showTerminateDialog}
        onClose={() => setShowTerminateDialog(false)}
        onConfirm={handleTerminate}
        title="Terminate Lease"
        message={`Are you sure you want to terminate lease ${lease.leaseNumber}? This action cannot be undone.`}
        confirmLabel="Terminate"
        variant="danger"
        loading={processing}
        icon="ri-close-circle-line"
      />

      {/* Renew Lease Dialog */}
      <ConfirmDialog
        isOpen={showRenewDialog}
        onClose={() => setShowRenewDialog(false)}
        onConfirm={handleRenew}
        title="Renew Lease"
        message={`Start the renewal process for ${lease.leaseNumber}? You will be redirected to the renewal wizard.`}
        confirmLabel="Start Renewal"
        variant="info"
        loading={processing}
        icon="ri-refresh-line"
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-orange-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Link href="/facility/leases" className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back">
                <i className="ri-arrow-left-line text-2xl"></i>
              </Link>
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <i className="ri-building-2-line text-3xl"></i>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{lease.leaseNumber}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1`}>
                    <i className={statusStyle.icon}></i>{lease.status}
                  </span>
                </div>
                <p className="text-gray-300 mt-1">{lease.propertyName}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span><i className="ri-map-pin-line mr-1"></i>{lease.propertyAddress}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lease.status === "ACTIVE" && (
                <button
                  onClick={() => setShowTerminateDialog(true)}
                  className="p-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl transition-all text-gray-400 hover:text-red-400"
                  aria-label="Terminate lease"
                >
                  <i className="ri-close-circle-line text-lg"></i>
                </button>
              )}
              <Link href={`/facility/leases/${leaseId}/edit`} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-colors">
                <i className="ri-edit-line"></i>Edit
              </Link>
              {(lease.status === "EXPIRING" || lease.status === "ACTIVE") && (
                <button 
                  onClick={() => setShowRenewDialog(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:shadow-lg hover:shadow-green-500/30 flex items-center gap-2 transition-all"
                >
                  <i className="ri-refresh-line"></i>Renew Lease
                </button>
              )}
              <button 
                onClick={() => { showInfo("Print", "Opening print dialog..."); window.print(); }}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                aria-label="Print"
              >
                <i className="ri-printer-line text-xl"></i>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Monthly Rent</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(lease.monthlyRent)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Annual Rent</p>
              <p className="text-3xl font-bold mt-1 text-amber-400">{formatCurrency(lease.annualRent)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Security Deposit</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(lease.securityDeposit)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Area</p>
              <p className="text-3xl font-bold mt-1">{lease.area.toLocaleString()} {lease.areaUnit}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Days Remaining</p>
              <p className={`text-3xl font-bold mt-1 ${daysRemaining < 90 ? "text-red-400" : daysRemaining < 180 ? "text-yellow-400" : "text-green-400"}`}>
                {daysRemaining}
              </p>
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
                  activeTab === tab.id ? "border-amber-500 text-amber-400" : "border-transparent text-gray-400 hover:text-white"
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
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-building-2-line text-amber-400"></i>
                Property Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Property Name</label>
                  <p className="mt-1 font-medium">{lease.propertyName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Address</label>
                  <p className="mt-1">{lease.propertyAddress}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Type</label>
                    <p className="mt-1">{lease.propertyType}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Lease Type</label>
                    <p className="mt-1">{lease.leaseType.replace(/_/g, " ")}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-user-star-line text-amber-400"></i>
                Landlord Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Landlord Name</label>
                  <p className="mt-1 font-medium">{lease.landlordName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Contact</label>
                  <p className="mt-1">{lease.landlordContact}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <a href={`mailto:${lease.landlordEmail}`} className="block mt-1 text-amber-400 hover:underline">{lease.landlordEmail}</a>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-calendar-2-line text-amber-400"></i>
                Lease Duration
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Start Date</label>
                  <p className="mt-1 font-medium">{formatDate(lease.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">End Date</label>
                  <p className="mt-1 font-medium">{formatDate(lease.endDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Renewal Date</label>
                  <p className="mt-1">{lease.renewalDate ? formatDate(lease.renewalDate) : "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Escalation</label>
                  <p className="mt-1">{lease.escalationRate}% {lease.escalationFrequency.toLowerCase()}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-file-list-3-line text-amber-400"></i>
                Special Clauses
              </h3>
              {lease.specialClauses.length > 0 ? (
                <ul className="space-y-2">
                  {lease.specialClauses.map((clause, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-fill text-amber-400 mt-0.5"></i>
                      <span className="text-gray-300">{clause}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No special clauses</p>
              )}
            </motion.div>
          </div>
        )}

        {activeTab === "payments" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <i className="ri-money-dollar-circle-line text-amber-400"></i>
                  Payment History
                </h3>
                <p className="text-sm text-gray-400 mt-1">{paidPayments} of {totalPayments} payments made</p>
              </div>
              <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center gap-2">
                <i className="ri-add-line"></i>Record Payment
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-4 px-6 text-gray-400 font-medium">Period</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Amount</th>
                    <th className="py-4 px-6 text-gray-400 font-medium">Due Date</th>
                    <th className="py-4 px-6 text-gray-400 font-medium">Paid Date</th>
                    <th className="py-4 px-6 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-6 font-medium">{payment.period}</td>
                      <td className="py-4 px-6 text-right">{formatCurrency(payment.amount)}</td>
                      <td className="py-4 px-6">{formatDate(payment.dueDate)}</td>
                      <td className="py-4 px-6">{payment.paidDate ? formatDate(payment.paidDate) : "-"}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.status === "PAID" ? "bg-green-500/20 text-green-400" :
                          payment.status === "OVERDUE" ? "bg-red-500/20 text-red-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "documents" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="ri-file-list-3-line text-amber-400"></i>
                Documents ({lease.documents.length})
              </h3>
              <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center gap-2">
                <i className="ri-upload-line"></i>Upload Document
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lease.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <i className="ri-file-pdf-line text-2xl text-red-400"></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-400">{formatDate(doc.uploadedAt)}</p>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-lg">
                    <i className="ri-download-line"></i>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6">Lease History</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
              <div className="space-y-6">
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-amber-500 border-2 border-gray-900"></div>
                  <div>
                    <p className="font-medium">Lease Created</p>
                    <p className="text-sm text-gray-400">{new Date(lease.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-green-500 border-2 border-gray-900"></div>
                  <div>
                    <p className="font-medium">Lease Activated</p>
                    <p className="text-sm text-gray-400">{formatDate(lease.startDate)}</p>
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
