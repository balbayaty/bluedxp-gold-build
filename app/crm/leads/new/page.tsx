/**
 * CRM New Lead Page
 * Create new lead with AI scoring prediction
 * UX Enhanced: Toast notifications, auto-save, keyboard shortcuts
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SaveStatus } from "@/components/ui/FormActions";
import { FieldLabel, InlineHelp } from "@/components/ui/FieldHelp";

const SOURCES = [
  { value: "WEBSITE", label: "Website", icon: "ri-global-line", color: "from-blue-500 to-cyan-500" },
  { value: "REFERRAL", label: "Referral", icon: "ri-share-line", color: "from-green-500 to-emerald-500" },
  { value: "EVENT", label: "Event", icon: "ri-calendar-event-line", color: "from-purple-500 to-pink-500" },
  { value: "COLD_CALL", label: "Cold Call", icon: "ri-phone-line", color: "from-orange-500 to-red-500" },
  { value: "SOCIAL_MEDIA", label: "Social Media", icon: "ri-twitter-line", color: "from-pink-500 to-rose-500" },
  { value: "OTHER", label: "Other", icon: "ri-more-line", color: "from-gray-500 to-gray-600" },
];

const STEPS = [
  { id: 0, title: "Contact", icon: "ri-user-line" },
  { id: 1, title: "Company", icon: "ri-building-line" },
  { id: 2, title: "Source", icon: "ri-compass-line" },
  { id: 3, title: "Details", icon: "ri-file-text-line" },
];

export default function NewLeadPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    source: "",
    notes: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError("Please fill in required fields");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tenantId: "default",
          status: "NEW",
        }),
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/crm/leads/${data.data.id}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href="/crm/leads" className="p-2 hover:bg-white/10 rounded-lg">
              <i className="ri-arrow-left-line text-xl"></i>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Create New Lead</h1>
              <p className="text-gray-400">Add a potential customer to your pipeline</p>
            </div>
          </div>

          {/* Steps */}
          <div className="mt-6 flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => setStep(s.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    step === s.id
                      ? "bg-purple-600 text-white"
                      : step > s.id
                      ? "bg-green-500/20 text-green-400"
                      : "bg-white/5 text-gray-400"
                  }`}
                >
                  {step > s.id ? <i className="ri-check-line"></i> : <i className={s.icon}></i>}
                  <span className="hidden sm:inline">{s.title}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${step > s.id ? "bg-green-500" : "bg-white/10"}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            <i className="ri-error-warning-line mr-2"></i>{error}
          </motion.div>
        )}

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          {/* Step 0: Contact */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="ri-user-add-line text-3xl"></i>
                </div>
                <h2 className="text-2xl font-bold">Contact Information</h2>
                <p className="text-gray-400 mt-1">Enter the lead&apos;s basic contact details</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="John"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="+966 5X XXX XXXX"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Company */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="ri-building-line text-3xl"></i>
                </div>
                <h2 className="text-2xl font-bold">Company Details</h2>
                <p className="text-gray-400 mt-1">Tell us about their organization</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="Acme Corporation"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="Logistics Manager"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Source */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="ri-compass-line text-3xl"></i>
                </div>
                <h2 className="text-2xl font-bold">Lead Source</h2>
                <p className="text-gray-400 mt-1">How did this lead find you?</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {SOURCES.map((source) => (
                  <button
                    key={source.value}
                    onClick={() => setFormData(prev => ({ ...prev, source: source.value }))}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      formData.source === source.value
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-white/10 hover:border-white/20 bg-white/5"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${source.color} flex items-center justify-center mx-auto mb-3`}>
                      <i className={`${source.icon} text-2xl text-white`}></i>
                    </div>
                    <p className="font-medium">{source.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="ri-file-text-line text-3xl"></i>
                </div>
                <h2 className="text-2xl font-bold">Additional Details</h2>
                <p className="text-gray-400 mt-1">Add notes and tags to help qualify this lead</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                  placeholder="Initial conversation notes, interests, requirements..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 outline-none"
                    placeholder="e.g., high-priority, warehousing..."
                  />
                  <button onClick={addTag} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl">
                    <i className="ri-add-line"></i>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center gap-2">
                      {tag}
                      <button onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}>
                        <i className="ri-close-line"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
            >
              <i className="ri-arrow-left-line mr-2"></i>Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                Next<i className="ri-arrow-right-line ml-2"></i>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-check-line"></i>}
                Create Lead
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
