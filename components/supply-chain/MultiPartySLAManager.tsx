"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SupplyChainSLA,
  SupplyChainPartyType,
  SupplyChainServiceCategory,
} from "@/types/supplyChainSLA";
import {
  detectApplicableSLAs,
  calculateSLACompliance,
  predictBreachRisk,
} from "@/data/multiPartySLAFramework";
import { format } from "date-fns";
import Select from "@/components/Select";
import Tooltip from "@/components/Tooltip";

export default function MultiPartySLAManager() {
  const [slas, setSLAs] = useState<SupplyChainSLA[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSLA, setEditingSLA] = useState<SupplyChainSLA | null>(null);
  const [selectedPartyType, setSelectedPartyType] =
    useState<SupplyChainPartyType>("CUSTOMER");
  const [selectedServiceCategory, setSelectedServiceCategory] =
    useState<SupplyChainServiceCategory>("OUTBOUND_FULFILLMENT");
  const [viewMode, setViewMode] = useState<
    "all" | "by-party" | "by-service" | "templates"
  >("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    partyType: "CUSTOMER" as SupplyChainPartyType,
    partyId: "",
    partyName: "",
    partyRole: "PROVIDER" as "PROVIDER" | "RECIPIENT" | "BOTH",
    serviceCategory: "OUTBOUND_FULFILLMENT" as SupplyChainServiceCategory,
    serviceType: "",
    targetDuration: 0,
    warningThreshold: 80,
    criticalThreshold: 100,
    metric: "duration" as "duration" | "percentage" | "count" | "custom",
    customFormula: "",
    responsibleParty: "WAREHOUSE" as SupplyChainPartyType,
    responsiblePartyId: "",
    isActive: true,
    isTemplate: false,
  });

  // Load SLAs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("supply-chain-slas");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        setSLAs(parsed);
      }
    }
  }, []);

  // Save SLAs to localStorage
  const saveSLAs = (newSLAs: SupplyChainSLA[]) => {
    setSLAs(newSLAs);
    localStorage.setItem("supply-chain-slas", JSON.stringify(newSLAs));
  };

  const partyTypeOptions = [
    { value: "CUSTOMER", label: "Customer" },
    { value: "WAREHOUSE", label: "Warehouse" },
    { value: "3PL_PROVIDER", label: "3PL Provider" },
    { value: "4PL_PROVIDER", label: "4PL Provider" },
    { value: "CARRIER", label: "Carrier" },
    { value: "VENDOR", label: "Vendor/Supplier" },
    { value: "END_RECIPIENT", label: "End Recipient" },
    { value: "CUSTOMS_BROKER", label: "Customs Broker" },
    { value: "FREIGHT_FORWARDER", label: "Freight Forwarder" },
    { value: "BROKER", label: "Broker" },
    { value: "CONSOLIDATOR", label: "Consolidator" },
    { value: "DISTRIBUTION_CENTER", label: "Distribution Center" },
    { value: "CROSS_DOCK", label: "Cross-Dock" },
    { value: "VALUE_ADDED_SERVICE", label: "VAS Provider" },
    { value: "QUALITY_LAB", label: "Quality Lab" },
    { value: "CERTIFICATION_BODY", label: "Certification Body" },
    { value: "INSURANCE_PROVIDER", label: "Insurance Provider" },
    { value: "BANK", label: "Bank" },
    { value: "CUSTOM", label: "Custom" },
  ];

  const serviceCategoryOptions = [
    { value: "DIGITAL_FULFILLMENT", label: "Digital Fulfillment" },
    { value: "INBOUND_LOGISTICS", label: "Inbound Logistics" },
    { value: "WAREHOUSE_OPERATIONS", label: "Warehouse Operations" },
    { value: "OUTBOUND_FULFILLMENT", label: "Outbound Fulfillment" },
    { value: "REVERSE_LOGISTICS", label: "Reverse Logistics" },
    { value: "VALUE_ADDED_SERVICES", label: "Value-Added Services" },
    { value: "CUSTOMS_CLEARANCE", label: "Customs Clearance" },
    { value: "TRANSPORTATION", label: "Transportation" },
    { value: "FREIGHT_FORWARDING", label: "Freight Forwarding" },
    { value: "DATA_ANALYTICS", label: "Data Analytics" },
    { value: "SUSTAINABILITY", label: "Sustainability" },
    { value: "QUALITY_ASSURANCE", label: "Quality Assurance" },
    { value: "FINANCIAL_SERVICES", label: "Financial Services" },
    { value: "DOCUMENTATION", label: "Documentation" },
    { value: "TRACKING_VISIBILITY", label: "Tracking & Visibility" },
    { value: "CUSTOM", label: "Custom" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sla: SupplyChainSLA = {
      id: editingSLA?.id || `sla-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      partyType: formData.partyType,
      partyId: formData.partyId,
      partyName: formData.partyName,
      partyRole: formData.partyRole,
      serviceCategory: formData.serviceCategory,
      serviceType: formData.serviceType,
      targetDuration:
        formData.metric === "percentage"
          ? formData.targetDuration
          : formData.targetDuration * 60, // Convert hours to seconds for duration
      warningThreshold: formData.warningThreshold,
      criticalThreshold: formData.criticalThreshold,
      metric: formData.metric,
      customFormula: formData.customFormula || undefined,
      responsibleParty: formData.responsibleParty,
      responsiblePartyId: formData.responsiblePartyId,
      isActive: formData.isActive,
      isTemplate: formData.isTemplate,
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
      name: "",
      description: "",
      partyType: "CUSTOMER",
      partyId: "",
      partyName: "",
      partyRole: "PROVIDER",
      serviceCategory: "OUTBOUND_FULFILLMENT",
      serviceType: "",
      targetDuration: 0,
      warningThreshold: 80,
      criticalThreshold: 100,
      metric: "duration",
      customFormula: "",
      responsibleParty: "WAREHOUSE",
      responsiblePartyId: "",
      isActive: true,
      isTemplate: false,
    });
    setEditingSLA(null);
    setIsModalOpen(false);
  };

  const handleEdit = (sla: SupplyChainSLA) => {
    setEditingSLA(sla);
    setFormData({
      name: sla.name,
      description: sla.description,
      partyType: sla.partyType,
      partyId: sla.partyId,
      partyName: sla.partyName,
      partyRole: sla.partyRole,
      serviceCategory: sla.serviceCategory,
      serviceType: sla.serviceType,
      targetDuration:
        sla.metric === "percentage"
          ? sla.targetDuration
          : sla.targetDuration / 60, // Convert seconds to hours
      warningThreshold: sla.warningThreshold,
      criticalThreshold: sla.criticalThreshold,
      metric: sla.metric,
      customFormula: sla.customFormula || "",
      responsibleParty: sla.responsibleParty,
      responsiblePartyId: sla.responsiblePartyId,
      isActive: sla.isActive,
      isTemplate: sla.isTemplate,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this SLA?")) {
      saveSLAs(slas.filter((s) => s.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    saveSLAs(
      slas.map((s) =>
        s.id === id
          ? { ...s, isActive: !s.isActive, updatedAt: new Date().toISOString() }
          : s,
      ),
    );
  };

  // Filter SLAs based on view mode
  const filteredSLAs = useMemo(() => {
    if (viewMode === "by-party") {
      return slas.filter((s) => s.partyType === selectedPartyType);
    }
    if (viewMode === "by-service") {
      return slas.filter((s) => s.serviceCategory === selectedServiceCategory);
    }
    if (viewMode === "templates") {
      return slas.filter((s) => s.isTemplate);
    }
    return slas;
  }, [slas, viewMode, selectedPartyType, selectedServiceCategory]);

  // Group SLAs by party type
  const slasByParty = useMemo(() => {
    const grouped: Record<SupplyChainPartyType, SupplyChainSLA[]> = {} as any;
    slas.forEach((sla) => {
      if (!grouped[sla.partyType]) {
        grouped[sla.partyType] = [];
      }
      grouped[sla.partyType].push(sla);
    });
    return grouped;
  }, [slas]);

  // Group SLAs by service category
  const slasByService = useMemo(() => {
    const grouped: Record<SupplyChainServiceCategory, SupplyChainSLA[]> =
      {} as any;
    slas.forEach((sla) => {
      if (!grouped[sla.serviceCategory]) {
        grouped[sla.serviceCategory] = [];
      }
      grouped[sla.serviceCategory].push(sla);
    });
    return grouped;
  }, [slas]);

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
        {(["all", "by-party", "by-service", "templates"] as const).map(
          (mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 min-h-[36px] ${
                viewMode === mode
                  ? "bg-cyan-500 text-white"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
              aria-label={`View ${mode} mode`}
            >
              <i
                className={`ri-${mode === "all" ? "dashboard-line" : mode === "by-party" ? "user-3-line" : mode === "by-service" ? "folder-line" : "file-list-line"} text-sm sm:text-base`}
              ></i>
              <span className="hidden sm:inline">
                {mode === "all"
                  ? "All SLAs"
                  : mode === "by-party"
                    ? "By Party"
                    : mode === "by-service"
                      ? "By Service"
                      : "Templates"}
              </span>
            </button>
          ),
        )}
      </div>

      {/* Filters */}
      {viewMode === "by-party" && (
        <div className="flex items-center gap-4 flex-wrap">
          <Select
            label="Party Type"
            options={partyTypeOptions}
            value={selectedPartyType}
            onChange={(e) =>
              setSelectedPartyType(e.target.value as SupplyChainPartyType)
            }
            className="min-w-[200px]"
          />
        </div>
      )}

      {viewMode === "by-service" && (
        <div className="flex items-center gap-4 flex-wrap">
          <Select
            label="Service Category"
            options={serviceCategoryOptions}
            value={selectedServiceCategory}
            onChange={(e) =>
              setSelectedServiceCategory(
                e.target.value as SupplyChainServiceCategory,
              )
            }
            className="min-w-[200px]"
          />
        </div>
      )}

      {/* Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Multi-Party SLAs</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <i className="ri-add-line"></i>
          <span className="hidden sm:inline">Create New SLA</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* SLA List */}
      {filteredSLAs.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
          <i className="ri-file-list-line text-4xl text-[#9ca3af] mb-4"></i>
          <h3 className="text-xl font-semibold text-white mb-2">
            No SLAs Configured
          </h3>
          <p className="text-[#9ca3af] mb-6">
            Create multi-party SLAs to track performance across all supply chain
            stakeholders
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <i className="ri-add-line"></i>
            Create First SLA
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSLAs.map((sla) => (
            <motion.div
              key={sla.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white leading-tight truncate">
                      {sla.name}
                    </h3>
                    {sla.isTemplate && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400 leading-tight">
                        Template
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium leading-tight ${
                        sla.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {sla.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-[#9ca3af] leading-relaxed mb-3">
                    {sla.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-[#9ca3af] leading-normal">
                        Party Type:
                      </span>
                      <span className="text-white font-medium ml-2 leading-tight">
                        {(sla.partyType || "").replace(/_/g, " ")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#9ca3af] leading-normal">
                        Party:
                      </span>
                      <span className="text-white font-medium ml-2 leading-tight truncate">
                        {sla.partyName || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#9ca3af] leading-normal">
                        Service:
                      </span>
                      <span className="text-white font-medium ml-2 leading-tight truncate">
                        {(sla.serviceCategory || "").replace(/_/g, " ")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#9ca3af] leading-normal">
                        Responsible:
                      </span>
                      <span className="text-white font-medium ml-2 leading-tight truncate">
                        {(sla.responsibleParty || "").replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <Tooltip content="Edit SLA" position="left">
                    <button
                      onClick={() => handleEdit(sla)}
                      className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                      aria-label="Edit SLA"
                    >
                      <i className="ri-edit-line text-sm"></i>
                    </button>
                  </Tooltip>
                  <Tooltip
                    content={sla.isActive ? "Deactivate" : "Activate"}
                    position="left"
                  >
                    <button
                      onClick={() => handleToggleActive(sla.id)}
                      className={`p-2 border rounded transition-colors focus:outline-none focus:ring-1 ${
                        sla.isActive
                          ? "bg-yellow-600/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-600/30 focus:ring-yellow-500"
                          : "bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600/30 focus:ring-green-500"
                      }`}
                      aria-label={
                        sla.isActive ? "Deactivate SLA" : "Activate SLA"
                      }
                    >
                      <i
                        className={`ri-${sla.isActive ? "pause" : "play"}-line text-sm`}
                      ></i>
                    </button>
                  </Tooltip>
                  <Tooltip content="Delete SLA" position="left">
                    <button
                      onClick={() => handleDelete(sla.id)}
                      className="p-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded hover:bg-red-600/30 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500"
                      aria-label="Delete SLA"
                    >
                      <i className="ri-delete-bin-line text-sm"></i>
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* SLA Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
                <div>
                  <div className="text-xs text-[#9ca3af] mb-1 leading-normal">
                    Target
                  </div>
                  <div className="text-sm font-medium text-white leading-tight">
                    {sla.metric === "percentage"
                      ? `${sla.targetDuration.toFixed(1)}%`
                      : `${(sla.targetDuration / 3600).toFixed(1)}h`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#9ca3af] mb-1 leading-normal">
                    Warning
                  </div>
                  <div className="text-sm font-medium text-yellow-400 leading-tight">
                    {sla.warningThreshold}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#9ca3af] mb-1 leading-normal">
                    Critical
                  </div>
                  <div className="text-sm font-medium text-red-400 leading-tight">
                    {sla.criticalThreshold}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#9ca3af] mb-1 leading-normal">
                    Metric
                  </div>
                  <div className="text-sm font-medium text-white leading-tight capitalize">
                    {sla.metric}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1f2937] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white leading-tight">
                  {editingSLA ? "Edit SLA" : "Create New Multi-Party SLA"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#9ca3af] hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  aria-label="Close modal"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-6"
              >
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-information-line text-cyan-400 text-lg"></i>
                      <span>Basic Information</span>
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5 leading-normal">
                        SLA Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        placeholder="e.g., Order-to-Ship Cycle Time"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5 leading-normal">
                        Description *
                      </label>
                      <textarea
                        required
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
                        placeholder="Describe the SLA and its purpose..."
                      />
                    </div>
                  </div>

                  {/* Party Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-user-3-line text-cyan-400 text-lg"></i>
                      <span>Party Information</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Party Type *"
                        options={partyTypeOptions}
                        value={formData.partyType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partyType: e.target.value as SupplyChainPartyType,
                          })
                        }
                      />

                      <div>
                        <label className="block text-sm font-medium text-white mb-1.5 leading-normal">
                          Party Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.partyName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              partyName: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                          placeholder="e.g., ABC Construction LLC"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-1.5 leading-normal">
                          Party ID
                        </label>
                        <input
                          type="text"
                          value={formData.partyId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              partyId: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                          placeholder="Optional: Party identifier"
                        />
                      </div>

                      <Select
                        label="Party Role *"
                        options={[
                          { value: "PROVIDER", label: "Provider" },
                          { value: "RECIPIENT", label: "Recipient" },
                          { value: "BOTH", label: "Both" },
                        ]}
                        value={formData.partyRole}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partyRole: e.target.value as
                              | "PROVIDER"
                              | "RECIPIENT"
                              | "BOTH",
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Service Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-service-line text-cyan-400 text-lg"></i>
                      <span>Service Information</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Service Category *"
                        options={serviceCategoryOptions}
                        value={formData.serviceCategory}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            serviceCategory: e.target
                              .value as SupplyChainServiceCategory,
                          })
                        }
                      />

                      <div>
                        <label className="block text-sm font-medium text-white mb-1.5 leading-normal">
                          Service Type *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.serviceType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              serviceType: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                          placeholder="e.g., Order-to-Ship, Dock-to-Stock"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SLA Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-line-chart-line text-cyan-400 text-lg"></i>
                      <span>SLA Metrics</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Metric Type *"
                        options={[
                          { value: "duration", label: "Duration (Time)" },
                          { value: "percentage", label: "Percentage" },
                          { value: "count", label: "Count" },
                          { value: "custom", label: "Custom Formula" },
                        ]}
                        value={formData.metric}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metric: e.target.value as
                              | "duration"
                              | "percentage"
                              | "count"
                              | "custom",
                          })
                        }
                      />

                      <div>
                        <label className="block text-sm font-medium text-white mb-1.5 leading-normal">
                          Target{" "}
                          {formData.metric === "percentage"
                            ? "(%)"
                            : formData.metric === "duration"
                              ? "(hours)"
                              : ""}{" "}
                          *
                        </label>
                        <input
                          type="number"
                          required
                          step={formData.metric === "percentage" ? 0.1 : 0.5}
                          value={formData.targetDuration}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              targetDuration: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                          placeholder={
                            formData.metric === "percentage"
                              ? "e.g., 99.5"
                              : formData.metric === "duration"
                                ? "e.g., 24"
                                : "e.g., 100"
                          }
                        />
                      </div>
                    </div>

                    {formData.metric === "custom" && (
                      <div>
                        <label className="block text-sm font-medium text-white mb-1.5 leading-normal">
                          Custom Formula *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.customFormula}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customFormula: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                          placeholder="e.g., (completedOrders / totalOrders) * 100"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-1.5 leading-normal">
                          Warning Threshold (%) *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          max={100}
                          value={formData.warningThreshold}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              warningThreshold:
                                parseFloat(e.target.value) || 80,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                          placeholder="e.g., 80"
                        />
                        <p className="text-xs text-[#9ca3af] mt-1 leading-normal">
                          Warning when {formData.warningThreshold}% of target is
                          reached
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-1.5 leading-normal">
                          Critical Threshold (%) *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          max={100}
                          value={formData.criticalThreshold}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              criticalThreshold:
                                parseFloat(e.target.value) || 100,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                          placeholder="e.g., 100"
                        />
                        <p className="text-xs text-[#9ca3af] mt-1 leading-normal">
                          Critical when {formData.criticalThreshold}% of target
                          is reached
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Responsibility */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-user-star-line text-cyan-400 text-lg"></i>
                      <span>Responsibility</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Responsible Party *"
                        options={partyTypeOptions}
                        value={formData.responsibleParty}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            responsibleParty: e.target
                              .value as SupplyChainPartyType,
                          })
                        }
                      />

                      <div>
                        <label className="block text-sm font-medium text-white mb-1.5 leading-normal">
                          Responsible Party ID
                        </label>
                        <input
                          type="text"
                          value={formData.responsiblePartyId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              responsiblePartyId: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                          placeholder="Optional: Responsible party identifier"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-settings-3-line text-cyan-400 text-lg"></i>
                      <span>Options</span>
                    </h3>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isActive: e.target.checked,
                            })
                          }
                          className="w-4 h-4 bg-white/5 border border-white/10 rounded text-cyan-500 focus:ring-cyan-500 focus:ring-1"
                        />
                        <span className="text-sm text-white leading-normal">
                          Active
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isTemplate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isTemplate: e.target.checked,
                            })
                          }
                          className="w-4 h-4 bg-white/5 border border-white/10 rounded text-cyan-500 focus:ring-cyan-500 focus:ring-1"
                        />
                        <span className="text-sm text-white leading-normal">
                          Save as Template
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end pt-6 mt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {editingSLA ? "Save Changes" : "Create SLA"}
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
