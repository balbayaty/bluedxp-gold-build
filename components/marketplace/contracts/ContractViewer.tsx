/**
 * Contract Viewer Component
 * Displays marketplace contract with all details, signatures, and SLAs
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  DollarSign,
  Users,
  Shield,
  Download,
  Eye,
  Edit,
  Send,
} from "lucide-react";
import type { MarketplaceContract } from "@/types/marketplace-contracts";

interface ContractViewerProps {
  contractId: string;
  onEdit?: () => void;
  onSign?: () => void;
  onDownload?: () => void;
}

export default function ContractViewer({
  contractId,
  onEdit,
  onSign,
  onDownload,
}: ContractViewerProps) {
  const [contract, setContract] = useState<MarketplaceContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "terms" | "sla" | "signatures" | "milestones"
  >("overview");

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      const response = await fetch(`/api/marketplace/contracts/${contractId}`);
      const result = await response.json();
      if (result.success) {
        setContract(result.data);
      }
    } catch (error) {
      console.error("Failed to load contract:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: MarketplaceContract["status"]) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-700";
      case "PENDING_SIGNATURE":
        return "bg-yellow-100 text-yellow-700";
      case "SIGNED":
        return "bg-blue-100 text-blue-700";
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "COMPLETED":
        return "bg-purple-100 text-purple-700";
      case "TERMINATED":
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: MarketplaceContract["status"]) => {
    switch (status) {
      case "ACTIVE":
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      case "PENDING_SIGNATURE":
        return <Clock className="w-4 h-4" />;
      case "TERMINATED":
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-slate-600">Contract not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {contract.title}
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Contract #{contract.contractNumber}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(contract.status)}`}
              >
                {getStatusIcon(contract.status)}
                {contract.status.replace("_", " ")}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(contract.startDate).toLocaleDateString()} -{" "}
                {new Date(contract.endDate).toLocaleDateString()}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {contract.totalValue.toLocaleString()} {contract.currency}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contract.status === "DRAFT" && onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {contract.status === "PENDING_SIGNATURE" && onSign && (
              <button
                onClick={onSign}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Sign
              </button>
            )}
            {onDownload && (
              <button
                onClick={onDownload}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex space-x-1 p-2">
            {(
              ["overview", "terms", "sla", "signatures", "milestones"] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-blue-500 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                  Parties
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Provider
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-100">
                      {contract.providerName}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Customer
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-100">
                      {contract.customerName}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                  Scope of Work
                </h3>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {contract.scopeOfWork}
                </p>
              </div>

              {contract.deliverables && contract.deliverables.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                    Deliverables
                  </h3>
                  <ul className="space-y-2">
                    {contract.deliverables.map((deliverable, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-400">
                          {deliverable}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {contract.paymentSchedule &&
                contract.paymentSchedule.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                      Payment Schedule
                    </h3>
                    <div className="space-y-2">
                      {contract.paymentSchedule.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4"
                        >
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {payment.milestone || "Payment"}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Due:{" "}
                              {new Date(payment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {payment.amount.toLocaleString()}{" "}
                              {contract.currency}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                payment.status === "PAID"
                                  ? "bg-green-100 text-green-700"
                                  : payment.status === "OVERDUE"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Terms Tab */}
          {activeTab === "terms" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                  Payment Terms
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {contract.terms.paymentTerms}
                </p>
              </div>

              {contract.terms.deliveryTerms && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                    Delivery Terms
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {contract.terms.deliveryTerms}
                  </p>
                </div>
              )}

              {contract.terms.warrantyTerms && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                    Warranty Terms
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {contract.terms.warrantyTerms}
                  </p>
                </div>
              )}

              {contract.terms.liabilityTerms && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                    Liability Terms
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {contract.terms.liabilityTerms}
                  </p>
                </div>
              )}

              {contract.terms.disputeResolution && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                    Dispute Resolution
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {contract.terms.disputeResolution}
                  </p>
                </div>
              )}

              {contract.terms.governingLaw && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                    Governing Law
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {contract.terms.governingLaw}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SLA Tab */}
          {activeTab === "sla" &&
            contract.serviceLevelAgreements &&
            contract.serviceLevelAgreements.length > 0 && (
              <div className="space-y-4">
                {contract.serviceLevelAgreements.map((sla) => (
                  <div
                    key={sla.id}
                    className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                          {sla.metric}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Target: {sla.target} {sla.unit} (
                          {sla.measurementPeriod})
                        </p>
                      </div>
                      {sla.status && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            sla.status === "MET"
                              ? "bg-green-100 text-green-700"
                              : sla.status === "EXCEEDED"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {sla.status}
                        </span>
                      )}
                    </div>
                    {sla.currentPerformance !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600 dark:text-slate-400">
                            Current Performance
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {sla.currentPerformance} {sla.unit}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              sla.currentPerformance >= sla.target
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min((sla.currentPerformance / sla.target) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          {/* Signatures Tab */}
          {activeTab === "signatures" && (
            <div className="space-y-4">
              {contract.signatures.map((signature) => (
                <div
                  key={signature.id}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {signature.signerName}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                        {signature.signerRole.toLowerCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      {signature.status === "SIGNED" ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Signed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <Clock className="w-5 h-5" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                      )}
                      {signature.signedAt && (
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(signature.signedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Milestones Tab */}
          {activeTab === "milestones" &&
            contract.milestones &&
            contract.milestones.length > 0 && (
              <div className="space-y-4">
                {contract.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                          {milestone.name}
                        </h4>
                        {milestone.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          milestone.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : milestone.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-700"
                              : milestone.status === "DELAYED"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {milestone.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </span>
                      {milestone.completedAt && (
                        <>
                          <span className="mx-2">•</span>
                          <span>
                            Completed:{" "}
                            {new Date(
                              milestone.completedAt,
                            ).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                    {milestone.deliverables &&
                      milestone.deliverables.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Deliverables:
                          </p>
                          <ul className="space-y-1">
                            {milestone.deliverables.map((deliverable, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{deliverable}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
        </div>
      </motion.div>
    </div>
  );
}
