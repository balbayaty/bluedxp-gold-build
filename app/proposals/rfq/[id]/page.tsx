/**
 * RFQ Detail Page
 * 
 * Comprehensive view of RFQ with all fields organized in tabs:
 * - Overview (summary, customer, timeline)
 * - Services & Requirements (selected services, cargo details)
 * - Route & Logistics (origin, destination, stops)
 * - Documents & Attachments
 * - Workflow & History
 * - Actions (Create Proposal, Approve, etc.)
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import type { RFQ, RFQStatus, RFQPriority } from "@/types/rfq";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// Tab definitions
const TABS = [
  { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
  { id: "services", label: "Services & Requirements", icon: "ri-service-line" },
  { id: "route", label: "Route & Logistics", icon: "ri-route-line" },
  { id: "documents", label: "Documents", icon: "ri-file-list-3-line" },
  { id: "workflow", label: "Workflow & History", icon: "ri-flow-chart" },
] as const;

type TabId = typeof TABS[number]["id"];

// Status badge component
const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" },
  SUBMITTED: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  UNDER_REVIEW: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  PRICING_IN_PROGRESS: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500" },
  AWAITING_APPROVAL: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  APPROVED: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  PROPOSAL_SENT: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500" },
  NEGOTIATION: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-400", dot: "bg-pink-500" },
  ACCEPTED: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  REJECTED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  CANCELLED: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-500 dark:text-gray-400", dot: "bg-gray-400" },
  EXPIRED: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-500 dark:text-gray-400", dot: "bg-gray-400" },
};

const priorityColors: Record<string, { bg: string; text: string; icon: string }> = {
  LOW: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-400", icon: "ri-flag-line" },
  MEDIUM: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", icon: "ri-flag-line" },
  HIGH: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", icon: "ri-flag-fill" },
  URGENT: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", icon: "ri-flag-fill" },
  CRITICAL: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", icon: "ri-alarm-warning-fill" },
};

// Helper components
function StatusBadge({ status }: { status: string }) {
  const style = statusColors[status] || statusColors.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const style = priorityColors[priority] || priorityColors.MEDIUM;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
      <i className={style.icon}></i>
      {priority}
    </span>
  );
}

function Section({ title, icon, children, className = "" }: { title: string; icon: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <i className={`${icon} text-blue-600`}></i>
          {title}
        </h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: React.ReactNode; icon?: string }) {
  return (
    <div className="py-3">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
        {icon && <i className={`${icon} text-gray-400`}></i>}
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{value || "-"}</dd>
    </div>
  );
}

function formatDate(date: string | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number | undefined, currency: string = "SAR"): string {
  if (!amount) return "-";
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function RFQDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rfqId = params.id as string;
  const { hasModuleAccess, canPerformAction } = useAuth();
  
  const [rfq, setRFQ] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  // Permission checks
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");
  const canEdit = canPerformAction("proposals-rfq", "proposals-rfq.rfq", undefined, "write");

  // Action handlers
  const handleApprove = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/proposals/rfq/${rfqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (response.ok) {
        showSuccess("RFQ Approved", "The RFQ has been approved and is ready for proposal creation");
        loadRFQ();
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

  const handleReject = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/proposals/rfq/${rfqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (response.ok) {
        showSuccess("RFQ Rejected", "The RFQ has been rejected");
        loadRFQ();
      } else {
        throw new Error("Rejection failed");
      }
    } catch (err) {
      showError("Rejection Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowRejectDialog(false);
    }
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/proposals/rfq/${rfqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (response.ok) {
        showSuccess("RFQ Cancelled", "The RFQ has been cancelled");
        loadRFQ();
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

  useEffect(() => {
    if (hasAccess) {
      loadRFQ();
    } else {
      setLoading(false);
    }
  }, [rfqId, hasAccess]);

  const loadRFQ = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/proposals/rfq/${rfqId}`);
      if (!response.ok) {
        throw new Error("RFQ not found");
      }
      const data = await response.json();
      if (data.success) {
        setRFQ(data.data);
      } else {
        throw new Error(data.error || "Failed to load RFQ");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load RFQ");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: RFQStatus) => {
    try {
      const response = await fetch(`/api/proposals/rfq/${rfqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        loadRFQ();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (!hasAccess) {
    return (
      <PageTemplate title="Access Denied" description="You do not have permission to view this RFQ" icon="ri-error-warning-line">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h3>
            <p className="text-gray-600 dark:text-gray-400">Please contact your administrator.</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading RFQ details...</p>
        </div>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <PageTemplate title="RFQ Not Found" description="The requested RFQ could not be found" icon="ri-error-warning-line">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <i className="ri-file-unknow-line text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">RFQ Not Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Link href="/proposals/rfq" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to RFQs
            </Link>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={handleApprove}
        title="Approve RFQ"
        message={`Approve RFQ "${rfq.title}"? This will move it to proposal creation stage.`}
        confirmLabel="Approve"
        variant="info"
        loading={processing}
        icon="ri-checkbox-circle-line"
      />

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleReject}
        title="Reject RFQ"
        message={`Reject RFQ "${rfq.title}"? The customer will be notified of this decision.`}
        confirmLabel="Reject"
        variant="danger"
        loading={processing}
        icon="ri-close-circle-line"
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title="Cancel RFQ"
        message={`Cancel RFQ "${rfq.title}"? This action cannot be undone.`}
        confirmLabel="Cancel RFQ"
        variant="warning"
        loading={processing}
        icon="ri-forbid-line"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              {/* Breadcrumb & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Link href="/proposals/rfq" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                    <i className="ri-arrow-left-line text-xl"></i>
                  </Link>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{rfq.title}</h1>
                      <StatusBadge status={rfq.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{rfq.rfqNumber}</span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <PriorityBadge priority={rfq.priority} />
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{rfq.customer?.companyName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {canEdit && (
                    <Link
                      href={`/proposals/rfq/${rfqId}/edit`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <i className="ri-edit-line"></i>
                      Edit RFQ
                    </Link>
                  )}
                  <Link
                    href={`/proposals/universal/new?rfqId=${rfqId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <i className="ri-file-paper-2-line"></i>
                    Create Proposal
                  </Link>
                  <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                    <i className="ri-printer-line"></i>
                  </button>
                  <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                    <i className="ri-more-2-fill"></i>
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-4 -mb-px overflow-x-auto">
                <nav className="flex space-x-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                      }`}
                    >
                      <i className={tab.icon}></i>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                  <div className="text-3xl font-bold">{formatCurrency(rfq.estimatedValue, rfq.currency)}</div>
                  <div className="text-sm opacity-80 mt-1">Estimated Value</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                  <div className="text-3xl font-bold">{rfq.serviceRequirements?.length || 0}</div>
                  <div className="text-sm opacity-80 mt-1">Services Requested</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
                  <div className="text-3xl font-bold">{rfq.routes?.length || 0}</div>
                  <div className="text-sm opacity-80 mt-1">Routes</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                  <div className="text-3xl font-bold">{formatDate(rfq.timeline?.responseDeadline)}</div>
                  <div className="text-sm opacity-80 mt-1">Response Deadline</div>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Customer Information" icon="ri-user-star-line">
                  <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                    <Field label="Company Name" value={rfq.customer?.companyName} icon="ri-building-line" />
                    <Field label="Contact Person" value={rfq.customer?.contactPerson} icon="ri-user-line" />
                    <Field label="Email" value={rfq.customer?.email} icon="ri-mail-line" />
                    <Field label="Phone" value={rfq.customer?.phone} icon="ri-phone-line" />
                    <Field label="Industry" value={rfq.customer?.industry} icon="ri-briefcase-line" />
                    <Field label="Credit Rating" value={rfq.customer?.creditRating} icon="ri-star-line" />
                    <Field label="Existing Customer" value={rfq.customer?.existingCustomer ? "Yes" : "No"} icon="ri-checkbox-circle-line" />
                  </dl>
                </Section>

                <Section title="Timeline" icon="ri-calendar-line">
                  <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                    <Field label="Request Date" value={formatDate(rfq.timeline?.requestDate)} icon="ri-calendar-check-line" />
                    <Field label="Response Deadline" value={formatDate(rfq.timeline?.responseDeadline)} icon="ri-alarm-line" />
                    <Field label="Expected Start Date" value={formatDate(rfq.timeline?.expectedStartDate)} icon="ri-play-circle-line" />
                    <Field label="Project Duration" value={rfq.timeline?.projectDuration ? `${rfq.timeline.projectDuration} days` : "-"} icon="ri-time-line" />
                    <Field label="Urgency" value={<PriorityBadge priority={rfq.timeline?.urgency || rfq.priority} />} icon="ri-flag-line" />
                  </dl>
                </Section>

                <Section title="RFQ Details" icon="ri-file-info-line" className="lg:col-span-2">
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300">{rfq.description || "No description provided."}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Source</div>
                      <div className="font-medium text-gray-900 dark:text-white">{rfq.source?.replace(/_/g, " ") || "-"}</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Assigned To</div>
                      <div className="font-medium text-gray-900 dark:text-white">{rfq.assignedTo || "-"}</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Created</div>
                      <div className="font-medium text-gray-900 dark:text-white">{formatDate(rfq.createdAt)}</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Last Updated</div>
                      <div className="font-medium text-gray-900 dark:text-white">{formatDate(rfq.updatedAt)}</div>
                    </div>
                  </div>
                </Section>
              </div>
            </div>
          )}

          {/* Services & Requirements Tab */}
          {activeTab === "services" && (
            <div className="space-y-6">
              <Section title="Requested Services" icon="ri-service-line">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rfq.serviceRequirements?.map((service, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <i className="ri-service-line text-blue-600"></i>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{service.category?.replace(/_/g, " ")}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{service.subCategory?.replace(/_/g, " ")}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{service.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <PriorityBadge priority={service.priority} />
                        {service.quantity && (
                          <span className="text-xs text-gray-500">{service.quantity} {service.unit}</span>
                        )}
                      </div>
                    </div>
                  )) || (
                    <p className="col-span-full text-gray-500 dark:text-gray-400 text-center py-8">No services specified</p>
                  )}
                </div>
              </Section>

              <Section title="Shipment Details" icon="ri-box-3-line">
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 divide-y sm:divide-y-0 divide-gray-200 dark:divide-gray-700">
                  <Field label="Commodity Type" value={rfq.shipmentDetails?.commodityType} icon="ri-archive-line" />
                  <Field label="HS Code" value={rfq.shipmentDetails?.hsCode} icon="ri-barcode-line" />
                  <Field label="Weight" value={rfq.shipmentDetails?.weight ? `${rfq.shipmentDetails.weight.value} ${rfq.shipmentDetails.weight.unit}` : "-"} icon="ri-scales-3-line" />
                  <Field label="Volume" value={rfq.shipmentDetails?.volume ? `${rfq.shipmentDetails.volume.value} ${rfq.shipmentDetails.volume.unit}` : "-"} icon="ri-box-1-line" />
                  <Field label="Package Count" value={rfq.shipmentDetails?.packageCount} icon="ri-stack-line" />
                  <Field label="Package Type" value={rfq.shipmentDetails?.packageType} icon="ri-archive-drawer-line" />
                  <Field label="Insurance Required" value={rfq.shipmentDetails?.insuranceRequired ? "Yes" : "No"} icon="ri-shield-check-line" />
                  <Field label="Insurance Value" value={rfq.shipmentDetails?.insuranceValue ? formatCurrency(rfq.shipmentDetails.insuranceValue, rfq.currency) : "-"} icon="ri-money-dollar-circle-line" />
                </dl>
                
                {rfq.shipmentDetails?.hazmat && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="font-medium text-red-800 dark:text-red-300 flex items-center gap-2">
                      <i className="ri-alert-line"></i>
                      Hazardous Materials
                    </h4>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-red-600 dark:text-red-400">UN Number:</span> {rfq.shipmentDetails.hazmat.unNumber}</div>
                      <div><span className="text-red-600 dark:text-red-400">Class:</span> {rfq.shipmentDetails.hazmat.class}</div>
                      <div><span className="text-red-600 dark:text-red-400">Packing Group:</span> {rfq.shipmentDetails.hazmat.packingGroup}</div>
                      <div><span className="text-red-600 dark:text-red-400">Proper Name:</span> {rfq.shipmentDetails.hazmat.properShippingName}</div>
                    </div>
                  </div>
                )}

                {rfq.shipmentDetails?.temperatureControlled && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                      <i className="ri-temp-cold-line"></i>
                      Temperature Control Required
                    </h4>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                      Range: {rfq.shipmentDetails.temperatureControlled.minTemp}°{rfq.shipmentDetails.temperatureControlled.unit} to {rfq.shipmentDetails.temperatureControlled.maxTemp}°{rfq.shipmentDetails.temperatureControlled.unit}
                    </div>
                  </div>
                )}
              </Section>

              <Section title="Volume Requirements" icon="ri-bar-chart-box-line">
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 divide-y sm:divide-y-0 divide-gray-200 dark:divide-gray-700">
                  <Field label="Frequency" value={rfq.volumeDetails?.frequency?.replace(/_/g, " ")} icon="ri-repeat-line" />
                  <Field label="Estimated Volume" value={rfq.volumeDetails?.estimatedVolume ? `${rfq.volumeDetails.estimatedVolume} ${rfq.volumeDetails.volumeUnit}` : "-"} icon="ri-bar-chart-line" />
                  <Field label="Contract Duration" value={rfq.volumeDetails?.contractDuration ? `${rfq.volumeDetails.contractDuration} months` : "-"} icon="ri-calendar-line" />
                  <Field label="Peak Seasons" value={rfq.volumeDetails?.peakSeasons?.join(", ")} icon="ri-sun-line" />
                </dl>
              </Section>
            </div>
          )}

          {/* Route & Logistics Tab */}
          {activeTab === "route" && (
            <div className="space-y-6">
              {rfq.routes?.map((route, index) => (
                <Section key={index} title={`Route ${index + 1}`} icon="ri-route-line">
                  <div className="flex items-center gap-8 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <i className="ri-map-pin-line text-green-600 text-xl"></i>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Origin</div>
                          <div className="font-medium text-gray-900 dark:text-white">{route.origin?.name}</div>
                          <div className="text-sm text-gray-500">{route.origin?.address?.city}, {route.origin?.address?.country}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-16 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                      <i className="ri-truck-line text-2xl"></i>
                      <div className="w-16 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Destination</div>
                          <div className="font-medium text-gray-900 dark:text-white">{route.destination?.name}</div>
                          <div className="text-sm text-gray-500">{route.destination?.address?.city}, {route.destination?.address?.country}</div>
                        </div>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                          <i className="ri-map-pin-fill text-red-600 text-xl"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-500">Preferred Mode</div>
                      <div className="font-medium">{route.preferredMode?.replace(/_/g, " ")}</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-500">Est. Distance</div>
                      <div className="font-medium">{route.estimatedDistance ? `${route.estimatedDistance} km` : "-"}</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-500">Est. Transit Time</div>
                      <div className="font-medium">{route.estimatedTransitTime ? `${route.estimatedTransitTime} days` : "-"}</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-500">Via Points</div>
                      <div className="font-medium">{route.viaPoints?.length || 0}</div>
                    </div>
                  </div>
                </Section>
              )) || (
                <Section title="Route Information" icon="ri-route-line">
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No routes specified</p>
                </Section>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <Section title="Attachments & Documents" icon="ri-file-list-3-line">
              {rfq.attachments && rfq.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rfq.attachments.map((attachment, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <i className="ri-file-line text-blue-600"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{attachment.name}</div>
                        <div className="text-sm text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                        <i className="ri-download-line"></i>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <i className="ri-file-upload-line text-2xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No documents attached</p>
                </div>
              )}
            </Section>
          )}

          {/* Workflow Tab */}
          {activeTab === "workflow" && (
            <div className="space-y-6">
              <Section title="RFQ Workflow" icon="ri-flow-chart">
                <div className="flex items-center justify-between overflow-x-auto pb-4">
                  {["SUBMITTED", "UNDER_REVIEW", "PRICING_IN_PROGRESS", "AWAITING_APPROVAL", "APPROVED", "PROPOSAL_SENT"].map((status, index, arr) => {
                    const isActive = rfq.status === status;
                    const isPast = arr.indexOf(rfq.status) > index;
                    return (
                      <div key={status} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isPast ? "bg-green-500 text-white" : isActive ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                          }`}>
                            {isPast ? <i className="ri-check-line"></i> : <span>{index + 1}</span>}
                          </div>
                          <div className={`mt-2 text-xs text-center max-w-[80px] ${isActive ? "font-medium text-blue-600" : "text-gray-500"}`}>
                            {status.replace(/_/g, " ")}
                          </div>
                        </div>
                        {index < arr.length - 1 && (
                          <div className={`w-16 h-0.5 mx-2 ${isPast ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>

              <Section title="Notes & History" icon="ri-history-line">
                {rfq.notes && rfq.notes.length > 0 ? (
                  <div className="space-y-4">
                    {rfq.notes.map((note, index) => (
                      <div key={index} className={`p-4 rounded-lg ${note.internal ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800" : "bg-gray-50 dark:bg-gray-700/50"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">{note.author}</span>
                          <div className="flex items-center gap-2">
                            {note.internal && <span className="text-xs px-2 py-0.5 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded">Internal</span>}
                            <span className="text-sm text-gray-500">{formatDate(note.createdAt)}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{note.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No notes or history available</p>
                )}
              </Section>
            </div>
          )}
        </div>
      </div>
    </ProposalErrorBoundary>
  );
}
