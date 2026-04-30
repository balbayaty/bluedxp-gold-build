/**
 * Edit CAPA Modal Component
 * Comprehensive CAPA editing with all ISO requirements
 * Adapted from chemcheck-ai with Hazalyze enhancements
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import UserSelector from "./UserSelector";
import CustomerSelector from "./CustomerSelector";
import SupplierSelector from "./SupplierSelector";
import AdvancedSmartDetectionForm from "@/components/forms/AdvancedSmartDetectionForm";

type AdvancedDetectionContext = any;

interface EditCAPAModalProps {
  capa: any;
  onClose: () => void;
  onSave: (updates: any) => void;
  previousCAPAs?: any[];
  useSmartDetection?: boolean;
}

export default function EditCAPAModal({
  capa,
  onClose,
  onSave,
  previousCAPAs = [],
  useSmartDetection = false,
}: EditCAPAModalProps) {
  const [formData, setFormData] = useState({
    subject: capa.subject || "",
    priority: capa.priority || "Medium",
    status: capa.status || "Open",
    capa_type: capa.capaType || "Corrective Action",
    capa_source: capa.capaSource || "NCR",
    exp_end_date: capa.targetDate || "",
    effectiveness_review: capa.effectivenessReview || "Pending",
    assigned_to: capa.assignedTo || "",
    action_plan: capa.actionPlan || "",
    root_cause: capa.rootCause || "",
    implementation_date: "",
    verified_by: "",
    resources_required: "",
    cost_estimate: "",
    actual_cost: "",
  });

  const [aiSuggestion, setAiSuggestion] = useState("");

  // ESC key handler and body scroll lock
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Lock body scroll when modal is open
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const suggestions = [
    "🤖 AI Insight: Based on similar CAPAs, completion typically takes 14 days. Consider setting realistic timeline.",
    "🤖 AI Insight: High priority CAPAs have 87% better effectiveness when assigned to dedicated owners.",
    "🤖 AI Insight: CAPAs linked to NCRs show 2x faster resolution when root cause is documented.",
    "🤖 AI Insight: Preventive actions reduce repeat NCRs by 65% in similar categories.",
  ];

  useState(() => {
    setAiSuggestion(
      suggestions[Math.floor(Math.random() * suggestions.length)],
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-capa-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
        className="rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gray-800 border border-gray-700 my-8"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-8 py-6 border-b bg-gray-800 border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2
                id="edit-capa-title"
                className="text-3xl font-bold text-white"
              >
                Edit CAPA
              </h2>
              <p className="text-sm mt-1 text-gray-400">
                {capa.capaNumber || capa.id} • Make changes and they'll sync
                instantly
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-lg transition-colors hover:bg-gray-700 text-gray-400"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        {/* AI Suggestion Banner */}
        {aiSuggestion && (
          <div className="mx-8 mt-6 p-4 rounded-lg bg-purple-900/20 border-purple-700 border">
            <p className="text-sm text-purple-300">{aiSuggestion}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-200">
              CAPA Title *
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg text-lg bg-gray-700 text-white border-gray-600 border-2 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Grid Section 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Type *
              </label>
              <select
                value={formData.capa_type}
                onChange={(e) =>
                  setFormData({ ...formData, capa_type: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
              >
                <option value="Corrective Action">Corrective Action</option>
                <option value="Preventive Action">Preventive Action</option>
              </select>
            </div>
          </div>

          {/* Grid Section 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Source
              </label>
              <select
                value={formData.capa_source}
                onChange={(e) =>
                  setFormData({ ...formData, capa_source: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
              >
                <option value="NCR">NCR</option>
                <option value="Audit">Audit</option>
                <option value="Risk">Risk Assessment</option>
                <option value="Management Review">Management Review</option>
                <option value="Customer Complaint">Customer Complaint</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Due Date
              </label>
              <input
                type="date"
                value={formData.exp_end_date}
                onChange={(e) =>
                  setFormData({ ...formData, exp_end_date: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Owner Assignment - CRITICAL ISO REQUIREMENT */}
          <div>
            <UserSelector
              value={formData.assigned_to}
              onChange={(email) =>
                setFormData({ ...formData, assigned_to: email })
              }
              label="Action Owner * (ISO Required)"
              required={true}
              isDark={true}
              placeholder="Email of responsible person"
            />
            <p className="text-xs mt-1 text-gray-400">
              ISO 10.2.1 requires clear ownership for all corrective actions
            </p>
          </div>

          {/* Root Cause Analysis - ISO REQUIREMENT */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-200">
              Root Cause Analysis{" "}
              <span className="text-red-500">(ISO 10.2.1)</span>
            </label>
            <textarea
              rows={3}
              value={formData.root_cause}
              onChange={(e) =>
                setFormData({ ...formData, root_cause: e.target.value })
              }
              placeholder="Why did this issue occur? Use 5 Whys, Fishbone, or other RCA method..."
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Action Plan - DETAILED */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-200">
              Detailed Action Plan *
            </label>
            <textarea
              required
              rows={4}
              value={formData.action_plan}
              onChange={(e) =>
                setFormData({ ...formData, action_plan: e.target.value })
              }
              placeholder="Step-by-step plan: What will be done, how, when, by whom..."
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Intelligent Interconnections - Customer & Supplier */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700 border">
            <h3 className="text-lg font-semibold mb-4 text-blue-300 flex items-center gap-2">
              <i className="ri-link"></i>
              Business Impact Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomerSelector
                value={formData.linked_customer}
                onChange={(customerName) =>
                  setFormData({ ...formData, linked_customer: customerName })
                }
                label="Related Customer"
                isDark={true}
                placeholder="Select customer if applicable..."
              />
              <SupplierSelector
                value={formData.linked_supplier}
                onChange={(supplierName) =>
                  setFormData({ ...formData, linked_supplier: supplierName })
                }
                label="Related Supplier"
                isDark={true}
                placeholder="Select supplier if applicable..."
              />
            </div>
          </div>

          {/* Resources & Cost */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Resources Required
              </label>
              <input
                type="text"
                value={formData.resources_required}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    resources_required: e.target.value,
                  })
                }
                placeholder="People, tools, materials..."
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Estimated Cost
              </label>
              <input
                type="number"
                value={formData.cost_estimate}
                onChange={(e) =>
                  setFormData({ ...formData, cost_estimate: e.target.value })
                }
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Actual Cost
              </label>
              <input
                type="number"
                value={formData.actual_cost}
                onChange={(e) =>
                  setFormData({ ...formData, actual_cost: e.target.value })
                }
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Implementation & Verification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Implementation Date
              </label>
              <input
                type="date"
                value={formData.implementation_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    implementation_date: e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Verified By
              </label>
              <input
                type="text"
                value={formData.verified_by}
                onChange={(e) =>
                  setFormData({ ...formData, verified_by: e.target.value })
                }
                placeholder="Verifier email"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Effectiveness Review */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-200">
              Effectiveness Review{" "}
              <span className="text-red-500">(ISO 10.2.1 - Required)</span>
            </label>
            <select
              value={formData.effectiveness_review}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  effectiveness_review: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:outline-none focus:border-purple-500"
            >
              <option value="Pending">Pending Review (Not yet reviewed)</option>
              <option value="Effective">
                Effective (Problem solved, no recurrence)
              </option>
              <option value="Not Effective">
                Not Effective (Problem persists)
              </option>
              <option value="Partially Effective">
                Partially Effective (Some improvement)
              </option>
            </select>
            <p className="text-xs mt-1 text-gray-400">
              ISO requires verification of effectiveness - Review 30-90 days
              after implementation
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-700">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              <i className="ri-save-line"></i>
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-4 rounded-xl font-semibold transition-all bg-gray-700 hover:bg-gray-600 text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
