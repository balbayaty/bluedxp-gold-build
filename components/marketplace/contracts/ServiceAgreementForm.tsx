/**
 * Service Agreement Form Component
 * Create/edit service agreement from booking
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Save, X, Plus, Trash2 } from "lucide-react";
import type {
  ContractCreationRequest,
  ServiceLevelAgreement,
  PaymentSchedule,
  Milestone,
} from "@/types/marketplace-contracts";

interface ServiceAgreementFormProps {
  bookingId: string;
  onSave: (contract: any) => void;
  onCancel: () => void;
  initialData?: Partial<ContractCreationRequest>;
}

export default function ServiceAgreementForm({
  bookingId,
  onSave,
  onCancel,
  initialData,
}: ServiceAgreementFormProps) {
  const [formData, setFormData] = useState<ContractCreationRequest>({
    bookingId,
    terms: {
      paymentTerms: initialData?.terms?.paymentTerms || "NET_30",
      deliveryTerms: initialData?.terms?.deliveryTerms,
      warrantyTerms: initialData?.terms?.warrantyTerms,
      liabilityTerms: initialData?.terms?.liabilityTerms,
      cancellationTerms:
        initialData?.terms?.cancellationTerms ||
        "Standard cancellation policy applies",
      disputeResolution:
        initialData?.terms?.disputeResolution ||
        "Arbitration in accordance with Saudi law",
      governingLaw: initialData?.terms?.governingLaw || "Saudi Arabia",
      jurisdiction: initialData?.terms?.jurisdiction || "Riyadh, Saudi Arabia",
    },
    serviceLevelAgreements: initialData?.serviceLevelAgreements || [],
    paymentSchedule: initialData?.paymentSchedule || [],
    milestones: initialData?.milestones || [],
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/marketplace/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        onSave(result.data);
      }
    } catch (error) {
      console.error("Failed to create contract:", error);
    } finally {
      setSaving(false);
    }
  };

  const addSLA = () => {
    setFormData((prev) => ({
      ...prev,
      serviceLevelAgreements: [
        ...(prev.serviceLevelAgreements || []),
        {
          metric: "",
          target: 0,
          unit: "",
          measurementPeriod: "MONTHLY",
        },
      ],
    }));
  };

  const removeSLA = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      serviceLevelAgreements:
        prev.serviceLevelAgreements?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateSLA = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      serviceLevelAgreements:
        prev.serviceLevelAgreements?.map((sla, i) =>
          i === index ? { ...sla, [field]: value } : sla,
        ) || [],
    }));
  };

  const addPaymentSchedule = () => {
    setFormData((prev) => ({
      ...prev,
      paymentSchedule: [
        ...(prev.paymentSchedule || []),
        {
          milestone: "",
          amount: 0,
          percentage: 0,
          dueDate: new Date().toISOString().split("T")[0],
        },
      ],
    }));
  };

  const removePaymentSchedule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      paymentSchedule:
        prev.paymentSchedule?.filter((_, i) => i !== index) || [],
    }));
  };

  const updatePaymentSchedule = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      paymentSchedule:
        prev.paymentSchedule?.map((ps, i) =>
          i === index ? { ...ps, [field]: value } : ps,
        ) || [],
    }));
  };

  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [
        ...(prev.milestones || []),
        {
          name: "",
          description: "",
          dueDate: new Date().toISOString().split("T")[0],
          deliverables: [],
        },
      ],
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      milestones:
        prev.milestones?.map((m, i) =>
          i === index ? { ...m, [field]: value } : m,
        ) || [],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Terms & Conditions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Terms & Conditions
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Payment Terms
            </label>
            <select
              value={formData.terms?.paymentTerms || "NET_30"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  terms: { ...prev.terms, paymentTerms: e.target.value },
                }))
              }
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="NET_15">Net 15</option>
              <option value="NET_30">Net 30</option>
              <option value="NET_60">Net 60</option>
              <option value="DUE_ON_RECEIPT">Due on Receipt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Delivery Terms
            </label>
            <textarea
              value={formData.terms?.deliveryTerms || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  terms: { ...prev.terms, deliveryTerms: e.target.value },
                }))
              }
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="Enter delivery terms..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Warranty Terms
            </label>
            <textarea
              value={formData.terms?.warrantyTerms || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  terms: { ...prev.terms, warrantyTerms: e.target.value },
                }))
              }
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="Enter warranty terms..."
            />
          </div>
        </div>
      </div>

      {/* Service Level Agreements */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Service Level Agreements
          </h3>
          <button
            onClick={addSLA}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add SLA
          </button>
        </div>
        <div className="space-y-4">
          {formData.serviceLevelAgreements?.map((sla, idx) => (
            <div
              key={idx}
              className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-slate-800 dark:text-slate-100">
                  SLA {idx + 1}
                </h4>
                <button
                  onClick={() => removeSLA(idx)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Metric
                  </label>
                  <input
                    type="text"
                    value={sla.metric}
                    onChange={(e) => updateSLA(idx, "metric", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    placeholder="e.g., Response Time"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Target
                  </label>
                  <input
                    type="number"
                    value={sla.target}
                    onChange={(e) =>
                      updateSLA(idx, "target", parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={sla.unit}
                    onChange={(e) => updateSLA(idx, "unit", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    placeholder="e.g., hours, days"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Period
                  </label>
                  <select
                    value={sla.measurementPeriod}
                    onChange={(e) =>
                      updateSLA(idx, "measurementPeriod", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  >
                    <option value="HOURLY">Hourly</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Payment Schedule
          </h3>
          <button
            onClick={addPaymentSchedule}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        </div>
        <div className="space-y-4">
          {formData.paymentSchedule?.map((payment, idx) => (
            <div
              key={idx}
              className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-slate-800 dark:text-slate-100">
                  Payment {idx + 1}
                </h4>
                <button
                  onClick={() => removePaymentSchedule(idx)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Milestone
                  </label>
                  <input
                    type="text"
                    value={payment.milestone || ""}
                    onChange={(e) =>
                      updatePaymentSchedule(idx, "milestone", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    placeholder="e.g., On completion"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={payment.amount}
                    onChange={(e) =>
                      updatePaymentSchedule(
                        idx,
                        "amount",
                        parseFloat(e.target.value),
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={payment.dueDate}
                    onChange={(e) =>
                      updatePaymentSchedule(idx, "dueDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Milestones
          </h3>
          <button
            onClick={addMilestone}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Milestone
          </button>
        </div>
        <div className="space-y-4">
          {formData.milestones?.map((milestone, idx) => (
            <div
              key={idx}
              className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-slate-800 dark:text-slate-100">
                  Milestone {idx + 1}
                </h4>
                <button
                  onClick={() => removeMilestone(idx)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Name
                  </label>
                  <input
                    type="text"
                    value={milestone.name}
                    onChange={(e) =>
                      updateMilestone(idx, "name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    placeholder="e.g., Phase 1 Completion"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    value={milestone.description || ""}
                    onChange={(e) =>
                      updateMilestone(idx, "description", e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    placeholder="Milestone description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={milestone.dueDate}
                    onChange={(e) =>
                      updateMilestone(idx, "dueDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Create Contract"}
        </button>
      </div>
    </div>
  );
}
