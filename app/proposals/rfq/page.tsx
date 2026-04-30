/**
 * RFQ Management Page
 * Complete RFQ listing with advanced filtering and workflow
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface RFQListItem {
  id: string;
  rfqNumber: string;
  title: string;
  customer: {
    companyName: string;
    contactName: string;
  };
  services: string[];
  status: string;
  priority: string;
  estimatedValue: number;
  deadline: string;
  createdAt: string;
  assignedTo?: string;
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> =
  {
    DRAFT: {
      bg: "bg-gray-100 dark:bg-gray-700",
      text: "text-gray-700 dark:text-gray-300",
      dot: "bg-gray-500",
    },
    SUBMITTED: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-400",
      dot: "bg-blue-500",
    },
    UNDER_REVIEW: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-400",
      dot: "bg-yellow-500",
    },
    PRICING: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-700 dark:text-purple-400",
      dot: "bg-purple-500",
    },
    APPROVED: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-400",
      dot: "bg-green-500",
    },
    SENT: {
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
      text: "text-indigo-700 dark:text-indigo-400",
      dot: "bg-indigo-500",
    },
    ACCEPTED: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
    REJECTED: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-400",
      dot: "bg-red-500",
    },
    EXPIRED: {
      bg: "bg-gray-100 dark:bg-gray-700",
      text: "text-gray-500 dark:text-gray-400",
      dot: "bg-gray-400",
    },
  };

const priorityColors: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-blue-500",
  HIGH: "text-orange-500",
  URGENT: "text-red-500",
};

export default function RFQManagement() {
  const { user, hasModuleAccess, canPerformAction } = useAuth();
  const [rfqs, setRFQs] = useState<RFQListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");
  const canCreate = canPerformAction(
    "proposals-rfq",
    "proposals-rfq.rfq",
    undefined,
    "write",
  );
  const [search, setSearch] = useState("");
  const [selectedRFQs, setSelectedRFQs] = useState<string[]>([]);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    loadRFQs();
  }, [hasAccess]);

  const loadRFQs = async () => {
    try {
      const response = await fetch("/api/proposals/rfq");
      const data = await response.json();
      if (data.success) {
        // Transform API data to RFQListItem format
        const transformedRFQs: RFQListItem[] = data.data.map((rfq: any) => ({
          id: rfq.id,
          rfqNumber: rfq.rfqNumber,
          title: rfq.title,
          customer: {
            companyName: rfq.customer?.companyName || "",
            contactName: rfq.customer?.contactName || "",
          },
          services:
            rfq.serviceRequirements?.map((req: any) => req.category) || [],
          status: rfq.status,
          priority: rfq.priority,
          estimatedValue: rfq.estimatedValue || 0,
          deadline: rfq.timeline?.responseDeadline || "",
          createdAt: rfq.createdAt,
          assignedTo: rfq.assignedTo,
        }));
        setRFQs(transformedRFQs);
      }
    } catch (error) {
      console.error("Error loading RFQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRFQs = rfqs.filter((rfq) => {
    const matchesFilter = filter === "ALL" || rfq.status === filter;
    const matchesSearch =
      rfq.title.toLowerCase().includes(search.toLowerCase()) ||
      rfq.rfqNumber.toLowerCase().includes(search.toLowerCase()) ||
      rfq.customer.companyName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedRFQs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return days;
  };

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to access RFQ Management"
        icon="ri-error-warning-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You do not have the required permissions to view RFQs. Please
              contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="RFQ Management"
        description="Manage requests for quotation across all services"
        icon="ri-questionnaire-line"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2">
              {canCreate && (
                <Link href="/proposals/rfq/new">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <i className="ri-add-line" />
                    New RFQ
                  </button>
                </Link>
              )}
              {selectedRFQs.length > 0 && (
                <>
                  <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2">
                    <i className="ri-check-double-line" />
                    Assign ({selectedRFQs.length})
                  </button>
                  <button className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 flex items-center gap-2">
                    <i className="ri-file-paper-2-line" />
                    Create Proposal
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search RFQs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="PRICING">Pricing</option>
                <option value="APPROVED">Approved</option>
                <option value="SENT">Sent</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                label: "Total RFQs",
                value: rfqs.length,
                color: "text-gray-900 dark:text-white",
              },
              {
                label: "Under Review",
                value: rfqs.filter((r) => r.status === "UNDER_REVIEW").length,
                color: "text-yellow-600",
              },
              {
                label: "Pricing",
                value: rfqs.filter((r) => r.status === "PRICING").length,
                color: "text-purple-600",
              },
              {
                label: "Pending Response",
                value: rfqs.filter((r) => r.status === "SENT").length,
                color: "text-indigo-600",
              },
              {
                label: "Won",
                value: rfqs.filter((r) => r.status === "ACCEPTED").length,
                color: "text-green-600",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700"
              >
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* RFQ List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading RFQs...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRFQs(filteredRFQs.map((r) => r.id));
                            } else {
                              setSelectedRFQs([]);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        RFQ #
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Title / Customer
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Services
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Value
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Deadline
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <AnimatePresence>
                      {filteredRFQs.map((rfq, index) => {
                        const daysLeft = getDaysUntilDeadline(rfq.deadline);
                        const statusStyle =
                          statusColors[rfq.status] || statusColors["DRAFT"];

                        return (
                          <motion.tr
                            key={rfq.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={selectedRFQs.includes(rfq.id)}
                                onChange={() => toggleSelect(rfq.id)}
                                className="rounded border-gray-300"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                                {rfq.rfqNumber}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {rfq.title}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {rfq.customer.companyName} •{" "}
                                  {rfq.customer.contactName}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {rfq.services.slice(0, 2).map((service, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                                  >
                                    {service.replace(/_/g, " ")}
                                  </span>
                                ))}
                                {rfq.services.length > 2 && (
                                  <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                    +{rfq.services.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                                ></span>
                                {rfq.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(rfq.estimatedValue)}
                                </p>
                                <p
                                  className={`text-xs ${priorityColors[rfq.priority]}`}
                                >
                                  <i className="ri-flag-line mr-1" />
                                  {rfq.priority}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {rfq.deadline}
                                </p>
                                <p
                                  className={`text-xs ${daysLeft <= 3 ? "text-red-500" : daysLeft <= 7 ? "text-yellow-500" : "text-gray-500"}`}
                                >
                                  {daysLeft > 0
                                    ? `${daysLeft} days left`
                                    : "Overdue"}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex gap-1">
                                <Link href={`/proposals/rfq/${rfq.id}`}>
                                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    <i className="ri-eye-line" />
                                  </button>
                                </Link>
                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                  <i className="ri-edit-line" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                  <i className="ri-more-2-fill" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
