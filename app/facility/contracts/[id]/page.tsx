/**
 * Facility Contract Detail Page
 * Comprehensive vendor/service contract management
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

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  description: string;
  vendorId: string;
  vendorName: string;
  vendorContact: string;
  vendorEmail: string;
  contractType: "SERVICE" | "MAINTENANCE" | "SUPPLY" | "CONSULTING" | "SLA";
  status: "DRAFT" | "ACTIVE" | "EXPIRING" | "EXPIRED" | "TERMINATED" | "ON_HOLD";
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  renewalNotificationDays: number;
  totalValue: number;
  currency: string;
  paymentTerms: string;
  paymentFrequency: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "ONE_TIME";
  scope: string[];
  slaMetrics: { metric: string; target: string; penalty: string }[];
  documents: { id: string; name: string; type: string }[];
  contacts: { name: string; role: string; email: string; phone: string }[];
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  DRAFT: { bg: "bg-gray-500/20", text: "text-gray-400", icon: "ri-draft-line" },
  ACTIVE: { bg: "bg-green-500/20", text: "text-green-400", icon: "ri-checkbox-circle-line" },
  EXPIRING: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: "ri-alarm-warning-line" },
  EXPIRED: { bg: "bg-red-500/20", text: "text-red-400", icon: "ri-time-line" },
  TERMINATED: { bg: "bg-red-500/20", text: "text-red-400", icon: "ri-close-circle-line" },
  ON_HOLD: { bg: "bg-orange-500/20", text: "text-orange-400", icon: "ri-pause-circle-line" },
};

const typeColors: Record<string, string> = {
  SERVICE: "from-blue-500 to-cyan-500",
  MAINTENANCE: "from-green-500 to-emerald-500",
  SUPPLY: "from-purple-500 to-pink-500",
  CONSULTING: "from-orange-500 to-red-500",
  SLA: "from-teal-500 to-cyan-500",
};

const TABS = [
  { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
  { id: "scope", label: "Scope & SLA", icon: "ri-list-check" },
  { id: "contacts", label: "Contacts", icon: "ri-contacts-line" },
  { id: "documents", label: "Documents", icon: "ri-file-list-3-line" },
  { id: "history", label: "History", icon: "ri-time-line" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const handleTerminate = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/facility/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "TERMINATED" }),
      });
      if (response.ok) {
        showSuccess("Contract Terminated", "The contract has been terminated");
        loadContract();
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

  const handlePlaceOnHold = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/facility/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ON_HOLD" }),
      });
      if (response.ok) {
        showSuccess("Contract On Hold", "The contract has been placed on hold");
        loadContract();
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      showError("Update Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowHoldDialog(false);
    }
  };

  const loadContract = async () => {
    setLoading(true);
    try {
      // Mock data for demo
      setContract({
        id: contractId,
        contractNumber: `CTR-${contractId.slice(0, 6).toUpperCase()}`,
        title: "Annual HVAC Maintenance Agreement",
        description: "Comprehensive heating, ventilation, and air conditioning maintenance for all warehouse facilities including preventive maintenance, emergency repairs, and filter replacements.",
        vendorId: "vendor-hvac-001",
        vendorName: "Saudi Climate Solutions Co.",
        vendorContact: "+966 11 456 7890",
        vendorEmail: "contracts@saudiclimate.com",
        contractType: "MAINTENANCE",
        status: "ACTIVE",
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
        renewalNotificationDays: 60,
        totalValue: 480000,
        currency: "SAR",
        paymentTerms: "Net 30",
        paymentFrequency: "QUARTERLY",
        scope: [
          "Monthly preventive maintenance inspections",
          "Quarterly filter replacement for all units",
          "24/7 emergency repair service",
          "Annual comprehensive system audit",
          "Energy efficiency optimization",
          "Refrigerant management and leak detection",
        ],
        slaMetrics: [
          { metric: "Response Time (Emergency)", target: "< 2 hours", penalty: "5% of monthly fee" },
          { metric: "Response Time (Standard)", target: "< 24 hours", penalty: "2% of monthly fee" },
          { metric: "System Uptime", target: "> 99%", penalty: "10% of monthly fee per 1% below target" },
          { metric: "Preventive Maintenance Completion", target: "100% on schedule", penalty: "3% of monthly fee" },
        ],
        documents: [
          { id: "1", name: "Master Service Agreement", type: "PDF" },
          { id: "2", name: "SLA Terms & Conditions", type: "PDF" },
          { id: "3", name: "Insurance Certificate", type: "PDF" },
          { id: "4", name: "Vendor Qualifications", type: "PDF" },
        ],
        contacts: [
          { name: "Ahmed Al-Hassan", role: "Account Manager", email: "ahmed@saudiclimate.com", phone: "+966 50 123 4567" },
          { name: "Fahad Al-Otaibi", role: "Technical Lead", email: "fahad@saudiclimate.com", phone: "+966 50 234 5678" },
          { name: "Sara Al-Rashid", role: "Billing Contact", email: "sara@saudiclimate.com", phone: "+966 50 345 6789" },
        ],
        createdBy: "facilities@company.com",
        approvedBy: "director@company.com",
        createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError("Failed to load contract");
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
    if (!contract) return 0;
    const end = new Date(contract.endDate);
    const today = new Date();
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <ErrorDisplay
          title="Contract Not Found"
          message={error || "The requested contract could not be found"}
          onRetry={loadContract}
          onBack={() => router.push("/facility/contracts")}
          icon="ri-file-contract-line"
        />
      </div>
    );
  }

  const statusStyle = statusConfig[contract.status] || statusConfig.DRAFT;
  const typeColor = typeColors[contract.contractType] || typeColors.SERVICE;
  const daysRemaining = getDaysRemaining();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Terminate Contract Dialog */}
      <ConfirmDialog
        isOpen={showTerminateDialog}
        onClose={() => setShowTerminateDialog(false)}
        onConfirm={handleTerminate}
        title="Terminate Contract"
        message={`Are you sure you want to terminate contract ${contract.contractNumber} with ${contract.vendorName}? This action cannot be undone.`}
        confirmLabel="Terminate"
        variant="danger"
        loading={processing}
        icon="ri-close-circle-line"
      />

      {/* Place on Hold Dialog */}
      <ConfirmDialog
        isOpen={showHoldDialog}
        onClose={() => setShowHoldDialog(false)}
        onConfirm={handlePlaceOnHold}
        title="Place Contract on Hold"
        message={`Place contract ${contract.contractNumber} on hold? Services under this contract will be suspended until resumed.`}
        confirmLabel="Place on Hold"
        variant="warning"
        loading={processing}
        icon="ri-pause-circle-line"
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Link href="/facility/contracts" className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back">
                <i className="ri-arrow-left-line text-2xl"></i>
              </Link>
              <div className={`w-20 h-20 bg-gradient-to-br ${typeColor} rounded-2xl flex items-center justify-center shadow-2xl`}>
                <i className="ri-file-contract-line text-3xl"></i>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{contract.contractNumber}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1`}>
                    <i className={statusStyle.icon}></i>{contract.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${typeColor} text-white`}>
                    {contract.contractType}
                  </span>
                </div>
                <p className="text-gray-300 mt-1">{contract.title}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span><i className="ri-store-2-line mr-1"></i>{contract.vendorName}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {contract.status === "ACTIVE" && (
                <>
                  <button
                    onClick={() => setShowTerminateDialog(true)}
                    className="p-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl transition-all text-gray-400 hover:text-red-400"
                    aria-label="Terminate contract"
                  >
                    <i className="ri-close-circle-line text-lg"></i>
                  </button>
                  <button
                    onClick={() => setShowHoldDialog(true)}
                    className="p-2.5 bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/30 rounded-xl transition-all text-gray-400 hover:text-orange-400"
                    aria-label="Place on hold"
                  >
                    <i className="ri-pause-circle-line text-lg"></i>
                  </button>
                </>
              )}
              <Link href={`/facility/contracts/${contractId}/edit`} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-colors">
                <i className="ri-edit-line"></i>Edit
              </Link>
              {contract.status === "EXPIRING" && (
                <button className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:shadow-lg flex items-center gap-2">
                  <i className="ri-refresh-line"></i>Renew
                </button>
              )}
              <button className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl">
                <i className="ri-printer-line text-xl"></i>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Contract Value</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(contract.totalValue)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Payment Frequency</p>
              <p className="text-3xl font-bold mt-1 text-indigo-400">{contract.paymentFrequency}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">SLA Metrics</p>
              <p className="text-3xl font-bold mt-1">{contract.slaMetrics.length}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Days Remaining</p>
              <p className={`text-3xl font-bold mt-1 ${daysRemaining < 60 ? "text-red-400" : daysRemaining < 120 ? "text-yellow-400" : "text-green-400"}`}>
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
                  activeTab === tab.id ? "border-indigo-500 text-indigo-400" : "border-transparent text-gray-400 hover:text-white"
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
                <i className="ri-file-text-line text-indigo-400"></i>
                Contract Details
              </h3>
              <p className="text-gray-300 mb-6">{contract.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Contract Type</label>
                  <p className="mt-1">{contract.contractType}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Payment Terms</label>
                  <p className="mt-1">{contract.paymentTerms}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Auto Renew</label>
                  <p className="mt-1">{contract.autoRenew ? <span className="text-green-400">Yes</span> : <span className="text-gray-400">No</span>}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Renewal Notice</label>
                  <p className="mt-1">{contract.renewalNotificationDays} days</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-store-2-line text-indigo-400"></i>
                Vendor Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Vendor Name</label>
                  <p className="mt-1 font-medium">{contract.vendorName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Contact</label>
                  <p className="mt-1">{contract.vendorContact}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <a href={`mailto:${contract.vendorEmail}`} className="block mt-1 text-indigo-400 hover:underline">{contract.vendorEmail}</a>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-calendar-2-line text-indigo-400"></i>
                Contract Duration
              </h3>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <label className="text-sm text-gray-400">Start Date</label>
                  <p className="mt-1 font-medium">{formatDate(contract.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">End Date</label>
                  <p className="mt-1 font-medium">{formatDate(contract.endDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Created By</label>
                  <p className="mt-1">{contract.createdBy}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Approved By</label>
                  <p className="mt-1">{contract.approvedBy || "-"}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === "scope" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-list-check text-indigo-400"></i>
                Scope of Work
              </h3>
              <ul className="space-y-3">
                {contract.scope.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-fill text-green-400 mt-0.5"></i>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-speed-line text-indigo-400"></i>
                SLA Metrics
              </h3>
              <div className="space-y-4">
                {contract.slaMetrics.map((sla, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-xl">
                    <p className="font-medium">{sla.metric}</p>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-400">Target: </span>
                        <span className="text-green-400">{sla.target}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Penalty: </span>
                        <span className="text-red-400">{sla.penalty}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === "contacts" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contract.contacts.map((contact, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-xl font-bold">
                    {contact.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-lg">{contact.name}</p>
                    <p className="text-sm text-gray-400">{contact.role}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-gray-400 hover:text-white">
                    <i className="ri-mail-line"></i>{contact.email}
                  </a>
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-gray-400 hover:text-white">
                    <i className="ri-phone-line"></i>{contact.phone}
                  </a>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "documents" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="ri-file-list-3-line text-indigo-400"></i>
                Documents ({contract.documents.length})
              </h3>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2">
                <i className="ri-upload-line"></i>Upload
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contract.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <i className="ri-file-pdf-line text-2xl text-red-400"></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-400">{doc.type}</p>
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
            <h3 className="text-lg font-semibold mb-6">Contract History</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
              <div className="space-y-6">
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-gray-500 border-2 border-gray-900"></div>
                  <div>
                    <p className="font-medium">Contract Created</p>
                    <p className="text-sm text-gray-400">{new Date(contract.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">By: {contract.createdBy}</p>
                  </div>
                </div>
                {contract.approvedBy && (
                  <div className="relative flex items-start gap-4 pl-10">
                    <div className="absolute left-2 w-5 h-5 rounded-full bg-blue-500 border-2 border-gray-900"></div>
                    <div>
                      <p className="font-medium">Contract Approved</p>
                      <p className="text-sm text-gray-400">{formatDate(contract.startDate)}</p>
                      <p className="text-sm text-gray-500">By: {contract.approvedBy}</p>
                    </div>
                  </div>
                )}
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-green-500 border-2 border-gray-900"></div>
                  <div>
                    <p className="font-medium">Contract Active</p>
                    <p className="text-sm text-gray-400">{formatDate(contract.startDate)}</p>
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
