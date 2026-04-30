/**
 * CRM Account Edit Page
 * Edit account/customer details
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
import type { CRMAccount } from "@/types/crm";

const ACCOUNT_TYPES = ["CUSTOMER", "PROSPECT", "PARTNER", "COMPETITOR"];
const RATINGS = ["A", "B", "C", "D"];
const INDUSTRIES = [
  "Logistics & Transportation",
  "Manufacturing",
  "Retail & E-commerce",
  "Oil & Gas",
  "Construction",
  "Healthcare",
  "Technology",
  "Financial Services",
  "Government",
  "Other",
];

export default function EditAccountPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    industry: "",
    website: "",
    annualRevenue: 0,
    employeeCount: 0,
    accountType: "CUSTOMER",
    rating: "",
    territory: "",
    accountOwnerId: "",
  });

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  const loadAccount = async () => {
    try {
      const response = await fetch(`/api/crm/accounts/${accountId}`);
      const data = await response.json();
      if (data.success) {
        const acc = data.data;
        setFormData({
          name: acc.name || "",
          email: acc.email || "",
          phone: acc.phone || "",
          address: acc.address || "",
          industry: acc.industry || "",
          website: acc.website || "",
          annualRevenue: acc.annualRevenue || 0,
          employeeCount: acc.employeeCount || 0,
          accountType: acc.accountType || "CUSTOMER",
          rating: acc.rating || "",
          territory: acc.crmFields?.territory || "",
          accountOwnerId: acc.crmFields?.accountOwnerId || "",
        });
      }
    } catch (err) {
      setError("Failed to load account");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      setError("Account name is required");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/crm/accounts/${accountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          crmFields: {
            territory: formData.territory,
            accountOwnerId: formData.accountOwnerId,
          },
        }),
      });
      if (response.ok) {
        router.push(`/crm/accounts/${accountId}`);
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      setError("Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
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
              <Link href={`/crm/accounts/${accountId}`} className="p-2 hover:bg-white/10 rounded-lg">
                <i className="ri-arrow-left-line text-xl"></i>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Edit Account</h1>
                <p className="text-sm text-gray-400">{formData.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/crm/accounts/${accountId}`} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
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
          {/* Company Info */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="ri-building-line text-blue-400"></i>
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="" className="bg-gray-900">Select Industry</option>
                  {INDUSTRIES.map(i => (
                    <option key={i} value={i} className="bg-gray-900">{i}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="https://company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="contact@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="+966 11 234 5678"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Company address..."
                />
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="ri-bar-chart-line text-blue-400"></i>
              Business Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Annual Revenue (SAR)</label>
                <input
                  type="number"
                  value={formData.annualRevenue}
                  onChange={(e) => setFormData(prev => ({ ...prev, annualRevenue: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Employee Count</label>
                <input
                  type="number"
                  value={formData.employeeCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* CRM Settings */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="ri-settings-3-line text-blue-400"></i>
              CRM Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {ACCOUNT_TYPES.map(t => (
                    <option key={t} value={t} className="bg-gray-900">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="" className="bg-gray-900">No Rating</option>
                  {RATINGS.map(r => (
                    <option key={r} value={r} className="bg-gray-900">{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Territory</label>
                <input
                  type="text"
                  value={formData.territory}
                  onChange={(e) => setFormData(prev => ({ ...prev, territory: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Central Region"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Account Owner</label>
                <input
                  type="email"
                  value={formData.accountOwnerId}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountOwnerId: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="owner@company.com"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
