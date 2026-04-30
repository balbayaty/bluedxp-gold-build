"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KPI } from "@/types/asn";
import { format } from "date-fns";
import FormulaBuilder from "./FormulaBuilder";

export default function KPIManager() {
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
  const [isInternal, setIsInternal] = useState(false);
  const [formData, setFormData] = useState({
    customerNumber: "",
    customerName: "",
    name: "",
    description: "",
    formula: "",
    target: 0,
    unit: "",
    category: "performance" as
      | "performance"
      | "efficiency"
      | "compliance"
      | "quality",
    responsibility: "WAREHOUSE" as "CUSTOMER" | "WAREHOUSE",
    isActive: true,
  });

  // Load KPIs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("asn-kpis");
    if (saved) {
      setKPIs(JSON.parse(saved));
    }
  }, []);

  // Group KPIs by type (internal vs customer) and by customer
  const kpisByType = useMemo(() => {
    const internal = kpis.filter((kpi) => kpi.id.startsWith("kpi-internal-"));
    const customer = kpis.filter((kpi) => !kpi.id.startsWith("kpi-internal-"));

    // Group customer KPIs by customer
    const customerKPIsByCustomer = customer.reduce(
      (acc, kpi) => {
        const customerKey = kpi.customerNumber || "UNASSIGNED";
        if (!acc[customerKey]) {
          acc[customerKey] = [];
        }
        acc[customerKey].push(kpi);
        return acc;
      },
      {} as Record<string, KPI[]>,
    );

    return { internal, customer, customerKPIsByCustomer, all: kpis };
  }, [kpis]);

  // Save KPIs to localStorage
  const saveKPIs = (newKPIs: KPI[]) => {
    setKPIs(newKPIs);
    localStorage.setItem("asn-kpis", JSON.stringify(newKPIs));
  };

  // Validate that internal KPI target is stricter than customer KPI target
  const validateInternalKPITarget = (
    target: number,
    unit: string,
    isInternal: boolean,
  ): string | null => {
    if (!isInternal) return null; // No validation needed for customer KPIs

    // Find corresponding customer KPI by name pattern
    const customerKPIs = kpisByType.customer.filter((kpi) => {
      // Try to match internal KPI name with customer KPI name
      const internalName = formData.name.toLowerCase();
      const customerName = kpi.name.toLowerCase();

      // Check if names are similar (e.g., "GRN Issuance (Internal)" vs "Inbound GRN Issuance")
      return (
        (internalName.includes("grn") && customerName.includes("grn")) ||
        (internalName.includes("relabeling") &&
          customerName.includes("relabeling")) ||
        (internalName.includes("picking") &&
          customerName.includes("picking")) ||
        (internalName.includes("packing") &&
          customerName.includes("packing")) ||
        (internalName.includes("dispatch") &&
          customerName.includes("dispatch")) ||
        (internalName.includes("return") && customerName.includes("return")) ||
        (internalName.includes("inventory") &&
          customerName.includes("inventory"))
      );
    });

    if (customerKPIs.length > 0) {
      const customerKPI = customerKPIs[0];

      // Convert to same unit for comparison
      let customerTarget = customerKPI.target;
      let internalTarget = target;

      // Normalize to hours for comparison
      if (unit === "minutes" && customerKPI.unit === "hours") {
        internalTarget = target / 60;
      } else if (unit === "hours" && customerKPI.unit === "minutes") {
        customerTarget = customerKPI.target / 60;
      } else if (unit === "minutes" && customerKPI.unit === "minutes") {
        // Both in minutes, compare directly
      } else if (unit === "hours" && customerKPI.unit === "hours") {
        // Both in hours, compare directly
      }

      // For time-based KPIs, internal must be lower (stricter)
      if (unit === "hours" || unit === "minutes" || unit === "days") {
        if (internalTarget >= customerTarget) {
          return `Internal KPI target (${target} ${unit}) must be STRICTER (lower) than customer KPI target (${customerKPI.target} ${customerKPI.unit}). This ensures we meet customer SLAs.`;
        }
      }

      // For percentage KPIs, internal must be higher (stricter)
      if (unit === "%") {
        if (internalTarget <= customerTarget) {
          return `Internal KPI target (${target}%) must be STRICTER (higher) than customer KPI target (${customerKPI.target}%). This ensures we meet customer SLAs.`;
        }
      }
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate internal KPI target
    if (isInternal) {
      const validationError = validateInternalKPITarget(
        formData.target,
        formData.unit,
        isInternal,
      );
      if (validationError) {
        alert(validationError);
        return;
      }
    }

    const kpi: KPI = {
      id:
        editingKPI?.id ||
        (isInternal ? `kpi-internal-${Date.now()}` : `kpi-${Date.now()}`),
      name: formData.name,
      description: formData.description,
      formula: formData.formula,
      target: formData.target,
      unit: formData.unit,
      category: formData.category,
      customerNumber: isInternal
        ? undefined
        : formData.customerNumber || undefined,
      customerName: isInternal ? undefined : formData.customerName || undefined,
      responsibility: isInternal
        ? "WAREHOUSE"
        : formData.responsibility || "WAREHOUSE",
      isActive: formData.isActive,
      createdAt: editingKPI?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingKPI) {
      saveKPIs(kpis.map((k) => (k.id === kpi.id ? kpi : k)));
    } else {
      saveKPIs([...kpis, kpi]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customerNumber: "",
      customerName: "",
      name: "",
      description: "",
      formula: "",
      target: 0,
      unit: "",
      category: "performance",
      responsibility: "WAREHOUSE",
      isActive: true,
    });
    setEditingKPI(null);
    setIsInternal(false);
    setIsModalOpen(false);
  };

  const handleEdit = (kpi: KPI) => {
    setEditingKPI(kpi);
    setIsInternal(kpi.id.startsWith("kpi-internal-"));
    setFormData({
      customerNumber: kpi.customerNumber || "",
      customerName: kpi.customerName || "",
      name: kpi.name,
      description: kpi.description,
      formula: kpi.formula,
      target: kpi.target,
      unit: kpi.unit,
      category: kpi.category,
      responsibility: kpi.responsibility || "WAREHOUSE",
      isActive: kpi.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this KPI?")) {
      saveKPIs(kpis.filter((k) => k.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    saveKPIs(
      kpis.map((k) =>
        k.id === id
          ? { ...k, isActive: !k.isActive, updatedAt: new Date().toISOString() }
          : k,
      ),
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "performance":
        return "from-cyan-500 to-blue-600";
      case "efficiency":
        return "from-green-500 to-emerald-600";
      case "compliance":
        return "from-yellow-500 to-orange-600";
      case "quality":
        return "from-purple-500 to-pink-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "performance":
        return "ri-speed-line";
      case "efficiency":
        return "ri-flashlight-line";
      case "compliance":
        return "ri-shield-check-line";
      case "quality":
        return "ri-star-line";
      default:
        return "ri-bar-chart-line";
    }
  };

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-1">
            KPI Configuration
          </h2>
          <p className="text-gray-400 text-sm">
            Define key performance indicators for tracking metrics
          </p>
        </div>
        <motion.button
          onClick={() => setIsModalOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2"
        >
          <i className="ri-add-line text-xl"></i>
          Add New KPI
        </motion.button>
      </div>

      {/* KPI List */}
      {kpis.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1E293B] border border-[#334155] rounded-lg p-12 text-center"
        >
          <i className="ri-bar-chart-line text-6xl text-gray-600 mb-4"></i>
          <h3 className="text-xl font-semibold text-white mb-2">
            No KPIs Configured
          </h3>
          <p className="text-gray-400 mb-6">
            Create internal or customer KPIs to track performance and compliance
            metrics
          </p>
          <div className="flex items-center justify-center gap-4">
            <motion.button
              onClick={() => {
                setIsInternal(true);
                setIsModalOpen(true);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-xl font-medium"
            >
              <i className="ri-building-line mr-2"></i>
              Create Internal KPI
            </motion.button>
            <motion.button
              onClick={() => {
                setIsInternal(false);
                setIsModalOpen(true);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium"
            >
              <i className="ri-add-line mr-2"></i>
              Create Customer KPI
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Internal Warehouse KPIs */}
          {kpisByType.internal.length > 0 && (
            <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    <i className="ri-building-line text-yellow-400"></i>
                    Internal Warehouse KPIs (3PL Provider)
                  </h3>
                  <p className="text-sm text-gray-400">
                    Operational KPIs for warehouse staff - Must be stricter than
                    customer KPIs
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium">
                  {kpisByType.internal.length} Internal KPI
                  {kpisByType.internal.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpisByType.internal.map((kpi, index) => (
                  <motion.div
                    key={kpi.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="bg-[#0F172A] border border-[#334155] rounded-lg p-6 hover:border-yellow-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getCategoryColor(
                              kpi.category,
                            )} flex items-center justify-center`}
                          >
                            <i
                              className={`${getCategoryIcon(kpi.category)} text-white text-lg`}
                            ></i>
                          </div>
                          <h3 className="text-lg font-semibold text-white">
                            {kpi.name}
                          </h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">
                          {kpi.description}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium">
                            Internal
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              kpi.isActive
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                            }`}
                          >
                            {kpi.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => toggleActive(kpi.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          kpi.isActive ? "bg-green-500" : "bg-gray-600"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            kpi.isActive ? "translate-x-6" : "translate-x-0.5"
                          }`}
                        ></div>
                      </motion.button>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Target:</span>
                        <span className="text-white font-medium">
                          {kpi.target} {kpi.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Category:</span>
                        <span className="text-white font-medium capitalize">
                          {kpi.category}
                        </span>
                      </div>
                      <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3">
                        <span className="text-gray-400 text-xs block mb-1">
                          Formula:
                        </span>
                        <code className="text-cyan-400 text-sm font-mono">
                          {kpi.formula}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-gray-400 text-xs">
                        Updated:{" "}
                        {format(new Date(kpi.updatedAt), "MMM dd, yyyy")}
                      </span>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => handleEdit(kpi)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-cyan-400 hover:text-cyan-300"
                          title="Edit"
                        >
                          <i className="ri-edit-line text-lg"></i>
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(kpi.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line text-lg"></i>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Customer KPIs - Grouped by Customer */}
          {Object.entries(kpisByType.customerKPIsByCustomer).map(
            ([customerNumber, customerKPIs]) => (
              <div key={customerNumber} className="mb-8">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                      <i className="ri-user-line text-blue-400"></i>
                      {customerKPIs[0]?.customerName ||
                        customerNumber ||
                        "Unassigned Customer"}{" "}
                      KPIs
                    </h3>
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium">
                      {customerKPIs.length} KPI
                      {customerKPIs.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {customerNumber === "UNASSIGNED"
                      ? "KPIs not assigned to a customer - Internal KPIs must be stricter than these"
                      : "Customer-facing KPIs - Internal KPIs must be stricter than these"}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customerKPIs.map((kpi, index) => (
                    <motion.div
                      key={kpi.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -8 }}
                      className="bg-[#1E293B] border border-[#334155] rounded-lg p-6 hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getCategoryColor(
                                kpi.category,
                              )} flex items-center justify-center`}
                            >
                              <i
                                className={`${getCategoryIcon(kpi.category)} text-white text-lg`}
                              ></i>
                            </div>
                            <h3 className="text-lg font-semibold text-white">
                              {kpi.name}
                            </h3>
                            {kpi.responsibility && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  kpi.responsibility === "WAREHOUSE"
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                }`}
                              >
                                {kpi.responsibility === "WAREHOUSE"
                                  ? "Our Responsibility"
                                  : "Customer Responsibility"}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-3">
                            {kpi.description}
                          </p>
                        </div>
                        <motion.button
                          onClick={() => toggleActive(kpi.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            kpi.isActive ? "bg-green-500" : "bg-gray-600"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              kpi.isActive ? "translate-x-6" : "translate-x-0.5"
                            }`}
                          ></div>
                        </motion.button>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Target:</span>
                          <span className="text-white font-medium">
                            {kpi.target} {kpi.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">
                            Category:
                          </span>
                          <span className="text-white font-medium capitalize">
                            {kpi.category}
                          </span>
                        </div>
                        <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3">
                          <span className="text-gray-400 text-xs block mb-1">
                            Formula:
                          </span>
                          <code className="text-cyan-400 text-sm font-mono">
                            {kpi.formula}
                          </code>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-gray-400 text-xs">
                          Updated:{" "}
                          {format(new Date(kpi.updatedAt), "MMM dd, yyyy")}
                        </span>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => handleEdit(kpi)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-cyan-400 hover:text-cyan-300"
                            title="Edit"
                          >
                            <i className="ri-edit-line text-lg"></i>
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(kpi.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1E293B] border border-[#334155] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingKPI ? "Edit KPI" : "Create New KPI"}
                  {isInternal && (
                    <span className="ml-2 px-2 py-1 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 rounded text-xs font-medium">
                      Internal
                    </span>
                  )}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Internal/Customer Toggle */}
                {!editingKPI && (
                  <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="w-4 h-4 bg-[#0F172A] border-[#334155] rounded text-yellow-600 focus:ring-yellow-500 focus:ring-2"
                      />
                      <div>
                        <span className="text-sm font-medium text-white">
                          Internal Warehouse KPI
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          Internal KPIs must be stricter (lower for time, higher
                          for percentage) than customer KPIs to ensure customer
                          SLAs are met
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Customer Information (only for customer KPIs) */}
                {!isInternal && !editingKPI && (
                  <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-white mb-3">
                      Customer Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Customer Number
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
                          className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          placeholder="CUST-00000001"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Customer Name
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
                          className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          placeholder="Customer Name"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="e.g., Average Processing Time"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                    rows={3}
                    placeholder="Describe what this KPI measures..."
                  />
                </div>

                <div>
                  <FormulaBuilder
                    value={formData.formula}
                    onChange={(formula) =>
                      setFormData({ ...formData, formula })
                    }
                    onValidate={(isValid, error) => {
                      // Validation feedback is handled by FormulaBuilder
                    }}
                    placeholder="e.g., AVG(offloadingDuration) or SUM(employeeOvertimeHours)"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Target
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.target}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target: parseFloat(e.target.value),
                        })
                      }
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Unit
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="e.g., seconds, minutes, %"
                    />
                  </div>
                </div>

                {/* Responsibility (only for customer KPIs) */}
                {!isInternal && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
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
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      required
                    >
                      <option value="WAREHOUSE">
                        Warehouse (3PL Provider) - Our Responsibility
                      </option>
                      <option value="CUSTOMER">
                        Customer - Customer's Responsibility
                      </option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.responsibility === "CUSTOMER"
                        ? "Customer is responsible for meeting this KPI (e.g., sending ASN on time)"
                        : "Warehouse is responsible for meeting this KPI (e.g., offloading, putaway, GRN issuance)"}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as
                          | "performance"
                          | "efficiency"
                          | "compliance"
                          | "quality",
                      })
                    }
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="performance">Performance</option>
                    <option value="efficiency">Efficiency</option>
                    <option value="compliance">Compliance</option>
                    <option value="quality">Quality</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-5 h-5 rounded bg-[#0F172A] border border-[#334155] text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-gray-300 text-sm">
                    Active
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                  >
                    {editingKPI ? "Update KPI" : "Create KPI"}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={resetForm}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 rounded-lg font-medium bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-white transition-all"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
