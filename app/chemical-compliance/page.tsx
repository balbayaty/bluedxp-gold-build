/**
 * Chemical Compliance Module
 * Regulatory tracking, certifications, permits, and audit trails
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import {
  Chemical,
  ComplianceInformation,
  RegulatoryStatus,
  Certification,
  Permit,
} from "@/types/chemical";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

type TabType =
  | "overview"
  | "regulatory"
  | "certifications"
  | "permits"
  | "audit";

export default function ChemicalCompliancePage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [chemicals, setChemicals] = useState<Chemical[]>([]);

  useEffect(() => {
    loadChemicals();
  }, []);

  const loadChemicals = async () => {
    try {
      const response = await fetch("/api/chemical");
      const data = await response.json();
      if (data.success) {
        setChemicals(data.chemicals || []);
      }
    } catch (error) {
      console.error("Error loading chemicals:", error);
    }
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: "ri-dashboard-line" },
    {
      id: "regulatory" as TabType,
      label: "Regulatory Status",
      icon: "ri-government-line",
    },
    {
      id: "certifications" as TabType,
      label: "Certifications",
      icon: "ri-award-line",
    },
    { id: "permits" as TabType, label: "Permits", icon: "ri-file-paper-line" },
    { id: "audit" as TabType, label: "Audit Trail", icon: "ri-history-line" },
  ];

  return (
    <PageTemplate
      title="Chemical Compliance"
      description="Regulatory tracking, certifications, permits, and audit trails"
      icon="ri-shield-check-line"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 font-medium transition ${
                activeTab === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ComplianceOverviewTab chemicals={chemicals} />
            </motion.div>
          )}

          {activeTab === "regulatory" && (
            <motion.div
              key="regulatory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RegulatoryStatusTab chemicals={chemicals} />
            </motion.div>
          )}

          {activeTab === "certifications" && (
            <motion.div
              key="certifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CertificationsTab chemicals={chemicals} />
            </motion.div>
          )}

          {activeTab === "permits" && (
            <motion.div
              key="permits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PermitsTab chemicals={chemicals} />
            </motion.div>
          )}

          {activeTab === "audit" && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AuditTrailTab chemicals={chemicals} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

// ============================================================================
// COMPLIANCE OVERVIEW TAB
// ============================================================================

interface ComplianceOverviewTabProps {
  chemicals: Chemical[];
}

function ComplianceOverviewTab({ chemicals }: ComplianceOverviewTabProps) {
  const compliantCount = chemicals.filter(
    (c) => c.compliance.ghsCompliant,
  ).length;
  const complianceRate =
    chemicals.length > 0 ? (compliantCount / chemicals.length) * 100 : 0;
  const totalCertifications = chemicals.reduce(
    (sum, c) => sum + (c.compliance.certifications?.length || 0),
    0,
  );
  const totalPermits = chemicals.reduce(
    (sum, c) => sum + (c.compliance.permits?.length || 0),
    0,
  );
  const expiringCertifications = chemicals
    .flatMap((c) => c.compliance.certifications || [])
    .filter((cert) => {
      if (!cert.expiryDate) return false;
      const expiry = new Date(cert.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

  // Compliance trend data
  const complianceTrend = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      compliance: 85 + Math.random() * 10,
    };
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Compliance Rate</span>
            <i className="ri-shield-check-line text-green-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">
            {complianceRate.toFixed(1)}%
          </div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border border-yellow-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Certifications</span>
            <i className="ri-award-line text-yellow-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">
            {totalCertifications}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Active Permits</span>
            <i className="ri-file-paper-line text-blue-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{totalPermits}</div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-600/10 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Expiring Soon</span>
            <i className="ri-calendar-line text-orange-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">
            {expiringCertifications}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Compliance Trends */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h4 className="font-bold mb-4 text-white">
            Compliance Trends (Last 12 Months)
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={complianceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="compliance"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance by Region */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h4 className="font-bold mb-4 text-white">Compliance by Region</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={["Saudi Arabia", "UAE", "EU", "US"].map((region) => {
                const regionChemicals = chemicals.filter((c) =>
                  c.compliance.regulatoryStatus.some(
                    (rs) => rs.region === region,
                  ),
                );
                const compliant = regionChemicals.filter(
                  (c) => c.compliance.ghsCompliant,
                ).length;
                const rate =
                  regionChemicals.length > 0
                    ? (compliant / regionChemicals.length) * 100
                    : 0;
                return { region, rate };
              })}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="region" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                {["Saudi Arabia", "UAE", "EU", "US"].map((region, idx) => {
                  const regionChemicals = chemicals.filter((c) =>
                    c.compliance.regulatoryStatus.some(
                      (rs) => rs.region === region,
                    ),
                  );
                  const compliant = regionChemicals.filter(
                    (c) => c.compliance.ghsCompliant,
                  ).length;
                  const rate =
                    regionChemicals.length > 0
                      ? (compliant / regionChemicals.length) * 100
                      : 0;
                  return (
                    <Cell
                      key={`cell-${idx}`}
                      fill={
                        rate >= 90
                          ? "#10b981"
                          : rate >= 70
                            ? "#f59e0b"
                            : "#ef4444"
                      }
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compliance Status by Region */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Compliance by Region</h3>
        <div className="space-y-2">
          {["Saudi Arabia", "UAE", "EU", "US"].map((region) => {
            const regionChemicals = chemicals.filter((c) =>
              c.compliance.regulatoryStatus.some((rs) => rs.region === region),
            );
            const compliant = regionChemicals.filter(
              (c) => c.compliance.ghsCompliant,
            ).length;
            const rate =
              regionChemicals.length > 0
                ? (compliant / regionChemicals.length) * 100
                : 0;

            return (
              <div key={region} className="p-3 rounded-lg bg-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{region}</span>
                  <span className="text-sm text-gray-400">
                    {rate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      rate >= 90
                        ? "bg-green-500"
                        : rate >= 70
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${rate}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REGULATORY STATUS TAB
// ============================================================================

function RegulatoryStatusTab({ chemicals }: { chemicals: Chemical[] }) {
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  const regions = Array.from(
    new Set(
      chemicals.flatMap((c) =>
        c.compliance.regulatoryStatus.map((rs) => rs.region),
      ),
    ),
  );

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
        >
          <option value="">All Regions</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Regulatory Status</h3>
        <div className="space-y-2">
          {chemicals
            .filter(
              (c) =>
                !selectedRegion ||
                c.compliance.regulatoryStatus.some(
                  (rs) => rs.region === selectedRegion,
                ),
            )
            .map((chemical) => (
              <div
                key={chemical.id}
                className="p-4 rounded-lg bg-gray-700 border border-gray-600"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{chemical.name}</p>
                    {chemical.casNumber && (
                      <p className="text-sm text-gray-400">
                        CAS: {chemical.casNumber}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      chemical.compliance.ghsCompliant
                        ? "bg-green-900/30 text-green-400"
                        : "bg-red-900/30 text-red-400"
                    }`}
                  >
                    {chemical.compliance.ghsCompliant
                      ? "GHS Compliant"
                      : "Non-Compliant"}
                  </span>
                </div>
                <div className="space-y-1 mt-3">
                  {chemical.compliance.regulatoryStatus
                    .filter(
                      (rs) => !selectedRegion || rs.region === selectedRegion,
                    )
                    .map((status, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-400">{status.region}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            status.status === "Approved"
                              ? "bg-green-900/30 text-green-400"
                              : status.status === "Restricted"
                                ? "bg-yellow-900/30 text-yellow-400"
                                : status.status === "Banned"
                                  ? "bg-red-900/30 text-red-400"
                                  : "bg-gray-700 text-gray-400"
                          }`}
                        >
                          {status.status}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// OTHER TAB COMPONENTS
// ============================================================================

function CertificationsTab({ chemicals }: { chemicals: Chemical[] }) {
  const allCertifications = chemicals.flatMap((c) =>
    (c.compliance.certifications || []).map((cert) => ({
      ...cert,
      chemical: c.name,
    })),
  );

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Certifications</h3>
      {allCertifications.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          No certifications found
        </p>
      ) : (
        <div className="space-y-2">
          {allCertifications.map((cert, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-gray-700 border border-gray-600"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{cert.type}</p>
                  <p className="text-sm text-gray-400">{cert.chemical}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Issuer: {cert.issuer}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    cert.status === "Active"
                      ? "bg-green-900/30 text-green-400"
                      : cert.status === "Expired"
                        ? "bg-red-900/30 text-red-400"
                        : "bg-yellow-900/30 text-yellow-400"
                  }`}
                >
                  {cert.status}
                </span>
              </div>
              {cert.expiryDate && (
                <p className="text-xs text-gray-500 mt-2">
                  Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PermitsTab({ chemicals }: { chemicals: Chemical[] }) {
  const allPermits = chemicals.flatMap((c) =>
    (c.compliance.permits || []).map((permit) => ({
      ...permit,
      chemical: c.name,
    })),
  );

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Permits</h3>
      {allPermits.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No permits found</p>
      ) : (
        <div className="space-y-2">
          {allPermits.map((permit, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-gray-700 border border-gray-600"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{permit.type}</p>
                  <p className="text-sm text-gray-400">{permit.chemical}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Issuer: {permit.issuer}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    permit.status === "Active"
                      ? "bg-green-900/30 text-green-400"
                      : permit.status === "Expired"
                        ? "bg-red-900/30 text-red-400"
                        : "bg-yellow-900/30 text-yellow-400"
                  }`}
                >
                  {permit.status}
                </span>
              </div>
              {permit.expiryDate && (
                <p className="text-xs text-gray-500 mt-2">
                  Expires: {new Date(permit.expiryDate).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditTrailTab({ chemicals }: { chemicals: Chemical[] }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Audit Trail</h3>
      <p className="text-gray-400">
        Compliance audit trail and change history coming soon...
      </p>
    </div>
  );
}
