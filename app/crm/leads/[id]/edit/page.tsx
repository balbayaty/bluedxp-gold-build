/**
 * CRM Lead Edit Page
 * Edit lead details with full field coverage
 * UX Enhanced: Auto-save, keyboard shortcuts, confirmation dialogs, toast notifications
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Lead } from "@/types/crm";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import FormActions, { SaveStatus, UnsavedChangesWarning } from "@/components/ui/FormActions";
import { FieldLabel, InlineHelp } from "@/components/ui/FieldHelp";

const SOURCES = ["WEBSITE", "REFERRAL", "EVENT", "COLD_CALL", "SOCIAL_MEDIA", "OTHER"];
const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    source: "WEBSITE",
    status: "NEW",
    assignedTo: "",
    notes: "",
    tags: [] as string[],
  });
  const [originalData, setOriginalData] = useState<typeof formData | null>(null);
  const [tagInput, setTagInput] = useState("");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Notifications
  const { notification, showSuccess, showError, showWarning, clearNotification } = useNotifications();

  // Load lead data
  const loadLead = useCallback(async () => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`);
      const data = await response.json();
      if (data.success) {
        const lead = data.data;
        const loadedData = {
          firstName: lead.firstName || "",
          lastName: lead.lastName || "",
          email: lead.email || "",
          phone: lead.phone || "",
          company: lead.company || "",
          title: lead.title || "",
          source: lead.source || "WEBSITE",
          status: lead.status || "NEW",
          assignedTo: lead.assignedTo || "",
          notes: lead.notes || "",
          tags: lead.tags || [],
        };
        setFormData(loadedData);
        setOriginalData(loadedData);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError("Failed to load lead");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  // Track changes
  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  // Auto-save to localStorage
  useEffect(() => {
    if (hasChanges) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(`lead-draft-${leadId}`, JSON.stringify(formData));
          setSaveStatus("saved");
          setLastSaved(new Date());
        } catch (e) {
          console.error("Auto-save failed:", e);
        }
      }, 2000);
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, hasChanges, leadId]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // Handle save
  const handleSave = async () => {
    // Validate required fields
    if (!formData.firstName.trim()) {
      showError("Validation Error", "First name is required");
      return;
    }
    if (!formData.lastName.trim()) {
      showError("Validation Error", "Last name is required");
      return;
    }
    if (!formData.email.trim()) {
      showError("Validation Error", "Email is required");
      return;
    }

    setSaving(true);
    setSaveStatus("saving");
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        // Clear draft
        localStorage.removeItem(`lead-draft-${leadId}`);
        setSaveStatus("saved");
        setLastSaved(new Date());
        setHasChanges(false);
        showSuccess("Lead Saved", "Your changes have been saved successfully");
        setTimeout(() => {
          router.push(`/crm/leads/${leadId}`);
        }, 1500);
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      setError("Failed to save lead");
      setSaveStatus("error");
      showError("Save Failed", "Please try again");
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel with unsaved changes check
  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      router.push(`/crm/leads/${leadId}`);
    }
  };

  const confirmCancel = () => {
    localStorage.removeItem(`lead-draft-${leadId}`);
    router.push(`/crm/leads/${leadId}`);
  };

  // Update field helper
  const updateField = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveStatus("idle");
  };

  // Tag management
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateField("tags", [...formData.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    updateField("tags", formData.tags.filter(t => t !== tag));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error && !formData.firstName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <ErrorDisplay
          title="Failed to Load Lead"
          message={error}
          onRetry={loadLead}
          onBack={() => router.push("/crm/leads")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={confirmCancel}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        variant="warning"
      />

      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleCancel} 
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Back"
              >
                <i className="ri-arrow-left-line text-xl"></i>
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold">Edit Lead</h1>
                  <SaveStatus status={saveStatus} lastSaved={lastSaved} />
                </div>
                <p className="text-sm text-gray-400">{formData.firstName} {formData.lastName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 hidden sm:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">S</kbd>
                <span className="ml-1">to save</span>
              </span>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
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
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <i className="ri-error-warning-line"></i>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="hover:text-white">
              <i className="ri-close-line"></i>
            </button>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Personal Info */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="ri-user-line text-purple-400"></i>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FieldLabel label="First Name" required htmlFor="firstName" />
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  placeholder="John"
                />
              </div>
              <div>
                <FieldLabel label="Last Name" required htmlFor="lastName" />
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  placeholder="Doe"
                />
              </div>
              <div>
                <FieldLabel label="Email" required htmlFor="email" help="Primary contact email for this lead" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <FieldLabel label="Phone" htmlFor="phone" help="Include country code for international numbers" />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  placeholder="+966 5X XXX XXXX"
                />
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="ri-building-line text-purple-400"></i>
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FieldLabel label="Company" htmlFor="company" />
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => updateField("company", e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <FieldLabel label="Job Title" htmlFor="title" />
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  placeholder="Logistics Manager"
                />
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="ri-settings-3-line text-purple-400"></i>
              Lead Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <FieldLabel label="Source" htmlFor="source" help="How did this lead find us?" />
                <select
                  id="source"
                  value={formData.source}
                  onChange={(e) => updateField("source", e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                >
                  {SOURCES.map(s => (
                    <option key={s} value={s} className="bg-gray-900">{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel label="Status" htmlFor="status" help="Current stage in the sales pipeline" />
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s} className="bg-gray-900">{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel label="Assigned To" htmlFor="assignedTo" help="Sales rep responsible for this lead" />
                <input
                  id="assignedTo"
                  type="email"
                  value={formData.assignedTo}
                  onChange={(e) => updateField("assignedTo", e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  placeholder="sales@company.com"
                />
              </div>
            </div>
          </div>

          {/* Notes & Tags */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="ri-file-text-line text-purple-400"></i>
              Notes & Tags
            </h3>
            <div className="space-y-6">
              <div>
                <FieldLabel label="Notes" htmlFor="notes" />
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none"
                  placeholder="Add notes about this lead..."
                />
                <InlineHelp text="Notes are visible to your team and will be preserved when the lead is converted" />
              </div>
              <div>
                <FieldLabel label="Tags" />
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                    placeholder="Add a tag and press Enter..."
                  />
                  <button 
                    onClick={addTag} 
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors"
                    aria-label="Add tag"
                  >
                    <i className="ri-add-line"></i>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.length === 0 ? (
                    <span className="text-gray-500 text-sm">No tags added</span>
                  ) : (
                    formData.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center gap-2">
                        {tag}
                        <button 
                          onClick={() => removeTag(tag)} 
                          className="hover:text-white"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Unsaved Changes Warning */}
      <UnsavedChangesWarning
        hasChanges={hasChanges}
        onSave={handleSave}
        onDiscard={() => setShowCancelDialog(true)}
        saving={saving}
      />
    </div>
  );
}
