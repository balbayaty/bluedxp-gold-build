/**
 * Export House License Dashboard
 * SEDA Export House license management
 */

"use client";

import { useState, useEffect } from "react";
import {
  RiGlobalLine,
  RiFileAddLine,
  RiShieldCheckLine,
  RiFileChartLine,
} from "react-icons/ri";

interface LicenseStatus {
  status: string;
  applicationNumber?: string;
  submittedAt?: string;
  expiryDate?: string;
}

export default function ExportHousePage() {
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicenseStatus();
  }, []);

  async function loadLicenseStatus() {
    try {
      const response = await fetch("/api/export-house/status", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setLicenseStatus(data);
      }
    } catch (error) {
      console.error("Error loading license status:", error);
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    not_applied: "bg-gray-500/20 text-gray-400",
    draft: "bg-yellow-500/20 text-yellow-400",
    submitted: "bg-blue-500/20 text-blue-400",
    under_review: "bg-purple-500/20 text-purple-400",
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
    suspended: "bg-orange-500/20 text-orange-400",
    expired: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Export House License</h1>
          <p className="text-gray-400">
            Saudi Export Development Authority (SEDA) Export Houses license
            management
          </p>
        </div>

        {/* Status Card */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-400/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <RiGlobalLine className="text-cyan-400 text-2xl" />
                <h3 className="text-lg font-semibold">License Status</h3>
              </div>
              <div
                className={`inline-block px-3 py-1 rounded-full text-sm mb-2 ${
                  statusColors[licenseStatus?.status || "not_applied"] ||
                  statusColors.not_applied
                }`}
              >
                {licenseStatus?.status?.replace("_", " ").toUpperCase() ||
                  "NOT APPLIED"}
              </div>
              {licenseStatus?.applicationNumber && (
                <div className="text-sm text-gray-400 mt-2">
                  Application: {licenseStatus.applicationNumber}
                </div>
              )}
            </div>

            <a
              href="/export-house/application"
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-400/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <RiFileAddLine className="text-cyan-400 text-2xl" />
                <h3 className="text-lg font-semibold">License Application</h3>
              </div>
              <p className="text-sm text-gray-400">
                Submit or update your SEDA Export House license application
              </p>
            </a>

            <a
              href="/export-house/compliance"
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-400/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <RiShieldCheckLine className="text-cyan-400 text-2xl" />
                <h3 className="text-lg font-semibold">Compliance Tracking</h3>
              </div>
              <p className="text-sm text-gray-400">
                Track compliance requirements and document status
              </p>
            </a>

            <a
              href="/export-house/business-plan"
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-400/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <RiFileChartLine className="text-cyan-400 text-2xl" />
                <h3 className="text-lg font-semibold">3-Year Business Plan</h3>
              </div>
              <p className="text-sm text-gray-400">
                Create and manage your 3-year export business plan
              </p>
            </a>
          </div>
        )}

        {/* Quick Info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">
            About Export House License
          </h2>
          <p className="text-gray-400 mb-4">
            The Saudi Export Development Authority (SEDA) Export Houses license
            enables companies to act as intermediaries or service providers in
            the export value chain, providing:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>Export enablement services</li>
            <li>Compliance coordination</li>
            <li>Logistics orchestration</li>
            <li>Market intelligence and support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
