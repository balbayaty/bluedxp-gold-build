/**
 * RFI Portal Dashboard
 * Intelligent Request for Information management
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";

interface RFI {
  id: string;
  rfiNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  status: string;
  dataCompleteness: number;
  pricingReadiness: number;
  pricingConfidence: "Low" | "Medium" | "High";
  readinessBadge: "Green" | "Amber" | "Red";
  createdAt: string;
  generatedRFQId?: string;
  generatedProposalId?: string;
}

export default function RFIPortalPage() {
  const { user, hasModuleAccess, canPerformAction } = useAuth();
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");
  const canCreate = canPerformAction(
    "proposals-rfq",
    "proposals-rfq.rfi",
    undefined,
    "write",
  );

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    loadRFIs();
    loadAnalytics();
  }, [hasAccess]);

  const loadRFIs = async () => {
    try {
      const response = await fetch("/api/rfi");
      const data = await response.json();
      if (data.success) {
        setRfis(data.data.rfis || []);
      }
    } catch (error) {
      console.error("Error loading RFIs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch("/api/rfi/analytics");
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data.analytics);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Green":
        return "bg-green-500";
      case "Amber":
        return "bg-yellow-500";
      case "Red":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "RFQ_GENERATED":
        return "bg-purple-100 text-purple-800";
      case "PROPOSAL_GENERATED":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to access the RFI Portal"
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
              You do not have the required permissions to view RFIs. Please
              contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (loading) {
    return (
      <PageTemplate
        title="RFI Portal"
        description="Intelligent Request for Information management"
        icon="ri-file-search-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="RFI Portal"
        description="Intelligent Request for Information management with automated RFI → RFQ → Proposal pipeline"
        icon="ri-file-search-line"
        actions={
          canCreate ? (
            <Link
              href="/proposals/rfi/new/wizard"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <i className="ri-add-line text-xl" />
              New RFI
            </Link>
          ) : null
        }
      >
        <div className="space-y-6">
          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total RFIs
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {analytics.totalRFIs}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Readiness
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {Math.round(analytics.averageReadiness)}%
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Automation Rate
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {Math.round(analytics.automationRate)}%
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Conversion Rate
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {Math.round(analytics.conversionRate)}%
                </div>
              </motion.div>
            </div>
          )}

          {/* RFI List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent RFIs
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      RFI Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Readiness
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pipeline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rfis.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                      >
                        No RFIs found. Create your first RFI to get started.
                      </td>
                    </tr>
                  ) : (
                    rfis.map((rfi) => (
                      <tr
                        key={rfi.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {rfi.rfiNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {rfi.companyName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {rfi.contactPerson}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              rfi.status,
                            )}`}
                          >
                            {rfi.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getBadgeColor(rfi.readinessBadge)}`}
                                style={{ width: `${rfi.pricingReadiness}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {rfi.pricingReadiness}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {rfi.pricingConfidence} confidence
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {rfi.generatedRFQId && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                                RFQ
                              </span>
                            )}
                            {rfi.generatedProposalId && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                Proposal
                              </span>
                            )}
                            {!rfi.generatedRFQId &&
                              !rfi.generatedProposalId && (
                                <span className="text-xs text-gray-400">
                                  Not processed
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/proposals/rfi/${rfi.id}`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
