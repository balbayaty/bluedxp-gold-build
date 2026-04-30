/**
 * Pulse Profile Page
 * Consent management and privacy settings
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import type { PulseConsent } from "@/types/pulse";

export default function PulseProfilePage() {
  const [consent, setConsent] = useState<PulseConsent | null>(null);
  const [loading, setLoading] = useState(true);
  const [wellnessOptIn, setWellnessOptIn] = useState(false);
  const [retentionDays, setRetentionDays] = useState(365);

  useEffect(() => {
    fetchConsent();
  }, []);

  const fetchConsent = async () => {
    // In real implementation, fetch from API
    // For now, use defaults
    setConsent({
      id: "consent1",
      tenantId: "default",
      userId: "user1",
      wellnessOptIn: false,
      consentVersion: "1.0",
      consentTextHash: "hash",
      dataRetentionDays: 365,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setWellnessOptIn(false);
    setRetentionDays(365);
    setLoading(false);
  };

  const updateConsent = async () => {
    try {
      const res = await fetch("/api/pulse/consent/optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          wellnessOptIn,
          retentionDays,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Consent updated successfully");
        setConsent(data.data);
      } else {
        alert(data.error || "Failed to update consent");
      }
    } catch (error) {
      console.error("Failed to update consent:", error);
      alert("Failed to update consent");
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Pulse Profile"
        description="Manage your privacy and consent settings"
        icon="ri-user-line"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Pulse Profile"
      description="Manage your privacy and consent settings"
      icon="ri-user-line"
    >
      <div className="space-y-6 max-w-2xl">
        {/* Privacy Notice */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">
            Privacy & Data Protection
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            Pulse respects your privacy. Wellness data is stored as daily
            aggregates only (no GPS traces, no raw health events). You can opt
            in or out at any time, and configure data retention periods.
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Wellness data stored as daily totals only</li>
            <li>• No location tracking or GPS data</li>
            <li>• Opt-in consent required for wellness tracking</li>
            <li>• Configurable data retention</li>
            <li>• Full audit trail of consent changes</li>
          </ul>
        </div>

        {/* Consent Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Consent Settings</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Wellness Tracking</div>
                <div className="text-sm text-gray-500">
                  Allow Pulse to track your wellness data (steps, active
                  minutes, calories)
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={wellnessOptIn}
                  onChange={(e) => setWellnessOptIn(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Data Retention (days)
              </label>
              <input
                type="number"
                min="30"
                max="3650"
                value={retentionDays}
                onChange={(e) =>
                  setRetentionDays(parseInt(e.target.value) || 365)
                }
                className="w-full px-4 py-2 border rounded"
              />
              <div className="text-xs text-gray-500 mt-1">
                How long to keep your wellness data (30-3650 days)
              </div>
            </div>

            <button
              onClick={updateConsent}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </div>

        {/* Consent History */}
        {consent && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Consent History</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Consent Version:</span>
                <span className="font-medium">{consent.consentVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Consented At:</span>
                <span className="font-medium">
                  {consent.consentedAt
                    ? new Date(consent.consentedAt).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Revoked At:</span>
                <span className="font-medium">
                  {consent.revokedAt
                    ? new Date(consent.revokedAt).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data Retention:</span>
                <span className="font-medium">
                  {consent.dataRetentionDays} days
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
