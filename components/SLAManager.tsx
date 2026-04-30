"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomerSLA, SLACondition } from "@/types/asn";
import { format } from "date-fns";
import FormulaBuilder from "./FormulaBuilder";
import { exportSLAKPIPDF } from "@/utils/pdfExporter";

export default function SLAManager() {
  const [slas, setSLAs] = useState<CustomerSLA[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSLA, setEditingSLA] = useState<CustomerSLA | null>(null);
  const [formData, setFormData] = useState({
    customerNumber: "",
    customerName: "",
    name: "",
    description: "",
    targetDuration: 0,
    warningThreshold: 80,
    criticalThreshold: 100,
    metric: "delivery_time" as
      | "duration1"
      | "duration2"
      | "total"
      | "delivery_time"
      | "processing_time"
      | "custom",
    customFormula: "",
    responsibility: "WAREHOUSE" as "CUSTOMER" | "WAREHOUSE",
    isActive: true,
    conditions: [] as SLACondition[],
  });

  // Load SLAs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("customer-slas");
    if (saved) {
      setSLAs(JSON.parse(saved));
    }
  }, []);

  // Save SLAs to localStorage
  const saveSLAs = (newSLAs: CustomerSLA[]) => {
    setSLAs(newSLAs);
    localStorage.setItem("customer-slas", JSON.stringify(newSLAs));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sla: CustomerSLA = {
      id: editingSLA?.id || `sla-${Date.now()}`,
      customerNumber: formData.customerNumber,
      customerName: formData.customerName,
      name: formData.name,
      description: formData.description,
      targetDuration: formData.targetDuration * 60, // Convert minutes to seconds
      warningThreshold: formData.warningThreshold,
      criticalThreshold: formData.criticalThreshold,
      metric: formData.metric,
      customFormula: formData.customFormula || undefined,
      conditions: formData.conditions,
      responsibility: formData.responsibility,
      isActive: formData.isActive,
      createdAt: editingSLA?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "SYSTEM",
      updatedBy: "SYSTEM",
    };

    if (editingSLA) {
      saveSLAs(slas.map((s) => (s.id === sla.id ? sla : s)));
    } else {
      saveSLAs([...slas, sla]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customerNumber: "",
      customerName: "",
      name: "",
      description: "",
      targetDuration: 0,
      warningThreshold: 80,
      criticalThreshold: 100,
      metric: "delivery_time",
      customFormula: "",
      responsibility: "WAREHOUSE",
      isActive: true,
      conditions: [],
    });
    setEditingSLA(null);
    setIsModalOpen(false);
  };

  const handleEdit = (sla: CustomerSLA) => {
    setEditingSLA(sla);
    setFormData({
      customerNumber: sla.customerNumber,
      customerName: sla.customerName,
      name: sla.name,
      description: sla.description,
      targetDuration: sla.targetDuration / 60, // Convert seconds to minutes
      warningThreshold: sla.warningThreshold,
      criticalThreshold: sla.criticalThreshold,
      metric: sla.metric,
      customFormula: sla.customFormula || "",
      responsibility: sla.responsibility || "WAREHOUSE",
      isActive: sla.isActive,
      conditions: sla.conditions || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this SLA?")) {
      saveSLAs(slas.filter((s) => s.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    saveSLAs(
      slas.map((s) =>
        s.id === id
          ? {
              ...s,
              isActive: !s.isActive,
              updatedAt: new Date().toISOString(),
              updatedBy: "SYSTEM",
            }
          : s,
      ),
    );
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        {
          id: `condition-${Date.now()}`,
          field: "",
          operator: "equals",
          value: "",
        },
      ],
    });
  };

  const removeCondition = (conditionId: string) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((c) => c.id !== conditionId),
    });
  };

  const updateCondition = (
    conditionId: string,
    updates: Partial<SLACondition>,
  ) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.map((c) =>
        c.id === conditionId ? { ...c, ...updates } : c,
      ),
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Group SLAs by customer (separate internal from customer SLAs)
  const slasByCustomer = useMemo(() => {
    const grouped = slas.reduce(
      (acc, sla) => {
        const key = sla.customerNumber;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(sla);
        return acc;
      },
      {} as Record<string, CustomerSLA[]>,
    );

    // Separate internal SLAs
    const internalSLAs = grouped["INTERNAL-3PL"] || [];
    const customerSLAs = Object.entries(grouped)
      .filter(([key]) => key !== "INTERNAL-3PL")
      .reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<string, CustomerSLA[]>,
      );

    return {
      internal: internalSLAs,
      customers: customerSLAs,
      all: grouped,
    };
  }, [slas]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Customer SLA Management
            </h2>
            <p className="text-[#9ca3af] text-sm">
              Configure flexible and dynamic SLAs for each customer
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-add-line text-base"></i>
            Create Customer SLA
          </button>
        </div>
      </div>

      {/* SLAs List */}
      {slas.length === 0 ? (
        <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-12 text-center">
          <i className="ri-file-list-3-line text-6xl text-[#6b7280] mb-4"></i>
          <h3 className="text-xl font-semibold text-white mb-2">
            No SLAs Configured
          </h3>
          <p className="text-[#9ca3af] text-sm mb-6">
            Create internal or customer-specific SLAs to track compliance
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <i className="ri-add-line text-lg"></i>
            Create Your First SLA
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Internal Warehouse SLAs */}
          {slasByCustomer.internal.length > 0 && (
            <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    <i className="ri-building-line text-blue-400"></i>
                    Internal Warehouse Operations (3PL Provider)
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    Operational SLAs for warehouse staff - Stricter than
                    customer SLAs
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium">
                  {slasByCustomer.internal.length} Internal SLA
                  {slasByCustomer.internal.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {slasByCustomer.internal.map((sla) => (
                  <div
                    key={sla.id}
                    className="bg-[#111827] border border-[#374151] rounded-lg p-4 hover:border-blue-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base font-semibold text-white">
                            {sla.name}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sla.isActive
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                            }`}
                          >
                            {sla.isActive ? "Active" : "Inactive"}
                          </span>
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium">
                            Internal
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (sla.responsibility || "WAREHOUSE") ===
                              "WAREHOUSE"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            }`}
                          >
                            {(sla.responsibility || "WAREHOUSE") === "WAREHOUSE"
                              ? "Our Responsibility"
                              : "Customer Responsibility"}
                          </span>
                        </div>
                        <p className="text-[#9ca3af] text-sm mb-3">
                          {sla.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="text-[#9ca3af] text-xs">
                              Target Duration:
                            </span>
                            <p className="text-white text-sm font-medium">
                              {formatDuration(sla.targetDuration)}
                            </p>
                          </div>
                          <div>
                            <span className="text-[#9ca3af] text-xs">
                              Metric:
                            </span>
                            <p className="text-white text-sm font-medium">
                              {sla.metric}
                            </p>
                          </div>
                          <div>
                            <span className="text-[#9ca3af] text-xs">
                              Warning:
                            </span>
                            <p className="text-white text-sm font-medium">
                              {sla.warningThreshold}%
                            </p>
                          </div>
                          <div>
                            <span className="text-[#9ca3af] text-xs">
                              Critical:
                            </span>
                            <p className="text-white text-sm font-medium">
                              {sla.criticalThreshold}%
                            </p>
                          </div>
                        </div>
                        {sla.metric === "custom" && sla.customFormula && (
                          <div className="mt-3 pt-3 border-t border-[#374151]">
                            <p className="text-xs text-[#9ca3af] mb-2">
                              Custom Formula:
                            </p>
                            <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-3">
                              <code className="text-cyan-400 text-sm font-mono">
                                {sla.customFormula}
                              </code>
                            </div>
                          </div>
                        )}
                        {sla.conditions && sla.conditions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#374151]">
                            <p className="text-xs text-[#9ca3af] mb-2">
                              Conditions:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {sla.conditions.map((condition) => (
                                <span
                                  key={condition.id}
                                  className="px-2 py-1 bg-[#374151] text-[#9ca3af] text-xs rounded border border-[#475569]"
                                >
                                  {condition.field} {condition.operator}{" "}
                                  {condition.value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-[#374151] text-xs text-[#6b7280]">
                          Updated:{" "}
                          {format(
                            new Date(sla.updatedAt),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleActive(sla.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            sla.isActive
                              ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-600/30"
                              : "bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30"
                          }`}
                          title={sla.isActive ? "Deactivate" : "Activate"}
                        >
                          <i
                            className={
                              sla.isActive ? "ri-pause-line" : "ri-play-line"
                            }
                          ></i>
                        </button>
                        <button
                          onClick={() => handleEdit(sla)}
                          className="text-[#9ca3af] hover:text-blue-400 transition-colors p-2 hover:bg-[#374151] rounded-lg"
                          title="Edit"
                        >
                          <i className="ri-edit-line text-base"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(sla.id)}
                          className="text-[#9ca3af] hover:text-red-400 transition-colors p-2 hover:bg-[#374151] rounded-lg"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line text-base"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer SLAs */}
          {Object.entries(slasByCustomer.customers).map(
            ([customerNumber, customerSLAs]) => {
              // Get customer KPIs for this specific customer
              const savedKPIs = localStorage.getItem("asn-kpis");
              const allKPIs = savedKPIs ? JSON.parse(savedKPIs) : [];
              const customerKPIs = allKPIs.filter(
                (kpi: any) =>
                  !kpi.id.startsWith("kpi-internal-") &&
                  (kpi.customerNumber === customerNumber ||
                    (!kpi.customerNumber &&
                      customerNumber === "CUST-SIKA-001")),
              );

              return (
                <div
                  key={customerNumber}
                  className="bg-[#1f2937] border border-[#374151] rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {customerSLAs[0].customerName}
                      </h3>
                      <p className="text-sm text-[#9ca3af]">
                        Customer Number: {customerNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          exportSLAKPIPDF(
                            customerNumber,
                            customerSLAs[0].customerName,
                            customerSLAs,
                            customerKPIs,
                          )
                        }
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
                        title="Export SLA & KPI Document as PDF"
                      >
                        <i className="ri-file-pdf-line text-base"></i>
                        Export PDF
                      </button>
                      <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium">
                        {customerSLAs.length} SLA
                        {customerSLAs.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {customerSLAs.map((sla) => (
                      <div
                        key={sla.id}
                        className="bg-[#111827] border border-[#374151] rounded-lg p-4 hover:border-blue-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-base font-semibold text-white">
                                {sla.name}
                              </h4>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  sla.isActive
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                }`}
                              >
                                {sla.isActive ? "Active" : "Inactive"}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  (sla.responsibility || "WAREHOUSE") ===
                                  "WAREHOUSE"
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                }`}
                              >
                                {(sla.responsibility || "WAREHOUSE") ===
                                "WAREHOUSE"
                                  ? "Our Responsibility"
                                  : "Customer Responsibility"}
                              </span>
                            </div>
                            <p className="text-[#9ca3af] text-sm mb-3">
                              {sla.description}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <span className="text-[#9ca3af] text-xs">
                                  Target Duration:
                                </span>
                                <p className="text-white text-sm font-medium">
                                  {formatDuration(sla.targetDuration)}
                                </p>
                              </div>
                              <div>
                                <span className="text-[#9ca3af] text-xs">
                                  Metric:
                                </span>
                                <p className="text-white text-sm font-medium">
                                  {sla.metric}
                                </p>
                              </div>
                              <div>
                                <span className="text-[#9ca3af] text-xs">
                                  Warning:
                                </span>
                                <p className="text-white text-sm font-medium">
                                  {sla.warningThreshold}%
                                </p>
                              </div>
                              <div>
                                <span className="text-[#9ca3af] text-xs">
                                  Critical:
                                </span>
                                <p className="text-white text-sm font-medium">
                                  {sla.criticalThreshold}%
                                </p>
                              </div>
                            </div>
                            {sla.metric === "custom" && sla.customFormula && (
                              <div className="mt-3 pt-3 border-t border-[#374151]">
                                <p className="text-xs text-[#9ca3af] mb-2">
                                  Custom Formula:
                                </p>
                                <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-3">
                                  <code className="text-cyan-400 text-sm font-mono">
                                    {sla.customFormula}
                                  </code>
                                </div>
                              </div>
                            )}
                            {sla.conditions && sla.conditions.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-[#374151]">
                                <p className="text-xs text-[#9ca3af] mb-2">
                                  Conditions:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {sla.conditions.map((condition) => (
                                    <span
                                      key={condition.id}
                                      className="px-2 py-1 bg-[#374151] text-[#9ca3af] text-xs rounded border border-[#475569]"
                                    >
                                      {condition.field} {condition.operator}{" "}
                                      {condition.value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="mt-3 pt-3 border-t border-[#374151] text-xs text-[#6b7280]">
                              Updated:{" "}
                              {format(
                                new Date(sla.updatedAt),
                                "MMM dd, yyyy HH:mm",
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => toggleActive(sla.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                sla.isActive
                                  ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-600/30"
                                  : "bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30"
                              }`}
                              title={sla.isActive ? "Deactivate" : "Activate"}
                            >
                              <i
                                className={
                                  sla.isActive
                                    ? "ri-pause-line"
                                    : "ri-play-line"
                                }
                              ></i>
                            </button>
                            <button
                              onClick={() => handleEdit(sla)}
                              className="text-[#9ca3af] hover:text-blue-400 transition-colors p-2 hover:bg-[#374151] rounded-lg"
                              title="Edit"
                            >
                              <i className="ri-edit-line text-base"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(sla.id)}
                              className="text-[#9ca3af] hover:text-red-400 transition-colors p-2 hover:bg-[#374151] rounded-lg"
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line text-base"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={resetForm}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1f2937] border border-[#374151] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-[#1f2937] border-b border-[#374151] p-6 flex items-center justify-between z-10">
                <h3 className="text-xl font-bold text-white">
                  {editingSLA ? "Edit Customer SLA" : "Create Customer SLA"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-[#9ca3af] hover:text-white transition-colors p-2 hover:bg-[#374151] rounded-lg"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                        Customer Number *
                      </label>
                      <input
                        type="text"
                        value={formData.customerNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerNumber: e.target.value,
                          })
                        }
                        className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="CUST-00000001"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerName: e.target.value,
                          })
                        }
                        className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Customer Name"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* SLA Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white mb-3">
                    SLA Information
                  </h4>
                  <div>
                    <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                      SLA Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Delivery Time SLA"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="SLA description..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                        Target Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        value={formData.targetDuration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetDuration: Number(e.target.value),
                          })
                        }
                        className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="60"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                        Metric *
                      </label>
                      <select
                        value={formData.metric}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metric: e.target.value as any,
                          })
                        }
                        className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                      >
                        <option value="delivery_time">Delivery Time</option>
                        <option value="processing_time">Processing Time</option>
                        <option value="duration1">Duration 1</option>
                        <option value="duration2">Duration 2</option>
                        <option value="total">Total Duration</option>
                        <option value="custom">Custom Formula</option>
                      </select>
                    </div>
                  </div>
                  {formData.metric === "custom" && (
                    <div>
                      <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                        Custom Formula
                      </label>
                      <FormulaBuilder
                        value={formData.customFormula}
                        onChange={(formula) =>
                          setFormData({ ...formData, customFormula: formula })
                        }
                        onValidate={(isValid, error) => {
                          // Validation feedback is handled by FormulaBuilder
                        }}
                        placeholder="e.g., duration1 + duration2 or AVG(offloadingDuration)"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                        Warning Threshold (%)
                      </label>
                      <input
                        type="number"
                        value={formData.warningThreshold}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            warningThreshold: Number(e.target.value),
                          })
                        }
                        className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="80"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                        Critical Threshold (%)
                      </label>
                      <input
                        type="number"
                        value={formData.criticalThreshold}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            criticalThreshold: Number(e.target.value),
                          })
                        }
                        className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="100"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                      Responsibility *
                    </label>
                    <select
                      value={formData.responsibility}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          responsibility: e.target.value as
                            | "CUSTOMER"
                            | "WAREHOUSE",
                        })
                      }
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="WAREHOUSE">
                        Warehouse (3PL Provider) - Our Responsibility
                      </option>
                      <option value="CUSTOMER">
                        Customer - Customer's Responsibility
                      </option>
                    </select>
                    <p className="text-xs text-[#6b7280] mt-1">
                      {formData.responsibility === "CUSTOMER"
                        ? "Customer is responsible for meeting this SLA (e.g., sending ASN on time)"
                        : "Warehouse is responsible for meeting this SLA (e.g., offloading, putaway, GRN issuance)"}
                    </p>
                  </div>
                </div>

                {/* Conditions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">
                      Conditions (Optional)
                    </h4>
                    <button
                      type="button"
                      onClick={addCondition}
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2"
                    >
                      <i className="ri-add-line"></i>
                      Add Condition
                    </button>
                  </div>
                  {formData.conditions.map((condition) => (
                    <div
                      key={condition.id}
                      className="flex items-center gap-2 p-3 bg-[#111827] border border-[#374151] rounded-lg"
                    >
                      <input
                        type="text"
                        value={condition.field}
                        onChange={(e) =>
                          updateCondition(condition.id, {
                            field: e.target.value,
                          })
                        }
                        className="flex-1 bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm"
                        placeholder="Field (e.g., vendor, plant)"
                      />
                      <select
                        value={condition.operator}
                        onChange={(e) =>
                          updateCondition(condition.id, {
                            operator: e.target.value as any,
                          })
                        }
                        className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm"
                      >
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not Equals</option>
                        <option value="contains">Contains</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) =>
                          updateCondition(condition.id, {
                            value: e.target.value,
                          })
                        }
                        className="flex-1 bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm"
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        onClick={() => removeCondition(condition.id)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 bg-[#111827] border-[#374151] rounded text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="isActive" className="text-[#9ca3af] text-sm">
                    Active (SLA will be used for compliance tracking)
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#374151]">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white hover:bg-[#374151] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {editingSLA ? "Update SLA" : "Create SLA"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
