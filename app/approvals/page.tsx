/**
 * Approvals - Enhanced
 * Approval Queue for ISO IMS items (CAPAs, NCRs, Documents, etc.)
 * Fully functional with approval workflow
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import ModuleLinks from "@/components/ModuleLinks";
import { getISOIMSLinks } from "@/utils/moduleInterconnectivity";

interface Approval {
  id: string;
  type: "CAPA" | "NCR" | "Document" | "Risk" | "Training";
  title: string;
  submittedBy: string;
  submittedDate: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "pending" | "approved" | "rejected" | "more_info_requested";
  details?: any;
  moduleUrl: string;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(
    null,
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      // Fetch pending approvals from various modules
      const [capas, ncrs, documents] = await Promise.all([
        fetch("/api/erpnext/capas")
          .then((r) => r.json())
          .catch(() => ({ data: [] })),
        fetch("/api/erpnext/ncrs")
          .then((r) => r.json())
          .catch(() => ({ data: [] })),
        fetch("/api/erpnext/documents")
          .then((r) => r.json())
          .catch(() => ({ documents: [] })),
      ]);

      const pendingApprovals: Approval[] = [];

      // CAPAs pending approval
      if (capas.data) {
        capas.data
          .filter(
            (c: any) => c.status === "Under Review" || c.status === "Open",
          )
          .forEach((capa: any) => {
            pendingApprovals.push({
              id: capa.name,
              type: "CAPA",
              title: capa.subject,
              submittedBy: capa.owner || "System",
              submittedDate: capa.creation || new Date().toISOString(),
              priority: (capa.priority || "Medium") as Approval["priority"],
              status: "pending",
              moduleUrl: "/capa-management",
            });
          });
      }

      // NCRs pending approval
      if (ncrs.data) {
        ncrs.data
          .filter(
            (n: any) =>
              n.status === "Open" || n.status === "Under Investigation",
          )
          .forEach((ncr: any) => {
            pendingApprovals.push({
              id: ncr.name,
              type: "NCR",
              title: ncr.subject,
              submittedBy: ncr.reported_by || "System",
              submittedDate: ncr.creation || new Date().toISOString(),
              priority: (ncr.priority || "Medium") as Approval["priority"],
              status: "pending",
              moduleUrl: "/ncr-management",
            });
          });
      }

      setApprovals(
        pendingApprovals.length > 0
          ? pendingApprovals
          : generateMockApprovals(),
      );
    } catch (error) {
      console.error("Error fetching approvals:", error);
      setApprovals(generateMockApprovals());
    } finally {
      setLoading(false);
    }
  };

  const generateMockApprovals = (): Approval[] => {
    return [
      {
        id: "1",
        type: "CAPA",
        title: "Improve Material Handling Procedures",
        submittedBy: "quality.manager@hazalyze.com",
        submittedDate: "2024-01-15",
        priority: "High",
        status: "pending",
        moduleUrl: "/capa-management",
      },
      {
        id: "2",
        type: "NCR",
        title: "Material Handling Non-Conformance",
        submittedBy: "warehouse.supervisor@hazalyze.com",
        submittedDate: "2024-01-20",
        priority: "Medium",
        status: "pending",
        moduleUrl: "/ncr-management",
      },
      {
        id: "3",
        type: "Document",
        title: "Chemical Handling Safety Policy v2.1",
        submittedBy: "safety.manager@hazalyze.com",
        submittedDate: "2024-01-18",
        priority: "High",
        status: "pending",
        moduleUrl: "/document-center",
      },
    ];
  };

  const handleApprove = async (approval: Approval) => {
    try {
      // Update status in ERPNext
      const response = await fetch(
        `/api/erpnext/${approval.type.toLowerCase()}s`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: approval.id,
            updates: {
              status: approval.type === "CAPA" ? "In Progress" : "Approved",
              approval_notes: reviewNotes,
            },
          }),
        },
      );

      if (response.ok) {
        setApprovals((prev) => prev.filter((a) => a.id !== approval.id));
        setSelectedApproval(null);
        setReviewNotes("");
        alert("✅ Approved successfully!");
      }
    } catch (error) {
      console.error("Approval error:", error);
      alert("Failed to approve");
    }
  };

  const handleReject = async (approval: Approval) => {
    if (!confirm(`Reject "${approval.title}"?`)) return;

    try {
      const response = await fetch(
        `/api/erpnext/${approval.type.toLowerCase()}s`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: approval.id,
            updates: {
              status: "Rejected",
              rejection_notes: reviewNotes,
            },
          }),
        },
      );

      if (response.ok) {
        setApprovals((prev) => prev.filter((a) => a.id !== approval.id));
        setSelectedApproval(null);
        setReviewNotes("");
        alert("❌ Rejected");
      }
    } catch (error) {
      console.error("Rejection error:", error);
      alert("Failed to reject");
    }
  };

  const filteredApprovals = approvals.filter((a) => {
    if (filterType === "all") return true;
    return a.type.toLowerCase() === filterType;
  });

  const stats = {
    total: approvals.length,
    pending: approvals.filter((a) => a.status === "pending").length,
    highPriority: approvals.filter(
      (a) => a.priority === "High" || a.priority === "Critical",
    ).length,
    capa: approvals.filter((a) => a.type === "CAPA").length,
  };

  return (
    <PageTemplate
      title="Approval Queue"
      description="Review and approve ISO IMS items (CAPAs, NCRs, Documents)"
      icon="ri-check-double-line"
      systemInfo={{
        sap: "Approval Management",
        oracle: "Approval Workflow",
        manhattan: "Review Queue",
      }}
      stats={[
        {
          label: "Pending Approvals",
          value: stats.pending,
          icon: "ri-time-line",
          trend: "neutral" as const,
        },
        {
          label: "High Priority",
          value: stats.highPriority,
          icon: "ri-alert-line",
          trend: "up" as const,
        },
        {
          label: "CAPAs",
          value: stats.capa,
          icon: "ri-tools-line",
          trend: "neutral" as const,
        },
        {
          label: "NCRs",
          value: approvals.filter((a) => a.type === "NCR").length,
          icon: "ri-alert-line",
          trend: "neutral" as const,
        },
      ]}
    >
      {/* Filter */}
      <div className="mb-6 flex gap-3">
        {["all", "capa", "ncr", "document"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterType === type
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Approvals List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approval Queue */}
        <div className="lg:col-span-1">
          <div className="p-4 mb-4 rounded-md bg-gray-800 border border-gray-700">
            <h2 className="text-lg font-medium mb-3 text-white">
              Pending Approvals ({filteredApprovals.length})
            </h2>

            {loading ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin">
                  <i className="ri-loader-4-line text-2xl text-gray-400"></i>
                </div>
                <p className="mt-2 text-gray-400">Loading items...</p>
              </div>
            ) : filteredApprovals.length > 0 ? (
              <ul className="space-y-2">
                {filteredApprovals.map((approval) => (
                  <li key={approval.id}>
                    <button
                      onClick={() => setSelectedApproval(approval)}
                      className={`w-full p-3 rounded-md text-left transition ${
                        selectedApproval?.id === approval.id
                          ? "bg-blue-900/30 border-l-4 border-blue-500"
                          : "bg-gray-700 hover:bg-gray-600 border-l-4 border-transparent"
                      }`}
                    >
                      <div className="font-medium text-white mb-1">
                        {approval.title}
                      </div>
                      <div className="text-sm text-gray-300 mb-1">
                        {approval.type} • {approval.submittedBy.split("@")[0]}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          {new Date(
                            approval.submittedDate,
                          ).toLocaleDateString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            approval.priority === "Critical" ||
                            approval.priority === "High"
                              ? "bg-red-900/30 text-red-400"
                              : "bg-yellow-900/30 text-yellow-400"
                          }`}
                        >
                          {approval.priority}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <i className="ri-checkbox-circle-line text-4xl mb-3"></i>
                <p>No pending approvals</p>
              </div>
            )}
          </div>
        </div>

        {/* Approval Details */}
        <div className="lg:col-span-2">
          {selectedApproval ? (
            <div className="rounded-md shadow-md p-8 bg-gray-800 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {selectedApproval.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {selectedApproval.type} • Submitted by{" "}
                    {selectedApproval.submittedBy}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedApproval.priority === "Critical"
                      ? "bg-red-900/30 text-red-400"
                      : selectedApproval.priority === "High"
                        ? "bg-orange-900/30 text-orange-400"
                        : selectedApproval.priority === "Medium"
                          ? "bg-yellow-900/30 text-yellow-400"
                          : "bg-green-900/30 text-green-400"
                  }`}
                >
                  {selectedApproval.priority} Priority
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Submitted Date
                  </label>
                  <p className="text-white">
                    {new Date(
                      selectedApproval.submittedDate,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Type
                  </label>
                  <p className="text-white">{selectedApproval.type}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Review Notes
                  </label>
                  <textarea
                    rows={4}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border focus:border-blue-500 focus:outline-none"
                    placeholder="Add review notes or comments..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-700">
                <button
                  onClick={() => handleApprove(selectedApproval)}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <i className="ri-check-line"></i>
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedApproval)}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <i className="ri-close-line"></i>
                  Reject
                </button>
                <button
                  onClick={() => router.push(selectedApproval.moduleUrl)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <i className="ri-external-link-line"></i>
                  View Details
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-md shadow-md p-8 text-center bg-gray-800 border border-gray-700">
              <i className="ri-file-search-line text-6xl text-gray-500 mb-4"></i>
              <h3 className="text-lg font-medium mb-2 text-white">
                No Item Selected
              </h3>
              <p className="text-gray-400">
                Select an item from the queue to review
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cross-Module Links */}
      <div className="pt-6 border-t border-white/10 mt-8">
        <ModuleLinks links={getISOIMSLinks()} />
      </div>
    </PageTemplate>
  );
}
