/**
 * 📋 ACCESS REQUEST FORM COMPONENT
 * 
 * Self-service access request with:
 * - Module/permission selection
 * - Justification
 * - Urgency level
 * - Request tracking
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import { ModuleId } from "@/types/user";

interface AccessRequestFormProps {
  onSubmit?: (request: any) => void;
}

type RequestType = "permission" | "module" | "api_key";

const MODULES: { id: ModuleId; name: string; icon: string }[] = [
  { id: "wms", name: "Warehouse Management", icon: "ri-building-2-line" },
  { id: "tms", name: "Transport Management", icon: "ri-truck-line" },
  { id: "finance", name: "Finance", icon: "ri-money-dollar-circle-line" },
  { id: "qhse", name: "QHSE", icon: "ri-shield-check-line" },
  { id: "crm", name: "CRM", icon: "ri-contacts-line" },
  { id: "proposals", name: "Proposals", icon: "ri-file-list-line" },
  { id: "analytics", name: "Analytics", icon: "ri-bar-chart-box-line" },
  { id: "integrations", name: "Integrations", icon: "ri-plug-line" },
];

const FEATURES: Record<string, string[]> = {
  wms: ["Inventory", "Orders", "Picking", "Putaway", "Reports", "Settings"],
  tms: ["Shipments", "Tracking", "Routes", "Carriers", "Reports"],
  finance: ["Accounts Payable", "Accounts Receivable", "General Ledger", "Reports"],
  qhse: ["Incidents", "Audits", "Training", "Documents"],
  crm: ["Accounts", "Contacts", "Leads", "Opportunities"],
};

const AccessRequestForm: React.FC<AccessRequestFormProps> = ({ onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [requestType, setRequestType] = useState<RequestType>("permission");
  const [selectedModule, setSelectedModule] = useState<ModuleId | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [justification, setJustification] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reset form
  const resetForm = () => {
    setStep(1);
    setRequestType("permission");
    setSelectedModule(null);
    setSelectedFeature(null);
    setSelectedActions(new Set());
    setJustification("");
    setUrgency("medium");
    setSubmitted(false);
  };

  // Toggle action
  const toggleAction = (action: string) => {
    const newActions = new Set(selectedActions);
    if (newActions.has(action)) {
      newActions.delete(action);
    } else {
      newActions.add(action);
    }
    setSelectedActions(newActions);
  };

  // Submit request
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const request = {
        type: requestType,
        moduleId: selectedModule,
        featureId: selectedFeature,
        actions: Array.from(selectedActions),
        justification,
        urgency,
      };

      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        setSubmitted(true);
        onSubmit?.(request);
      }
    } catch (error) {
      console.error("Failed to submit request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return requestType !== null;
      case 2:
        return selectedModule !== null;
      case 3:
        return justification.length >= 20;
      default:
        return true;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-blue-600 transition-colors"
      >
        <i className="ri-add-line mr-2"></i>
        Request Access
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          resetForm();
        }}
        title="Request Access"
        size="md"
      >
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Progress */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={s}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        step === s
                          ? "bg-cyan-500 text-white"
                          : step > s
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-white/5 text-[#6b7280]"
                      }`}
                    >
                      {step > s ? <i className="ri-check-line"></i> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`flex-1 h-0.5 ${
                          step > s ? "bg-cyan-500" : "bg-white/10"
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1: Request Type */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      What would you like to request?
                    </h3>
                    <p className="text-sm text-[#9ca3af]">
                      Select the type of access you need
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {[
                      {
                        id: "permission",
                        label: "Specific Permission",
                        desc: "Request access to specific features and actions",
                        icon: "ri-key-line",
                      },
                      {
                        id: "module",
                        label: "Full Module Access",
                        desc: "Request complete access to a module",
                        icon: "ri-apps-line",
                      },
                      {
                        id: "api_key",
                        label: "API Key",
                        desc: "Request API access for integrations",
                        icon: "ri-code-s-slash-line",
                      },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setRequestType(type.id as RequestType)}
                        className={`p-4 rounded-xl border text-left transition-colors ${
                          requestType === type.id
                            ? "bg-cyan-500/10 border-cyan-500/30"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              requestType === type.id
                                ? "bg-cyan-500/20"
                                : "bg-white/10"
                            }`}
                          >
                            <i
                              className={`${type.icon} text-xl ${
                                requestType === type.id ? "text-cyan-400" : "text-[#9ca3af]"
                              }`}
                            ></i>
                          </div>
                          <div>
                            <div className="text-white font-medium">{type.label}</div>
                            <div className="text-xs text-[#9ca3af]">{type.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Select Module/Permission */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Select Module
                    </h3>
                    <p className="text-sm text-[#9ca3af]">
                      Choose the module you need access to
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {MODULES.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => setSelectedModule(module.id)}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          selectedModule === module.id
                            ? "bg-cyan-500/10 border-cyan-500/30"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <i
                            className={`${module.icon} text-lg ${
                              selectedModule === module.id
                                ? "text-cyan-400"
                                : "text-[#9ca3af]"
                            }`}
                          ></i>
                          <span className="text-sm text-white">{module.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Feature Selection (for permission type) */}
                  {requestType === "permission" && selectedModule && FEATURES[selectedModule] && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-white mb-2">
                        Feature (optional)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {FEATURES[selectedModule].map((feature) => (
                          <button
                            key={feature}
                            onClick={() =>
                              setSelectedFeature(
                                selectedFeature === feature ? null : feature
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              selectedFeature === feature
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "bg-white/5 text-[#9ca3af] hover:bg-white/10"
                            }`}
                          >
                            {feature}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions Selection */}
                  {requestType === "permission" && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-white mb-2">
                        Actions Needed
                      </label>
                      <div className="flex gap-2">
                        {["read", "create", "update", "delete"].map((action) => (
                          <button
                            key={action}
                            onClick={() => toggleAction(action)}
                            className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${
                              selectedActions.has(action)
                                ? action === "delete"
                                  ? "bg-red-500/20 text-red-400"
                                  : action === "update"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : action === "create"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-blue-500/20 text-blue-400"
                                : "bg-white/5 text-[#9ca3af] hover:bg-white/10"
                            }`}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Justification */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Justification
                    </h3>
                    <p className="text-sm text-[#9ca3af]">
                      Explain why you need this access
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Reason for request *
                    </label>
                    <textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Describe your business need for this access..."
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 resize-none"
                    />
                    <p className="text-xs text-[#6b7280] mt-1">
                      {justification.length}/20 minimum characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Urgency
                    </label>
                    <div className="flex gap-2">
                      {[
                        { id: "low", label: "Low", color: "green" },
                        { id: "medium", label: "Medium", color: "yellow" },
                        { id: "high", label: "High", color: "red" },
                      ].map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setUrgency(u.id as any)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                            urgency === u.id
                              ? u.color === "green"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : u.color === "yellow"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-white/5 text-[#9ca3af] border border-white/10"
                          }`}
                        >
                          {u.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">Request Summary</h4>
                    <div className="space-y-1 text-sm text-[#9ca3af]">
                      <p>
                        <span className="text-[#6b7280]">Type:</span>{" "}
                        {requestType === "permission"
                          ? "Specific Permission"
                          : requestType === "module"
                          ? "Full Module Access"
                          : "API Key"}
                      </p>
                      <p>
                        <span className="text-[#6b7280]">Module:</span>{" "}
                        {MODULES.find((m) => m.id === selectedModule)?.name}
                      </p>
                      {selectedFeature && (
                        <p>
                          <span className="text-[#6b7280]">Feature:</span> {selectedFeature}
                        </p>
                      )}
                      {selectedActions.size > 0 && (
                        <p>
                          <span className="text-[#6b7280]">Actions:</span>{" "}
                          {Array.from(selectedActions).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                )}
                <div className="flex-1"></div>
                {step < 3 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed()}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canProceed()}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin"></i>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-line"></i>
                        Submit Request
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <i className="ri-check-line text-4xl text-green-400"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
              <p className="text-[#9ca3af] mb-6">
                Your access request has been submitted and is pending approval.
                You'll be notified once it's reviewed.
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-colors"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </>
  );
};

export default AccessRequestForm;
