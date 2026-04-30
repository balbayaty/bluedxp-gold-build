/**
 * QHSE Incident Detail Page
 * 
 * Comprehensive view of incident with all fields:
 * - Overview (basic info, severity, status)
 * - People Involved & Witnesses
 * - Investigation & Root Cause
 * - Corrective Actions
 * - Documents & Photos
 * - Timeline & History
 * - Compliance (OSHA/RIDDOR)
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import { useAuth } from "@/contexts/AuthContext";
import type { Incident, IncidentStatus, IncidentSeverity, IncidentType } from "@/types/qhse";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const TABS = [
  { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
  { id: "people", label: "People & Witnesses", icon: "ri-group-line" },
  { id: "investigation", label: "Investigation", icon: "ri-search-eye-line" },
  { id: "actions", label: "Corrective Actions", icon: "ri-task-line" },
  { id: "documents", label: "Documents & Photos", icon: "ri-image-line" },
  { id: "compliance", label: "Compliance", icon: "ri-shield-check-line" },
  { id: "timeline", label: "Timeline", icon: "ri-time-line" },
] as const;

type TabId = typeof TABS[number]["id"];

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  NEAR_MISS: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-500" },
  MINOR: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-500" },
  MODERATE: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-500" },
  SERIOUS: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", border: "border-red-500" },
  SEVERE: { bg: "bg-red-200 dark:bg-red-900/50", text: "text-red-800 dark:text-red-300", border: "border-red-600" },
  FATAL: { bg: "bg-gray-900 dark:bg-gray-950", text: "text-white", border: "border-gray-900" },
};

const statusColors: Record<string, { bg: string; text: string }> = {
  REPORTED: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  UNDER_INVESTIGATION: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
  INVESTIGATION_COMPLETE: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
  CORRECTIVE_ACTIONS_IN_PROGRESS: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  CLOSED: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  REOPENED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
};

const typeIcons: Record<string, string> = {
  INJURY: "ri-heart-pulse-line",
  ILLNESS: "ri-virus-line",
  NEAR_MISS: "ri-error-warning-line",
  PROPERTY_DAMAGE: "ri-building-line",
  ENVIRONMENTAL: "ri-plant-line",
  FIRE: "ri-fire-line",
  CHEMICAL_SPILL: "ri-flask-line",
  VEHICLE_ACCIDENT: "ri-car-line",
  SLIP_TRIP_FALL: "ri-footprint-line",
  ELECTRICAL: "ri-flashlight-line",
  MACHINERY: "ri-settings-3-line",
  SECURITY: "ri-shield-line",
  OTHER: "ri-question-line",
};

function SeverityBadge({ severity }: { severity: string }) {
  const style = severityColors[severity] || severityColors.MINOR;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text} border ${style.border}`}>
      <i className="ri-alert-fill"></i>
      {severity.replace(/_/g, " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = statusColors[status] || statusColors.REPORTED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
      {status.replace(/_/g, " ")}
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

function formatDateTime(date: string | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as string;
  const { hasModuleAccess, canPerformAction } = useAuth();
  
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  // Action handlers
  const handleClose = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/qhse/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      if (response.ok) {
        showSuccess("Incident Closed", "The incident has been marked as closed");
        loadIncident();
      } else {
        throw new Error("Failed to close incident");
      }
    } catch (err) {
      showError("Close Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowCloseDialog(false);
    }
  };

  const handleReopen = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/qhse/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REOPENED" }),
      });
      if (response.ok) {
        showSuccess("Incident Reopened", "The incident has been reopened for further investigation");
        loadIncident();
      } else {
        throw new Error("Failed to reopen incident");
      }
    } catch (err) {
      showError("Reopen Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowReopenDialog(false);
    }
  };

  const handleDelete = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/qhse/incidents/${incidentId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showSuccess("Incident Deleted", "The incident has been removed");
        setTimeout(() => router.push("/qhse/incidents"), 1500);
      } else {
        throw new Error("Failed to delete incident");
      }
    } catch (err) {
      showError("Delete Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  const hasAccess = hasModuleAccess("qhse", "read_only");
  const canEdit = canPerformAction("qhse", "qhse.incidents", undefined, "write");

  useEffect(() => {
    if (hasAccess) {
      loadIncident();
    } else {
      setLoading(false);
    }
  }, [incidentId, hasAccess]);

  const loadIncident = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/qhse/incidents/${incidentId}`);
      if (!response.ok) throw new Error("Incident not found");
      const data = await response.json();
      if (data.success) {
        setIncident(data.data);
      } else {
        throw new Error(data.error || "Failed to load incident");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incident");
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <PageTemplate title="Access Denied" description="No permission to view incidents" icon="ri-error-warning-line">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="ri-error-warning-fill text-5xl text-red-500 mb-4"></i>
            <h3 className="text-lg font-semibold">Access Denied</h3>
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
          <p className="mt-4 text-gray-600">Loading incident...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <PageTemplate title="Incident Not Found" description="The requested incident could not be found" icon="ri-error-warning-line">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <i className="ri-file-unknow-line text-5xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-semibold mb-2">Incident Not Found</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Link href="/qhse/incidents" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Incidents
            </Link>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Close Incident Dialog */}
      <ConfirmDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onConfirm={handleClose}
        title="Close Incident"
        message={`Close incident "${incident.title}"? This marks the investigation as complete.`}
        confirmLabel="Close Incident"
        variant="info"
        loading={processing}
        icon="ri-checkbox-circle-line"
      />

      {/* Reopen Incident Dialog */}
      <ConfirmDialog
        isOpen={showReopenDialog}
        onClose={() => setShowReopenDialog(false)}
        onConfirm={handleReopen}
        title="Reopen Incident"
        message={`Reopen incident "${incident.title}"? This will allow further investigation.`}
        confirmLabel="Reopen"
        variant="warning"
        loading={processing}
        icon="ri-restart-line"
      />

      {/* Delete Incident Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Incident"
        message={`Are you sure you want to delete incident "${incident.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={processing}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Link href="/qhse/incidents" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors" aria-label="Back">
                    <i className="ri-arrow-left-line text-xl"></i>
                  </Link>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${severityColors[incident.severity]?.bg || "bg-gray-100"}`}>
                  <i className={`${typeIcons[incident.type] || "ri-alert-line"} text-2xl ${severityColors[incident.severity]?.text || "text-gray-600"}`}></i>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{incident.title}</h1>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500 font-mono">{incident.incidentNumber}</span>
                    <SeverityBadge severity={incident.severity} />
                    <StatusBadge status={incident.status} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {canEdit && (
                  <Link
                    href={`/qhse/incidents/${incidentId}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                  >
                    <i className="ri-edit-line"></i>
                    Edit
                  </Link>
                )}
                <Link
                  href={`/iso-ims/capa/new?incidentId=${incidentId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
                >
                  <i className="ri-add-line"></i>
                  Create CAPA
                </Link>
                <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200">
                  <i className="ri-printer-line"></i>
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
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
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
            {/* Alert Banner for High Severity */}
            {(incident.severity === "SEVERE" || incident.severity === "FATAL") && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                  <i className="ri-alarm-warning-fill text-2xl"></i>
                  <div>
                    <h4 className="font-semibold">Critical Incident Alert</h4>
                    <p className="text-sm">This incident requires immediate attention and executive notification.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500">Type</div>
                <div className="flex items-center gap-2 mt-1">
                  <i className={`${typeIcons[incident.type]} text-blue-600`}></i>
                  <span className="font-medium text-gray-900 dark:text-white">{incident.type.replace(/_/g, " ")}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500">Date & Time</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{formatDateTime(incident.occurredAt)}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{incident.location?.name || incident.location || "-"}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500">Reported By</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{incident.reportedBy}</div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section title="Incident Details" icon="ri-file-info-line">
                <div className="prose dark:prose-invert max-w-none mb-6">
                  <p className="text-gray-700 dark:text-gray-300">{incident.description}</p>
                </div>
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="Category" value={incident.category} icon="ri-folder-line" />
                  <Field label="Sub-Category" value={incident.subCategory} icon="ri-folder-open-line" />
                  <Field label="Shift" value={incident.shift} icon="ri-time-line" />
                  <Field label="Weather Conditions" value={incident.weatherConditions} icon="ri-sun-line" />
                  <Field label="Equipment Involved" value={incident.equipmentInvolved} icon="ri-tools-line" />
                </dl>
              </Section>

              <Section title="Location Details" icon="ri-map-pin-line">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="Facility" value={incident.location?.facility} icon="ri-building-line" />
                  <Field label="Building" value={incident.location?.building} icon="ri-building-2-line" />
                  <Field label="Floor" value={incident.location?.floor} icon="ri-stairs-line" />
                  <Field label="Zone/Area" value={incident.location?.zone} icon="ri-layout-grid-line" />
                  <Field label="Specific Location" value={incident.location?.specificLocation} icon="ri-map-pin-2-line" />
                  {incident.location?.coordinates && (
                    <Field 
                      label="GPS Coordinates" 
                      value={`${incident.location.coordinates.lat}, ${incident.location.coordinates.lng}`} 
                      icon="ri-compass-line" 
                    />
                  )}
                </dl>
              </Section>

              <Section title="Immediate Actions Taken" icon="ri-first-aid-kit-line" className="lg:col-span-2">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300">{incident.immediateActions || "No immediate actions documented."}</p>
                </div>
              </Section>
            </div>
          </div>
        )}

        {/* People & Witnesses Tab */}
        {activeTab === "people" && (
          <div className="space-y-6">
            <Section title="People Involved" icon="ri-group-line">
              {incident.peopleInvolved && incident.peopleInvolved.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incident.peopleInvolved.map((person, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <i className="ri-user-line text-blue-600"></i>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{person.name}</div>
                          <div className="text-sm text-gray-500">{person.role} • {person.employeeId}</div>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <div><span className="text-gray-500">Department:</span> {person.department}</div>
                        <div><span className="text-gray-500">Involvement:</span> {person.involvementType}</div>
                        {person.injuryDescription && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-700 dark:text-red-400">
                            <i className="ri-heart-pulse-line mr-1"></i>
                            {person.injuryDescription}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No people involved documented</p>
              )}
            </Section>

            <Section title="Witness Statements" icon="ri-eye-line">
              {incident.witnessStatements && incident.witnessStatements.length > 0 ? (
                <div className="space-y-4">
                  {incident.witnessStatements.map((witness, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <i className="ri-user-line text-gray-500"></i>
                          <span className="font-medium text-gray-900 dark:text-white">{witness.witnessName}</span>
                          {witness.anonymous && <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Anonymous</span>}
                        </div>
                        <span className="text-sm text-gray-500">{formatDateTime(witness.statementDate)}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{witness.statement}</p>
                      {witness.contact && (
                        <div className="mt-2 text-sm text-gray-500">
                          <i className="ri-phone-line mr-1"></i>
                          {witness.contact}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No witness statements recorded</p>
              )}
            </Section>
          </div>
        )}

        {/* Investigation Tab */}
        {activeTab === "investigation" && (
          <div className="space-y-6">
            <Section title="Investigation Details" icon="ri-search-eye-line">
              {incident.investigation ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-500">Lead Investigator</div>
                      <div className="font-medium text-gray-900 dark:text-white">{incident.investigation.leadInvestigator}</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-500">Start Date</div>
                      <div className="font-medium">{formatDateTime(incident.investigation.startDate)}</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="font-medium">{incident.investigation.status}</div>
                    </div>
                  </div>
                  
                  {incident.investigation.team && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Investigation Team</h4>
                      <div className="flex flex-wrap gap-2">
                        {incident.investigation.team.map((member, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {incident.investigation.findings && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Findings</h4>
                      <p className="text-gray-700 dark:text-gray-300">{incident.investigation.findings}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-search-eye-line text-4xl text-gray-300 mb-2"></i>
                  <p className="text-gray-500">Investigation not started</p>
                  {canEdit && (
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Start Investigation
                    </button>
                  )}
                </div>
              )}
            </Section>

            <Section title="Root Cause Analysis" icon="ri-mind-map">
              {incident.rootCauseAnalysis ? (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Method Used</div>
                    <div className="font-medium text-gray-900 dark:text-white">{incident.rootCauseAnalysis.method}</div>
                  </div>

                  {incident.rootCauseAnalysis.method === "FIVE_WHY" && incident.rootCauseAnalysis.fiveWhys && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">5 Whys Analysis</h4>
                      {incident.rootCauseAnalysis.fiveWhys.map((why, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">Why {i + 1}</div>
                            <p className="text-gray-600 dark:text-gray-400">{why}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {incident.rootCauseAnalysis.rootCauses && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Identified Root Causes</h4>
                      <ul className="space-y-2">
                        {incident.rootCauseAnalysis.rootCauses.map((cause, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <i className="ri-arrow-right-circle-fill text-red-500 mt-0.5"></i>
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {incident.rootCauseAnalysis.contributingFactors && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Contributing Factors</h4>
                      <ul className="space-y-2">
                        {incident.rootCauseAnalysis.contributingFactors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <i className="ri-arrow-right-s-line text-orange-500 mt-0.5"></i>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Root cause analysis not performed</p>
              )}
            </Section>
          </div>
        )}

        {/* Corrective Actions Tab */}
        {activeTab === "actions" && (
          <Section title="Corrective & Preventive Actions" icon="ri-task-line">
            {incident.correctiveActions && incident.correctiveActions.length > 0 ? (
              <div className="space-y-4">
                {incident.correctiveActions.map((action, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${
                    action.status === "COMPLETED" ? "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800" :
                    action.status === "IN_PROGRESS" ? "border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800" :
                    "border-gray-200 dark:border-gray-700"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${
                          action.status === "COMPLETED" ? "bg-green-500" :
                          action.status === "IN_PROGRESS" ? "bg-blue-500" :
                          action.status === "OVERDUE" ? "bg-red-500" :
                          "bg-gray-400"
                        }`}></span>
                        <span className="font-medium text-gray-900 dark:text-white">{action.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        action.type === "CORRECTIVE" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      }`}>
                        {action.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{action.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span><i className="ri-user-line mr-1"></i>{action.assignedTo}</span>
                      <span><i className="ri-calendar-line mr-1"></i>Due: {formatDateTime(action.dueDate)}</span>
                      {action.completedDate && (
                        <span className="text-green-600"><i className="ri-check-line mr-1"></i>Completed: {formatDateTime(action.completedDate)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="ri-task-line text-4xl text-gray-300 mb-2"></i>
                <p className="text-gray-500">No corrective actions defined</p>
                {canEdit && (
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Add Corrective Action
                  </button>
                )}
              </div>
            )}
          </Section>
        )}

        {/* Documents & Photos Tab */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            <Section title="Photos & Images" icon="ri-image-line">
              {incident.photos && incident.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {incident.photos.map((photo, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img src={photo.url} alt={photo.caption || `Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a href={photo.url} target="_blank" rel="noopener noreferrer" className="text-white">
                          <i className="ri-zoom-in-line text-2xl"></i>
                        </a>
                      </div>
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-image-add-line text-4xl text-gray-300 mb-2"></i>
                  <p className="text-gray-500">No photos uploaded</p>
                </div>
              )}
            </Section>

            <Section title="Documents" icon="ri-file-list-3-line">
              {incident.documents && incident.documents.length > 0 ? (
                <div className="space-y-3">
                  {incident.documents.map((doc, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <i className="ri-file-line text-blue-600"></i>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{doc.name}</div>
                        <div className="text-sm text-gray-500">{doc.type} • {(doc.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <a href={doc.url} download className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                        <i className="ri-download-line"></i>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No documents attached</p>
              )}
            </Section>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div className="space-y-6">
            <Section title="OSHA Compliance" icon="ri-government-line">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">OSHA Recordable</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      incident.oshaRecordable 
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}>
                      {incident.oshaRecordable ? "Yes" : "No"}
                    </span>
                  </div>
                  {incident.oshaRecordable && (
                    <dl className="space-y-2">
                      <Field label="OSHA Classification" value={incident.oshaClassification} />
                      <Field label="Case Number" value={incident.oshaCaseNumber} />
                      <Field label="Days Away from Work" value={incident.daysAwayFromWork} />
                      <Field label="Days Restricted/Transfer" value={incident.daysRestrictedTransfer} />
                    </dl>
                  )}
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">RIDDOR Reportable</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      incident.riddorReportable 
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}>
                      {incident.riddorReportable ? "Yes" : "No"}
                    </span>
                  </div>
                  {incident.riddorReportable && (
                    <dl className="space-y-2">
                      <Field label="RIDDOR Category" value={incident.riddorCategory} />
                      <Field label="Report Date" value={formatDateTime(incident.riddorReportDate)} />
                      <Field label="Reference Number" value={incident.riddorReferenceNumber} />
                    </dl>
                  )}
                </div>
              </div>
            </Section>

            <Section title="Cost & Impact" icon="ri-money-dollar-box-line">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {incident.estimatedCost ? `$${incident.estimatedCost.toLocaleString()}` : "-"}
                  </div>
                  <div className="text-sm text-gray-500">Estimated Cost</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {incident.actualCost ? `$${incident.actualCost.toLocaleString()}` : "-"}
                  </div>
                  <div className="text-sm text-gray-500">Actual Cost</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {incident.lostWorkHours || 0}
                  </div>
                  <div className="text-sm text-gray-500">Lost Work Hours</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {incident.insuranceClaim ? "Yes" : "No"}
                  </div>
                  <div className="text-sm text-gray-500">Insurance Claim</div>
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <Section title="Incident Timeline" icon="ri-time-line">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
              <div className="space-y-6">
                <div className="relative flex items-start gap-4 pl-8">
                  <div className="absolute left-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800"></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Incident Occurred</div>
                    <div className="text-sm text-gray-500">{formatDateTime(incident.occurredAt)}</div>
                  </div>
                </div>
                <div className="relative flex items-start gap-4 pl-8">
                  <div className="absolute left-2 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Reported</div>
                    <div className="text-sm text-gray-500">{formatDateTime(incident.reportedAt)} by {incident.reportedBy}</div>
                  </div>
                </div>
                {incident.investigation?.startDate && (
                  <div className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-2 w-4 h-4 rounded-full bg-yellow-500 border-2 border-white dark:border-gray-800"></div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Investigation Started</div>
                      <div className="text-sm text-gray-500">{formatDateTime(incident.investigation.startDate)}</div>
                    </div>
                  </div>
                )}
                {incident.investigation?.completedDate && (
                  <div className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-2 w-4 h-4 rounded-full bg-purple-500 border-2 border-white dark:border-gray-800"></div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Investigation Completed</div>
                      <div className="text-sm text-gray-500">{formatDateTime(incident.investigation.completedDate)}</div>
                    </div>
                  </div>
                )}
                {incident.closedAt && (
                  <div className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-2 w-4 h-4 rounded-full bg-gray-500 border-2 border-white dark:border-gray-800"></div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Incident Closed</div>
                      <div className="text-sm text-gray-500">{formatDateTime(incident.closedAt)} by {incident.closedBy}</div>
                    </div>
                  </div>
                )}
                <div className="relative flex items-start gap-4 pl-8">
                  <div className="absolute left-2 w-4 h-4 rounded-full bg-gray-300 border-2 border-white dark:border-gray-800"></div>
                  <div>
                    <div className="font-medium text-gray-500 dark:text-gray-400">Last Updated</div>
                    <div className="text-sm text-gray-500">{formatDateTime(incident.updatedAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
    </>
  );
}
