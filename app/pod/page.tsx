"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { format } from "date-fns";
import PODVisionIntegration from "@/components/vision/PODVisionIntegration";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { logger } from "@/lib/services/observability/logger";
import { apiFetch } from "@/utils/apiFetch";

interface POD {
  id: string;
  podNumber: string;
  trackingNumber: string;
  shipmentNumber: string;
  soNumber: string;
  customerNumber: string;
  customerName: string;
  deliveryDate: Date | string;
  deliveryTime: string;
  deliveryAddress: string;
  deliveredBy: string;
  receivedBy: string;
  signature?: string;
  photo?: string;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  deliveryNotes?: string;
  customerConfirmation: "PENDING" | "CONFIRMED" | "REJECTED";
  itemsDelivered: number;
  itemsReceived: number;
  damageReport?: {
    hasDamage: boolean;
    damageType?: string;
    damageDescription?: string;
    photos?: string[];
  };
  createdAt: Date | string;
}

export default function ProofofDelivery() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const soFilter = searchParams.get("so");
  const trackingFilter = searchParams.get("tracking");

  const [pods, setPods] = useState<POD[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedPOD, setSelectedPOD] = useState<POD | null>(null);

  const filteredPODs = useMemo(() => {
    return pods.filter((pod) => {
      const matchesSearch =
        pod.podNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pod.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pod.soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pod.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || pod.status === selectedStatus;
      const matchesSO = !soFilter || pod.soNumber === soFilter;
      const matchesTracking =
        !trackingFilter || pod.trackingNumber === trackingFilter;
      return matchesSearch && matchesStatus && matchesSO && matchesTracking;
    });
  }, [pods, searchQuery, selectedStatus, soFilter, trackingFilter]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await apiFetch("/api/transportation/pod");
        const data = (await res.json()) as POD[];
        if (!mounted) return;
        setPods(data || []);
      } catch (e) {
        if (!mounted) return;
        setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const statusDistribution = useMemo(() => {
    const completed = pods.filter((p) => p.status === "COMPLETED").length;
    const pending = pods.filter((p) => p.status === "PENDING").length;
    const rejected = pods.filter((p) => p.status === "REJECTED").length;
    return [
      { name: "Completed", value: completed, color: "#10b981" },
      { name: "Pending", value: pending, color: "#f59e0b" },
      { name: "Rejected", value: rejected, color: "#ef4444" },
    ];
  }, [pods]);

  const confirmationStats = useMemo(() => {
    const confirmed = pods.filter(
      (p) => p.customerConfirmation === "CONFIRMED",
    ).length;
    const pending = pods.filter(
      (p) => p.customerConfirmation === "PENDING",
    ).length;
    const rejected = pods.filter(
      (p) => p.customerConfirmation === "REJECTED",
    ).length;
    return { confirmed, pending, rejected };
  }, [pods]);

  const stats = [
    {
      label: "Total PODs",
      value: pods.length,
      icon: "ri-file-check-line",
      tooltip: "Total proof of delivery records",
      trend: "up" as const,
    },
    {
      label: "Completed",
      value: pods.filter((p) => p.status === "COMPLETED").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Completed PODs",
      trend: "up" as const,
    },
    {
      label: "Customer Confirmed",
      value: confirmationStats.confirmed,
      icon: "ri-user-check-line",
      tooltip: "Customer confirmed deliveries",
      trend: "up" as const,
    },
    {
      label: "With Damage",
      value: pods.filter((p) => p.damageReport?.hasDamage).length,
      icon: "ri-alert-line",
      tooltip: "PODs with damage reports",
      trend: "neutral" as const,
    },
  ];

  const handleView = (pod: POD) => {
    setSelectedPOD(pod);
    setShowViewModal(true);
  };

  const handleSignature = (pod: POD) => {
    setSelectedPOD(pod);
    setShowSignatureModal(true);
  };

  const handleNavigateToSO = (pod: POD) => {
    router.push(`/sales-orders?so=${pod.soNumber}`);
  };

  const handleNavigateToTracking = (pod: POD) => {
    router.push(`/tracking?tracking=${pod.trackingNumber}`);
  };

  const handleNavigateToCustomer = (pod: POD) => {
    router.push(`/customers?customer=${pod.customerNumber}`);
  };

  return (
    <PageTemplate
      title="Proof of Delivery"
      description="Digital POD management with signatures, photo capture, customer confirmation, and delivery reports"
      icon="ri-file-check-line"
      systemInfo={{
        sap: "POD Management, Delivery Confirmation",
        oracle: "Proof of Delivery, POD",
        manhattan: "POD Management, Digital Signatures",
      }}
      examples={[
        "Digital signatures",
        "Photo capture",
        "Customer confirmation",
        "Damage reporting",
        "Delivery notes",
        "POD reports",
        "Customer portal integration",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <Tooltip content="Export POD Report" position="bottom">
            <button className="bg-white/5 border border-white/10 hover:border-cyan-500/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <i className="ri-download-line"></i>
              Export
            </button>
          </Tooltip>
        </div>
      }
    >
      {/* Analytics */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            POD Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Customer Confirmation Status
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={[
                { name: "Confirmed", value: confirmationStats.confirmed },
                { name: "Pending", value: confirmationStats.pending },
                { name: "Rejected", value: confirmationStats.rejected },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="value" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by POD Number, Tracking, SO Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* POD Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  POD Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Sales Order
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Delivery Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Received By
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Confirmation
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredPODs.map((pod, index) => (
                <motion.tr
                  key={pod.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white font-mono">
                      {pod.podNumber}
                    </div>
                    <div className="text-xs text-[#9ca3af] font-mono">
                      {pod.trackingNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleNavigateToSO(pod)}
                      className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      {pod.soNumber}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{pod.customerName}</div>
                    <div className="text-xs text-[#9ca3af] font-mono">
                      {pod.customerNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {format(new Date(pod.deliveryDate), "MMM dd, yyyy")}
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      {pod.deliveryTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{pod.receivedBy}</div>
                    <div className="text-xs text-[#9ca3af]">
                      By: {pod.deliveredBy}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        pod.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : pod.status === "PENDING"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {pod.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        pod.customerConfirmation === "CONFIRMED"
                          ? "bg-green-500/20 text-green-400"
                          : pod.customerConfirmation === "PENDING"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {pod.customerConfirmation}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Tooltip content="View POD Details" position="top">
                        <button
                          onClick={() => handleView(pod)}
                          className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                      </Tooltip>
                      {pod.signature && (
                        <Tooltip content="View Signature" position="top">
                          <button
                            onClick={() => handleSignature(pod)}
                            className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                          >
                            <i className="ri-file-edit-line"></i>
                          </button>
                        </Tooltip>
                      )}
                      {pod.photo && (
                        <Tooltip content="View Photo" position="top">
                          <button
                            onClick={() => handleView(pod)}
                            className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                          >
                            <i className="ri-image-line"></i>
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View POD Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedPOD(null);
        }}
        title={`Proof of Delivery - ${selectedPOD?.podNumber || ""}`}
        size="lg"
      >
        {selectedPOD && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  POD Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedPOD.podNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Sales Order
                </label>
                <button
                  onClick={() => handleNavigateToSO(selectedPOD)}
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedPOD.soNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Customer
                </label>
                <div className="text-sm text-white">
                  {selectedPOD.customerName}
                </div>
                <div className="text-xs text-[#9ca3af] font-mono">
                  {selectedPOD.customerNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Delivery Date & Time
                </label>
                <div className="text-sm text-white">
                  {format(new Date(selectedPOD.deliveryDate), "MMM dd, yyyy")}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {selectedPOD.deliveryTime}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Delivery Address
                </label>
                <div className="text-sm text-white">
                  {selectedPOD.deliveryAddress}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Delivered By
                </label>
                <div className="text-sm text-white">
                  {selectedPOD.deliveredBy}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Received By
                </label>
                <div className="text-sm text-white">
                  {selectedPOD.receivedBy}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedPOD.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedPOD.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {selectedPOD.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Items Delivered
                </label>
                <div className="text-sm text-white">
                  {selectedPOD.itemsDelivered}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Items Received
                </label>
                <div
                  className={`text-sm font-medium ${
                    selectedPOD.itemsReceived < selectedPOD.itemsDelivered
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  {selectedPOD.itemsReceived}
                </div>
              </div>
            </div>
            {selectedPOD.deliveryNotes && (
              <div className="bg-white/5 rounded-lg p-4">
                <label className="text-xs text-[#9ca3af] mb-2 block">
                  Delivery Notes
                </label>
                <div className="text-sm text-white">
                  {selectedPOD.deliveryNotes}
                </div>
              </div>
            )}
            {selectedPOD.damageReport?.hasDamage && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-400 mb-2">
                  Damage Report
                </h4>
                <div className="text-sm text-white mb-1">
                  Type: {selectedPOD.damageReport.damageType}
                </div>
                <div className="text-sm text-white mb-2">
                  {selectedPOD.damageReport.damageDescription}
                </div>
                {selectedPOD.damageReport.photos && (
                  <div className="text-xs text-[#9ca3af]">
                    Photos: {selectedPOD.damageReport.photos.join(", ")}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              {selectedPOD.signature && (
                <div className="bg-white/5 rounded-lg p-4">
                  <label className="text-xs text-[#9ca3af] mb-2 block">
                    Digital Signature
                  </label>
                  <div className="text-sm text-white font-mono">
                    {selectedPOD.signature}
                  </div>
                  <button
                    onClick={() => handleSignature(selectedPOD)}
                    className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View Signature
                  </button>
                </div>
              )}
              {selectedPOD.photo && (
                <div className="bg-white/5 rounded-lg p-4">
                  <label className="text-xs text-[#9ca3af] mb-2 block">
                    Delivery Photo
                  </label>
                  <div className="text-sm text-white font-mono">
                    {selectedPOD.photo}
                  </div>
                  <div className="text-xs text-[#9ca3af] mt-2">
                    Photo captured at delivery
                  </div>
                </div>
              )}
            </div>

            {/* AI Vision Integration */}
            <div className="mt-4">
              <PODVisionIntegration
                onPODComplete={(pod) => {
                  logger.info("AI Vision POD verification", undefined, {
                    module: "pod",
                    service: "vision-verification",
                    verified: pod.verified,
                  });
                  // Auto-update POD with verification results
                  if (selectedPOD) {
                    setPods((prev) =>
                      prev.map((p) =>
                        p.id === selectedPOD.id
                          ? {
                              ...p,
                              status: pod.verified
                                ? ("COMPLETED" as const)
                                : ("PENDING" as const),
                              damageReport: pod.damageDetected
                                ? {
                                    hasDamage: true,
                                    damageType: "Detected by AI Vision",
                                    damageDescription:
                                      "Damage detected during delivery verification",
                                    photos: [],
                                  }
                                : p.damageReport,
                            }
                          : p,
                      ),
                    );
                  }
                }}
                formFields={[
                  {
                    id: "status",
                    name: "status",
                    type: "select",
                    label: "POD Status",
                  },
                  {
                    id: "deliveryNotes",
                    name: "deliveryNotes",
                    type: "textarea",
                    label: "Delivery Notes",
                  },
                ]}
                onFieldFill={(fieldId, value, confidence) => {
                  logger.debug("Auto-filled field", undefined, {
                    module: "pod",
                    service: "vision-verification",
                    fieldId,
                    confidence,
                  });
                }}
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleNavigateToSO(selectedPOD)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-shopping-cart-2-line"></i>
                  View Sales Order
                </button>
                <button
                  onClick={() => handleNavigateToTracking(selectedPOD)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-map-pin-line"></i>
                  View Tracking
                </button>
                <button
                  onClick={() => handleNavigateToCustomer(selectedPOD)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-user-line"></i>
                  View Customer
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Signature Modal */}
      <Modal
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          setSelectedPOD(null);
        }}
        title={`Digital Signature - ${selectedPOD?.podNumber || ""}`}
        size="md"
      >
        {selectedPOD && selectedPOD.signature && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-8 flex items-center justify-center border-2 border-dashed border-white/20">
              <div className="text-center">
                <i className="ri-file-edit-line text-6xl text-[#9ca3af] mb-4"></i>
                <div className="text-white font-medium mb-2">
                  Digital Signature
                </div>
                <div className="text-sm text-[#9ca3af]">
                  {selectedPOD.signature}
                </div>
                <div className="text-xs text-[#6b7280] mt-2">
                  Captured on{" "}
                  {format(
                    new Date(selectedPOD.deliveryDate),
                    "MMM dd, yyyy HH:mm",
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-white mb-1">
                Signed By:{" "}
                <span className="font-medium">{selectedPOD.receivedBy}</span>
              </div>
              <div className="text-sm text-white">
                Customer:{" "}
                <span className="font-medium">{selectedPOD.customerName}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
