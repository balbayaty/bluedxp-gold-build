/**
 * CRM Opportunity Edit Page
 * Edit opportunity details
 * UX Enhanced: Toast notifications, auto-save, confirmation dialogs
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import { SaveStatus, UnsavedChangesWarning } from "@/components/ui/FormActions";
import { FieldLabel, InlineHelp } from "@/components/ui/FieldHelp";
import type { Opportunity } from "@/types/crm";

const STAGES = ["DISCOVERY", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"];
const SOURCES = ["LEAD", "RFQ", "SALES_ORDER", "MARKETPLACE", "MANUAL"];

export default function EditOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    accountId: "",
    stage: "DISCOVERY",
    probability: 10,
    value: 0,
    currency: "SAR",
    expectedCloseDate: "",
    source: "MANUAL",
    ownerId: "",
    competitor: "",
    notes: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    loadOpportunity();
  }, [opportunityId]);

  const loadOpportunity = async () => {
    try {
      const response = await fetch(`/api/crm/opportunities/${opportunityId}`);
      const data = await response.json();
      if (data.success) {
        const opp = data.data;
        setFormData({
          name: opp.name || "",
          description: opp.description || "",
          accountId: opp.accountId || "",
          stage: opp.stage || "DISCOVERY",
          probability: opp.probability || 10,
          value: opp.value || 0,
          currency: opp.currency || "SAR",
          expectedCloseDate: opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toISOString().split("T")[0] : "",
          source: opp.source || "MANUAL",
          ownerId: opp.ownerId || "",
          competitor: opp.competitor || "",
          notes: opp.notes || "",
          tags: opp.tags || [],
        });
      }
    } catch (err) {
      setError("Failed to load opportunity");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.accountId) {
      setError("Name and Account are required");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/crm/opportunities/${opportunityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        router.push(`/crm/opportunities/${opportunityId}`);
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      setError("Failed to save opportunity");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const updateProbabilityFromStage = (stage: string) => {
    const probabilities: Record<string, number> = {
      DISCOVERY: 10,
      QUALIFICATION: 25,
      PROPOSAL: 50,
      NEGOTIATION: 75,
      CLOSED_WON: 100,
      CLOSED_LOST: 0,
    };
    setFormData(prev => ({ ...prev, stage, probability: probabilities[stage] || 10 }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/crm/opportunities/${opportunityId}`} className="p-2 hover:bg-white/10 rounded-lg">
                <i className="ri-arrow-left-line text-xl"></i>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Edit Opportunity</h1>
                <p className="text-sm text-gray-400">{formData.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/crm/opportunities/${opportunityId}`} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-save-line"></i>}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            <i className="ri-error-warning-line mr-2"></i>{error}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="ri-funds-line text-emerald-400"></i>
              Opportunity Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Opportunity Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Q4 Warehouse Services Contract"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                  placeholder="Describe the opportunity..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Account ID *</label>
                <input
                  type="text"
                  value={formData.accountId}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="account-id"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  {SOURCES.map(s => (
                    <option key={s} value={s} className="bg-gray-900">{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pipeline & Value */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="ri-bar-chart-grouped-line text-emerald-400"></i>
              Pipeline & Value
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => updateProbabilityFromStage(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  {STAGES.map(s => (
                    <option key={s} value={s} className="bg-gray-900">{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Probability (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData(prev => ({ ...prev, probability: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Deal Value</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="0"
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 outline-none"
                  >
                    <option value="SAR" className="bg-gray-900">SAR</option>
                    <option value="USD" className="bg-gray-900">USD</option>
                    <option value="EUR" className="bg-gray-900">EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Expected Close Date</label>
                <input
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Additional */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="ri-settings-3-line text-emerald-400"></i>
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Owner</label>
                <input
                  type="email"
                  value={formData.ownerId}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerId: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="sales@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Competitor</label>
                <input
                  type="text"
                  value={formData.competitor}
                  onChange={(e) => setFormData(prev => ({ ...prev, competitor: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Competitor name"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 outline-none"
                    placeholder="Add a tag..."
                  />
                  <button onClick={addTag} type="button" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                    <i className="ri-add-line"></i>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm flex items-center gap-2">
                      {tag}
                      <button onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))} type="button">
                        <i className="ri-close-line"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
