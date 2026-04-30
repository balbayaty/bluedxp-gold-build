/**
 * Export House License Application Form
 * Complete SEDA application submission workflow
 */

"use client";

import { useState, useEffect } from "react";
import {
  RiFileAddLine,
  RiSaveLine,
  RiSendPlaneLine,
  RiCheckLine,
} from "react-icons/ri";

interface ApplicationForm {
  companyName: string;
  commercialRegister: string;
  taxId: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  codeOfConductDocumentId?: string;
  commercialRegisterDocumentId?: string;
  businessPlanDocumentId?: string;
}

export default function ApplicationPage() {
  const [form, setForm] = useState<ApplicationForm>({
    companyName: "",
    commercialRegister: "",
    taxId: "",
    address: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function saveApplication() {
    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch("/api/export-house/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving application:", error);
    } finally {
      setSaving(false);
    }
  }

  async function submitApplication() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/export-house/application", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          action: "submit",
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error: any) {
      alert(error.message || "Error submitting application");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Export House License Application
          </h1>
          <p className="text-gray-400">
            Complete your SEDA Export House license application
          </p>
        </div>

        {submitted && (
          <div className="bg-green-500/20 border border-green-400/50 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <RiCheckLine className="text-green-400 text-2xl" />
              <div>
                <h3 className="text-lg font-semibold text-green-400">
                  Application Submitted
                </h3>
                <p className="text-gray-400">
                  Your application has been submitted to SEDA for review.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Company Information */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Commercial Register *
                </label>
                <input
                  type="text"
                  value={form.commercialRegister}
                  onChange={(e) =>
                    setForm({ ...form, commercialRegister: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Tax ID *
                </label>
                <input
                  type="text"
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm({ ...form, contactPerson: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm({ ...form, contactPhone: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              onClick={saveApplication}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white border border-white/10 rounded-xl hover:border-cyan-400/50 transition-colors disabled:opacity-50"
            >
              <RiSaveLine />{" "}
              {saving ? "Saving..." : saved ? "Saved!" : "Save Draft"}
            </button>
            <button
              onClick={submitApplication}
              disabled={submitting || submitted}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 rounded-xl hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
            >
              <RiSendPlaneLine />{" "}
              {submitting
                ? "Submitting..."
                : submitted
                  ? "Submitted"
                  : "Submit Application"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
